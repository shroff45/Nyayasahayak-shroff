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
import type {
    IDBDatabaseLike,
    IDBLike,
    IDBObjectStoreLike,
    IDBRequestLike,
    JournalMeta,
    WebStorage,
} from '../src/core/trust/store.ts';
import { defaultDriver, indexedDbDriver } from '../src/core/trust/index.ts';

const ZERO = '0'.repeat(64);

/** Minimal stand-in for `window.localStorage` - the driver is written against this, not against a browser. */
const fakeStorage = (): WebStorage & { map: Map<string, string>; failNextWrite?: Error; forgetWrites?: boolean } => {
    const map = new Map<string, string>();
    const holder: any = {
        map,
        // `forgetWrites` is Safari-in-private-mode behaviour: `setItem` neither throws nor sticks.
        // It exists because "the write did not throw" is the weak claim, and a persistence flag
        // built on it is the defect D6 removes.
        getItem: (k: string) => (holder.forgetWrites ? null : (map.has(k) ? map.get(k)! : null)),
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


// ---------------------------------------------------------------------------
// D6: `persisted` is an answer to a question, not a description of which APIs exist.
//
// The flag used to be `typeof storage !== 'undefined'`, and the IndexedDB tier was offered but
// never chosen. Both halves were unproven claims about durability - the same category as
// "verified secure" on a button, which is why they are tested the same way: by building the
// refusal and checking that the app notices.

type FakeStores = Map<string, Map<number, unknown>>;

/**
 * A fake `indexedDB` with the three ways a real one refuses: `open` errors, the database already
 * exists at version 1 without the probe store (so a readwrite transaction on it is a NotFoundError),
 * or everything works. The last one is checked structurally too - the probe must leave its own store
 * empty, or "proving durability" would be a write that litters the thing it certifies.
 */
const fakeIdb = (opts: { failOpen?: boolean; preexistingWithoutProbeStore?: boolean } = {}) => {
    const dbs = new Map<string, FakeStores>();
    // A database that already exists at the requested version never fires `onupgradeneeded`, so an
    // install from before the probe store existed is simulated by pre-seeding it - not by refusing
    // the store later, which would let the upgrade path create the store and answer the probe
    // honestly for a situation it does not model. The name is the driver's default.
    if (opts.preexistingWithoutProbeStore) dbs.set('nyaya-ledger', new Map([['records', new Map<number, unknown>()]]));

    const request = <T,>(produce: () => T): IDBRequestLike => {
        const req: IDBRequestLike = { result: undefined, onsuccess: null, onerror: null, onupgradeneeded: null };
        // Deferred by a microtask because the driver assigns `onsuccess` after calling - a
        // synchronous callback would be delivered to nobody.
        queueMicrotask(() => {
            try {
                req.result = produce();
                req.onsuccess?.({ target: { result: req.result } });
            } catch (error) {
                req.onerror?.({ target: { error } });
            }
        });
        return req;
    };

    const objectStore = (data: Map<number, unknown>): IDBObjectStoreLike => ({
        put: (value, key) => request(() => { data.set(key ?? data.size, value); }),
        get: (key) => request(() => data.get(key)),
        getAll: () => request(() => [...data.values()]),
        clear: () => request(() => { data.clear(); }),
        delete: (key) => request(() => { data.delete(key); }),
    });

    const database = (stores: FakeStores): IDBDatabaseLike => ({
        objectStoreNames: { contains: (name: string) => stores.has(name) },
        createObjectStore: (name: string) => { stores.set(name, new Map()); return {}; },
        transaction: (name: string) => {
            const data = stores.get(name);
            if (!data) throw new Error(`NotFoundError: no object store named ${name}`);
            return { objectStore: () => objectStore(data) };
        },
    });

    const idb: IDBLike & { dbs: Map<string, FakeStores> } = {
        dbs,
        open: (name: string) => {
            const req: IDBRequestLike = { result: undefined, onsuccess: null, onerror: null, onupgradeneeded: null };
            queueMicrotask(() => {
                if (opts.failOpen) {
                    req.onerror?.({ target: { error: new Error('open blocked by policy') } });
                    return;
                }
                let stores = dbs.get(name);
                const needsUpgrade = stores === undefined;
                if (!stores) {
                    stores = new Map<string, Map<number, unknown>>();
                    dbs.set(name, stores);
                }
                req.result = database(stores);
                // A database that already exists at the requested version never fires this handler,
                // which is exactly how an install from before the probe store existed stays without one.
                if (needsUpgrade) req.onupgradeneeded?.({});
                req.onsuccess?.({ target: { result: req.result } });
            });
            return req;
        },
    };
    return idb;
};

const withGlobals = async <T,>(
    overrides: { localStorage?: WebStorage; indexedDB?: IDBLike },
    run: () => Promise<T>
): Promise<T> => {
    const had = {
        localStorage: Object.getOwnPropertyDescriptor(globalThis, 'localStorage'),
        indexedDB: Object.getOwnPropertyDescriptor(globalThis, 'indexedDB'),
    };
    const put = (key: 'localStorage' | 'indexedDB') => {
        const value = overrides[key];
        if (value === undefined) delete (globalThis as Record<string, unknown>)[key];
        else Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
    };
    put('localStorage');
    put('indexedDB');
    try {
        return await run();
    } finally {
        const restore = (key: 'localStorage' | 'indexedDB', desc: PropertyDescriptor | undefined) => {
            if (desc) Object.defineProperty(globalThis, key, desc);
            else delete (globalThis as Record<string, unknown>)[key];
        };
        restore('localStorage', had.localStorage);
        restore('indexedDB', had.indexedDB);
    }
};

test('the memory driver calls its own store unpersisted, rather than unproven', async () => {
    assert.equal(await memoryDriver().probe(), false);
});

test('a localStorage that accepts writes and then forgets them fails the probe', async () => {
    const working = fakeStorage();
    assert.equal(await localStorageDriver(working).probe(), true, 'the ordinary case must stay true');

    const forgetting = fakeStorage();
    forgetting.forgetWrites = true;
    assert.equal(
        await localStorageDriver(forgetting).probe(), false,
        'Safari private mode: setItem never throws and nothing survives - the weak claim was "it did not throw"'
    );

    const quota = fakeStorage();
    quota.failNextWrite = new Error('QuotaExceededError');
    assert.equal(await localStorageDriver(quota).probe(), false, 'a throwing store is refused, not fatal at boot');
});

test('the probe leaves nothing behind in its own store', async () => {
    const idb = fakeIdb();
    const driver = indexedDbDriver(idb);
    assert.equal(await driver.probe(), true);
    const stores = idb.dbs.get('nyaya-ledger');
    assert.ok(stores, 'the database was created');
    const probe = stores!.get('persistence-probe');
    assert.ok(probe, 'the probe store exists beside the journal, not inside it');
    assert.equal(probe!.size, 0, 'a marker left behind would let a stale value vouch for a store that just refused a write');
    assert.equal(stores!.get('records')!.size, 0, 'and the journal itself was never touched by the probe');
});

test('IndexedDB is chosen when it can answer for itself, and refused when it cannot', async () => {
    const working = fakeIdb();
    const chosen = await withGlobals({ localStorage: fakeStorage(), indexedDB: working }, () => defaultDriver());
    assert.equal(chosen.driver.name, 'indexedDB');
    assert.equal(chosen.persisted, true);

    const blocked = await withGlobals({ localStorage: fakeStorage(), indexedDB: fakeIdb({ failOpen: true }) }, () => defaultDriver());
    assert.equal(blocked.driver.name, 'localStorage', 'a refused open falls through instead of failing the boot');
    assert.equal(blocked.persisted, true);

    const legacy = await withGlobals(
        { localStorage: fakeStorage(), indexedDB: fakeIdb({ preexistingWithoutProbeStore: true }) },
        () => defaultDriver()
    );
    assert.equal(legacy.driver.name, 'localStorage', 'a database from before the probe store existed is not trusted on read-only evidence');
});

test('a device whose journal is already in localStorage is not moved onto an empty store', async () => {
    // The preference order is IndexedDB first, but preference loses to history: switching stores
    // mid-life would leave every record anchored yesterday out of reach while the chain still
    // looked healthy from record #1 onward.
    const local = fakeStorage();
    local.setItem('nyaya:ledger:v1:meta', JSON.stringify({
        version: 1, storeId: 'from-before-d6', headDigest: 'a'.repeat(64), recordCount: 7,
    }));
    const picked = await withGlobals({ localStorage: local, indexedDB: fakeIdb() }, () => defaultDriver());
    assert.equal(picked.driver.name, 'localStorage');
    assert.equal(picked.persisted, true);
});

test('with no store that can prove itself, the ledger degrades and says so', async () => {
    const outcome = await withGlobals({ indexedDB: fakeIdb({ failOpen: true }) }, () => defaultDriver());
    assert.equal(outcome.driver.name, 'memory');
    assert.equal(outcome.persisted, false);
});

test('an explicitly supplied driver is probed for itself, not for the browser around it', async () => {
    // Before D6 this pair was inverted: the environment was asked, so `memoryDriver()` inside a
    // browser reported `persisted: true` and the citizen was told their complaint was on disk.
    const workingStorage = fakeStorage();
    const { identity, trusted } = await freshIdentity();
    const ledger = await withGlobals({ localStorage: workingStorage }, async () => {
        const created = await createLedger({ driver: memoryDriver(), identity, trustedAuthorities: trusted });
        const status = await created.status();
        return status;
    });
    assert.equal(ledger.persisted, false, 'the flag describes the store in use, not the store available');

    const viaDefault = await withGlobals({ localStorage: workingStorage }, async () => {
        const created = await createLedger({ identity, trustedAuthorities: trusted });
        return await created.status();
    });
    assert.equal(viaDefault.persisted, true, 'and with no driver supplied it does describe the chosen store');
    assert.equal(viaDefault.storeName, 'localStorage');
});

test('a journal written through IndexedDB survives the reload that ends the session', async () => {
    const idb = fakeIdb();
    const { identity, trusted } = await freshIdentity();
    const ledger = await seed(indexedDbDriver(idb), identity, trusted, 2);
    const first = await ledger.status();
    assert.equal(first.persisted, true);
    assert.equal(first.records, 2);

    // "Reload" in this fake is a new driver over the same databases map, which is the same thing a
    // new page does over the same origin.
    const reopened = indexedDbDriver(idb);
    const records = await reopened.readAll();
    assert.equal(records.length, 2);
    assert.equal(records.map((r) => r.index).join(','), '1,2');
    const meta = await reopened.readMeta();
    assert.equal(meta!.recordCount, 2, 'and the meta that keeps the chain monotonic came back with it');
});
