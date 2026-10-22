/**
 * ledger_repro.cjs — does the "Akhand Ledger" do what the app claims of it?
 *
 *   node tools/ledger_repro.cjs        # exit 0 = every claim holds; exit 1 = at least one does not
 *
 * History: this file used to *re-implement* the ledger's logic locally (against `crypto-js`)
 * because the real module could not run outside a browser. That made it a report about source
 * code rather than a test. It now bundles the real `src/services/akhandLedger.ts` with the
 * esbuild already in node_modules, installs a localStorage shim, and exercises the shipped
 * module - the same code path the Evidence Locker and the judge's verifier call.
 *
 * Checks in eight groups:
 *   A zero-knowledge / tamper detection     B persistence, attribution, offline verification
 *   C "post-quantum"                        D the merkleRoot field
 *   E how many ledger copies exist and whether they agree
 *   F whether the Block 3 screens actually mount, are routed, and are free of demo fixtures
 *   G whether the language-model path degrades when no API key is configured
 *   H whether any live screen still renders a mechanism claim
 *
 * Exit status is the point. A harness that prints FAIL and still returns 0 is how a repo ships
 * a "100% verified" badge for years.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync, execSync } = require('child_process');
const { createHash } = require('crypto');

const repoRoot = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Environment. WebCrypto is native in node 20+; localStorage is not, so shim it. The
// harness deliberately does not know the storage key names: it finds the journal by shape,
// so a rename in store.ts cannot turn a tamper test into a silent no-op.
// ---------------------------------------------------------------------------
class ShimStorage {
    constructor() { this.map = new Map(); }
    getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
    setItem(k, v) { this.map.set(k, String(v)); }
    removeItem(k) { this.map.delete(k); }
    key(i) { return [...this.map.keys()][i] ?? null; }
    get length() { return this.map.size; }
}
const storageShim = new ShimStorage();
globalThis.localStorage = storageShim;

const journalKeys = () => {
    let recordsKey = null;
    let metaKey = null;
    for (const key of storageShim.map.keys()) {
        const raw = storageShim.getItem(key);
        if (!raw || raw[0] !== '[') continue;
        let parsed;
        try { parsed = JSON.parse(raw); } catch { continue; }
        if (Array.isArray(parsed) && parsed[0] && 'leafDigest' in parsed[0]) { recordsKey = key; metaKey = key.replace(/:records$/, ':meta'); }
    }
    return { recordsKey, metaKey };
};
const readJournal = () => {
    const { recordsKey, metaKey } = journalKeys();
    if (!recordsKey) throw new Error('no ledger journal found in storage - the write never persisted');
    return { recordsKey, metaKey, records: JSON.parse(storageShim.getItem(recordsKey)) };
};
const wipeJournal = () => {
    const { recordsKey, metaKey } = journalKeys();
    if (recordsKey) storageShim.removeItem(recordsKey);
    if (metaKey) storageShim.removeItem(metaKey);
};

const bundleDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nyaya-ledger-repro-'));
const esbuildBin = path.join(repoRoot, 'node_modules', '.bin', 'esbuild');

const bundle = (source, outName) => {
    const outfile = path.join(bundleDir, outName);
    try {
        execFileSync(esbuildBin, [source, '--bundle', '--format=esm', '--platform=node', '--external:react', `--outfile=${outfile}`],
            { cwd: repoRoot, stdio: 'pipe' });
    } catch (err) {
        console.error(`esbuild could not bundle ${source}:\n${err.stderr?.toString() ?? err.message}`);
        process.exit(2);
    }
    return outfile;
};

const facadePath = bundle('src/services/akhandLedger.ts', 'ledger-facade.mjs');
const trustPath = bundle('src/core/trust/index.ts', 'trust-core.mjs');

/**
 * A "page refresh" is a second import of the same file with a cache-busting query: fresh module
 * state, same storage. That is exactly the scenario the audit said the old code could not survive.
 */
const freshImport = (file) => import(`file://${file}?v=${Math.random()}`);

let pass = 0;
let fail = 0;
const check = (claim, ok, detail) => {
    console.log(`  [${ok ? 'CLAIM HOLDS' : 'CLAIM FAILS'}] ${claim}`);
    console.log(`             ${detail}`);
    ok ? pass++ : fail++;
};

const sha256hex = (bytes) => createHash('sha256').update(bytes).digest('hex');
const utf8 = (s) => new TextEncoder().encode(s);
const isHex64 = (s) => typeof s === 'string' && /^[0-9a-f]{64}$/.test(s);

const exhibitDigest = sha256hex(utf8('scene-video-raw.mp4 bytes')).toUpperCase();
const caseId = 'EV-REPRO-1';

const exhibitPayload = () => ({
    id: caseId,
    cnrNumber: 'EVIDENCE/2026/1',
    complainant: 'SI KUMAR',
    respondent: 'ACCUSED',
    caseType: 'EVIDENCE',
    summary: 'Evidence: scene-video.mp4',
    caseNotes: JSON.stringify({ fileName: 'scene-video.mp4', hash: exhibitDigest }),
    filingDate: new Date().toISOString(),
    incidentDate: new Date().toISOString(),
    isZeroFir: false,
    applicableLaw: 'BNS',
    status: 'FILED',
    urgency: 'HIGH',
    sectionsInvoked: ['BSA-63'],
    adjournmentsCount: 0,
});

/** Strips comments so an honest "this is NOT a zero-knowledge proof" note cannot read as the claim. */
const codeOnly = (file) =>
    fs.readFileSync(path.join(repoRoot, file), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');

const main = async () => {
    console.log('\n=== A. "Zero-Knowledge Proof to detect tampering vs. Ledger" (README, Hash Verifier) ===');

    if (!globalThis.crypto?.subtle) {
        console.error('This harness needs WebCrypto (node 20+).');
        process.exit(2);
    }

    let ledger = await freshImport(facadePath);
    const core = await freshImport(trustPath);
    await ledger.initializeLedger();
    const written = await ledger.addBlock(exhibitPayload());

    check(
        'No zero-knowledge claim survives in the ledger code path',
        (() => {
            const files = ['src/services/akhandLedger.ts', 'src/core/trust/sha256.ts', 'src/core/trust/merkle.ts', 'src/core/trust/ledger.ts', 'src/core/trust/keys.ts'];
            return !/zero.?knowledge|zkp|zk-?snark/i.test(files.map(codeOnly).join('\n'));
        })(),
        'The audit found `verifyCase` billed as a zero-knowledge proof while doing a string equality test. Verification is now recomputed SHA-256 plus a signed Merkle inclusion proof, which reveals the payload by design; the label is gone from the code, and docs/TRUST_MODEL.md says why.'
    );

    const naive = await (async () => {
        const { recordsKey, records } = readJournal();
        const target = records.find((r) => r.data?.id === caseId);
        if (!target) return { detected: false, why: 'the exhibit is not in storage at all' };
        const forgedNotes = JSON.stringify({ fileName: 'scene-video.mp4', hash: 'DEADBEEF'.repeat(8) });
        storageShim.setItem(recordsKey, JSON.stringify(records.map((r) => (r === target ? { ...r, data: { ...r.data, caseNotes: forgedNotes } } : r))));
        const reloaded = await freshImport(facadePath);
        await reloaded.initializeLedger();
        const chain = await reloaded.verifyChainIntegrity();
        wipeJournal();
        ledger = await freshImport(facadePath);
        await ledger.initializeLedger();
        await ledger.addBlock(exhibitPayload());
        return { detected: !chain.isValid, why: chain.summary };
    })();
    check(
        'Naive in-band tampering of a stored record is caught',
        naive.detected,
        `Editing the exhibit's payload inside localStorage and reopening the ledger reports: ${naive.why}. Against the old in-memory array this could not even be tested across a reload.`
    );

    const launder = await (async () => {
        const { recordsKey, metaKey, records } = readJournal();
        const forgedDigest = 'f'.repeat(64);
        const edited = [];
        for (let i = 0; i < records.length; i++) {
            const r = records[i];
            if (r.data?.id === caseId) {
                r.data = { ...r.data, caseNotes: JSON.stringify({ fileName: 'scene-video.mp4', hash: forgedDigest }) };
            }
            r.leafDigest = await core.leafDigestFor(r);
            r.previousDigest = i === 0 ? '0'.repeat(64) : records[i - 1].leafDigest;
            edited.push(r);
        }
        let head = '0'.repeat(64);
        for (const r of edited) head = sha256hex(utf8(`${head}|${r.leafDigest}`));
        storageShim.setItem(recordsKey, JSON.stringify(edited));
        const meta = JSON.parse(storageShim.getItem(metaKey));
        storageShim.setItem(metaKey, JSON.stringify({ ...meta, headDigest: head }));

        const reloaded = await freshImport(facadePath);
        await reloaded.initializeLedger();
        const chain = await reloaded.verifyChainIntegrity();
        const verdict = await (await reloaded.getLedger()).verifyRecord(written.index);
        const forgedDigestFindable = (await reloaded.getLedgerEntries()).some((b) => {
            try { return JSON.parse(b.data?.caseNotes || '{}').hash === forgedDigest; } catch { return false; }
        });

        wipeJournal();
        ledger = await freshImport(facadePath);
        await ledger.initializeLedger();
        await ledger.addBlock(exhibitPayload());

        return {
            blocked: !chain.isValid && !verdict.ok && /Merkle root|anchor|signature/i.test(verdict.reason),
            detail: `chain valid=${chain.isValid}; record verdict: "${verdict.reason}"; judge-side digest lookup still matches the forged value=${forgedDigestFindable}`,
        };
    })();
    check(
        'Integrity survives an attacker who can also write to the store (the audit\'s central finding)',
        launder.blocked,
        `The adversary swapped the exhibit digest AND recomputed every leaf, every link and the head fold - the laundering that used to succeed. Now: ${launder.detail}. The Merkle root inside a signature over a key the store does not contain is what they cannot reproduce.`
    );

    console.log('\n=== B. "Trust Triangle": Ingest -> Anchor -> Verify (README) ===');

    const survivesReload = await (async () => {
        const reloaded = await freshImport(facadePath);
        await reloaded.initializeLedger();
        const chain = await reloaded.getLedgerEntries();
        const found = chain.find((b) => {
            try { return JSON.parse(b.data?.caseNotes || '{}').hash === exhibitDigest; } catch { return false; }
        });
        return { ok: Boolean(found), count: chain.length };
    })();
    check(
        'Anchored hashes survive for a judge who opens the verifier later',
        survivesReload.ok,
        `A second import of the module - fresh memory, same storage - still finds the exhibit among ${survivesReload.count} record(s). The failing case the audit recorded was a refresh re-seeding to genesis, so the judge's screen answered "NO MATCH" to a perfectly intact file.`
    );

    const attribution = await (async () => {
        const instance = await ledger.getLedger();
        const anchors = await instance.anchors();
        const anchor = anchors[anchors.length - 1];
        const status = await ledger.getLedgerStatus();
        const signedByUs = Boolean(anchor?.signature) && anchor.signerFingerprint === status.signerFingerprint;
        const before = await instance.verifyRecord(written.index);
        const pins = JSON.parse(storageShim.getItem('nyaya:authorities:v1') ?? '[]');
        storageShim.setItem('nyaya:authorities:v1', JSON.stringify(pins.filter((p) => p.fingerprint !== anchor.signerFingerprint)));
        const untrusted = await freshImport(facadePath);
        await untrusted.initializeLedger();
        const after = await (await untrusted.getLedger()).verifyRecord(written.index);
        storageShim.setItem('nyaya:authorities:v1', JSON.stringify(pins));
        return {
            ok: signedByUs && before.ok && !after.ok && /trust|pin/i.test(after.reason),
            detail: `anchor #${anchor.anchorIndex} signed by ${anchor.signerFingerprint} (custody: ${anchor.custody}); pinned => "${before.reason}" | key unpinned => "${after.reason}"`,
        };
    })();
    check(
        'The ledger records WHO anchored an exhibit, and trust stays a separate decision',
        attribution.ok,
        `${attribution.detail}. Removing the pin must break verification while the signature itself still checks out - otherwise "signed" would mean nothing. Self-pinned device keys are the weakest honest form: they prove the record has not changed since this browser wrote it, not that a named officer wrote it.`
    );

    const offline = await (async () => {
        const certJson = await ledger.exportCertificate(written.index);
        const parsed = JSON.parse(certJson);
        const verified = await ledger.verifyCertificate(certJson);
        const forged = { ...parsed, record: { ...parsed.record, data: { ...parsed.record.data, summary: 'Evidence: nothing.mp4' } } };
        const rejected = await ledger.verifyCertificate(JSON.stringify(forged));
        return {
            ok: verified.ok && !rejected.ok && isHex64(parsed.anchor?.merkleRoot ?? ''),
            detail: `clean certificate: "${verified.reason}"; one payload field edited: "${rejected.reason}"`,
        };
    })();
    check(
        'A judge can verify an anchor without trusting this application',
        offline.ok,
        'exportCertificate() emits {record, proof, anchor, signature}; verifyCertificate() needs no app state, only a pinned key, so the check runs on another machine, offline. ' + offline.detail
    );

    console.log('\n=== C. "Post-Quantum Cryptography using CRYSTALS-Kyber" (README / UI badge) ===');

    const labels = await (async () => {
        const found = execSync(
            `grep -rliE 'kyber|PQC-v1|ENCAPSULATED|post-quantum|quantum-resistant|quantum (proof|verify|search|signature)' src --include=*.ts --include=*.tsx || true`,
            { cwd: repoRoot }
        ).toString().trim().split('\n').filter(Boolean);
        // Comments are excluded on purpose: the modules explain what the code used to claim, and a
        // historical note must not be counted as the claim. A live label is in code or JSX text.
        const pattern = /kyber|PQC-v1|ENCAPSULATED|post-quantum|quantum-resistant|quantum\s+(proof|verify|search|signature|protected)/i;
        const claiming = found.filter((f) => pattern.test(codeOnly(f)));
        return { ok: claiming.length === 0, lines: claiming };
    })();
    check(
        'Nothing in the tree calls itself post-quantum or embeds KEM material',
        labels.ok,
        labels.ok
            ? 'No Kyber / PQC-v1 / post-quantum / quantum-resistant / "Quantum Proof"-style string survives in shipped code or UI text under src/ (localisation values included, comments excluded). A digest is 32 bytes of SHA-256; an ML-KEM-768 ciphertext is 1,088 B, so the label cannot quietly return without this check catching it.'
            : `still claimed in:\n               ${labels.lines.slice(0, 8).join('\n               ')}`
    );

    const plainHash = await (async () => {
        const instance = await ledger.getLedger();
        const record = (await instance.records()).find((r) => r.data?.id === caseId);
        const canonical = core.canonicalBytes({
            index: record.index,
            timestamp: record.timestamp,
            previousDigest: record.previousDigest,
            data: record.data,
        });
        const withNodeCrypto = sha256hex(canonical);
        const block = (await ledger.getLedgerEntries()).find((b) => b.data?.id === caseId);
        return {
            ok: withNodeCrypto === record.leafDigest && isHex64(block.hash) && block.nonce === 0,
            detail: `node:crypto over the same canonical bytes => ${withNodeCrypto.slice(0, 16)}… vs stored ${record.leafDigest.slice(0, 16)}…; the hash field is ${block.hash.length} bare hex chars with no prefix, and nonce stays 0 because there is no proof of work and none is claimed`,
        };
    })();
    check(
        'The digest is plain SHA-256 over a canonical record - no constant salt, no double-hash',
        plainHash.ok,
        plainHash.detail + '. Two independent SHA-256 implementations agreeing is the point; the old scheme was SHA256(SHA256(data) || a hard-coded "KYBER-1024-ENCAPSULATED-SALT"), which adds zero bits.'
    );

    const singleHasher = await (async () => {
        const evidencePath = [
            'src/core/services/evidenceHasher.ts',
            'src/services/akhandLedger.ts',
            'src/core/trust/sha256.ts',
            'src/core/trust/ledger.ts',
        ].map(codeOnly).join('\n');
        // Comments are stripped first, because three files describe the old arrangement in prose and
        // prose is not a dependency: the gate is "no code imports it", not "nobody may mention it".
        const tsFiles = (dir, out = []) => {
            for (const entry of fs.readdirSync(path.join(repoRoot, dir), { withFileTypes: true })) {
                const rel = `${dir}/${entry.name}`;
                if (entry.isDirectory()) tsFiles(rel, out);
                else if (/\.(ts|tsx)$/.test(entry.name)) out.push(rel);
            }
            return out;
        };
        const users = tsFiles('src').filter((f) => /crypto-js/.test(codeOnly(f)));
        // D13 turned this from an observation into a gate. It used to check four files and *print* the
        // list of everything else that still imported the library, which is how a claim can sit green
        // for weeks beside the one file it should have failed: `AuthContext.tsx` was in that printed
        // list the whole time. Now the whole tree has to be clean, and so does the dependency itself,
        // because a package.json entry invites the import straight back.
        const pkg = fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8');
        return {
            ok: !/crypto-js/.test(evidencePath) && users.length === 0
                && !/"crypto-js"|"@types\/crypto-js"/.test(pkg),
            users,
        };
    })();
    check(
        'One SHA-256 implementation in the app, and no second one a click away in package.json',
        singleHasher.ok,
        `crypto-js importers: ${singleHasher.users.length === 0 ? 'none' : singleHasher.users.join(', ')}. ` +
        `The officer hashed exhibits with crypto-js while the ledger verified with WebCrypto - two implementations of the same promise, so a difference in either one would read as tampering. evidenceHasher now calls the trust layer's own function. Files still importing crypto-js: ${singleHasher.users.join(', ') || 'none'} (the session HMAC in AuthContext is a known, documented remainder and is not on the evidence path).`
    );

    console.log('\n=== D. "merkleRoot" field on every block ===');

    const batch = await (async () => {
        const leaves = [];
        for (let i = 0; i < 5; i++) {
            const r = await ledger.addBlock({
                id: `BATCH-${i}`, cnrNumber: `B/${i}`, complainant: 'X', respondent: 'Y', caseType: 'EVIDENCE',
                summary: `batch leaf ${i}`, caseNotes: `{"i":${i}}`, filingDate: new Date().toISOString(),
                incidentDate: new Date().toISOString(), isZeroFir: false, applicableLaw: 'BNS',
                status: 'FILED', urgency: 'LOW', sectionsInvoked: [], adjournmentsCount: 0,
            });
            leaves.push(r.leafDigest);
        }
        const instance = await ledger.getLedger();
        const anchors = await instance.anchors();
        const last = anchors[anchors.length - 1];
        const covered = (await instance.records()).filter((r) => r.index >= last.batchStart && r.index <= last.batchEnd);
        const proofs = [];
        for (const rec of covered) {
            const cert = JSON.parse(await ledger.exportCertificate(rec.index));
            proofs.push(await core.verifyInclusionProof(cert.record.leafDigest, cert.proof, cert.anchor.merkleRoot, {
                expectedLeafCount: cert.anchor.leafCount,
            }));
        }
        // A proof must NOT verify for a leaf that is not in the batch.
        const crossUsed = await core.verifyInclusionProof(leaves[0], JSON.parse(await ledger.exportCertificate(covered[covered.length - 1].index)).proof, last.merkleRoot, {
            expectedLeafCount: last.leafCount,
        });
        const referenceRoot = (vals) => {
            let level = vals.map((l) => sha256hex(Buffer.concat([Buffer.from([0x00]), Buffer.from(l, 'hex')])));
            while (level.length > 1) {
                const next = [];
                for (let i = 0; i < level.length; i += 2) {
                    if (i + 1 === level.length) { next.push(level[i]); continue; }
                    next.push(sha256hex(Buffer.concat([Buffer.from([0x01]), Buffer.from(level[i], 'hex'), Buffer.from(level[i + 1], 'hex')])));
                }
                level = next;
            }
            return level[0];
        };
        return {
            ok: isHex64(last.merkleRoot) && covered.length === last.leafCount && proofs.length === covered.length
                && proofs.every((p) => p.isValid) && !crossUsed.isValid,
            detail: `anchor #${last.anchorIndex} covers ${last.leafCount} record(s) [${last.batchStart}..${last.batchEnd}] with root ${last.merkleRoot.slice(0, 16)}…; inclusion verified for every leaf in the batch and refused for a leaf proven against the wrong position. Batch sizes 1..9, empty trees and odd top nodes are covered by tests/trust_primitives.test.ts.`,
        };
    })();
    check(
        'merkleRoot is a real Merkle root over multiple leaves, with a proof per leaf',
        batch.ok,
        batch.detail + ' The old field was SHA256(JSON.stringify(payload)) - one leaf, no tree, so no inclusion proof could exist; the nationals copy - deleted with the subtree - had it literally as `merkleRoot: "" // Optional implementation`, which is the strongest form of the defect.'
    );

    const fieldHonesty = await (async () => {
        const chain = await ledger.getLedgerEntries();
        const instance = await ledger.getLedger();
        const status = await ledger.getLedgerStatus();
        const EMPTY = '0'.repeat(64);
        const anchors = await instance.anchors();
        const realRoots = new Set(anchors.map((a) => a.merkleRoot));
        const dataRows = chain.filter((b) => b.data?.kind !== 'ANCHOR');
        const anchorRows = chain.filter((b) => b.data?.kind === 'ANCHOR');
        // Two properties, both worth asserting:
        //  - every evidence row carries a root that some anchor actually produced - no row may
        //    display a stale or invented one, because the UI table is what a reviewer reads;
        //  - a row whose index no anchor covers must show the empty root, so "not yet anchored"
        //    stays distinguishable from "anchored into a different tree".
        const covered = (index) => anchors.some((a) => index >= a.batchStart && index <= a.batchEnd);
        const rowsHonest = chain.every((b) => (covered(b.index) ? realRoots.has(b.merkleRoot) : b.merkleRoot === EMPTY));
        const dataAllCovered = dataRows.every((b) => covered(b.index) && b.merkleRoot !== EMPTY);
        return {
            ok: rowsHonest && dataAllCovered && status.unanchored === 0,
            detail: `${dataRows.length} evidence record(s) all inside an anchor batch; ${anchorRows.filter((b) => covered(b.index)).length}/${anchorRows.length} anchor record(s) themselves covered by a later anchor (the rest trail the last batch and correctly read as the empty root); ${chain.length} row(s) in total, every root traceable to a signed anchor; status reports ${status.unanchored} unanchored.`,
        };
    })();
    check(
        'A record advertises a Merkle root only when an anchor actually covers it',
        fieldHonesty.ok,
        fieldHonesty.detail + ' Anchoring on every write keeps the unprotected window at one record in a browser-only build.'
    );

    // --------------------------------------------------------------------------- D6 / claim 28
    //
    // `persisted` used to mean `typeof window.localStorage !== 'undefined'`, and the IndexedDB tier
    // existed in the file but was never chosen. Both halves are behavioural, so this claim runs the
    // real selector instead of reading its source: the old probe wrote a value and never asked for it
    // back, and no grep can tell that apart from a probe that does.
    const trustStore = await freshImport(bundle('src/core/trust/store.ts', 'trust-store.mjs'));

    const freshLocal = (seedMeta) => {
        const map = new Map();
        if (seedMeta) map.set('nyaya:ledger:v1:meta', JSON.stringify(seedMeta));
        return {
            getItem: (k) => (map.has(k) ? map.get(k) : null),
            setItem: (k, v) => { map.set(k, v); },
            removeItem: (k) => { map.delete(k); },
            _map: map,
        };
    };
    // Writes accepted, nothing kept, no error raised. Every browser in private mode, and the exact
    // situation the receipt on the citizen's screen used to describe as "Saved to this device".
    const lyingLocal = { getItem: () => null, setItem: () => { }, removeItem: () => { } };

    const idbStub = (mode) => {
        const dbs = new Map();
        if (mode === 'legacy') dbs.set('nyaya-ledger', new Map([['records', new Map()]]));
        const request = (produce) => {
            const req = { result: undefined, onsuccess: null, onerror: null, onupgradeneeded: null };
            queueMicrotask(() => {
                try {
                    req.result = produce();
                    if (req.onsuccess) req.onsuccess({ target: { result: req.result } });
                } catch (error) {
                    if (req.onerror) req.onerror({ target: { error } });
                }
            });
            return req;
        };
        const objectStore = (data) => ({
            put: (value, key) => request(() => { data.set(key === undefined ? data.size : key, value); }),
            get: (key) => request(() => data.get(key)),
            getAll: () => request(() => Array.from(data.values())),
            clear: () => request(() => { data.clear(); }),
            delete: (key) => request(() => { data.delete(key); }),
        });
        const database = (stores) => ({
            objectStoreNames: { contains: (name) => stores.has(name) },
            createObjectStore: (name) => { stores.set(name, new Map()); return {}; },
            transaction: (name) => {
                const data = stores.get(name);
                if (!data) throw new Error(`NotFoundError: no object store named ${name}`);
                return { objectStore: () => objectStore(data) };
            },
        });
        return {
            dbs,
            open: (name) => {
                const req = { result: undefined, onsuccess: null, onerror: null, onupgradeneeded: null };
                queueMicrotask(() => {
                    if (mode === 'blocked') {
                        if (req.onerror) req.onerror({ target: { error: new Error('blocked by policy') } });
                        return;
                    }
                    let stores = dbs.get(name);
                    const needsUpgrade = stores === undefined;
                    if (!stores) { stores = new Map(); dbs.set(name, stores); }
                    req.result = database(stores);
                    if (needsUpgrade) {
                        if (req.onupgradeneeded) req.onupgradeneeded({});
                    }
                    if (req.onsuccess) req.onsuccess({ target: { result: req.result } });
                });
                return req;
            },
        };
    };

    const driverChoice = await (async () => {
        const keep = {
            localStorage: Object.getOwnPropertyDescriptor(globalThis, 'localStorage'),
            indexedDB: Object.getOwnPropertyDescriptor(globalThis, 'indexedDB'),
        };
        const set = (key, value) => {
            if (value === undefined) delete globalThis[key];
            else Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
        };
        const restore = () => {
            for (const key of ['localStorage', 'indexedDB']) {
                if (keep[key]) Object.defineProperty(globalThis, key, keep[key]);
                else delete globalThis[key];
            }
        };
        const run = async (localStorage, indexedDB) => {
            set('localStorage', localStorage);
            set('indexedDB', indexedDB);
            return await trustStore.defaultDriver();
        };
        try {
            const privateMode = await run(lyingLocal, undefined);
            const ordinary = await run(freshLocal(), idbStub('blocked'));
            const bothAvailable = freshLocal();
            const workingIdb = idbStub('default');
            const preferred = await run(bothAvailable, workingIdb);
            const withHistory = await run(
                freshLocal({ version: 1, storeId: 'before-d6', headDigest: 'a'.repeat(64), recordCount: 7 }),
                idbStub('default')
            );
            const legacyDb = await run(freshLocal(), idbStub('legacy'));
            // Optional chaining everywhere below on purpose: a build that never constructs the
            // IndexedDB driver has no database to inspect, and this claim must answer that with
            // `CLAIM FAILS` plus a reason, not by taking the harness down with a TypeError.
            const idbDbs = workingIdb.dbs.get('nyaya-ledger');
            const probeStore = idbDbs ? idbDbs.get('persistence-probe') : undefined;
            const journalStore = idbDbs ? idbDbs.get('records') : undefined;
            return {
                ok: privateMode.driver.name === 'memory' && privateMode.persisted === false
                    && ordinary.driver.name === 'localStorage' && ordinary.persisted === true
                    && preferred.driver.name === 'indexedDB' && preferred.persisted === true
                    && withHistory.driver.name === 'localStorage'
                    && legacyDb.driver.name === 'localStorage'
                    && probeStore !== undefined && probeStore.size === 0
                    && journalStore !== undefined && journalStore.size === 0,
                detail: `private-mode storage -> ${privateMode.driver.name}/${privateMode.persisted}; `
                    + `IDB refusing to open -> ${ordinary.driver.name}/${ordinary.persisted}; `
                    + `both available -> ${preferred.driver.name}/${preferred.persisted}; `
                    + `journal already in localStorage -> ${withHistory.driver.name}; `
                    + `database predating the probe store -> ${legacyDb.driver.name}; `
                    + `probe store left with ${probeStore ? probeStore.size : 'no store'} marker(s), `
                    + `journal store ${journalStore ? `untouched (${journalStore.size} record(s))` : 'never opened'}`,
            };
        } finally {
            // The harness's own storage shim has to come back exactly as it was: every claim after
            // this one reads the journal the earlier claims wrote through it.
            restore();
        }
    })();
    check(
        'The persistence flag is earned by a write and a read-back, in the store it describes',
        driverChoice.ok,
        driverChoice.detail +
        ' | A store that accepts writes and discards them (Safari private mode) must land on memory/false, ' +
        'IndexedDB is preferred only when it proves itself, and a device with history in localStorage is never ' +
        'moved onto an empty store. The claim also fails if the probe leaves a marker behind or writes into the ' +
        'journal - proving durability must not cost a record.'
    );

    console.log('\n=== E. Consistency of the ledger copies that survive in the tree ===');

    const ledgerFiles = execSync(`find src -name 'akhandLedger.ts'`, { cwd: repoRoot }).toString().trim().split('\n').filter(Boolean);
    check(
        'Every ledger copy produces interoperable block hashes',
        (() => {
            const formats = new Set();
            for (const f of ledgerFiles) {
                for (const m of fs.readFileSync(path.join(repoRoot, f), 'utf8').matchAll(/`(PQC-v1:[^`]*?)\$\{[^}]*\}`/g)) formats.add(m[1]);
            }
            return ledgerFiles.length === 1 && formats.size === 0;
        })(),
        `${ledgerFiles.length} copy/copies under src/: ${ledgerFiles.join(', ') || 'none'}. The audit found three, each with its own in-memory array and hash format, so a block anchored by one could never be matched by a verifier reading the other. The class-based duplicate that used to live under src/features/nationals/ is gone with the rest of that subtree, and its importers read the facade.`
    );

    const reachability = await (async () => {
        const hits = execSync(`grep -rn "akhandLedger'" src --include=*.ts --include=*.tsx || true`, { cwd: repoRoot })
            .toString().trim().split('\n').filter(Boolean);
        const importersOf = (file) => hits.filter((l) => !l.startsWith(file + ':') && l.includes("from '"));
        const dead = ledgerFiles.filter((f) => importersOf(f).length === 0);
        const importers = [...new Set(ledgerFiles.flatMap((f) => importersOf(f).map((l) => l.split(':')[0])))];
        return { ok: dead.length === 0 && importers.length >= 4, detail: `dead: ${dead.join(', ') || 'none'}; imported by ${importers.length} file(s)` };
    })();
    check(
        'Every ledger copy is actually reachable from the app',
        reachability.ok,
        'A ledger module nobody imports keeps the claims alive for a reviewer while the running app writes elsewhere - that is how the nationals copy survived for a whole release - reachable from two citizen screens, invisible to the judge - until the subtree was deleted. This check fails if such an orphan reappears. ' + reachability.detail
    );


    console.log('\n=== F. The Block 3 screens: mounted, routed, and free of demo fixtures ===');

    // A component that compiles is not a component that mounts, and "the screen exists" was the
    // exact claim that had been false for these three screens for as long as they have been in the
    // tree. So render them for real: write an entry into tools/, bundle it with esbuild (React,
    // react-dom/server and react-router are resolved from node_modules like the app does), and
    // render each page to markup through the app's own provider stack. Effects do not run under
    // renderToStaticMarkup, which is the right property here: what is on screen is the component's
    // own first paint against an empty store, with nothing fetched and nothing invented.
    const entryRel = 'tools/.block3-render.tsx';
    const entryPath = path.join(repoRoot, entryRel);
    const entrySource = [
        "import React from 'react';",
        "import { renderToStaticMarkup } from 'react-dom/server';",
        "import { MemoryRouter, Route, Routes } from 'react-router-dom';",
        "import { AuthProvider } from '../src/core/auth/AuthContext';",
        "import { AppSettingsProvider } from '../src/core/context/AppSettingsContext';",
        "import { WorkspaceProvider } from '../src/core/context/WorkspaceContext';",
        "import { ToastProvider } from '../src/shared/hooks/useToast';",
        "import EvidenceLocker from '../src/personas/police/pages/EvidenceLocker';",
        "import CertificatePage from '../src/personas/police/pages/Section63CertificatePage';",
        "import GatePage from '../src/personas/police/pages/ChargeSheetGatePage';",
        "import CustodyPage from '../src/personas/judge/pages/CaseChainOfCustodyPage';",
        "import CertificateWizard from '../src/personas/police/components/Section63CertificateGenerator';",
        "import IntegrityPage from '../src/features/main/components/DocumentIntegrityPage';",
        "import About from '../src/features/main/components/About';",
        "",
        "const shell = (route: string, pattern: string, node: React.ReactNode) => renderToStaticMarkup(",
        "    <AuthProvider><AppSettingsProvider><WorkspaceProvider><ToastProvider>",
        "        <MemoryRouter initialEntries={[route]}>",
        "            <Routes><Route path={pattern} element={<>{node}</>} /></Routes>",
        "        </MemoryRouter>",
        "    </ToastProvider></WorkspaceProvider></AppSettingsProvider></AuthProvider>",
        ");",
        "",
        "export const screens = () => ({",
        "    integrity: shell('/admin/integrity', '/admin/integrity', <IntegrityPage t={(key: string) => key} />),",
        "    about: shell('/about', '/about', <About t={(key: string) => key} />),",
        "    locker: shell('/police/evidence', '/police/evidence', <EvidenceLocker />),",
        "    certificate: shell('/police/certificate', '/police/certificate', <CertificatePage />),",
        "    gate: shell('/police/chargesheet', '/police/chargesheet', <GatePage />),",
        "    custody: shell('/judge/custody', '/judge/custody', <CustodyPage />),",
        "    certificateDeep: shell('/police/certificate/EV-1', '/police/certificate/:evidenceId', <CertificatePage />),",
        "    gateDeep: shell('/police/chargesheet/CASE-1/gate', '/police/chargesheet/:caseId/gate', <GatePage />),",
        "    custodyDeep: shell('/judge/case/CASE-1/chain-of-custody', '/judge/case/:id/chain-of-custody', <CustodyPage />),",
        "    // The wizard on its own: the pages only reach it once the store has answered, and an SSR",
        "    // render never waits. Mounted directly, its first step is on screen immediately.",
        "    generator: shell('/x', '/x', <CertificateWizard evidenceId=\"EV-1\" fileName=\"scene.mp4\" ledgerDigest=\"aa\" />),",
        "});",
        "",
    ].join('\n');

    let rendered = null;
    let renderFailure = null;
    // The bundle lands inside the repo, not in the temp dir: `react` and `react-dom` are left
    // external so the render uses the same React instance the app uses, and node resolves bare
    // specifiers from the importing file's directory. In /tmp that resolution finds nothing, and a
    // harness whose fixture cannot load must fail loudly rather than skip.
    // CommonJS, not ESM, for this one bundle: `react-dom/server` is a CJS package and bundling it
    // into an ESM output leaves esbuild emitting a `require('react')` that node refuses. Keeping
    // react and react-dom external and requiring the result is how node and CJS want to be used.
    const renderOut = path.join(repoRoot, 'tools', '.block3-render.cjs');
    fs.writeFileSync(entryPath, entrySource);
    try {
        execFileSync(esbuildBin, [
            entryRel, '--bundle', '--format=cjs', '--platform=node',
            '--external:react', '--external:react-dom', `--outfile=${renderOut}`,
        ], { cwd: repoRoot, stdio: 'pipe' });
        // react-dom/server warns that useLayoutEffect is inert during SSR: true, irrelevant here,
        // and seventeen copies of it would bury the rest of this log. Swallow that one line and
        // re-emit everything else, so a warning that matters still reaches the reader.
        const realError = console.error;
        console.error = (...args) => {
            if (typeof args[0] === 'string' && args[0].includes('useLayoutEffect does nothing on the server')) return;
            realError(...args);
        };
        try {
            rendered = require(renderOut).screens();
        } finally {
            console.error = realError;
        }
    } catch (err) {
        renderFailure = (err && err.stderr ? err.stderr.toString() : String(err)).split('\n').slice(0, 8).join('\n');
    } finally {
        fs.rmSync(entryPath, { force: true });
        fs.rmSync(renderOut, { force: true });
    }

    const expect = {
        locker: ['Evidence Locker', 'Exhibits in the ledger (0)', 'Reading the journal'],
        certificate: ['Section 63 Certificate', 'Reading the ledger'],
        // Without a case in the store there is nothing to interlock against, so the top-level route
        // is expected to show the picker and NOT the gate. The gate itself is only asserted on the
        // deep link, where a case id is named - and there it must render its pending panel rather
        // than the blank it used to return before it had an answer.
        gate: ['Charge Sheet', 'Forensic Interlock'],
        custody: ['Chain of Custody', 'Reading the journal'],
        certificateDeep: ['Section 63 Certificate', 'Reading the ledger'],
        generator: ['BSA Section 63 Certificate Generator', 'Step 1: Device Information', 'IMEI'],
        gateDeep: ['Charge Sheet', 'Forensic Interlock', 'BNSS Sec 176(3)', 'Submission stays closed'],
        custodyDeep: ['Chain of Custody'],
        integrity: ['integrity_check_title', 'This compares two hash values', 'integrity_run'],
        // Q9: the About page is where this project describes itself, so it is rendered here rather
        // than trusted. These three sentinels are the replacement for the counters the page used to
        // run - 5,000,000+ Cases Analyzed, 2,500+ Courts Connected, 98% User Satisfaction - each one
        // animating up to a figure nothing in the repository could know, under a source comment
        // admitting the statistics were "simulated for design purposes". What is on the page now is
        // checkable from a command line, which is why the sentinel is the heading that says so.
        about: ['Four Numbers You Can Check', 'Interface languages, English fallback', 'Local by design'],
    };
    // 'DEMO-' is left out on purpose: the hard-coded fixture ids this repo used to carry are worth
    // forbidding, but a page may legitimately print the word in a caveat, so that is checked where
    // the fixtures used to live rather than in rendered markup.
    // These last three are D18's vocabulary - the labels the language-model fingerprint screen put on
    // screen. They are retired for every render, not only the new screen's, because the point of the
    // commit is that no wired screen gets to say them again.
    // D19's vocabulary, retired alongside D18's: every one of these was a live sentence in a screen
    // this commit publishes or links to. They are checked against every render, not only About's, so
    // a number cannot move to another page and come back into style.
    const retired = ['Court Ready', 'Captured / Uploaded', 'Sample Evidence', 'lorem',
        'Verified & Secure', 'Potential Tampering', 'Quantum Fingerprinting',
        'Cases Analyzed', 'Courts Connected', 'User Satisfaction', 'Join thousands',
        'Court-grade security', 'End-to-End Encrypted', '22 languages supported'];
    const missing = [];
    const stale = [];
    for (const [name, sentinels] of Object.entries(expect)) {
        const html = rendered ? rendered[name] : null;
        if (typeof html !== 'string' || html.length < 200) { missing.push(`${name} (no markup)`); continue; }
        for (const text of sentinels) if (!html.includes(text)) missing.push(`${name}: "${text}"`);
        for (const ghost of retired) if (html.includes(ghost)) stale.push(`${name}: "${ghost}"`);
    }
    check(
        'Every wired screen mounts, and mounts on the store rather than a fixture',
        !renderFailure && missing.length === 0 && stale.length === 0,
        renderFailure
            ? `the screens could not even be rendered:\n             ${renderFailure}`
            : `${Object.keys(expect).length} renders (six top-level routes, three deep links with a path param, and the wizard mounted directly) through AuthProvider/WorkspaceProvider/ToastProvider, the same stack main.tsx installs. `
              + `The ledger pages show their own empty-journal copy - "Exhibits in the ledger (0)", "Reading the journal" - because there is nothing in the store yet, which is the opposite of the demo data these pages used to carry. `
              + (missing.length ? `missing: ${missing.join('; ')}` : 'no retired fixture strings (' + retired.join(', ') + ') reappeared' + (stale.length ? ` except ${stale.join('; ')}` : '')) + '.'
    );

    // Comments are stripped for every claim below, and deliberately so: this project's source is
    // full of honest notes like "this used to be `mockDelay(1200)`", and a check that reads a comment
    // as a claim fails for the wrong reason until someone weakens the check. `codeOnly` is what the
    // label sweeps in group A already use, so prose can neither pass nor fail these.
    const read = (file) => codeOnly(file);
    const app = read('src/App.tsx');
    const routesWanted = [
        'path="certificate/:evidenceId"', 'path="chargesheet/:caseId/gate"',
        'path="case/:id/chain-of-custody"', 'path="custody"', 'path="certificate"', 'path="chargesheet"',
        // Q9's reason for asserting this here: About spent the whole life of this repository as a
        // component imported by exactly one dead file (src/features/main/MainApp.tsx - deleted by
        // D28, which is why this sentence is past tense and the needle below is not). A
        // component that is not routed is a component that does not exist, so the route and the three
        // sidebar links below are the claim - not the 250 lines of JSX, which passed review before.
        'path="/about"',
    ];
    const routesMissing = routesWanted.filter((needle) => !app.includes(needle));
    check(
        'Each screen is routed, including the deep links a court order would cite',
        routesMissing.length === 0,
        `App.tsx declares /police/certificate[/:evidenceId], /police/chargesheet[/:caseId/gate] and /judge/custody + /judge/case/:id/chain-of-custody. `
        + (routesMissing.length ? `missing: ${routesMissing.join(', ')}` : 'a route is one <Route> away from being reachable, and one <Route> away from being dead code again.')
    );

    const navs = [['src/shared/layout/PoliceLayout.tsx', ['/police/certificate', '/police/chargesheet', '/about']],
    ['src/shared/layout/JudgeLayout.tsx', ['/judge/custody', '/about']],
    ['src/shared/layout/CitizenLayout.tsx', ['/about']]];
    const navMissing = navs.flatMap(([file, needles]) => needles.filter((needle) => !read(file).includes(needle)));
    check(
        'Every new route is reachable from the persona navigation menus',
        navMissing.length === 0,
        navMissing.length ? `not in any nav array: ${navMissing.join(', ')}`
            : 'Police: "Sec 63 Certificate", "Charge Sheet Gate". Judge: "Chain of Custody". A screen only reachable by guessing a URL is a screen nobody uses, which is how the three were lost the first time.'
    );

    const custodyShared = ['src/personas/police/pages/EvidenceLocker.tsx', 'src/personas/judge/pages/CaseChainOfCustodyPage.tsx']
        .filter((file) => !read(file).includes('shared/components/ChainOfCustodyTimeline'));
    const lockerFake = read('src/personas/police/pages/EvidenceLocker.tsx').includes("label: 'Court Ready'");
    check(
        'One custody timeline, mounted on both sides of the case',
        custodyShared.length === 0 && !lockerFake,
        custodyShared.length
            ? `does not render the shared component: ${custodyShared.join(', ')}`
            : 'The Evidence Locker used to draw its own four-step strip - Captured, Uploaded, Hashed, Court Ready - with a progress bar whose width an `if` chose. That component is deleted; both the locker and the judge now render the same shared timeline, fed by buildCustodyChain(), so the two cannot disagree about what the custody record says.'
    );

    const theatre = [
        ['src/personas/police/pages/EvidenceLocker.tsx', ['mockDelay', "from '../../../shared/utils/mockApi'"]],
        ['src/personas/police/components/Section63CertificateGenerator.tsx', ['(PDF)', 'mockDelay']],
    ].flatMap(([file, needles]) => needles.filter((needle) => read(file).includes(needle)));
    // D20. Two different lies lived in one file: the intake printed a CNR that `Math.random()` had
    // invented, and it promised the complaint was "recorded in this device's evidence ledger" while the
    // only writer of `kind:'CASE'` rows was never called - so the locker, the charge-sheet gate and the
    // judge's custody page (three live readers of `listCases`) could not see a filing at all. This claim
    // pins the wiring and the receipt copy together, because a receipt that is accurate about a row that
    // does not exist is still a fabrication.
    const intake = read('src/personas/citizen/pages/CitizenComplaint.tsx');
    const intakeRequired = [
        'addBlock(',
        'incidentDate: extractedData.incidentDate',
        'filingDate: new Date().toISOString()',
        'isZeroFir,',
        'Journal Record #',
        'Integrity Digest',
        'Saved to this device',
        'Session only',
        'Recorded on this device; nothing was sent to a police station or court.',
    ];
    const intakeForbidden = [
        // EVIDENCE rows are invisible to listCases forever, so the wrong writer is a failure mode, not
        // a style choice. `setTimeout` and the arithmetic CNR are the theatre that used to stand in for
        // the write. The two invented names are what turned a mock into a journal entry.
        'appendEvidenceRecord',
        'setTimeout',
        '/2024/DL/',
        'Math.random() * 1000',
        "complainant: 'Citizen User'",
        "respondent: 'To be identified'",
        'AI Process',
        'AI Analyzing',
    ];
    const citizenCopy = read('src/features/citizen/constants/citizenTranslations.ts');
    const intakeMissing = intakeRequired.filter((needle) => !intake.includes(needle));
    const intakePresent = intakeForbidden.filter((needle) => intake.includes(needle));
    const intakeLie = ['AI-Extracted', 'AI-\u0928िष्कर्षित'].filter((needle) => citizenCopy.includes(needle));
    check(
        'The one live citizen intake writes the journal row its receipt describes',
        intakeMissing.length === 0 && intakePresent.length === 0 && intakeLie.length === 0,
        (intakeMissing.length ? `missing from the intake: ${intakeMissing.join(', ')}. ` : '')
            + (intakePresent.length ? `still present in the intake: ${intakePresent.join(', ')}. ` : '')
            + (intakeLie.length ? `the review heading still claims: ${intakeLie.join(', ')}. ` : '')
            + 'CitizenComplaint files through `addBlock` - the only writer of `kind:\'CASE\'`, which is what '
              + '`listCases` can read - with `id`, both names as typed, `sectionsInvoked`, `incidentDate` '
              + 'carried explicitly (omitting it lets `readCase` fall back to `filingDate`, which moves '
              + 'pre-01-07-2024 conduct across the BNS commencement line and flips the s.176(3) interlock: '
              + 'tests/citizen_intake_ledger.test.ts proves both halves), `filingDate`, `isZeroFir`, and a '
              + 'CNR only if the citizen typed one. The receipt then prints what the ledger answered - index, '
              + 'digest, whether it persisted, whether it is anchored - and says plainly that nothing reached '
              + 'a police station or a court. `applicableLaw` is deliberately not stored: the date decides '
              + 'the code at read time, and writing the conclusion into a field named "as recorded" is the '
              + 'substitution D18 removed, wearing a data-model costume.'
    );

    check(
        'No certificate waits on a timer, and no button promises a format this app cannot produce',
        theatre.length === 0,
        theatre.length ? `still present: ${theatre.join(', ')}`
            : 'The wizard\'s "Download Part A (PDF)" had no handler and there is no PDF writer in the tree; it now downloads the text the s.63 Schedule can actually be read from, and the certificate\'s own digest is anchored so the download can be checked against the journal. The locker\'s verify/certificate buttons used to sleep for a second and then claim success.'
    );


    // D25. `App` used to pick between the authenticated and public route trees on `isAuthenticated`
    // alone, and the session arrives one effect later. So the public tree won the first paint, its
    // `<Route path="*">` rewrote the URL to `/`, and the landing page's `/` route then bounced the now
    // authenticated visitor to their role home. A bookmark, an SMS link or a reopened tab lost its
    // target - which is what the Playwright journey tripped over, three times, before this claim
    // existed. Pinning the order of two statements is unfashionable; pinning it is also the only way a
    // "cleanup" of `if (isLoading) return ...` fails a build instead of silently degrading every
    // deep link in the product, and the browser test that would catch it needs a Chromium download.
    const boot = read('src/App.tsx');
    const holdAt = boot.indexOf('if (isLoading)');
    const treeAt = boot.indexOf('if (isAuthenticated && user)');
    const readsFlag = boot.includes('const { user, isAuthenticated, isLoading } = useAuth();');
    const rewrites = (boot.match(/<Route path="\*" element=\{<Navigate to="\/"/g) || []).length;
    check(
        'A cold boot holds the first paint instead of routing, so a deep link survives it',
        holdAt !== -1 && treeAt !== -1 && holdAt < treeAt && readsFlag && rewrites === 2,
        !readsFlag
            ? '`App` does not read `isLoading` from `useAuth()` at all.'
            : holdAt === -1
                ? 'the `if (isLoading)` hold is gone, so the public tree mounts before the session is '
                  + 'restored and every persona deep link is rewritten to a role home.'
                : treeAt !== -1 && holdAt > treeAt
                    ? 'the hold sits after the tree choice, which is the same as not having it.'
                    : `expected the public and authenticated trees to keep their catch-alls (found ${rewrites}), `
                      + 'because the trees are the reason the order matters at all'
    );

    // -----------------------------------------------------------------------
    // G. the language-model path. The AI service used to `throw` at module scope when
    // VITE_API_KEY was absent - and the committed .env carried a placeholder, so every clone on
    // earth started from a broken import. Group G bundles that module for real, under a stubbed
    // SDK, and proves the app survives with no key, invents nothing, and says which of the three
    // states it is in.
    // -----------------------------------------------------------------------
    const walkTs = (dir, out = []) => {
        for (const entry of fs.readdirSync(path.join(repoRoot, dir), { withFileTypes: true })) {
            const rel = `${dir}/${entry.name}`;
            if (entry.isDirectory()) walkTs(rel, out);
            else if (/\.(ts|tsx)$/.test(entry.name)) out.push(rel);
        }
        return out;
    };

    console.log('\n=== G. no API key must degrade the AI screens, not detonate them ===');

    const genaiStub = path.join(bundleDir, 'genai-stub.mjs');
    fs.writeFileSync(genaiStub, [
        '// Anything the service tries to do with the real SDK is a bug in the harness, so refuse loudly.',
        'export class GoogleGenAI {',
        '    constructor() { throw new Error("harness: the language model must not be reached from these tests"); }',
        '}',
        'export const Type = { OBJECT: "OBJECT", STRING: "STRING", ARRAY: "ARRAY" };',
        'export class GenerateContentResponse {}',
        'export class Part {}',
        '',
    ].join('\n'));

    const bundleWithEnv = (outName, env) => {
        const outfile = path.join(bundleDir, outName);
        try {
            execFileSync(esbuildBin, [
                'src/features/main/services/geminiService.ts',
                '--bundle', '--format=esm', '--platform=node', '--external:react',
                `--alias:@google/genai=${genaiStub}`,
                `--define:import.meta.env=${JSON.stringify(env)}`,
                `--outfile=${outfile}`,
            ], { cwd: repoRoot, stdio: 'pipe' });
        } catch (err) {
            console.error(`esbuild could not bundle the AI service under ${JSON.stringify(env)}:\n${err.stderr?.toString() ?? err.message}`);
            process.exit(2);
        }
        return outfile;
    };

    // Same vehicle, any entry: the digest claim needs the lookup module and the hash function the
    // screen actually calls, bundled the way the app bundles them.
    const bundleTs = (entry, outName) => {
        const outfile = path.join(bundleDir, outName);
        try {
            execFileSync(esbuildBin, [
                entry, '--bundle', '--format=esm', '--platform=node', `--outfile=${outfile}`,
            ], { cwd: repoRoot, stdio: 'pipe' });
        } catch (err) {
            console.error(`esbuild could not bundle ${entry}:\n${err.stderr ? err.stderr.toString() : err}`);
            process.exit(2);
        }
        return outfile;
    };

    // (1) empty key. The import itself is the regression: an exception here fails the claim.
    const noKey = await freshImport(bundleWithEnv('ai-no-key.mjs', { VITE_API_KEY: '' }));
    check(
        'A clone with no key can still import the AI service',
        typeof noKey.isGeminiConfigured === 'function' && noKey.isGeminiConfigured() === false,
        'The module used to run `throw new Error("API_KEY environment variable is not set.")` at load time, ' +
        'which took down every screen that imported it - five routed ones, including the citizen intake form. ' +
        'The client is now built lazily on first use and `isGeminiConfigured()` is the public answer.'
    );

    const DIGEST_API = /quantumHash|generateQuantumFingerprint|QuantumFingerprintResult|anomalyDetector/;
    // No exemptions on this scan, which is the point: it used to skip `src/features/nationals/`, a
    // directory-sized exception written as though the dead copy were permanent. The purge deletes what
    // was skipped, so the digest-API sweep now covers every file under `src/` - if a banned mechanism
    // name comes back anywhere, including inside a fresh orphan, the scan sees it.
    const digestOffenders = walkTs('src').filter((f) => DIGEST_API.test(codeOnly(f)));
    const lookup = await freshImport(bundleTs('src/shared/utils/integrityLookup.ts', 'integrity-lookup.mjs'));
    const sha = await freshImport(bundleTs('src/core/trust/sha256.ts', 'sha256-module.mjs'));
    // The record is shaped the way the Evidence Locker writes it (`sha256: hashResult.hash.toUpperCase()`,
    // EvidenceLocker.tsx:212), because that is the thing the check has to match against: the journal
    // keeps the exhibit digest upper-cased while sha256Hex returns lower-case, so an exact-string
    // comparison would report a logged document as unlogged. Case-insensitive, and tested that way.
    const logged = 'charge sheet body, as logged';
    const loggedDigest = await sha.sha256Hex(logged);
    const exhibitRecord = (digest) => [{
        index: 7,
        timestamp: '2026-01-01T00:00:00.000Z',
        leafDigest: '00'.repeat(32),
        previousDigest: '00'.repeat(32),
        data: { kind: 'EVIDENCE', id: 'EV-G1', fileName: 'charge-sheet.pdf', sha256: digest.toUpperCase() },
    }];
    const hit = lookup.findByDigest(exhibitRecord(loggedDigest), loggedDigest);
    const anchoredLabel = lookup.integrityVerdict(hit, true).label;
    const unanchoredLabel = lookup.integrityVerdict(hit, false).label;
    const missLabel = lookup.integrityVerdict(
        lookup.findByDigest(exhibitRecord(loggedDigest), 'ab'.repeat(32)), false, false
    ).label;
    const refusesGarbage = lookup.findByDigest(exhibitRecord(loggedDigest), 'the model said this was a hash') === null;
    check(
        'Nothing asks a language model for a digest, and the check that replaced it answers in three states',
        digestOffenders.length === 0
            && noKey.geminiService.generateQuantumFingerprint === undefined
            && noKey.anomalyDetector === undefined
            && isHex64(loggedDigest) && hit !== null && hit.recordIndex === 7
            && anchoredLabel === 'FOUND (anchored at index 7)'
            && unanchoredLabel === 'FOUND (not yet anchored)'
            && missLabel === 'NOT IN JOURNAL'
            && refusesGarbage,
        digestOffenders.length
            ? `the invented-digest API is still named in: ${digestOffenders.join(', ')}`
            : 'the AI service exports no fingerprint method and no anomaly logger; the app\'s own sha256Hex over '
              + 'logged bytes matches the journal record and yields exactly "FOUND (anchored at index 7)" / '
              + '"FOUND (not yet anchored)" / "NOT IN JOURNAL"; a value that is not 64 hex characters is refused '
              + 'instead of compared. This replaces a screen that asked gemini-2.5-pro to "generate a unique '
              + 'quantum cryptographic hash", rendered the answer as a fingerprint, and offered an '
              + 'integrityStatus of "Verified & Secure" or "Potential Tampering Detected" - which, offline, '
              + 'accused every document in the tree.'
    );

    const prediction = await noKey.geminiService.predictCaseOutcome({ id: 'CASE-G' }, 'en');
    check(
        'The fallback states the reason that is actually true, without pretending a request failed',
        /not configured/.test(prediction.rationale) && prediction.contributingFactors.join(' ').includes('VITE_API_KEY'),
        `"${prediction.rationale}" / ${JSON.stringify(prediction.contributingFactors)} - it used to report a network error ` +
        'for a call that was never made, after three backoffs (7 seconds of waiting for a failure that was known up front).'
    );

    const placeholder = await freshImport(bundleWithEnv('ai-placeholder.mjs', { VITE_API_KEY: 'YOUR_KEY_HERE' }));
    check(
        'A placeholder key is treated as no key',
        placeholder.isGeminiConfigured() === false,
        'This is the state the repository itself shipped in: a .env with YOUR_KEY_HERE in it. Accepting it would send a ' +
        'doomed request on every click and then blame the network for the 400 that came back.'
    );

    const configured = await freshImport(bundleWithEnv('ai-configured.mjs', { VITE_API_KEY: `AIza${'x'.repeat(35)}` }));
    check(
        'A real-shaped key is recognised as configured (no request is made here)',
        configured.isGeminiConfigured() === true,
        'Google AI-Studio keys are `AIza` plus 35 characters. The check is shape-only, deliberately: validating a key ' +
        'means calling the API, and a test suite must not make network calls.'
    );

    // Deliberately NOT codeOnly() here: a suppression directive is a comment, so stripping comments
    // would make this claim unfalsifiable - it would report "clean" forever, which is the same failure
    // as grepping prose, pointed the other way. The cost is that prose in src/ must not spell the
    // directive either; say "suppression" instead.
    const DIRECTIVE = /@ts-(ignore|expect-error|nocheck)/;
    const suppressions = walkTs('src').filter((f) => DIRECTIVE.test(fs.readFileSync(path.join(repoRoot, f), 'utf8')));
    check(
        'No compiler suppressions anywhere in src/',
        suppressions.length === 0,
        suppressions.length ? `found in: ${suppressions.join(', ')}` :
        'Three were removed, and all three were hiding something: the one in the chat call claimed the SDK types were ' +
        'stale while `systemInstruction` and `tools` sat outside `config`, where the SDK ignores them - so the topic ' +
        'guardrail had never been applied. The two in the NPS counter were a `useRef(null)` with no type argument. ' +
        'The scan strips comments, so this file mentioning the word cannot make the claim pass.'
    );


    // -----------------------------------------------------------------------
    // H. the anti-drift gate for the 4(e) label sweep. Block 2 removed the false mechanism claims,
    // then a liveness-blind audit found them still standing in the landing page, the citizen tracker
    // and the judge's verifier - because nothing re-checked them. So the check itself is now part of
    // the build: no string a live screen can render may promise a blockchain, a zero-knowledge proof,
    // post-quantum security, or national precedence.
    // -----------------------------------------------------------------------
    console.log('\n=== H. no mechanism claim may survive in a live screen\'s strings ===');

    const aliasFromConfig = (() => {
        const cfg = fs.readFileSync(path.join(repoRoot, 'vite.config.ts'), 'utf8');
        const block = cfg.slice(cfg.indexOf('alias'), cfg.indexOf('resolve') > cfg.indexOf('alias') ? cfg.indexOf('plugins') : cfg.length);
        const found = {};
        for (const m of block.matchAll(/['\"@][\w/]*?['\"@]?\s*:\s*['"]\.\/([^'"]+)['"]/g)) {
            const key = m[0].slice(0, m[0].indexOf(':')).replace(/[^@\w/-]/g, '');
            if (key.startsWith('@')) found[key] = m[1];
        }
        return Object.keys(found).length ? found : { '@core': 'src/core', '@personas': 'src/personas', '@shared': 'src/shared' };
    })();

    const srcFiles = walkTs('src');
    const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    const resolves = (spec, fromDir) => {
        let base = null;
        for (const alias of Object.keys(aliasFromConfig)) {
            if (spec === alias) base = aliasFromConfig[alias];
            else if (spec.startsWith(`${alias}/`)) base = aliasFromConfig[alias] + spec.slice(alias.length);
        }
        if (base === null) {
            if (!spec.startsWith('.') || /\.(css|svg|png|jpe?g|json|webp|woff2?)$/.test(spec)) return null;
            base = path.posix.normalize(path.posix.join(fromDir, spec));
        }
        for (const cand of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
            if (fs.existsSync(path.join(repoRoot, cand)) && fs.statSync(path.join(repoRoot, cand)).isFile()) return cand;
        }
        return null;
    };
    const IMPORT_SPEC = /(?:import|export)\s*(?:type\s*)?[\s\S]{0,320}?from\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const edgesFrom = (file) => {
        const text = stripComments(fs.readFileSync(path.join(repoRoot, file), 'utf8'));
        const out = new Set();
        let m;
        IMPORT_SPEC.lastIndex = 0;
        while ((m = IMPORT_SPEC.exec(text))) {
            const r = resolves(m[1] || m[2], path.posix.dirname(file));
            if (r && r !== file) out.add(r);
        }
        return [...out];
    };
    const reachable = new Set(['src/main.tsx']);
    const queue = ['src/main.tsx'];
    while (queue.length) {
        for (const next of edgesFrom(queue.pop())) if (!reachable.has(next)) { reachable.add(next); queue.push(next); }
    }

    // D19 adds the last two, and their absence was load-bearing: "End-to-End Encrypted" sat on the
    // front door of the app (LandingPage's badge) and in About's trust indicators, and "Court-grade
    // security" sat beside it, while this build has no transport layer to describe. A screen the
    // router hides is not the same as a screen that tells the truth, so the vocabulary is the gate's.
    const CLAIM = /blockchain|zero[- ]?knowledge|post[- ]?quantum|quantum[- ]secure|india['\u2019]s first|tamper[- ]proof|unhackable|unbreakable|end[- ]to[- ]end encryption|court[- ]?grade/i;
    const quotedStrings = (text) => [...text.matchAll(/"[^"\n]{6,}"|'[^'\n]{6,}'|`[^`\n]{6,}`|>[^<>{}`/\n]{12,}</g)].map((m) => m[0]);
    const offenders = [];
    for (const file of srcFiles) {
        if (!reachable.has(file)) continue;                     // dead files are the purge block's problem, not the user's
        for (const line of stripComments(fs.readFileSync(path.join(repoRoot, file), 'utf8')).split('\n')) {
            for (const str of quotedStrings(line)) {
                // A translation key is an identifier in quotes, not prose: `t('verifying_blockchain_hash')`.
                // The sentence a user reads is the value under that key, and the value is scanned on its own
                // line in localization.ts - so skipping key-shaped strings loses nothing and stops the gate
                // from failing on names.
                if (/^['"][A-Za-z0-9_]+['"]$/.test(str.trim())) continue;
                const hit = str.match(CLAIM);
                if (!hit) continue;
                // A string that spends its breath denying the claim is the honest case, so allow a
                // negation before the term: "tamper-evident, not immutable", "this is not a blockchain".
                if (/\bnot\b|\bno\b|\bnever\b/i.test(str.slice(0, hit.index))) continue;
                offenders.push(`${file}: ${str.trim().slice(0, 72)}`);
            }
        }
    }
    check(
        'No live screen can render a blockchain, zero-knowledge or quantum claim',
        offenders.length === 0,
        offenders.length
            ? `found in: ${[...new Set(offenders)].slice(0, 6).join(' | ')}`
            : `Scanned the string and JSX literals of all ${reachable.size} files reachable from src/main.tsx (comments stripped first, so a disclaimer cannot read as a claim). \`initializeLedger\`/\`getBlockchain\`/\`BlockchainBlock\` are now initializeLedger/getLedgerEntries/LedgerEntry for the same reason: the names were the claim.`
    );

    // --------------------------------------------------------------------------- D16 / claim 29
    //
    // Group H above proves the *source* cannot render a mechanism claim. It scans `src/`, so the front
    // door - the one document most readers open before they read a line of code, and the one that had
    // been promising "AI & Blockchain" and a license that was never in the repository - was outside
    // every gate in this project. So the README gets checked structurally: the sections it promises, the
    // commands it tells a stranger to run, the routes it links to, and the vocabulary it is allowed.
    const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
    const readmeLines = readme.split('\n');
    const readmeHeadings = readmeLines.filter((l) => /^## /.test(l)).map((l) => l.replace(/^##\s+/, '').trim());
    const WANT_SECTIONS = ['What this is', 'What this is not', 'Trust model', 'Statutory anchors',
        'Getting started', 'Quality gates', 'License'];
    // Claims, not words. A file may say "there is no consensus and no peer network"; what it may not do
    // is advertise a mechanism the code does not implement.
    const NEVER_IN_README = ['blockchain', 'zero-knowledge', 'end-to-end encrypt', "india's first",
        'court-grade', 'e-courts', 'mit license', 'hackathon', 'openai', 'verified & secure',
        'potential tampering', 'cases analyzed', 'user satisfaction', 'courts connected',
        'join thousands', '22 languages', 'npm install'];
    const lowerReadme = readme.toLowerCase();
    const readmeClaims = NEVER_IN_README.filter((w) => lowerReadme.includes(w));
    // Words a denial is allowed to use, on the same rule group H applies to source strings: forbidding
    // "quantum" outright would delete the sentence that says the app is not quantum-safe, which is the
    // one sentence in the file that a reader most needs.
    const DENIED_TERMS = ['quantum', 'tampering', 'unbreakable', 'immutable', 'post-quantum'];
    const undenied = readmeLines
        .filter((l) => DENIED_TERMS.some((w) => l.toLowerCase().includes(w)))
        .filter((l) => !/\bnot\b|\bno\b|\bnever\b|\bwithout\b/i.test(l));
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
    const haveScripts = Object.keys(pkg.scripts || {});
    const citedScripts = [...readme.matchAll(/npm run ([a-zA-Z0-9:_-]+)/g)].map((m) => m[1]);
    const bogusScripts = citedScripts.filter((name) => !haveScripts.includes(name));
    const citedTools = [...readme.matchAll(/node (tools\/[A-Za-z0-9._/-]+)/g)].map((m) => m[1]);
    const missingTools = citedTools.filter((rel) => !fs.existsSync(path.join(repoRoot, rel)));
    const appRoutes = fs.readFileSync(path.join(repoRoot, 'src/App.tsx'), 'utf8');
    const citedRoutes = [...readme.matchAll(/`(\/(citizen|police|judge)\/([a-z-]+))`/g)].map((m) => m[1]);
    const missingRoutes = citedRoutes.filter((route) => {
        const parts = route.slice(1).split('/');
        return !appRoutes.includes(`path="/${parts[0]}"`) || !appRoutes.includes(`path="${parts[1]}"`);
    });
    check(
        'The README is a document the code can be checked against, not a brochure',
        readmeHeadings.join('|') === WANT_SECTIONS.join('|')
            && readme.includes('No license is currently declared')
            && readme.includes('npm ci')
            && readmeClaims.length === 0
            && undenied.length === 0
            && citedScripts.length >= 3 && bogusScripts.length === 0
            && missingTools.length === 0
            && citedRoutes.length >= 4 && missingRoutes.length === 0,
        `sections [${readmeHeadings.join(' / ')}]; `
        + `${citedScripts.length} npm run + ${citedTools.length} tool commands, all of which exist`
        + `${bogusScripts.length ? ` EXCEPT ${bogusScripts.join(', ')}` : ''}`
        + `${missingTools.length ? ` and missing: ${missingTools.join(', ')}` : ''}; `
        + `${citedRoutes.length} persona routes cited, ${missingRoutes.length ? `not routed: ${missingRoutes.join(', ')}` : 'all routed in App.tsx'}; `
        + `license sentence and \`npm ci\` ${readme.includes('No license is currently declared') && readme.includes('npm ci') ? 'present' : 'MISSING'}; `
        + `advertised mechanisms: ${readmeClaims.length ? readmeClaims.join(', ') : 'none'}; `
        + `denied terms outside a negation: ${undenied.length ? undenied.map((l) => l.trim().slice(0, 54)).join(' | ') : 'none'}`
    );

    console.log('\n=== I. the app\'s numbers about itself, cross-checked against the files that hold them ===');

    // --------------------------------------------------------------------------- D34 / claim 30
    //
    // Groups A-H guard plumbing and vocabulary. This one guards a screen that is legible and false, which
    // no earlier claim can see. The rule is deliberately narrower than "no fake data": every fixture in
    // this repository is fake and says so in a comment, and a comment is not a disclaimer a user reads.
    // So the test is a conjunction - a titled person's name, a score key in the same file, and nothing in
    // that file's own *rendered* text telling the reader the data is a sample. D29 deleted the worst
    // instance of this shape and the register noted that the shape itself was still on two other screens;
    // this is the difference between "we fixed that screen" and "a rule applies to that screen".
    const TITLED = /\b(?:Adv\.|Advocate|Dr\.|SI|HC|Inspector|Superintendent|Shri|Smt\.)\s+[A-Z][a-z]+/;
    const SCORE_KEY = /\b(?:riskLevel|adjournmentRisk|adjournmentRate|predictedDelay|averageDelayMonths|casesHandled|riskScore|confidence|complianceScore|historicalRate)\b/;
    // The vocabulary of "this was written by a person, not measured": sample data, and an invented number that says
    // so out loud. `not a model` is here because SmartFIR fabricates no rows - it fabricates a *measurement* -
    // and "placeholder" is deliberately NOT, since Tailwind's `placeholder:` utility made any input styling
    // read as a disclaimer when quoted strings were scanned.
    const HEDGE_WORDS = /\b(sample|samples|sampled|illustrative|fixture|fixtures|demo|simulated|synthetic|fictional|not real|no real|does not exist|invented|not a model|no model|not measured|fixed number|fixed value)\b/i;
    // A hedge has to be text a reader sees, so only JSX text counts - one-line or wrapped - and a quoted
    // string does not. Two consequences, both intended: a `title="sample data"` tooltip cannot satisfy this
    // (something a reader must hover is not printed on the screen, which is the standard the About page sets),
    // and a Tailwind class list containing the word `placeholder` cannot either. Wrapped text is accepted
    // because that is what a formatter produces, and a gate that a reindent alone can fail is a gate that
    // gets deleted; `[^=]` keeps `=>`-shaped code out, and no braces may appear between the tags, which is
    // what keeps an expression container from reading as prose.
    const jsxText = (code) => [
        ...code.matchAll(/[^=]>\s*([^<>{}\n]{8,})<\s*\n?/g),
        ...code.matchAll(/[^=]>\s*([A-Z][^<>{}]{12,1200}?)\s*</gs),
    ].map((m) => m[1]).filter((t) => /[a-z]{3,}\s+[a-z]{3,}/.test(t));

    const unlabelled = [];
    for (const file of srcFiles) {
        if (!reachable.has(file)) continue;             // dead screens are the purge block's problem, not the reader's
        const code = codeOnly(file);                    // comments stripped, so a source note cannot satisfy this
        if (!TITLED.test(code) || !SCORE_KEY.test(code)) continue;
        if (jsxText(code).some((lit) => HEDGE_WORDS.test(lit))) continue;
        const who = (code.match(TITLED) || [''])[0].trim();
        const key = (code.match(SCORE_KEY) || [''])[0];
        unlabelled.push(`${file} (${who} + ${key})`);
    }
    check(
        'A live screen that names a person beside a score says out loud that the data is a sample',
        unlabelled.length === 0,
        unlabelled.length
            ? `${unlabelled.length} live file(s) pair a titled name with a score key and render no hedge: `
              + `${unlabelled.slice(0, 6).join(' | ')}`
            : `scanned ${reachable.size} files reachable from src/main.tsx, comments stripped, so a source note cannot `
            + `count as a hedge; JSX text only, so a tooltip cannot either. Two exclusions stated rather than hidden: `
            + `"Justice <name>" is not matched because in this repository it names a foundation, not a judge; and a `
            + `titled name with no score key is not matched, because a list of advocates is not an assessment. The one `
            + `live file this rule guards is personas/judge/pages/JudgeBoard.tsx - fixture rows naming six advocates `
            + `and four SIs, a hand-written adjournmentRisk that the board sorts by, and the URL that /judge/risk `
            + `redirects to since D29. Two more screens are labelled in the same commit even though this claim does `
            + `not police them: CaseQueuePage (names, no score) and SmartFIR, whose "AI Confidence" is a setInterval `
            + `that always lands on 100 next to four String.includes tests - an invented measurement rather than `
            + `invented data, which is a different rule and should get its own claim.`
    );

    // --------------------------------------------------------------------------- D34 / claim 31
    //
    // PROJECT_KNOWLEDGE_BASE.md §7 has long asserted that the claim count "is asserted by
    // docs/TRUST_MODEL.md §7 and by the About page's fourth number, so a claim quietly dropped makes two
    // other things fail". Nothing enforced any of it: the number is a literal in AboutStats.tsx and a
    // sentence in two markdown files, edited by hand, four times, every time a claim lands - and adding
    // claim 30 is what proved the assertion false, because all three drifted out of step and no gate
    // noticed. So the count gets one check that reads the four sources and compares them. The static
    // call-site count is the anchor because it cannot lie about how many claims exist: a claim deleted
    // from this file is a `check(` gone, and that is the failure mode this project has been bitten by
    // before (a check that stopped running looked exactly like a check that passed).
    const claimSites = (fs.readFileSync(path.join(repoRoot, 'tools/ledger_repro.cjs'), 'utf8')
        .match(/^ {4}check\(/gm) || []).length;
    const aboutSrc = fs.readFileSync(path.join(repoRoot, 'src/features/main/components/about/AboutStats.tsx'), 'utf8');
    const aboutValue = Number((aboutSrc.match(/id: 'claims',[\s\S]{0,160}?value: (\d+)/) || [])[1]);
    const readmeCount = Number((readme.match(/node tools\/ledger_repro\.cjs\s+#\s+(\d+) claims/) || [])[1]);
    const trustModelPath = path.join(repoRoot, 'docs/TRUST_MODEL.md');
    const trustCount = Number((fs.readFileSync(trustModelPath, 'utf8')
        .match(/node tools\/ledger_repro\.cjs\s+#\s+(\d+) claims/) || [])[1]);
    check(
        'The claim count the app shows and documents is the count the harness actually runs',
        claimSites > 0 && aboutValue === claimSites && readmeCount === claimSites && trustCount === claimSites,
        `the harness has ${claimSites} \`check(\` call sites at four-space indentation (measured, not counted by hand); `
        + `About's fourth number says ${aboutValue}; README says ${readmeCount}; docs/TRUST_MODEL.md says ${trustCount}. `
        + `All four must agree, and About's heading above them reads "Four Numbers You Can Check", which is a `
        + `promise this file now keeps. A claim dropped from this harness without editing the three documents `
        + `fails here, which is the case that had no gate until D34.`
    );

    // --------------------------------------------------------------------------- 4(a)-i / claim 32
    //
    // The adapter now answers with a result rather than a Case, because a record with no date must not
    // pick a criminal code for itself (Art. 20(1); see legacyCaseAdapter.ts). A refusal nobody handles is
    // the same defect with an extra step, so the rule is mechanical: every *live* caller must look at the
    // discriminant, and none may read a field off an untested result. The floor is the part that matters -
    // a rule over an empty set passes by construction, which is how several of this file's earlier checks
    // would have behaved against a deleted directory. Here the floor is a measured count of callers, so a
    // third caller that ignores the refusal cannot be added quietly, and neither can the callers vanish.
    const ADAPTED = srcFiles.filter((f) =>
        reachable.has(f) && !f.endsWith('legacyCaseAdapter.ts') && /\btoGoldenCase\s*\(/.test(codeOnly(f)));
    const unhandled = [];
    for (const file of ADAPTED) {
        const code = codeOnly(file);                       // comments stripped: a note cannot satisfy this
        // An escape hatch in a caller is the refusal being discarded, whatever the guard looks like.
        const escape = code.match(/\bas any\b|@ts-ignore|\bas unknown as/g);
        if (escape) unhandled.push(`${file} (escape hatch: ${escape[0]})`);
        // A file-wide `\.ok` test is not enough: it can sit in unrelated JSX while the real consumer
        // casts the result straight to a Case. So the rule is per binding - every variable assigned from
        // toGoldenCase must be guarded within the statement that follows it.
        const bindings = [...code.matchAll(/(?:const|let)\s+(\w+)\s*=\s*[^;\n]*?toGoldenCase\s*\([^)]*\)[^;]*;/g)];
        if (!bindings.length) unhandled.push(`${file} (calls toGoldenCase without binding its result)`);
        for (const m of bindings) {
            const name = m[1];
            const after = code.slice(m.index, m.index + 600);
            const guarded = new RegExp(`${name}\\??\\.ok\\b`).test(after);
            const bare = new RegExp(`${name}\\.(?!ok\\b|case\\b|reason\\b|missing\\b)[a-zA-Z]`).test(code);
            if (!guarded) unhandled.push(`${file}: ${name} bound from toGoldenCase and never tested for .ok nearby`);
            if (bare) unhandled.push(`${file}: ${name}.<field> read off the untested result`);
        }
    }
    check(
        'Every live caller of toGoldenCase guards the refusal at the binding',
        ADAPTED.length >= 2 && unhandled.length === 0,
        ADAPTED.length < 2
            ? `only ${ADAPTED.length} live caller file(s) found (${ADAPTED.join(', ') || 'none'}) - a rule over fewer than two callers is not a rule, so this fails rather than passing vacuously`
            : `${ADAPTED.length} live caller file(s) measured (${ADAPTED.join(', ')}); `
                + (unhandled.length ? `unhandled refusal: ${unhandled.join(' | ')}`
                    : 'every binding from toGoldenCase is tested for `ok` within the statement that follows it, no field is read off an untested result, '
                      + 'and no caller casts its way past the union. The refusal is also rendered, not swallowed: App.tsx replaces the '
                      + 'draft-judgment panel with the reason, and ChargeSheetGatePage counts the excluded cases aloud so the s.176(3) '
                      + 'denominator stays auditable.')
    );

    console.log(`\n=== SUMMARY: ${pass} claim(s) hold, ${fail} do not (of ${pass + fail}) ===\n`);
    if (fail === 0) {
        console.log('Verdict: the ledger does the three things the app asks of it - it detects');
        console.log('tampering against a writer, persists across a reload, and can be verified');
        console.log('offline by a third party holding a pinned key. It is not a blockchain (no');
        console.log('peers, no consensus, no external timestamping), not post-quantum, not a');
        console.log('zero-knowledge proof, and a self-signed device key is not non-repudiation.');
        console.log('See docs/TRUST_MODEL.md before repeating any of those words.');
        console.log('');
        process.exit(0);
    }
    console.log('At least one claim does not hold. Fix the code, not this file.');
    console.log('');
    process.exit(1);
};

main().catch((err) => {
    console.error('\nHARNESS ERROR (counted as a failure, never as a pass):');
    console.error(err instanceof Error ? `${err.message}\n${err.stack?.split('\n')[1]?.trim() ?? ''}` : err);
    process.exit(1);
});
