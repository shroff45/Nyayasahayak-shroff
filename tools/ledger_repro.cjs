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
 * Twelve checks, in the same five groups the audit raised:
 *   A zero-knowledge / tamper detection     B persistence, attribution, offline verification
 *   C "post-quantum"                        D the merkleRoot field
 *   E how many ledger copies exist and whether they agree
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
    await ledger.initializeBlockchain();
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
        await reloaded.initializeBlockchain();
        const chain = await reloaded.verifyChainIntegrity();
        wipeJournal();
        ledger = await freshImport(facadePath);
        await ledger.initializeBlockchain();
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
        await reloaded.initializeBlockchain();
        const chain = await reloaded.verifyChainIntegrity();
        const verdict = await (await reloaded.getLedger()).verifyRecord(written.index);
        const forgedDigestFindable = (await reloaded.getBlockchain()).some((b) => {
            try { return JSON.parse(b.data?.caseNotes || '{}').hash === forgedDigest; } catch { return false; }
        });

        wipeJournal();
        ledger = await freshImport(facadePath);
        await ledger.initializeBlockchain();
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
        await reloaded.initializeBlockchain();
        const chain = await reloaded.getBlockchain();
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
        await untrusted.initializeBlockchain();
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
        const block = (await ledger.getBlockchain()).find((b) => b.data?.id === caseId);
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
        batch.detail + ' The old field was SHA256(JSON.stringify(payload)) - one leaf, no tree, so no inclusion proof could exist; in the nationals copy it was literally `merkleRoot: "" // Optional implementation`.'
    );

    const fieldHonesty = await (async () => {
        const chain = await ledger.getBlockchain();
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
        `${ledgerFiles.length} copy/copies under src/: ${ledgerFiles.join(', ') || 'none'}. The audit found three, each with its own in-memory array and hash format, so a block anchored by one could never be matched by a verifier reading the other. The class-based duplicate under features/nationals is deleted and its two importers now use the façade.`
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
        'A ledger module nobody imports keeps the claims alive for a reviewer while the running app writes elsewhere - that is how the nationals copy survived, reachable from two citizen screens and invisible to the judge. This check fails if such an orphan reappears. ' + reachability.detail
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
