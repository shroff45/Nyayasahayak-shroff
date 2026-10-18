/**
 * ledger.ts — the Akhand Ledger, second implementation.
 *
 * What changed from the first one, in the order it matters:
 *
 *  1. It persists. The previous ledger was `let blockchain = []` at module scope: on reload it
 *     re-seeded to genesis, so a judge who anchored an exhibit, switched tabs, and returned was
 *     told their intact file did not match. Every claim below is checked against a store that
 *     survives the page.
 *  2. It is anchored by a key, not by a salt. The old `calculateHash` was
 *     `SHA256(SHA256(payload) || "KYBER-1024-ENCAPSULATED-SALT")` under a `PQC-v1:KYBER-1024:`
 *     label. A compile-time string is not a key, adds zero bits, and the double pass only
 *     length-extends the digest. Anyone able to write to the store could recompute it for a
 *     forged payload — so the chain proved nothing about who authored it.
 *  3. `merkleRoot` is a Merkle root, so a single exhibit can be proven against a published
 *     root without revealing or re-hashing the batch (see merkle.ts).
 *  4. Claims match behaviour. No "quantum", no "zero-knowledge", no "court-admissible".
 *
 * Verification is layered so a failure says which layer broke:
 *     payload digest   -> someone edited a record's contents
 *     linkage          -> someone inserted, deleted or reordered a record
 *     head digest      -> someone truncated the journal
 *     merkle root      -> a record inside an anchored batch was changed
 *     signature        -> the batch was not produced by a pinned authority
 *
 * Residual window, stated rather than hidden: records appended *after* the last anchor are
 * covered only by the local head digest. An adversary with write access who truncates back to
 * the last anchor removes recent evidence without a signature to break. `anchor()` after every
 * meaningful custody event keeps that window short, and `exportCertificate()` lets an officer
 * publish the head digest to another channel, which is what an external timestamp would do for
 * free. Real deployment should anchor to a server or a timestamping authority; docs/TRUST_MODEL.md
 * spells out what each option does and does not buy.
 */
import { sha256Hex } from './sha256.ts';
import { buildMerkleTree, createInclusionProof, merkleRoot, verifyInclusionProof, EMPTY_ROOT } from './merkle.ts';
// (EMPTY_ROOT is re-exported once, at the bottom of this file.)
import type { MerkleInclusionProof } from './merkle.ts';
import {
    canonicalBytes,
    signPayload,
    verifyAnchorSignature,
    resolveOrCreateIdentity,
    KEY_ALG,
} from './keys.ts';
import type { AnchorKeyPair, AuthorityRecord, CustodyStrength, IdentityVault } from './keys.ts';
import { JOURNAL_VERSION, defaultDriver } from './store.ts';
import type { JournalDriver, JournalMeta, LedgerRecord } from './store.ts';

/** What a journal entry is about. Kept open-ended on purpose; `data.kind` is what anchors bind. */
export type EntryKind = 'CASE' | 'EVIDENCE' | 'CUSTODY' | 'BAIL' | 'ANCHOR' | 'CUSTOM';

export interface AnchorPayload {
    kind: 'ANCHOR';
    anchorIndex: number;
    /** Journal indexes covered by this anchor, inclusive. */
    batchStart: number;
    batchEnd: number;
    leafCount: number;
    merkleRoot: string;
    algorithm: typeof KEY_ALG;
    signerFingerprint: string;
    custody: CustodyStrength;
    anchoredAt: string;
    /** Head of the whole journal at anchor time, so truncation after the fact is visible. */
    headDigest: string;
}

export interface AnchorRecord extends AnchorPayload {
    signature: string;
}

export interface LedgerConfig {
    driver?: JournalDriver;
    identity?: AnchorKeyPair & { custody: CustodyStrength };
    identityVault?: IdentityVault;
    /** Public keys this deployment trusts. Empty means nothing can verify — reported, not assumed. */
    trustedAuthorities?: AuthorityRecord[];
    identityLabel?: string;
}

export interface AppendInput {
    kind: EntryKind;
    /** The authoritative content. Its canonical encoding is what the leaf digest commits to. */
    data: Record<string, unknown>;
    timestamp?: string;
}

export interface AppendResult {
    index: number;
    leafDigest: string;
    persisted: boolean;
}

export interface RecordVerification {
    recordIndex: number;
    /** Recomputed from the stored payload; a mismatch means the bytes changed under us. */
    digestMatches: boolean;
    anchored: boolean;
    anchorIndex?: number;
    /** Whose signature covers this record, when an anchor does. */
    signerFingerprint?: string;
    proofValid?: boolean;
    signature?: { ok: boolean; reason: string };
    ok: boolean;
    reason: string;
}

export interface ChainVerification {
    isValid: boolean;
    totalRecords: number;
    totalAnchors: number;
    /** Journal indexes whose stored payload does not hash to their recorded digest. */
    editedRecords: number[];
    /** Indexes where previousDigest does not match the actual predecessor. */
    brokenLinks: number[];
    headDigestMatches: boolean;
    /** How many journal records the ledger holds, anchor records included. */
    totalJournalRecords?: number;
    /** Anchors whose recomputed Merkle root no longer matches the signed one. */
    failedAnchors: { anchorIndex: number; reason: string }[];
    unanchoredTail: number;
    persisted: boolean;
    summary: string;
}

/**
 * The fold that makes truncation visible without needing a signature for every append:
 * head_n = SHA-256("head_{n-1}|digest_n"). It is a second, cheap commitment over the whole
 * journal so that "delete the tail" changes something the store itself reports.
 */
const foldHead = async (previousHead: string, leafDigest: string): Promise<string> =>
    sha256Hex(`${previousHead}|${leafDigest}`);

/**
 * The bytes an anchor signature covers: the anchor record WITHOUT the `signature` field.
 * Signing the payload and then verifying the stored record (which has the signature attached)
 * is the classic way to build a verifier that can never say yes - it is caught here only
 * because the smoke test actually ran a sign/verify round trip.
 */
export const anchorSignablePayload = (anchor: AnchorRecord): Record<string, unknown> => {
    const { signature, ...rest } = anchor as unknown as Record<string, unknown>;
    return rest;
};

/**
 * What a leaf digest commits to. Declared structurally rather than as `Omit<LedgerRecord, …>`:
 * a record being built does not have its digest yet, and a record read back from storage does,
 * and both must produce the same bytes. `Omit` made the first case an excess-property error and
 * hid the fact that the digest is *not* part of what is hashed.
 */
export type DigestInput = {
    index: number;
    timestamp: string;
    previousDigest: string;
    data: Record<string, unknown>;
};

/** The exact tuple the leaf digest commits to: index, time, predecessor and content together. */
export const payloadForDigest = (record: DigestInput): Record<string, unknown> => ({
    index: record.index,
    timestamp: record.timestamp,
    previousDigest: record.previousDigest,
    data: record.data,
});

/** The digest a record commits to. Exposed so a verifier can recompute it without re-deriving
 * the record's shape by hand - the field layout is this module's business, not the caller's. */
export const leafDigestFor = (record: DigestInput): Promise<string> =>
    sha256Hex(canonicalBytes(payloadForDigest(record)));

export interface Ledger {
    append(input: AppendInput): Promise<AppendResult>;
    /** Hashes every record since the last anchor into a Merkle root and signs it. */
    anchor(): Promise<AnchorRecord | null>;
    records(): Promise<LedgerRecord[]>;
    anchors(): Promise<AnchorRecord[]>;
    getRecord(index: number): Promise<LedgerRecord | null>;
    /** Inclusion proof for one record against the anchor that covers it. */
    getProof(index: number): Promise<{ proof: MerkleInclusionProof; anchor: AnchorRecord } | null>;
    verifyRecord(index: number): Promise<RecordVerification>;
    verifyChain(): Promise<ChainVerification>;
    /** A portable, self-contained artifact a third party can check with `verifyCertificate`. */
    exportCertificate(index: number): Promise<string>;
    status(): Promise<{
        persisted: boolean;
        records: number;
        anchors: number;
        unanchored: number;
        signerFingerprint: string;
        custody: CustodyStrength;
        trustedAuthorities: number;
        storeName: string;
    }>;
    /** Only for tests and an operator-initiated wipe; the ledger itself has no other way back. */
    reset(): Promise<void>;
}

// Explicit fields rather than constructor parameter properties: `erasableSyntaxOnly` is on in
// tsconfig so this module stays parseable by Node's type-stripping, which is what lets
// `npm test` run these files directly with no build step.
class LedgerImpl implements Ledger {
    private readonly driver: JournalDriver;
    private readonly identity: AnchorKeyPair & { custody: CustodyStrength };
    private readonly trusted: AuthorityRecord[];
    private readonly persisted: boolean;

    constructor(
        driver: JournalDriver,
        identity: AnchorKeyPair & { custody: CustodyStrength },
        trusted: AuthorityRecord[],
        persisted: boolean
    ) {
        this.driver = driver;
        this.identity = identity;
        this.trusted = trusted;
        this.persisted = persisted;
    }

    private async load(): Promise<{ records: LedgerRecord[]; meta: JournalMeta | null }> {
        const records = await this.driver.readAll();
        const meta = await this.driver.readMeta();
        return { records, meta };
    }

    private anchorsFrom(records: LedgerRecord[]): AnchorRecord[] {
        return records
            .filter((r) => (r.data as { kind?: string }).kind === 'ANCHOR')
            .map((r) => r.data as unknown as AnchorRecord);
    }

    async records(): Promise<LedgerRecord[]> {
        return (await this.load()).records;
    }

    async anchors(): Promise<AnchorRecord[]> {
        return this.anchorsFrom(await this.records());
    }

    async getRecord(index: number): Promise<LedgerRecord | null> {
        const all = await this.records();
        return all.find((r) => r.index === index) ?? null;
    }

    async append(input: AppendInput): Promise<AppendResult> {
        const { records, meta } = await this.load();
        const expectedCount = meta?.recordCount ?? 0;
        if (records.length !== expectedCount) {
            throw new Error(
                `Ledger state mismatch: the store holds ${records.length} records but its meta says ` +
                `${expectedCount}. Refusing to append over a journal that does not agree with itself.`
            );
        }
        const previousDigest = records.length ? records[records.length - 1].leafDigest : EMPTY_ROOT;
        const timestamp = input.timestamp ?? new Date().toISOString();
        const body = { kind: input.kind, ...input.data };
        const index = records.length + 1;
        const leafDigest = await leafDigestFor({ index, timestamp, previousDigest, data: body });
        const nextHead = await foldHead(meta?.headDigest ?? EMPTY_ROOT, leafDigest);
        const record: LedgerRecord = { index, timestamp, leafDigest, previousDigest, data: body };
        const nextMeta: JournalMeta = {
            version: JOURNAL_VERSION,
            storeId: meta?.storeId ?? `${this.driver.name}:${Date.now().toString(36)}`,
            headDigest: nextHead,
            recordCount: index,
        };
        await this.driver.append(record, nextMeta);
        return { index, leafDigest, persisted: this.persisted };
    }

    async anchor(): Promise<AnchorRecord | null> {
        const { records, meta } = await this.load();
        const anchors = this.anchorsFrom(records);
        const lastAnchor = anchors[anchors.length - 1];
        const batchStart = lastAnchor ? lastAnchor.batchEnd + 1 : 1;
        const batch = records.filter((r) => r.index >= batchStart);
        // Two reasons to stop here. No pending records means nothing to commit. And if the only
        // pending record is an anchor itself, writing "anchor #2 over anchor #1" would produce a
        // signed statement about nothing that a reviewer could mistake for new evidence.
        const hasNewContent = batch.some((r) => (r.data as { kind?: string }).kind !== 'ANCHOR');
        if (batch.length === 0 || !hasNewContent) return null;

        const root = await merkleRoot(batch.map((r) => r.leafDigest));
        const anchoredAt = new Date().toISOString();
        const payload: AnchorPayload = {
            kind: 'ANCHOR',
            anchorIndex: anchors.length + 1,
            batchStart,
            batchEnd: records.length,
            leafCount: batch.length,
            merkleRoot: root,
            algorithm: KEY_ALG,
            signerFingerprint: this.identity.fingerprint,
            custody: this.identity.custody,
            anchoredAt,
            headDigest: meta?.headDigest ?? EMPTY_ROOT,
        };
        const signature = await signPayload(this.identity.privateKey, payload as unknown as Record<string, unknown>);
        const anchorRecord: AnchorRecord = { ...payload, signature };
        // The anchor is itself appended to the journal, so anchor history is append-only too:
        // deleting or editing an anchor breaks the linkage the next verification walks.
        await this.append({ kind: 'ANCHOR', data: anchorRecord as unknown as Record<string, unknown> });
        return anchorRecord;
    }

    /** The leaves an anchor committed to, recomputed from today's stored payloads. */
    private async batchLeaves(records: LedgerRecord[], anchor: AnchorRecord): Promise<LedgerRecord[]> {
        return records.filter((r) => r.index >= anchor.batchStart && r.index <= anchor.batchEnd);
    }

    async getProof(index: number): Promise<{ proof: MerkleInclusionProof; anchor: AnchorRecord } | null> {
        const records = await this.records();
        const record = records.find((r) => r.index === index);
        if (!record) throw new Error(`No ledger record at index ${index}`);
        const covering = this.anchorsFrom(records)
            .filter((a) => index >= a.batchStart && index <= a.batchEnd)
            .pop();
        if (!covering) return null;
        const batch = await this.batchLeaves(records, covering);
        const proof = await createInclusionProof(batch.map((r) => r.leafDigest), index - covering.batchStart);
        return { proof, anchor: covering };
    }

    async verifyRecord(index: number): Promise<RecordVerification> {
        const records = await this.records();
        const record = records.find((r) => r.index === index);
        if (!record) {
            return {
                recordIndex: index, digestMatches: false, anchored: false, ok: false,
                reason: `No record at index ${index}. It was either never anchored or the journal was truncated.`,
            };
        }
        const recomputed = await leafDigestFor(record);
        const digestMatches = recomputed === record.leafDigest;
        if (!digestMatches) {
            return {
                recordIndex: index, digestMatches, anchored: false, ok: false,
                reason: 'Stored payload does not hash to the recorded digest: the record was edited after it was written.',
            };
        }
        const covering = await this.getProof(index);
        if (!covering) {
            return {
                recordIndex: index, digestMatches: true, anchored: false, ok: true,
                reason: 'Internally consistent but UNANCHORED: no signed batch covers it yet, so a writer with store ' +
                    'access could still remove it. Anchor before relying on it.',
            };
        }
        const { proof, anchor } = covering;
        const proofResult = await verifyInclusionProof(record.leafDigest, proof, anchor.merkleRoot, {
            expectedLeafCount: anchor.leafCount,
        });
        const sig = await verifyAnchorSignature(
            anchorSignablePayload(anchor),
            anchor.signature,
            anchor.signerFingerprint,
            this.trusted
        );
        const ok = proofResult.isValid && sig.ok;
        return {
            recordIndex: index,
            digestMatches: true,
            anchored: true,
            anchorIndex: anchor.anchorIndex,
            signerFingerprint: anchor.signerFingerprint,
            proofValid: proofResult.isValid,
            signature: { ok: sig.ok, reason: sig.reason },
            ok,
            reason: !proofResult.isValid
                ? `Inclusion proof fails (${proofResult.reason ?? 'root mismatch'}) — the batch this record was anchored in has changed.`
                : !sig.ok
                    ? sig.reason
                    : `Record ${index} is inside signed anchor #${anchor.anchorIndex} (${anchor.signerFingerprint}).`,
        };
    }

    async verifyChain(): Promise<ChainVerification> {
        const { records, meta } = await this.load();
        const editedRecords: number[] = [];
        const brokenLinks: number[] = [];

        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            if ((await leafDigestFor(record)) !== record.leafDigest) editedRecords.push(record.index);
            const expectedPrev = i === 0 ? EMPTY_ROOT : records[i - 1].leafDigest;
            if (record.previousDigest !== expectedPrev) brokenLinks.push(record.index);
        }

        let head = EMPTY_ROOT;
        for (const r of records) head = await foldHead(head, r.leafDigest);
        const headDigestMatches = !meta || meta.headDigest === head;

        const anchors = this.anchorsFrom(records);
        const failedAnchors: { anchorIndex: number; reason: string }[] = [];
        for (const anchor of anchors) {
            const batch = await this.batchLeaves(records, anchor);
            if (batch.length !== anchor.leafCount) {
                failedAnchors.push({
                    anchorIndex: anchor.anchorIndex,
                    reason: `batch covers ${anchor.batchStart}-${anchor.batchEnd} but only ${batch.length} of ` +
                        `${anchor.leafCount} anchored leaves are present`,
                });
                continue;
            }
            const root = await buildMerkleTree(batch.map((r) => r.leafDigest));
            if (root.root !== anchor.merkleRoot) {
                failedAnchors.push({
                    anchorIndex: anchor.anchorIndex,
                    reason: `recomputed Merkle root ${root.root.slice(0, 16)}… does not match the signed ` +
                        `${anchor.merkleRoot.slice(0, 16)}… — a record inside this batch changed`,
                });
                continue;
            }
            const sig = await verifyAnchorSignature(
                anchorSignablePayload(anchor),
                anchor.signature,
                anchor.signerFingerprint,
                this.trusted
            );
            if (!sig.ok) failedAnchors.push({ anchorIndex: anchor.anchorIndex, reason: sig.reason });
        }

        const lastAnchor = anchors[anchors.length - 1];
        // Only non-anchor entries count as "awaiting anchoring": the anchor record itself is
        // appended after its batch is described, so counting it would report an always-dirty tail.
        const unanchored = records.filter(
            (r) => (r.data as { kind?: string }).kind !== 'ANCHOR' &&
                   (!lastAnchor || r.index > lastAnchor.batchEnd)
        ).length;
        const isValid = editedRecords.length === 0 && brokenLinks.length === 0 &&
            headDigestMatches && failedAnchors.length === 0;

        const entries = records.length - anchors.length;
        const parts = [
            `${entries} entries + ${anchors.length} anchor record(s) in a ${records.length}-record journal`,
            editedRecords.length ? `EDITED: ${editedRecords.join(', ')}` : 'payloads intact',
            brokenLinks.length ? `BROKEN LINKS: ${brokenLinks.join(', ')}` : 'linkage intact',
            headDigestMatches ? 'head digest matches' : 'HEAD DIGEST MISMATCH — the journal was truncated or swapped',
            failedAnchors.length ? `FAILED ANCHORS: ${failedAnchors.map((f) => `#${f.anchorIndex} (${f.reason})`).join('; ')}` : 'signatures verify',
            unanchored ? `${unanchored} record(s) appended since the last anchor` : 'every record is anchored',
        ];

        return {
            isValid,
            totalRecords: records.length,
            totalJournalRecords: records.length,
            totalAnchors: anchors.length,
            editedRecords,
            brokenLinks,
            headDigestMatches,
            failedAnchors,
            unanchoredTail: unanchored,
            persisted: this.persisted,
            summary: parts.join(' · '),
        };
    }

    async exportCertificate(index: number): Promise<string> {
        const records = await this.records();
        const record = records.find((r) => r.index === index);
        if (!record) throw new Error(`No ledger record at index ${index}`);
        const covering = await this.getProof(index);
        if (!covering) throw new Error(`Record ${index} is not inside any signed anchor yet; anchor first.`);
        const { proof, anchor } = covering;
        // Everything a verifier needs, and nothing they have to trust: the record, the batch
        // membership path, the root, the signature and the pinned public key.
        return JSON.stringify({
            certificateVersion: 1,
            record,
            proof,
            anchor: { ...anchor },
            authority: this.trusted.find((t) => t.fingerprint === anchor.signerFingerprint) ?? null,
            exportedAt: new Date().toISOString(),
        }, null, 2);
    }

    async status() {
        const records = await this.records();
        const anchors = this.anchorsFrom(records);
        const last = anchors[anchors.length - 1];
        return {
            persisted: this.persisted,
            records: records.length,
            anchors: anchors.length,
            unanchored: records.filter(
                (r) => (r.data as { kind?: string }).kind !== 'ANCHOR' && (!last || r.index > last.batchEnd)
            ).length,
            signerFingerprint: this.identity.fingerprint,
            custody: this.identity.custody,
            trustedAuthorities: this.trusted.length,
            storeName: this.driver.name,
        };
    }

    async reset(): Promise<void> {
        await this.driver.reset();
    }
}

/**
 * A certificate is verifiable by someone who never saw the ledger — that is the point of the
 * Merkle proof. Kept separate from the class so a verifier can run on a kiosk with no store.
 */
export const verifyCertificate = async (
    certificateJson: string,
    trusted: AuthorityRecord[]
): Promise<{ ok: boolean; reason: string }> => {
    let cert: {
        record: LedgerRecord;
        proof: MerkleInclusionProof;
        anchor: AnchorRecord;
        authority: AuthorityRecord | null;
    };
    try {
        cert = JSON.parse(certificateJson);
    } catch (err) {
        return { ok: false, reason: `Certificate is not valid JSON: ${err instanceof Error ? err.message : 'parse error'}` };
    }
    if (!cert?.record || !cert?.proof || !cert?.anchor) {
        return { ok: false, reason: 'Certificate is missing record, proof or anchor.' };
    }
    const recomputedDigest = await leafDigestFor(cert.record);
    if (recomputedDigest !== cert.record.leafDigest) {
        return { ok: false, reason: 'The record inside the certificate does not hash to its own digest — it was edited after export.' };
    }
    const proofResult = await verifyInclusionProof(cert.record.leafDigest, cert.proof, cert.anchor.merkleRoot, {
        expectedLeafCount: cert.anchor.leafCount,
    });
    if (!proofResult.isValid) {
        return { ok: false, reason: `Inclusion proof does not reach the anchored root (${proofResult.reason ?? 'mismatch'}).` };
    }
    const sig = await verifyAnchorSignature(
        anchorSignablePayload(cert.anchor),
        cert.anchor.signature,
        cert.anchor.signerFingerprint,
        trusted
    );
    return sig.ok
        ? { ok: true, reason: `${sig.reason} Root ${cert.anchor.merkleRoot.slice(0, 16)}… covers ${cert.anchor.leafCount} record(s) at index ${cert.record.index}.` }
        : { ok: false, reason: sig.reason };
};

/**
 * Build a ledger. When no identity is supplied, one is loaded or created in the given vault so
 * the same device keeps signing with the same key across reloads.
 */
export const createLedger = async (config: LedgerConfig = {}): Promise<Ledger> => {
    const { driver: defaultStoreDriver, persisted } = defaultDriver();
    const driver = config.driver ?? defaultStoreDriver;
    let identity = config.identity;
    if (!identity) {
        if (!config.identityVault) {
            throw new Error(
                'createLedger needs either an identity or an identityVault, otherwise every page ' +
                'load would generate a new signing key and no anchor would ever verify again.'
            );
        }
        identity = await resolveOrCreateIdentity(config.identityVault, config.identityLabel ?? 'NyayaSahayak device key');
    }
    return new LedgerImpl(driver, identity, config.trustedAuthorities ?? [], persisted);
};

export type { LedgerRecord, JournalMeta } from './store.ts';
export { memoryDriver, localStorageDriver, indexedDbDriver } from './store.ts';
export type { JournalDriver, WebStorage } from './store.ts';
export { sha256Hex } from './sha256.ts';
export { merkleRoot, buildMerkleTree, createInclusionProof, verifyInclusionProof, EMPTY_ROOT } from './merkle.ts';
