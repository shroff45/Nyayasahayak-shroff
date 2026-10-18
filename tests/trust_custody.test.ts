/**
 * tests/trust_custody.test.ts — the custody projection, tested against a real journal.
 *
 * `ChainOfCustodyTimeline` (src/shared/components) was already written and already had a badge
 * system; what it lacked was data. This file is the contract between that component and the
 * ledger: which event each node comes from, and - the part that matters - whether a node's
 * VERIFIED / PENDING / MISMATCH / UNKNOWN badge follows *its own record* rather than the chain.
 * A timeline that colours every node green because the head digest happened to match is the failure
 * mode this replaces: the Evidence Locker used to render four fixed steps and a bar whose width
 * was chosen by an `if`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createLedger, memoryDriver, localStorageDriver, leafDigestFor } from '../src/core/trust/ledger.ts';
import { generateSigningIdentity } from '../src/core/trust/keys.ts';
import { sha256Hex } from '../src/core/trust/sha256.ts';
import { appendCustodyEvent, buildCustodyChain, GAP_TOLERANCE_HOURS } from '../src/core/trust/custody.ts';
import type { CustodyEventInput } from '../src/core/trust/custody.ts';
import type { WebStorage } from '../src/core/trust/store.ts';

const ZERO = '0'.repeat(64);

const fakeStorage = (): WebStorage & { map: Map<string, string> } => {
    const map = new Map<string, string>();
    return {
        map,
        getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
        setItem: (k: string, v: string) => { map.set(k, v); },
        removeItem: (k: string) => { map.delete(k); },
    } as WebStorage & { map: Map<string, string> };
};

const bench = async (options: { trusted?: boolean; storage?: WebStorage } = {}) => {
    const id = await generateSigningIdentity();
    const identity = { ...id, custody: 'session-only' as const };
    const trusted = options.trusted === false
        ? []
        : [{
            fingerprint: id.fingerprint,
            label: 'Bench key',
            publicKeyJwk: id.publicKeyJwk,
            addedAt: '2026-01-01T00:00:00.000Z',
        }];
    const driver = options.storage
        ? localStorageDriver(options.storage)
        : memoryDriver();
    const ledger = await createLedger({ driver, identity, trustedAuthorities: trusted });
    return { ledger, identity, trusted };
};

const exhibit = async (evidenceId: string, fileName: string, timestamp?: string) => ({
    kind: 'EVIDENCE' as const,
    ...(timestamp ? { timestamp } : {}),
    data: { id: evidenceId, caseId: 'CASE-1', fileName, sha256: (await sha256Hex(fileName)).toUpperCase(), summary: `Exhibit ${fileName}` },
});

const transfer = (evidenceId: string, over: Partial<CustodyEventInput> = {}): CustodyEventInput => ({
    caseId: 'CASE-1',
    evidenceId,
    eventType: 'HANDOVER',
    description: 'Handed to the Malkhana in-charge',
    custodian: { id: 'SI-4471', name: 'SI Kumar', role: 'MALKHANA_INCHARGE', designation: 'Sub-Inspector', badgeNumber: '4471' },
    location: { name: 'PS Saket' },
    sealNumber: 'SEAL-99',
    ...over,
});

test('a custody event is written, anchored, and comes back as one verified timeline node', async () => {
    const { ledger } = await bench();
    await ledger.append(await exhibit('EV-1', 'cctv-shop12.mp4'));
    await ledger.anchor();
    const written = await appendCustodyEvent(ledger, transfer('EV-1'));
    assert.equal(written.anchored, true, 'a transfer must not sit in the unanchored tail');

    const chain = await buildCustodyChain(ledger, { evidenceId: 'EV-1' });
    assert.equal(chain.events.length, 2, 'registration + handover');
    assert.equal(chain.events[0].eventType, 'RECEIPT', 'the exhibit record reads as the intake event');
    assert.equal(chain.events[1].eventType, 'HANDOVER');
    assert.deepEqual(chain.events.map((e) => e.integrityStatus), ['VERIFIED', 'VERIFIED']);
    assert.equal(chain.overallIntegrity, 'VERIFIED');
    assert.equal(chain.isChainUnbroken, true);
    assert.equal(chain.ledgerVerification.isVerified, true);
    assert.equal(chain.currentCustodian.name, 'SI Kumar');
    assert.equal(chain.gaps.length, 0);
    assert.ok(chain.proofs.every((p) => p.anchorIndex !== undefined), 'every node names the anchor covering it');
});

test('a broken record costs its own batch its provability, and nothing beyond it', async () => {
    const storage = fakeStorage();
    const { ledger, identity, trusted } = await bench({ storage });
    await ledger.append(await exhibit('EV-1', 'cctv-shop12.mp4'));
    await appendCustodyEvent(ledger, transfer('EV-1'));                     // batch A (with the exhibit)
    await appendCustodyEvent(ledger, transfer('EV-1', {                     // batch B, its own anchor
        eventType: 'TRANSPORT',
        description: 'In transit to FSL Rohini',
        sealNumber: 'SEAL-100',
    }));

    const key = 'nyaya:ledger:v1:records';
    const records = JSON.parse(storage.getItem(key)!);
    // Find it by content: the journal interleaves anchor records, so an array position here would
    // silently start testing whatever happens to sit next door.
    const target = records.find((r) => r.data.kind === 'CUSTODY' && r.data.eventType === 'HANDOVER');
    assert.ok(target, 'the handover event is in the store before we attack it');
    target.data.description = 'Handed to the Malkhana in-charge (and nobody objected)';
    // Recompute the digest so a naive "does the payload still hash to its own digest" check passes,
    // and fix the head fold too: this adversary is not a beginner.
    target.leafDigest = await leafDigestFor(target);
    let head = ZERO;
    for (const r of records) head = await sha256Hex(`${head}|${r.leafDigest}`);
    storage.setItem(key, JSON.stringify(records));
    storage.setItem('nyaya:ledger:v1:meta', JSON.stringify({
        ...JSON.parse(storage.getItem('nyaya:ledger:v1:meta')!), headDigest: head,
    }));

    // Re-open with the SAME device key and the SAME pinned authority: otherwise every record reads
    // as UNKNOWN for want of a trust anchor and this test proves nothing about the edit.
    const reopened = await createLedger({ driver: localStorageDriver(storage), identity, trustedAuthorities: trusted });
    const chain = await buildCustodyChain(reopened, { evidenceId: 'EV-1' });
    const byType = new Map(chain.events.map((e) => [e.eventType, e.integrityStatus]));
    const anchors = await reopened.anchors();
    const anchorOf = (eventId: string) => {
        const idx = Number(eventId.replace('LEDGER-', ''));
        return anchors.find((a) => idx >= a.batchStart && idx <= a.batchEnd)?.anchorIndex;
    };
    const edited = chain.events.find((e) => e.description.includes('nobody objected'))!;
    const sibling = chain.events.find((e) => e.eventType === 'RECEIPT')!;
    const outsider = chain.events.find((e) => e.eventType === 'TRANSPORT')!;

    assert.equal(edited.integrityStatus, 'MISMATCH', 'the forged record is refused');
    assert.match(chain.proofs.find((pp) => pp.recordIndex === Number(edited.eventId.slice(7)))!.reason, /Merkle root|anchor/i);
    assert.equal(byType.get('RECEIPT'), 'MISMATCH');
    assert.notEqual(anchorOf(edited.eventId), anchorOf(outsider.eventId), 'the two sit under different signed batches');
    assert.equal(outsider.integrityStatus, 'VERIFIED', 'and the other batch is untouched by this');
    assert.equal(chain.isChainUnbroken, false);
    assert.equal(chain.overallIntegrity, 'MISMATCH');
    // The exhibit record shares the forged record's anchor, so it loses provability too. That is
    // the honest reading, not a false alarm: what broke is membership in a signed root, which is a
    // property of the whole batch. A UI that painted only the edited node red would be implying the
    // rest of that batch is still provable, and it is not.
    assert.equal(sibling.integrityStatus, 'MISMATCH');
    assert.ok(sibling.eventId !== edited.eventId);
});

test('a transfer logged late keeps its event time, and a >24h hole becomes a gap not an accusation', async () => {
    const { ledger } = await bench();
    await ledger.append(await exhibit('EV-1', 'knife.jpg', '2026-01-01T09:00:00.000Z'));
    // Typed up two days after the fact - the event time must still land where it happened.
    await appendCustodyEvent(ledger, transfer('EV-1', {
        eventType: 'RECEIPT',
        description: 'Received at FSL Rohini',
        timestamp: '2026-01-01T09:30:00.000Z',
    }));
    await appendCustodyEvent(ledger, transfer('EV-1', {
        eventType: 'ANALYSIS',
        description: 'Terramine residue detected',
        timestamp: '2026-01-04T09:00:00.000Z',
    }));

    const chain = await buildCustodyChain(ledger, { evidenceId: 'EV-1' });
    assert.deepEqual(
        chain.events.map((e) => e.eventType),
        ['RECEIPT', 'RECEIPT', 'ANALYSIS'],
        'ordered by when it happened, not by when it was written'
    );
    assert.equal(chain.hasTimeGaps, true, 'the ~3-day hole is visible');
    assert.equal(chain.gaps.length, 1);
    assert.ok(chain.gaps[0].gapDuration >= GAP_TOLERANCE_HOURS);
    assert.equal(chain.gaps[0].isAcceptable, false);
    assert.match(chain.gaps[0].reason ?? '', /not necessarily unattended/);
    assert.equal(chain.overallIntegrity, 'GAP_DETECTED', 'a gap is its own status, not a tamper alert');
    assert.equal(chain.isChainUnbroken, true, 'and it does not imply the records were edited');
    assert.ok(chain.proofs[1].loggedAt, 'the write time is kept next to the event time');
    assert.notEqual(new Date(chain.proofs[1].loggedAt!).toISOString(), chain.events[1].timestamp.toISOString());
});

test('an unanchored event is PENDING, and a signature from an unpinned key is UNKNOWN - never VERIFIED, never MISMATCH', async () => {
    const { ledger } = await bench();
    await ledger.append(await exhibit('EV-1', 'cctv-shop12.mp4'));
    await appendCustodyEvent(ledger, transfer('EV-1'));
    // Append one more and skip the anchor: this is the tail the app cannot yet vouch for.
    await ledger.append({ kind: 'CUSTODY', data: { ...transfer('EV-1', { eventType: 'ANALYSIS' }) } });
    const tail = await buildCustodyChain(ledger, { evidenceId: 'EV-1' });
    assert.equal(tail.events[tail.events.length - 1].integrityStatus, 'PENDING');

    // Same journal, but the reader has not pinned the signer's key.
    const storage = fakeStorage();
    const signed = await bench({ storage });
    await signed.ledger.append(await exhibit('EV-2', 'phone.img'));
    await appendCustodyEvent(signed.ledger, transfer('EV-2'));
    const untrusted = await bench({ storage, trusted: false });
    const chain = await buildCustodyChain(untrusted.ledger, { evidenceId: 'EV-2' });
    assert.deepEqual(chain.events.map((e) => e.integrityStatus), ['UNKNOWN', 'UNKNOWN']);
    assert.equal(chain.ledgerVerification.isVerified, false);
    assert.equal(chain.isChainUnbroken, true, 'we cannot confirm it, and we must not claim we disproved it');
    assert.match(chain.proofs[0].reason, /trust|pin/i);
});

test('a timeline for an unknown exhibit is empty and says so, rather than rendering a green chain', async () => {
    const { ledger } = await bench();
    await ledger.append(await exhibit('EV-1', 'cctv-shop12.mp4'));
    const chain = await buildCustodyChain(ledger, { evidenceId: 'EV-MISSING' });
    assert.equal(chain.events.length, 0);
    assert.equal(chain.overallIntegrity, 'UNKNOWN');
    assert.equal(chain.ledgerVerification.isVerified, false);
    assert.equal(chain.currentCustodian.name, 'No custody record yet');
    assert.equal(chain.chainStartHash, '', 'no hash is invented for a record that does not exist');
});

test('a custody event without an exhibit or a custodian is refused at the door', async () => {
    const { ledger } = await bench();
    await assert.rejects(
        () => appendCustodyEvent(ledger, transfer('   ')),
        /needs the exhibit id/
    );
    await assert.rejects(
        () => appendCustodyEvent(ledger, transfer('EV-1', { custodian: { id: 'x', name: '  ', role: 'JUDGE', designation: 'd' } })),
        /needs the person taking custody/
    );
    assert.equal((await ledger.records()).length, 0, 'a refused event leaves nothing half-written');
});

test('custody events for a different exhibit never leak into this timeline', async () => {
    const { ledger } = await bench();
    await ledger.append(await exhibit('EV-1', 'cctv-shop12.mp4'));
    await ledger.append(await exhibit('EV-2', 'knife.jpg'));
    await appendCustodyEvent(ledger, transfer('EV-1'));
    await appendCustodyEvent(ledger, transfer('EV-2', { eventType: 'ANALYSIS' }));
    const one = await buildCustodyChain(ledger, { evidenceId: 'EV-1' });
    const two = await buildCustodyChain(ledger, { evidenceId: 'EV-2' });
    assert.equal(one.events.length, 2);
    assert.equal(two.events.length, 2);
    assert.deepEqual(one.events.map((e) => e.description).filter((d) => d.includes('FSL')), []);
    assert.equal(one.events[1].eventType, 'HANDOVER');
    assert.equal(two.events[1].eventType, 'ANALYSIS');
});
