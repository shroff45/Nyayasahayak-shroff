/**
 * statute_tests.mjs — behavioural tests for the statutory-derivation layer.
 *
 * Why this exists: the project has no test runner, and the modules under test import each
 * other with extensionless specifiers, which plain `node` cannot resolve. So we bundle each
 * module with the esbuild that is already in node_modules and assert against the result.
 * No new dependency, nothing to install.
 *
 *   node tools/statute_tests.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const repoRoot = path.resolve(import.meta.dirname, '..');
const bundleDir = mkdtempSync(path.join(tmpdir(), 'nyaya-statute-tests-'));

const esbuild = path.join(repoRoot, 'node_modules', '.bin', 'esbuild');
const modules = {
    adapter: 'src/core/workspace/legacyCaseAdapter.ts',
    interlock: 'src/core/services/forensicInterlock.ts',
};

for (const [name, source] of Object.entries(modules)) {
    execFileSync(
        esbuild,
        [
            source,
            '--bundle',
            '--format=esm',
            '--platform=node',
            '--external:react',
            `--outfile=${path.join(bundleDir, `${name}.mjs`)}`,
        ],
        { cwd: repoRoot, stdio: 'inherit' }
    );
}

const { applicableLawFor, toGoldenCase } = await import(path.join(bundleDir, 'adapter.mjs'));
const { isForensicVideoMandatory, BNS_EFFECTIVE_DATE, validateForensicCompliance } = await import(path.join(bundleDir, 'interlock.mjs'));

let pass = 0;
let fail = 0;
const test = (label, fn) => {
    try {
        fn();
        pass++;
        console.log(`  \x1b[32m✓\x1b[0m ${label}`);
    } catch (err) {
        fail++;
        console.log(`  \x1b[31m✗\x1b[0m ${label}\n    ${err.message.split('\n')[0]}`);
    }
};

console.log('\n=== A. BNS / BNSS commencement (Art. 20(1): no retroactive criminal law) ===');
test('conduct on or after 01-07-2024 is governed by the BNS', () => {
    assert.equal(applicableLawFor('2024-07-01'), 'BNS');
    assert.equal(applicableLawFor('2025-11-20'), 'BNS');
});
test('conduct before 01-07-2024 stays under the IPC', () => {
    assert.equal(applicableLawFor('2024-06-30'), 'IPC');
    assert.equal(applicableLawFor('2024-03-14'), 'IPC');
});
test('an unusable date fails safe to the older, more lenient code', () => {
    assert.equal(applicableLawFor(undefined), 'IPC');
    assert.equal(applicableLawFor('not-a-date'), 'IPC');
});

console.log('\n=== B. intake case -> golden-key contract ===');
const legacyCase = {
    id: 'C-1',
    title: 'State v. Rahul',
    caseNumber: 'DL/2024/00001',
    petitioner: 'State of Delhi',
    respondent: 'Rahul Kumar',
    invokedActs: ['IPC 379'],
    filingDate: '2024-11-20',
    lastHearingDate: '2025-01-10',
    complexityScore: 4,
    summary: 'Theft caught on CCTV.',
    notes: 'Accused in custody.',
    caseType: 'Criminal',
    priority: 'High',
    userId: 'citizen-9',
};
const golden = toGoldenCase(legacyCase);
test('the fields the judge panels read are populated from the intake record', () => {
    assert.equal(golden.cnrNumber, 'DL/2024/00001');
    assert.equal(golden.complainant, 'State of Delhi');
    assert.deepEqual(golden.sectionsInvoked, ['IPC 379']);
    assert.equal(golden.urgency, 'HIGH');
    assert.equal(golden.caseNotes, 'Accused in custody.');
});
test('applicableLaw is derived from the incident, never copied from the caller', () => {
    // The intake screen does not capture an incident date, so the adapter falls back to the
    // filing date and derives the code from it - visible here, and the reason the intake form
    // should collect the incident date explicitly (Block 3).
    assert.equal(golden.incidentDate, '2024-11-20');
    assert.equal(golden.applicableLaw, 'BNS');
});
test('a case whose incident predates commencement is reported under the IPC', () => {
    const older = toGoldenCase({ ...legacyCase, filingDate: '2024-05-01' });
    assert.equal(older.applicableLaw, 'IPC');
});

console.log('\n=== C. BNSS s.176(3) interlock respects the same boundary ===');
test('a 7-year-plus offence after commencement triggers the interlock', () => {
    const r = isForensicVideoMandatory(['103'], 'BNS', new Date('2024-09-01'));
    assert.equal(r.isMandatory, true);
    assert.deepEqual(r.matchedSections, ['103']);
});
test('the same offence committed before commencement is exempt, with a stated reason', () => {
    const r = isForensicVideoMandatory(['103'], 'BNS', new Date('2024-03-14'));
    assert.equal(r.isMandatory, false);
    assert.equal(r.applicableAct, 'IPC');
    assert.match(r.reason ?? '', /commencement/);
});
test('existing callers that pass no incident date keep their previous behaviour', () => {
    const r = isForensicVideoMandatory(['105'], 'BNS');
    assert.equal(r.isMandatory, false, '105 is not on the >=7y list');
    const r2 = isForensicVideoMandatory(['302'], 'IPC');
    assert.equal(r2.isMandatory, true);
    assert.equal(r2.applicableAct, 'IPC');
});
test('the exported commencement constant is the date the statutes actually came into force', () => {
    assert.equal(BNS_EFFECTIVE_DATE.toISOString().slice(0, 10), '2024-07-01');
});

console.log('\n=== D. the interlock\'s video leg accepts a verified exhibit (a defect that locked honest callers) ===');
const token = {
    tokenId: 'TOK-1', caseId: 'C-1', investigatingOfficerId: 'SI-1', investigatingOfficerName: 'SI Kumar',
    forensicExpertId: 'FSL-9', forensicExpertName: 'Dr Rao', forensicExpertDesignation: 'Scientist B',
    visitTimestamp: new Date('2024-09-01T10:00:00Z'),
    geoLocation: { latitude: 28.5, longitude: 77.2, accuracy: 12 },
    handshakeMethod: 'MANUAL', digitalSignature: 'ledger-record-7', isVerified: true,
};
const video = (over = {}) => ({
    videoId: 'V-1', caseId: 'C-1', fileName: 'scene.mp4', fileSize: 1000, duration: 60, mimeType: 'video/mp4',
    captureDevice: { make: 'Samsung', model: 'S23', osVersion: 'Android 14' },
    captureTimestamp: new Date('2024-09-01T09:00:00Z'), ntpSynced: false, geoLocation: { latitude: 28.5, longitude: 77.2 },
    sourceHash: 'ab'.repeat(32), hashAlgorithm: 'SHA-256', uploadStatus: 'UPLOADED', integrityStatus: 'UNVERIFIED', ...over,
});
test('an uploaded, unverified video plus a verified token opens the gate', () => {
    const c = validateForensicCompliance('C-1', video(), token, true);
    assert.equal(c.checkResult, 'PASS');
    assert.equal(c.isHashVerified, false, 'integrity was never claimed, so none is reported');
});
test('a video already VERIFIED against the ledger does NOT read as missing', () => {
    const c = validateForensicCompliance('C-1', video({ uploadStatus: 'VERIFIED', integrityStatus: 'VERIFIED' }), token, true);
    assert.equal(c.checkResult, 'PASS');
    assert.equal(c.isHashVerified, true);
});
test('a video still uploading, or whose hash mismatched, keeps the gate shut', () => {
    assert.equal(validateForensicCompliance('C-1', video({ uploadStatus: 'UPLOADING' }), token, true).checkResult, 'FAIL_NO_VIDEO');
    assert.equal(validateForensicCompliance('C-1', video({ integrityStatus: 'MISMATCH' }), token, true).checkResult, 'FAIL_HASH_MISMATCH');
    assert.equal(validateForensicCompliance('C-1', video({ uploadStatus: 'PENDING' }), token, true).checkResult, 'FAIL_NO_VIDEO');
});
test('no expert token means no gate, however good the video is', () => {
    const c = validateForensicCompliance('C-1', video({ uploadStatus: 'VERIFIED' }), null, true);
    assert.equal(c.checkResult, 'FAIL_NO_EXPERT');
    assert.equal(c.interlockStatus, 'LOCKED');
});

console.log(`\n=== SUMMARY: ${pass} passed, ${fail} failed ===\n`);
process.exit(fail === 0 ? 0 : 1);
