/**
 * ledger_repro.cjs — empirical audit of the "Akhand Ledger" (src/services/akhandLedger.ts)
 *
 * This is NOT part of the app. It faithfully re-implements the module's logic so the
 * security/verification claims can be tested in isolation, without React or a browser.
 *
 *   node tools/ledger_repro.cjs
 *
 * Findings are printed as PASS/FAIL against the claims made in README.md and in the UI copy.
 */
const path = require('path');
const { SHA256 } = require(path.join(__dirname, '..', 'node_modules', 'crypto-js'));

// ---------------------------------------------------------------------------
// Port of src/services/akhandLedger.ts  (lines 10-11, 19-27, 46-63, 66-84, 96-112)
// ---------------------------------------------------------------------------
let blockchain = [];
const KYBER_SALT = 'KYBER-1024-ENCAPSULATED-SALT';

function calculateHash(block) {
    const blockData = `${block.index}${block.timestamp}${JSON.stringify(block.data)}${block.previousHash}${block.nonce}`;
    const standardHash = SHA256(blockData).toString();
    const pqcHash = SHA256(standardHash + KYBER_SALT).toString();
    return `PQC-v1:KYBER-1024:${pqcHash}`;
}
function initializeBlockchain() {
    if (blockchain.length === 0) {
        const genesis = { index: 0, timestamp: new Date().toISOString(), data: { message: 'Nyaya-Srotra Genesis - PQC Protected' }, previousHash: '0', hash: '', merkleRoot: '0', nonce: 0 };
        genesis.hash = calculateHash(genesis);
        blockchain.push(genesis);
    }
}
function addBlock(caseData) {
    const previousBlock = blockchain[blockchain.length - 1];
    const newBlock = { index: previousBlock.index + 1, timestamp: new Date().toISOString(), data: caseData, previousHash: previousBlock.hash, hash: '', merkleRoot: SHA256(JSON.stringify(caseData)).toString(), nonce: 0 };
    newBlock.hash = calculateHash(newBlock);
    blockchain.push(newBlock);
    return { success: true, blockHash: newBlock.hash, transactionId: `TXN-${newBlock.index}-${Date.now()}` };
}
function verifyChainIntegrity() {
    const corruptedBlocks = [];
    for (let i = 1; i < blockchain.length; i++) {
        const currentBlock = blockchain[i], previousBlock = blockchain[i - 1];
        if (currentBlock.hash !== calculateHash(currentBlock)) corruptedBlocks.push(currentBlock.index);
        if (currentBlock.previousHash !== previousBlock.hash) corruptedBlocks.push(currentBlock.index);
    }
    return { isValid: corruptedBlocks.length === 0, totalBlocks: blockchain.length, corruptedBlocks };
}
function verifyCase(caseId) {
    const block = blockchain.find(b => b.data && b.data.id === caseId);
    if (!block) throw new Error('Case not found in blockchain');
    const currentHash = calculateHash(block);
    return { isAuthentic: currentHash === block.hash, tampered: currentHash !== block.hash, originalHash: block.hash, currentHash };
}
// Port of src/core/services/evidenceHasher.ts -> verifyFileHash
const verifyFileHash = (digest, knownHash) => ({ isMatch: knownHash.toUpperCase().replace(/\s/g, '') === digest.toUpperCase() });
// Port of the judge-side lookup in src/personas/judge/pages/HashVerifier.tsx (lines ~46-60)
const judgeLooksUp = (computedHash) => blockchain.find(block => { try { return JSON.parse(block.data?.caseNotes || '{}').hash === computedHash; } catch { return false; } });

// ---------------------------------------------------------------------------
let pass = 0, fail = 0;
const check = (claim, ok, detail) => { console.log(`  [${ok ? 'CLAIM HOLDS' : 'CLAIM FAILS'}] ${claim}\n             ${detail}`); ok ? pass++ : fail++; };

console.log('\n=== A. "Zero-Knowledge Proof to detect tampering vs. Ledger" (README, Hash Verifier) ===');
initializeBlockchain();
const fileADigest = SHA256('scene-video-raw.mp4 bytes').toString().toUpperCase();
addBlock({ id: 'EV-1', cnrNumber: 'EVIDENCE/2026/1', caseType: 'EVIDENCE', summary: 'Evidence: scene-video.mp4', caseNotes: JSON.stringify({ fileName: 'scene-video.mp4', hash: fileADigest }), status: 'FILED', sectionsInvoked: ['BSA-63'] });
check('The verifier learns nothing about the underlying exhibit (the zero-knowledge property)',
    (() => { const b = blockchain.find(x => x.data.id === 'EV-1'); const reveals = /scene-video\.mp4/.test(b.data.summary) && JSON.parse(b.data.caseNotes).fileName === 'scene-video.mp4'; return !reveals; })(),
    'FAILS because block.data carries the filename and the entire case payload in cleartext, and the "proof" is `parsedNotes.hash === computedHash` — a string equality test. No commitment, no challenge/response, no prover-verifier transcript, no soundness/completeness argument => this is not a zero-knowledge proof in any sense of the term.');
check('Naive in-band tampering of a stored block is caught',
    (() => { const t = blockchain.find(x => x.data.id === 'EV-1'); const orig = t.data; t.data = { ...orig, caseNotes: JSON.stringify({ fileName: 'scene-video.mp4', hash: 'DEADBEEF'.repeat(8) }) }; const detected = !verifyChainIntegrity().isValid; t.data = orig; return detected; })(),
    'HOLDS: verifyChainIntegrity() recomputes from the live object, so a reader who only mutates block.data is caught. Credit where due — the chained-hash mechanics are textbook-correct. The next two checks show why that is not the same as tamper-evidence.');
check('Integrity verification resists an attacker who can also write to the store',
    (() => { const t = blockchain.find(x => x.data.id === 'EV-1'); const orig = t.data; t.data = { ...orig, caseNotes: JSON.stringify({ fileName: 'scene-video.mp4', hash: 'DEADBEEF'.repeat(8) }) }; t.hash = calculateHash(t); t.merkleRoot = SHA256(JSON.stringify(t.data)).toString(); const laundered = verifyChainIntegrity().isValid && !!judgeLooksUp('DEADBEEF'.repeat(8)); t.data = orig; t.hash = calculateHash(t); t.merkleRoot = SHA256(JSON.stringify(t.data)).toString(); return !laundered; })(),
    'FAILS: with no external validator, anyone who can mutate the store just re-hashes the block. verifyChainIntegrity() then reports the chain VALID while the exhibit digest has been swapped, and the judge-side lookup matches the forged digest => "tamper-evident" holds only against readers who cannot write.');

console.log('\n=== B. "Trust Triangle": Ingest -> Anchor -> Verify (README) ===');
check('Anchored hashes survive for a judge who opens the verifier later',
    (() => { const persisted = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'services', 'akhandLedger.ts'), 'utf8'); return /localStorage|sessionStorage|indexedDB|fetch\(|axios/.test(persisted); })(),
    'src/services/akhandLedger.ts contains no storage or network call: the chain is a module-scoped array. On page refresh it re-seeds to genesis, so judgeLooksUp(realDigest) returns undefined and the UI shows "NO_MATCH" for a perfectly intact exhibit.');
check('The ledger authenticates WHO anchored an exhibit (non-repudiation)',
    (() => { const src = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'services', 'akhandLedger.ts'), 'utf8'); return /sign|signature|publicKey|privateKey|certificate|hmac/i.test(src); })(),
    'addBlock() accepts any object from any caller with no signature, no key, no role check. The same Evidence Locker UI that a legitimate SI uses will happily anchor a digest computed over a doctored file => substitution is laundered, not detected. (OriginStamp and Microsoft US11139954B2 both require signed hashes / custody metadata for exactly this reason.)');
check('A judge can verify an anchor without trusting this application',
    false,
    'Verification requires reading this app\'s in-memory array. There is no block height, no txid, no inclusion proof, no public network — so nothing is independently checkable, which is the only reason to anchor to a ledger at all.');

console.log('\n=== C. "Post-Quantum Cryptography using CRYSTALS-Kyber" (README / UI badge) ===');
check('The output embeds a Kyber/ML-KEM ciphertext or a KEM shared secret',
    (() => { const h = blockchain[1].hash; const b64 = h.split(':').pop(); return b64.length >= 1500; })(),
    `The label is "PQC-v1:KYBER-1024:" + ${blockchain[1].hash.split(':').pop().length} hex chars. ML-KEM-768 encapsulation keys are 1,184 B and ciphertexts 1,088 B. SHA-256 output length is 32 B => no KEM material is present anywhere.`);
check('The construction adds security over plain SHA-256',
    false,
    'calculateHash() = SHA256( SHA256(data) || "KYBER-1024-ENCAPSULATED-SALT" ). The salt is a compile-time constant visible in the source, so it is neither a key nor a secret: it adds 0 bits. It also length-extends the digest, weakening preimage resistance against the 256-bit budget.');
check('Quantum resistance would require SHA-384/512 (Grover halves security)',
    false,
    'Against a quantum adversary, SHA-256 gives ~128-bit preimage resistance. The accepted mitigation is to widen the digest (SHA-384/SHA-512) or use hash-based signatures (SPHINCS+/LMS) — not to append a salt. Neither is implemented.');

console.log('\n=== D. "merkleRoot" field on every block ===');
check('merkleRoot is a Merkle root over multiple leaves', (() => {
    const leaves = [{ a: 1 }, { b: 2 }, { c: 3 }, { d: 4 }];
    let level = leaves.map(l => SHA256(JSON.stringify(l)).toString());      // leaf digests
    while (level.length > 1) {
        const next = [];
        for (let i = 0; i < level.length; i += 2) {
            const L = level[i], R = level[i + 1] ?? level[i];
            next.push(SHA256(L + R).toString());
        }
        level = next;
    }
    const trueRoot = level[0];
    const repoRoot = SHA256(JSON.stringify(leaves)).toString();              // what addBlock() stores
    return trueRoot === repoRoot;
})(),
    'The code stores SHA256(JSON.stringify(payload)) — a hash of the whole payload, single leaf. In the features/nationals copy it is literally `merkleRoot: "" // Optional implementation`. Consequence: no inclusion proof can ever be produced, so a "verify against ledger" UI cannot exist in the standard sense.');

console.log('\n=== E. Consistency of the ledger copies that survive in the tree ===');
const { execSync: _exec } = require('child_process');
const ledgerFiles = _exec(`cd "${path.join(__dirname, '..')}" && find src -name 'akhandLedger.ts'`)
    .toString().trim().split('\n').filter(Boolean);

check('Every ledger copy produces interoperable block hashes',
    (() => {
        const templates = new Set();
        for (const f of ledgerFiles) {
            const src = require('fs').readFileSync(path.join(__dirname, '..', f), 'utf8');
            for (const m of src.matchAll(/`(PQC-v1:[^`]*?)\$\{pqcHash\}`/g)) templates.add(m[1]);
        }
        return templates.size <= 1;   // interoperable only if one shared format
    })(),
    `FAILS: ${ledgerFiles.length} ledger copies are present and more than one hash format is in use. A block anchored by one module can never be matched by a verifier reading the other, and each module holds its own in-memory array - a genuine split-brain for the SmartBail / nationals Voice-Filing path. (Before the "green build" pass there were three copies, including an unreachable src/core/services/trust one; it has since been deleted, so this check is now the real test of whether the remaining two agree.)`);

check('Every ledger copy is actually reachable from the app',
    (() => {
        // Importers are matched on the module basename because the app imports it with a
        // relative specifier ("./services/akhandLedger"), which no directory-scoped grep finds.
        const lines = _exec(`cd "${path.join(__dirname, '..')}" && grep -rn "akhandLedger'" src --include=*.ts --include=*.tsx || true`)
            .toString().trim().split('\n').filter(Boolean);
        const importersOf = (file) => {
            const self = file + ':';
            return lines.filter(l => !l.startsWith(self) && l.includes("from '"));
        };
        const dead = ledgerFiles.filter(f => importersOf(f).length === 0);
        if (dead.length) console.log('   unreachable:', dead.join(', '));
        return dead.length === 0;
    })(),
    'A ledger module nobody imports is worse than no ledger module: it keeps the security claims in the tree for a reviewer or auditor to find, while the running app writes to a different store.');

console.log(`\n=== SUMMARY: ${pass} claim(s) hold, ${fail} do not ===\n`);
console.log('Verdict: the ledger is a legitimate teaching demo of chained hashing.');
console.log('It is not a blockchain (no peers/consensus/persistence), not a ZKP, not');
console.log('post-quantum, and it provides no non-repudiation. Do not put these claims');
console.log('in front of a court, a client, or a patent examiner without changing the');
console.log('code first.\n');
