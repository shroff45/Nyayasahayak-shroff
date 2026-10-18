/**
 * tests/trust_ledger.test.ts — the trust layer's promises, tested as promises.
 *
 * The audit of the previous ledger ended with one sentence that decided this file:
 * "a write-capable adversary re-hashes and launders; nothing persists; no authority binding".
 * Each clause gets a test here, including the strongest version of the attack - an adversary who
 * edits a record, recomputes every digest downstream, and re-folds the head - because that is
 * exactly what a hash chain without signatures cannot stop.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    createLedger,
    memoryDriver,
    localStorageDriver,
    leafDigestFor,
    verifyCertificate,
    anchorSignablePayload,
} from '../src/core/trust/ledger.ts';
import type { LedgerRecord } from '../src/core/trust/ledger.ts';
import {
    generateSigningIdentity,
    signPayload,
    verifySignature,
    webStorageIdentityVault,
} from '../src/core/trust/keys.ts';
import { verifyInclusionProof } from '../src/core/trust/merkle.ts';
import { sha256Hex } from '../src/core/trust/sha256.ts';
import type { JournalMeta, WebStorage } from '../src/core/trust/store.ts';

const ZERO = '0'.repeat(64);

/** Minimal stand-in for `window.localStorage` - the driver is written against this, not against a browser. */
const fakeStorage = (): WebStorage & { map: Map<string, string>; failNextWrite?: Error } => {
    const map = new Map<string, string>();
    const holder: any = {
        map,
        getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
        setItem: (k: string, v: string) => {
            if (holder.failNextWrite) {
                const err = holder.failNextWrite;
                holder.failNextWrite = undefined;
                throw err;
            }
            map.set(k, v);
        },
        removeItem: (k: string) => { map.delete(k); },
    };
    return holder as WebStorage & { map: Map<string, string>; failNextWrite?: Error };
};

const freshIdentity = async () => {
    const id = await generateSigningIdentity();
    return {
        identity: { ...id, custody: 'session-only' as const },
        trusted: [{
            fingerprint: id.fingerprint,
            label: 'Test bench key',
            publicKeyJwk: id.publicKeyJwk,
            addedAt: '2026-01-01T00:00:00.000Z',
        }],
    };
};

const seed = async (driver: any, identity: any, trusted: any[], count = 3) => {
    const ledger = await createLedger({ driver, identity, trustedAuthorities: trusted });
    for (let i = 1; i <= count; i++) {
        await ledger.append({
            kind: 'EVIDENCE',
            data: { exhibitNo: `EX-${i}`, description: `Seized item ${i}`, sha256: sha256Hex(`file-${i}`) },
        });
    }
    return ledger;
};

test('appends are 1-based, ordered, and each record names its predecessor', async () => {
    const { identity, trusted } = await freshIdentity();
    const ledger = await seed(memoryDriver(), identity, trusted, 4);
    const records = await ledger.records();
    assert.deepEqual(records.map((r) => r.index), [1, 2, 3, 4]);
    assert.equal(records[0].previousDigest, ZERO, 'the first record hangs off a defined zero, not an absent field');
    for (let i = 1; i < records.length; i++) {
        assert.equal(records[i].previousDigest, records[i - 1].leafDigest);
    }
});

test('a clean journal verifies, and says what it checked while doing so', async () => {
    const { identity, trusted } = await freshIdentity();
    const driver = memoryDriver();
    const ledger = await seed(driver, identity, trusted);
    await ledger.anchor();
    const result = await ledger.verifyChain();
    assert.equal(result.isValid, true, result.summary);
    assert.deepEqual(result.editedRecords, []);
    assert.deepEqual(result.brokenLinks, []);
    assert.equal(result.headDigestMatches, true);
    assert.deepEqual(result.failedAnchors, []);
    assert.match(result.summary, /3 entries \+ 1 anchor record\(s\) in a 4-record journal/);
});

test('editing a stored payload in place is detected', async () => {
    const { identity, trusted } = await freshIdentity();
    const driver = memoryDriver();
    const ledger = await seed(driver, identity, trusted);
    await ledger.anchor();

    const records = (await driver.readAll()).map((r: LedgerRecord) => ({ ...r, data: { ...r.data } }));
    records[0].data.description = 'Seized item 1 (SWAPPED)';
    const forged = memoryDriver({ meta: await driver.readMeta(), records });

    const result = await (await createLedger({ driver: forged, identity, trustedAuthorities: trusted })).verifyChain();
    assert.equal(result.isValid, false);
    assert.deepEqual(result.editedRecords, [1]);
});

test('a forger who re-hashes the whole downstream chain is still caught, by the signed root', async () => {
    const { identity, trusted } = await freshIdentity();
    const driver = memoryDriver();
    const ledger = await seed(driver, identity, trusted);
    await ledger.anchor();

    // The strong attack: change a record, then recompute its digest, every later record's
    // digest and linkage, and the running head digest. A pure hash chain has nothing left to
    // say; the anchor signature over the Merkle root is what breaks.
    const records = (await driver.readAll()).map((r: LedgerRecord) => ({ ...r, data: { ...r.data } }));
    records[0].data.description = 'Seized item 1 (REPLACED, then re-hashed)';
    let head = ZERO;
    for (let i = 0; i < records.length; i++) {
        records[i].previousDigest = i === 0 ? ZERO : records[i - 1].leafDigest;
        records[i].leafDigest = await leafDigestFor(records[i]);
        head = await sha256Hex(`${head}|${records[i].leafDigest}`);
    }
    const meta = { ...(await driver.readMeta())!, headDigest: head } as JournalMeta;
    const result = await (await createLedger({
        driver: memoryDriver({ meta, records }), identity, trustedAuthorities: trusted,
    })).verifyChain();

    assert.equal(result.isValid, false, 'a re-hashed chain must not verify');
    assert.equal(result.editedRecords.length, 0, 'the naive digest check alone would have passed it');
    assert.equal(result.headDigestMatches, true, 'and so would the head-digest check');
    assert.equal(result.failedAnchors.length, 1);
    assert.match(result.failedAnchors[0].reason, /Merkle root/);
});

test('truncating the tail is reported, and the dropped record reads as missing rather than tampered', async () => {
    const { identity, trusted } = await freshIdentity();
    const driver = memoryDriver();
    const ledger = await seed(driver, identity, trusted, 5);
    await ledger.anchor();
    const all = await driver.readAll();
    const meta = await driver.readMeta();

    const truncated = memoryDriver({ meta, records: all.slice(0, 2) });
    const result = await (await createLedger({ driver: truncated, identity, trustedAuthorities: trusted })).verifyChain();
    assert.equal(result.isValid, false);
    assert.equal(result.headDigestMatches, false);
    const missing = await (await createLedger({ driver: truncated, identity, trustedAuthorities: trusted })).verifyRecord(5);
    assert.equal(missing.ok, false);
    assert.match(missing.reason, /never anchored or the journal was truncated/);
});

test('records survive a reload - and the store really is the browser-shaped one', async () => {
    const { identity, trusted } = await freshIdentity();
    const storage = fakeStorage();

    const writer = await createLedger({
        driver: localStorageDriver(storage), identity, trustedAuthorities: trusted,
    });
    await writer.append({ kind: 'EVIDENCE', data: { exhibitNo: 'EX-9', description: 'Seized laptop' } });
    await writer.append({ kind: 'CUSTODY', data: { exhibitNo: 'EX-9', to: 'Malkhana, Room 3' } });
    await writer.anchor();

    // Something was actually written for a page load to read back - not just kept in a closure.
    assert.ok(storage.map.size >= 2, 'driver must write through to storage');
    assert.ok([...storage.map.values()].some((v) => String(v).includes('EX-9')));

    // A brand-new ledger instance, no shared memory, same storage: this is the reload.
    const reader = await createLedger({
        driver: localStorageDriver(storage), identity, trustedAuthorities: trusted,
    });
    const result = await reader.verifyChain();
    assert.equal(result.isValid, true, `state did not survive reload: ${result.summary}`);
    assert.equal(result.totalRecords, 3);
    const verdict = await reader.verifyRecord(1);
    assert.equal(verdict.ok, true);
    assert.match(verdict.reason, /inside signed anchor/);
});

test('a record appended after the last anchor is reported as unanchored, not as verified', async () => {
    const { identity, trusted } = await freshIdentity();
    const ledger = await seed(memoryDriver(), identity, trusted);
    await ledger.anchor();
    await ledger.append({ kind: 'EVIDENCE', data: { exhibitNo: 'EX-4', description: 'late arrival' } });

    const status = await ledger.status();
    assert.equal(status.unanchored, 1, 'the anchor record itself must not count as a dirty tail');
    const verdict = await ledger.verifyRecord(4);
    assert.equal(verdict.anchored, false);
    assert.match(verdict.reason, /UNANCHORED/);
    assert.match(verdict.reason, /could still remove it/);
});

test('an empty batch never produces an anchor', async () => {
    const { identity, trusted } = await freshIdentity();
    const ledger = await seed(memoryDriver(), identity, trusted);
    await ledger.anchor();
    assert.equal(await ledger.anchor(), null, 'a second anchor with nothing new would write a redundant, misleading record');
});

test('without pinned authorities nothing verifies, and the app says so instead of self-certifying', async () => {
    const { identity } = await freshIdentity();
    const ledger = await seed(memoryDriver(), identity, []);
    await ledger.anchor();
    const result = await ledger.verifyChain();
    assert.equal(result.isValid, false);
    assert.equal(result.failedAnchors.length, 1);
    assert.match(result.failedAnchors[0].reason, /No pinned authority/);
});

test('a quota failure aborts the write instead of leaving a chain that looks intact', async () => {
    const { identity, trusted } = await freshIdentity();
    const storage = fakeStorage();
    const ledger = await createLedger({ driver: localStorageDriver(storage), identity, trustedAuthorities: trusted });
    await ledger.append({ kind: 'EVIDENCE', data: { exhibitNo: 'EX-1' } });
    storage.failNextWrite = new Error('QuotaExceededError');
    await assert.rejects(
        () => ledger.append({ kind: 'EVIDENCE', data: { exhibitNo: 'EX-2' } }),
        /Ledger write failed/
    );
    const after = await ledger.records();
    assert.equal(after.length, 1, 'the failed record must not be half-present');
    assert.equal((await ledger.status()).records, 1);
});

test('the journal refuses an out-of-order append rather than accepting a rewrite', async () => {
    const driver = memoryDriver();
    const record = (index: number): LedgerRecord => ({
        index, timestamp: '2026-01-01T00:00:00.000Z', leafDigest: 'aa'.repeat(32),
        previousDigest: ZERO, data: { kind: 'CUSTOM' },
    });
    const meta = (recordCount: number): JournalMeta => ({ version: 1, storeId: 't', headDigest: 'bb'.repeat(32), recordCount });
    await driver.append(record(1), meta(1));
    // Both refusals now use one wording across drivers: a repeat index says so, and a jump
    // forward says who the journal believes is writing.
    await assert.rejects(() => driver.append(record(1), meta(2)), /index 1 already exists/);
    await assert.rejects(() => driver.append(record(7), meta(7)), /another writer is at 1 records/);
    assert.equal((await driver.readAll()).length, 1, 'a refused append must leave the journal untouched');
});

test('memory and localStorage drivers satisfy the same contract, so the fallback cannot drift', async () => {
    const cases: { name: string; make: () => any }[] = [
        { name: 'memory', make: () => memoryDriver() },
        { name: 'localStorage', make: () => localStorageDriver(fakeStorage()) },
    ];
    const record = (index: number): LedgerRecord => ({
        index, timestamp: '2026-01-01T00:00:00.000Z', leafDigest: `${index.toString(16).padStart(2, '0')}`.padEnd(64, '0'),
        previousDigest: ZERO, data: { kind: 'CUSTOM', index },
    });
    for (const { name, make } of cases) {
        const driver = make();
        assert.equal(await driver.readMeta(), null, `${name}: empty store reports no meta`);
        assert.deepEqual(await driver.readAll(), [], `${name}: empty store reports no records`);
        await driver.append(record(1), { version: 1, storeId: name, headDigest: 'cc'.repeat(32), recordCount: 1 });
        await driver.append(record(2), { version: 1, storeId: name, headDigest: 'dd'.repeat(32), recordCount: 2 });
        assert.deepEqual((await driver.readAll()).map((r: LedgerRecord) => r.index), [1, 2], name);
        assert.equal((await driver.readMeta())!.recordCount, 2, name);
        // The shared contract: an index that already exists must be refused. `localStorageDriver`
        // additionally re-reads the store on every append, so it also catches a writer in another
        // tab that moved the head underneath us - which no in-memory contract test can express.
        await assert.rejects(
            () => driver.append(record(1), { version: 1, storeId: name, headDigest: 'ee'.repeat(32), recordCount: 2 }),
            /already exists/,
            `${name}: duplicate index must be refused`
        );
        await assert.rejects(
            () => driver.append(record(2), { version: 1, storeId: name, headDigest: 'ee'.repeat(32), recordCount: 2 }),
            /already exists|is not 3|another writer/,
            `${name}: rewriting an existing index must be refused`
        );
        assert.equal((await driver.readAll()).length, 2, `${name}: rejected appends changed nothing`);
        await driver.reset();
        assert.deepEqual(await driver.readAll(), [], `${name}: reset clears`);
    }
});

test('a certificate verifies offline and rejects a record edited after export', async () => {
    const { identity, trusted } = await freshIdentity();
    const ledger = await seed(memoryDriver(), identity, trusted);
    await ledger.anchor();
    const cert = await ledger.exportCertificate(2);

    const clean = await verifyCertificate(cert, trusted);
    assert.equal(clean.ok, true, clean.reason);
    assert.match(clean.reason, /covers 3 record/);

    const noTrust = await verifyCertificate(cert, []);
    assert.equal(noTrust.ok, false);
    assert.match(noTrust.reason, /No pinned authority/);

    const body = JSON.parse(cert);
    body.record.data.description = 'edited after export';
    const tampered = await verifyCertificate(JSON.stringify(body), trusted);
    assert.equal(tampered.ok, false);
    assert.match(tampered.reason, /edited after export/);

    // The signed payload the anchor covers must exclude the signature itself, or no verifier ever passes.
    assert.equal('signature' in anchorSignablePayload(JSON.parse(cert).anchor), false);
});

test('identity persistence keeps the same signing key across reloads', async () => {
    const storage = fakeStorage();
    const vault = webStorageIdentityVault(storage);
    const a = await createLedger({ driver: memoryDriver(), identityVault: vault, identityLabel: 'Court 4 kiosk' });
    const b = await createLedger({ driver: memoryDriver(), identityVault: vault, identityLabel: 'Court 4 kiosk' });
    assert.equal((await a.status()).signerFingerprint, (await b.status()).signerFingerprint);
    assert.match((await a.status()).signerFingerprint, /^NYAYA-A1:[0-9A-F]{8}$/);
    assert.equal((await a.status()).custody, 'exportable-in-web-storage', 'a browser vault is device-secret, not HSM - reported, not hidden');
});

test('anchors are signed over exactly the bytes a verifier will recompute', async () => {
    const { identity, trusted } = await freshIdentity();
    const ledger = await seed(memoryDriver(), identity, trusted);
    await ledger.anchor();
    const [anchor] = await ledger.anchors();
    assert.ok(anchor, 'the anchor must be readable back out of the journal, not just returned');

    assert.ok(
        await verifySignature(identity.publicKey, anchor.signature, anchorSignablePayload(anchor)),
        'signature must verify against the anchor minus its own signature field'
    );
    assert.equal(
        await verifySignature(identity.publicKey, anchor.signature, anchor as unknown as Record<string, unknown>),
        false,
        'if the signature field were inside the signed bytes, no verifier could ever pass'
    );
    assert.equal(anchor.algorithm, 'ECDSA-P256-SHA256');
});

test('an anchor payload copied to another batch is caught by the index range it names', async () => {
    const { identity, trusted } = await freshIdentity();
    const ledger = await seed(memoryDriver(), identity, trusted, 3);
    await ledger.anchor();
    // Attach the record-1 proof to a batch that does not contain it: the count and range checks
    // in verifyInclusionProof are what reject this.
    const { proof, anchor } = (await ledger.getProof(1))!;
    const detached = await verifyInclusionProof(
        (await ledger.getRecord(1))!.leafDigest,
        { ...proof, leafIndex: 2 },
        anchor.merkleRoot,
        { expectedLeafCount: anchor.leafCount }
    );
    assert.equal(detached.isValid, false);
});

test('a signature is not accepted for a payload with one extra field', async () => {
    const { identity } = await freshIdentity();
    const payload = { anchorIndex: 1, merkleRoot: 'aa'.repeat(32) };
    const signature = await signPayload(identity.privateKey, payload);
    assert.ok(await verifySignature(identity.publicKey, signature, payload));
    assert.equal(await verifySignature(identity.publicKey, signature, { ...payload, extra: 1 }), false);
    assert.equal(await verifySignature(identity.publicKey, signature, { ...payload, merkleRoot: 'bb'.repeat(32) }), false);
});

test('a payload with an explicitly-undefined field still verifies after a reload', async () => {
    const { identity, trusted } = await freshIdentity();
    const storage = fakeStorage();
    const ledger = await createLedger({ driver: localStorageDriver(storage), identity, trustedAuthorities: trusted });
    // Exactly the shape the Section 63 wizard produces: optional fields set to undefined rather
    // than omitted. The driver drops them on write, so the digest has to be taken over the
    // reduced object or every such record would read as tampered the moment it was re-read.
    await ledger.append({
        kind: 'EVIDENCE',
        data: { exhibitNo: 'EX-UNDEF', badgeNumber: undefined, remarks: undefined, note: 'kept' },
    });
    await ledger.anchor();
    const reopened = await createLedger({ driver: localStorageDriver(storage), identity, trustedAuthorities: trusted });
    const verdict = await reopened.verifyRecord(1);
    assert.equal(verdict.digestMatches, true, verdict.reason);
    assert.equal(verdict.ok, true, verdict.reason);
    const stored = JSON.parse(storage.getItem('nyaya:ledger:v1:records')!)[0];
    assert.equal('badgeNumber' in stored.data, false, 'the key is gone from storage, as JSON does');
});
