/**
 * tests/citizen_intake_ledger.test.ts — D20's contract, end to end.
 *
 * The defect this pins was not a crash: the citizen intake showed "Complaint Filed Successfully" and a
 * CNR that `Math.random()` had invented, while the only writer of `kind:'CASE'` rows was never called.
 * Three live screens read cases (`EvidenceLocker`, `ChargeSheetGatePage`, `CaseChainOfCustodyPage`) and
 * none of them could ever see a complaint, so the app had an intake and a docket that never met.
 *
 * These tests go through the real façade (`src/services/akhandLedger.ts`) and the real reader
 * (`src/shared/utils/ledgerRecords.ts`) against the same localStorage-shaped driver the browser uses.
 * Not fixtures: a fixture would have passed the day this was broken, which is the whole point.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { addBlock, getLedger } from '../src/services/akhandLedger.ts';
import { findCase, listCases } from '../src/shared/utils/ledgerRecords.ts';
import { isForensicVideoMandatory, BNS_EFFECTIVE_DATE } from '../src/core/services/forensicInterlock.ts';
import type { WebStorage } from '../src/core/trust/store.ts';

/**
 * The façade refuses to run at all without localStorage - it throws rather than keep an un-anchorable
 * journal - so the shim is the minimum this file can ask for, not a convenience.
 */
const installStorage = (): WebStorage => {
    const map = new Map<string, string>();
    const storage: WebStorage = {
        getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
        setItem: (k: string, v: string) => { map.set(k, String(v)); },
        removeItem: (k: string) => { map.delete(k); },
    };
    globalThis.localStorage = storage as unknown as Storage;
    return storage;
};

const freshJournal = async () => {
    installStorage();
    const ledger = await getLedger();
    await ledger.reset();
    return ledger;
};

/** Exactly what `CitizenComplaint.handleSubmit` sends, for a theft on 20 November 2023. */
const filedComplaint = (overrides: Record<string, unknown> = {}) => ({
    id: 'CASE-0f0c1a2b-3d4e-5f60-7182-93a4b5c6d7e8',
    complainant: 'Kavitha Raman',
    respondent: '',
    caseType: 'Criminal',
    summary: 'My mobile phone was stolen near Central Market on 15th December.',
    sectionsInvoked: ['BNS 303'],
    incidentDate: '2023-11-20',
    filingDate: '2026-10-19T09:00:00.000Z',
    isZeroFir: true,
    ...overrides,
});

test('a complaint filed by the citizen intake is a row the persona screens can read', async () => {
    const ledger = await freshJournal();
    const payload = filedComplaint({ cnrNumber: '441/2023/CN-KAR' });

    const written = await addBlock(payload);
    assert.equal(written.success, true);
    assert.equal(written.index, 1, 'a fresh journal starts at 1');
    assert.match(written.leafDigest, /^[0-9a-f]{64}$/, 'lower-case hex, computed here, not dictated');
    assert.equal(written.persisted, true, 'with a working storage driver the receipt may say "Saved to this device"');

    const records = await ledger.records();
    const cases = listCases(records);
    assert.equal(cases.length, 1);
    const found = findCase(records, payload.id);
    assert.ok(found, 'findCase resolves a citizen complaint by its journal id');
    assert.equal(found!.complainant, 'Kavitha Raman');
    assert.equal(found!.cnrNumber, '441/2023/CN-KAR', 'a typed CNR survives');
    assert.deepEqual(found!.sectionsInvoked, ['BNS 303']);
    assert.equal(found!.incidentDate, '2023-11-20');
    assert.equal(found!.isZeroFir, true, 'a zero FIR is explainable downstream: no CNR, by design');
    assert.equal(found!.applicableLaw, undefined, 'the intake stores no code: the date decides it, at read time');
});

test('a respondent the citizen left blank stays unstated - the record is not allowed to guess', async () => {
    const ledger = await freshJournal();
    await addBlock(filedComplaint());
    const found = findCase(await ledger.records(), 'CASE-0f0c1a2b-3d4e-5f60-7182-93a4b5c6d7e8');
    assert.ok(found);
    assert.equal(found!.respondent, undefined, 'no "unknown person", no "To be identified"');
    assert.equal(found!.cnrNumber, undefined, 'a CNR is a number a police station assigns; nothing here assigns one');
});

test('incidentDate is the field that carries legal weight, so the reader must never infer it', async () => {
    const ledger = await freshJournal();
    const withDate = filedComplaint();
    await addBlock(withDate);
    const records = await ledger.records();
    const found = findCase(records, withDate.id)!;

    // Pre-commencement conduct: the BNS/BNSS did not apply on 20 November 2023, so the s.176(3)
    // videography interlock must not fire off this record.
    const date = new Date(found.incidentDate!);
    assert.ok(date < BNS_EFFECTIVE_DATE);
    const derived = isForensicVideoMandatory(['303'], 'BNS', date);
    assert.equal(derived.applicableAct, 'IPC', 'the date the record carries is what routes the case to the IPC');
    assert.equal(derived.isMandatory, false);

    // Now the same complaint with `incidentDate` omitted - the exact regression D20 guards against.
    const ledger2 = await freshJournal();
    const dropped = { ...withDate } as Record<string, unknown>;
    delete dropped.incidentDate;
    await addBlock(dropped);
    const readBack = findCase(await ledger2.records(), withDate.id)!;
    assert.equal(
        readBack.incidentDate, '2026-10-19T09:00:00.000Z',
        'readCase falls back to filingDate, which silently turns 2023 conduct into post-commencement conduct'
    );
    const flipped = isForensicVideoMandatory(['303'], 'BNS', new Date(readBack.incidentDate!));
    assert.equal(flipped.applicableAct, 'BNS', 'and the guard flips - which is why the intake never omits the field');
});

test('the receipt can honestly say the row is anchored, because the proof is retrievable', async () => {
    const ledger = await freshJournal();
    const written = await addBlock(filedComplaint());
    const proof = await ledger.getProof(written.index);
    assert.ok(proof, 'addBlock anchors per record, so `Anchored: Yes` on the receipt is a fact about the journal');
    const check = await ledger.verifyRecord(written.index);
    assert.equal(check.ok, true, check.reason);
    assert.equal(check.proofValid, true);
    assert.equal(check.anchored, true);
});
