/**
 * tests/section63_certificate.test.ts — the s.63(4) certificate document.
 *
 * The wizard collects Part A field by field; this file is the only thing proving those fields
 * survive into the document an officer actually prints and signs. The failure mode it guards
 * against is quiet: a renderer that reads `JSON.stringify(partA)` or forgets an optional field
 * produces a plausible certificate with holes in it, and nobody notices until a court asks about
 * the period of lawful control.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    formatPartA,
    formatPartB,
    formatSection63Certificate,
    section63FileName,
} from '../src/core/services/section63Certificate.ts';
import type { Section63PartA } from '../src/types/evidence.types.ts';

const partA = (over: Partial<Section63PartA> = {}): Section63PartA => ({
    deponentName: 'SI Kumar',
    designation: 'Sub-Inspector, PS Saket',
    badgeNumber: '4471',
    deviceSource: 'mobile',
    deviceMetadata: {
        type: 'mobile',
        make: 'Samsung',
        model: 'Galaxy S23',
        uniqueId: '356938035643809',
        osVersion: 'Android 14',
    },
    operationalCertification: {
        isDeviceWorkingProperly: true,
        periodOfControl: '2026-10-17 21:00 to 2026-10-18 09:30',
        controlAffirmation: true,
    },
    hashValue: '9f2c4b1e7d0a3c5f8e2b1d4a7c6f0e3b5d8a1c4f7e2b9d0a3c6f5e8b1d4a7c0f',
    hashAlgorithm: 'SHA-256',
    signatureTimestamp: new Date('2026-10-18T09:31:00.000Z'),
    ...over,
});

const meta = {
    evidenceId: 'EV-2026-0001',
    caseId: 'CASE-1',
    fileName: 'cctv-shop12.mp4',
    fileSize: 1048576,
};

test('every Part A particular reaches the document', () => {
    const text = formatPartA(partA(), meta);
    for (const value of [
        'SI Kumar',
        'Sub-Inspector, PS Saket',
        '4471',
        'Samsung',
        'Galaxy S23',
        '356938035643809',
        'Android 14',
        '2026-10-17 21:00 to 2026-10-18 09:30',
        'SHA-256',
        'cctv-shop12.mp4',
        'EV-2026-0001',
        '1048576',
    ]) {
        assert.ok(text.includes(value), `the certificate lost ${value}`);
    }
    assert.ok(text.includes('Device was operating properly throughout'));
    assert.ok(text.includes('Yes'), 'the affirmations have to be answered, not left implicit');
    assert.ok(text.includes('2026-10-18T09:31:00.000Z'), 'the signing time is a Part A particular');
});

test('an absent optional prints as a placeholder, never as undefined or a silent blank', () => {
    const sparse = partA({ badgeNumber: undefined, aadhaarHash: undefined, digitalSignature: undefined });
    const text = formatPartA(sparse, { evidenceId: 'EV-2' });
    for (const forbidden of ['undefined', 'null', 'NaN', '[object Object]']) {
        assert.ok(!text.includes(forbidden), `the word ${forbidden} must never be printed on a certificate`);
    }
    assert.ok(text.includes('not provided'), 'a missing particular has to be visibly missing');
});

test('a declared malfunction is carried into Part A; a working device says so in terms', () => {
    const broken = partA({
        operationalCertification: {
            isDeviceWorkingProperly: false,
            malfunctionDetails: 'Camera stabiliser failed after 02:10; recording continued.',
            periodOfControl: '2026-10-18 00:00 to 04:00',
            controlAffirmation: true,
        },
    });
    const brokenText = formatPartA(broken, meta);
    assert.ok(brokenText.includes('Camera stabiliser failed after 02:10'));
    assert.match(brokenText, /operating properly throughout\s*: No/);
    assert.ok(!formatPartA(partA(), meta).includes('failed after 02:10'));
    assert.match(formatPartA(partA(), meta), /Details of any malfunction\s*: Not applicable/);
});

test('Part B is issued blank, because the officer cannot attest for the expert', () => {
    const text = formatPartB(partA(), meta);
    assert.match(text, /to be completed by the Forensic Science Laboratory/);
    // What the expert needs in advance: the exhibit, the file, the digest to compare against.
    assert.ok(text.includes('EV-2026-0001'));
    assert.ok(text.includes('cctv-shop12.mp4'));
    assert.ok(text.includes(partA().hashValue.toUpperCase()));
    // And nothing that belongs to the expert's answer.
    for (const stolen of ['Name of the expert'.padEnd(38) + ': S', 'hashMatch', 'Match Found', ': Yes']) {
        assert.ok(!text.includes(stolen), `Part B must not pre-answer ${stolen}`);
    }
    assert.match(text, /Whether the hashes match\s*: — not provided —/);
});

test('the ledger coordinates are printed, and their absence is stated as an absence', () => {
    const withLedger = formatSection63Certificate(partA(), {
        ...meta,
        ledgerLines: ['record #7 of 9, anchored at #8 (Merkle root 9f2c4b1e…)'],
    });
    assert.ok(withLedger.includes('LEDGER COORDINATES'));
    assert.ok(withLedger.includes('anchored at #8'));
    const without = formatSection63Certificate(partA(), meta);
    assert.ok(without.includes('Not recorded in a ledger.'));
});

test('the limits of the certificate travel with the document', () => {
    const text = formatSection63Certificate(partA(), meta);
    assert.ok(text.includes('WHAT THIS DOCUMENT ESTABLISHES'));
    assert.ok(text.includes('WHAT IT DOES NOT ESTABLISH'));
    assert.ok(text.includes('Part B is outstanding until the expert signs it'));
    assert.ok(text.includes('Gazette'), 'the form is this project\'s reading of the Schedule, and says so');
    assert.ok(!/quantum|zero[- ]?knowledge|zkp|immutable|blockchain/i.test(text),
        'no capability this layer does not implement may appear on a certificate');
});

test('the same fields render byte-identically, so a published digest can be checked later', () => {
    const a = formatSection63Certificate(partA(), { ...meta, ledgerLines: ['record #7, anchored at #8'] });
    const b = formatSection63Certificate(partA(), { ...meta, ledgerLines: ['record #7, anchored at #8'] });
    assert.equal(a, b, 'a certificate whose text drifts between renders cannot have a useful digest');
});

test('a file name built from an exhibit id cannot carry path or shell characters', () => {
    assert.equal(section63FileName('EV-2026/0001'), 'BSA63_EV-2026_0001.txt');
    assert.equal(section63FileName('../../etc/passwd'), 'BSA63_.._.._etc_passwd.txt');
    assert.equal(section63FileName('EV-1', 'json'), 'BSA63_EV-1.json');
});
