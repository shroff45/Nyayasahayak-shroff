/**
 * akhandLedger.ts — the app-facing ledger.
 *
 * This file used to contain the whole "blockchain": an array at module scope, a `calculateHash`
 * that double-hashed the payload with a hard-coded string and called the result
 * `PQC-v1:KYBER-1024`, a `merkleRoot` that was a flat hash, and no storage at all. Every one of
 * those is now handled by `src/core/trust`, which is where the real SHA-256, Merkle tree,
 * ECDSA anchoring and persistence live. What remains here is the compatibility surface the
 * existing pages already import, so the app got a working ledger without a rewrite of every
 * screen - and so that "which ledger am I talking to?" has exactly one answer.
 *
 * Two API changes were unavoidable:
 *  - These functions are async. SHA-256 via WebCrypto and an ECDSA signature are async; the
 *    old synchronous hashing was part of why nothing was ever persisted.
 *  - `simulateTampering()` is gone. It existed so a demo could show detection working, and it
 *    was exported into application code where any caller could rewrite a record. The test suite
 *    tampers with a copy of the store instead (tests/trust_ledger.test.ts).
 *
 * Trust model, in one paragraph: anchors are signed by this device's own key and, on first run,
 * that key is pinned by this same device. That proves *no record changed after it was written
 * by this browser* - nothing more. It does not establish that a particular officer wrote it, and
 * it cannot survive the key being lost. Counter-signing a second terminal's key
 * (`pinAuthority`) or exporting a certificate to another channel is what turns it into
 * evidence a third party can check. `isSelfSignedOnly()` exists so the UI can say which of the
 * two states it is in rather than implying the stronger one. See docs/TRUST_MODEL.md.
 */
import type { LedgerEntry, Case, VerificationResult } from '../types';
import type { SmartBailContract } from '../types';
import {
    createLedger,
    EMPTY_ROOT,
    leafDigestFor,
    verifyCertificate as verifyTrustCertificate,
} from '../core/trust/ledger.ts';
import type { Ledger, LedgerRecord } from '../core/trust/ledger.ts';
import {
    fingerprintFromPublicKey,
    importPublicKey,
    resolveOrCreateIdentity,
    webStorageIdentityVault,
} from '../core/trust/keys.ts';
import type { AnchorKeyPair, AuthorityRecord, CustodyStrength } from '../core/trust/keys.ts';
import { createBailLedger } from '../core/trust/bail.ts';
import type { WebStorage } from '../core/trust/store.ts';

const AUTHORITIES_KEY = 'nyaya:authorities:v1';
const IDENTITY_KEY = 'nyaya:identity:v1';

export interface LedgerStatus {
    initialised: boolean;
    persisted: boolean;
    storeName: string;
    signerFingerprint: string;
    custody: CustodyStrength;
    pinnedAuthorities: number;
    selfSignedOnly: boolean;
    records: number;
    anchors: number;
    unanchored: number;
}

const storage = (): WebStorage | null =>
    (globalThis as unknown as { localStorage?: WebStorage }).localStorage ?? null;

const readAuthorities = (raw: string | null | undefined): AuthorityRecord[] => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as AuthorityRecord[]) : [];
    } catch {
        // A corrupt pin file must not silently mean "trust nobody" *and* look like a working
        // ledger: report it, and let verification fail loudly for each anchor.
        console.error('Ledger: pinned-authority list is unreadable; anchors will report as untrusted until it is fixed.');
        return [];
    }
};

type ReadyLedger = { ledger: Ledger; identity: AnchorKeyPair & { custody: CustodyStrength } };
let pending: Promise<ReadyLedger> | null = null;

const initialise = async () => {
    const store = storage();
    if (!store) {
        throw new Error(
            'The ledger needs localStorage to persist anchors. In this browser it is unavailable ' +
            '(private mode, or storage disabled by policy), so nothing can be safely anchored.'
        );
    }
    const vault = webStorageIdentityVault(store, IDENTITY_KEY);
    // One resolution path for "my key, or make one" - the same function the tests exercise,
    // so the app can never drift from what has actually been verified to work.
    const identity = await resolveOrCreateIdentity(vault);

    const existingPins = readAuthorities(store.getItem(AUTHORITIES_KEY));
    // Bootstrap trust on the very first run only: pin this device's own key so a fresh install can
    // verify its own history. The condition is deliberately "the list is absent", NOT "our key is
    // absent" - the latter re-adds the key every time an operator removes it, which makes
    // un-pinning impossible and turns the trust list into decoration. (The ledger harness catches
    // exactly that: tools/ledger_repro.cjs section B.)
    if (store.getItem(AUTHORITIES_KEY) === null && existingPins.length === 0) {
        existingPins.push({
            fingerprint: identity.fingerprint,
            label: 'This device (self-pinned on first run)',
            publicKeyJwk: identity.publicKeyJwk,
            addedAt: new Date().toISOString(),
            note: 'Self-pinned at first run. Add a second terminal key to make an anchor checkable by others.',
        });
        store.setItem(AUTHORITIES_KEY, JSON.stringify(existingPins));
    }

    const ledger = await createLedger({
        identity,
        identityVault: vault,
        trustedAuthorities: existingPins,
    });
    return { ledger, identity };
};

/** The one ledger instance for the whole app. Concurrent callers share a single init. */
export const getLedger = async (): Promise<Ledger> => {
    const ready = pending ?? (pending = initialise());
    const { ledger } = await ready;
    return ledger;
};

/** Call once at startup. Kept for `App.tsx`, which mounted it as an effect. */
/** Warms the journal. It was `initializeBlockchain`: nothing here is a blockchain - no peers, no
 * consensus, no external timestamp - so the name promised a mechanism the code does not have. */
export const initializeLedger = async (): Promise<Ledger> => getLedger();

const bail = async () => createBailLedger(await getLedger());

const toLedgerEntry = (record: LedgerRecord, merkleRootFor: (i: number) => string): LedgerEntry => ({
    index: record.index,
    timestamp: record.timestamp,
    data: record.data,
    hash: record.leafDigest,
    previousHash: record.previousDigest,
    merkleRoot: merkleRootFor(record.index),
    // No proof of work exists and none is claimed; the field stays because the UI table renders it.
    nonce: 0,
});

/**
 * Anchor a new record immediately after appending it.
 *
 * Cost: one extra journal record per write. Benefit: the "appended since last anchor" window -
 * the only period in which a writer with store access could remove a record without breaking a
 * signature - is kept as close to zero as a browser-only deployment can. A batch-anchor policy
 * would be the right trade-off on a server; here, per-record anchoring is.
 */
/**
 * A record payload is anything carrying a string `id`: the journal stores it verbatim and
 * `verifyCase` looks it up by that id. The golden `Case` fits, and so does the looser model the
 * citizen-facing screens use - the two used to require two ledgers, which is the split-brain this
 * file exists to remove. (A `type` with an index signature is deliberate: an `interface` on the
 * other side of the boundary is not assignable to one, which is exactly how the duplicate crept in.)
 */
export type LedgerSubject = { id: string } & Record<string, unknown>;

export const addBlock = async (
    caseData: Case | LedgerSubject
): Promise<{
    success: boolean;
    /** Kept for existing callers: the record's own digest. */
    blockHash: string;
    transactionId: string;
    /** The journal index, so a caller can re-verify this record later. */
    index: number;
    leafDigest: string;
    anchored: boolean;
    persisted: boolean;
}> => {
    const ledger = await getLedger();
    const appended = await ledger.append({ kind: 'CASE', data: { ...caseData } });
    const anchor = await ledger.anchor();
    return {
        success: true,
        blockHash: appended.leafDigest,
        transactionId: `TXN-${appended.index}-${Date.now()}`,
        index: appended.index,
        leafDigest: appended.leafDigest,
        anchored: Boolean(anchor),
        persisted: appended.persisted,
    };
};

export const appendEvidenceRecord = async (
    data: Record<string, unknown>
): Promise<{ index: number; leafDigest: string; persisted: boolean }> => {
    const ledger = await getLedger();
    const result = await ledger.append({ kind: 'EVIDENCE', data });
    await ledger.anchor();
    return { index: result.index, leafDigest: result.leafDigest, persisted: result.persisted };
};

export const verifyCase = async (caseId: string): Promise<VerificationResult> => {
    const ledger = await getLedger();
    const records = await ledger.records();
    // Newest first: a case re-filed under the same id should verify against its latest anchor.
    const match = [...records]
        .reverse()
        .find((r) => (r.data as { id?: string }).id === caseId);
    if (!match) {
        throw new Error(
            `Case ${caseId} is not in this device's ledger. If it was anchored before, the store ` +
            'was cleared or you are on another device - ask for its certificate rather than assuming tampering.'
        );
    }
    const verdict = await ledger.verifyRecord(match.index);
    // Recomputed with the same function the writer used - not a re-serialisation of the object,
    // which would produce a digest that differs from the stored one for reasons that have
    // nothing to do with tampering and would accuse an innocent exhibit.
    const recomputed = await leafDigestFor(match);
    return {
        isAuthentic: verdict.ok,
        originalHash: match.leafDigest,
        currentHash: recomputed,
        tampered: !verdict.digestMatches,
        timestamp: match.timestamp,
        anchored: verdict.anchored,
        anchorIndex: verdict.anchorIndex,
        signerFingerprint: verdict.signerFingerprint,
        verificationReason: verdict.reason,
    };
};

export const verifyChainIntegrity = async (): Promise<{
    isValid: boolean;
    totalBlocks: number;
    corruptedBlocks: number[];
    summary: string;
    unanchoredTail: number;
    persisted: boolean;
}> => {
    const ledger = await getLedger();
    const result = await ledger.verifyChain();
    const corrupted = [...new Set([...result.editedRecords, ...result.brokenLinks])].sort((a, b) => a - b);
    return {
        isValid: result.isValid,
        totalBlocks: result.totalRecords,
        corruptedBlocks: corrupted,
        summary: result.summary,
        unanchoredTail: result.unanchoredTail,
        persisted: result.persisted,
    };
};

/** The journal as the screens want to show it: every record plus the Merkle root it was batched under. */
export const getLedgerEntries = async (): Promise<LedgerEntry[]> => {
    const ledger = await getLedger();
    const records = await ledger.records();
    const anchors = await ledger.anchors();
    const rootFor = (index: number): string => {
        const covering = anchors.find((a) => index >= a.batchStart && index <= a.batchEnd);
        return covering ? covering.merkleRoot : EMPTY_ROOT;
    };
    return records.map((r) => toLedgerEntry(r, rootFor));
};

export const getLedgerStatus = async (): Promise<LedgerStatus> => {
    const ready = pending ?? (pending = initialise());
    const { ledger, identity } = await ready;
    const pinned = readAuthorities(storage()?.getItem(AUTHORITIES_KEY));
    const status = await ledger.status();
    return {
        initialised: true,
        persisted: status.persisted,
        storeName: status.storeName,
        signerFingerprint: identity.fingerprint,
        custody: identity.custody,
        pinnedAuthorities: pinned.length,
        selfSignedOnly: pinned.length <= 1 && pinned[0]?.fingerprint === identity.fingerprint,
        records: status.records,
        anchors: status.anchors,
        unanchored: status.unanchored,
    };
};

/** Add another terminal's public key so its anchors verify here, and yours verify there. */
export const pinAuthority = async (record: AuthorityRecord): Promise<{ fingerprint: string; label: string }> => {
    const store = storage();
    if (!store) throw new Error('No storage available to pin an authority against.');
    const all = readAuthorities(store.getItem(AUTHORITIES_KEY));
    const fingerprint = record.fingerprint ||
        await fingerprintFromPublicKey(await importPublicKey(record.publicKeyJwk));
    if (all.some((a) => a.fingerprint === fingerprint)) return { fingerprint, label: record.label };
    store.setItem(AUTHORITIES_KEY, JSON.stringify([...all, { ...record, fingerprint }]));
    // Re-initialise so the running ledger picks up the new trust set instead of keeping the old one.
    pending = null;
    return { fingerprint, label: record.label };
};

export const getPinnedAuthorities = async (): Promise<AuthorityRecord[]> =>
    readAuthorities(storage()?.getItem(AUTHORITIES_KEY));

export const isSelfSignedOnly = async (): Promise<boolean> => {
    const status = await getLedgerStatus();
    return status.selfSignedOnly;
};

export const exportCertificate = async (index: number): Promise<string> => {
    const ledger = await getLedger();
    return ledger.exportCertificate(index);
};

export const verifyCertificate = async (certificateJson: string): Promise<{ ok: boolean; reason: string }> => {
    const trusted = await getPinnedAuthorities();
    return verifyTrustCertificate(certificateJson, trusted);
};

// --------------------- SMART BAIL (conditional escrow, not a smart contract) ---------------------

export const createBailContract = async (
    caseId: string,
    amount: number,
    accusedId: string,
    courtDates: string[],
    jurisdiction = 'NOT-SPECIFIED'
): Promise<SmartBailContract> => {
    return (await bail()).create({ caseId, accusedId, amount, courtDates, jurisdiction }) as Promise<SmartBailContract>;
};

export const verifyCourtAppearance = async (
    transactionId: string,
    date: string,
    biometricHash: string
): Promise<{ success: boolean; complianceScore: number; status: string; message: string }> =>
    (await bail()).verifyAppearance(transactionId, date, biometricHash);

export const releaseBailAmount = async (
    transactionId: string
): Promise<{ success: boolean; refundAmount: number; message: string }> => {
    const result = await (await bail()).releaseRefund(transactionId);
    return { success: result.success, refundAmount: result.refundAmount, message: result.message };
};

export const getBailContractStatus = async (transactionId: string): Promise<SmartBailContract | null> => {
    const contract = await (await bail()).get(transactionId);
    if (!contract) return null;
    return { ...contract, status: contract.status as SmartBailContract['status'] };
};

export const listBailContracts = async (): Promise<SmartBailContract[]> =>
    (await (await bail()).list()).map((c) => ({ ...c, status: c.status as SmartBailContract['status'] }));
