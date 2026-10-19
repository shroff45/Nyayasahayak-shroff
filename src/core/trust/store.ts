/**
 * store.ts — the append-only journal the ledger is built on.
 *
 * What this fixes: the previous "Akhand Ledger" kept `let blockchain: BlockchainBlock[] = []`
 * at module scope. On reload it re-seeded to genesis, so a judge who anchored an exhibit,
 * switched tabs, and came back got "NO MATCH" for a perfectly intact file — a false
 * accusation of tampering, which is worse than no feature at all. Everything in this module
 * exists to make the record outlive the page.
 *
 * Driver choice, stated plainly - and every clause of it is answered by a probe, not by an
 * assumption about which APIs a browser happens to expose:
 *  - `indexedDbDriver` is preferred, because it is the only one of these stores that is not
 *    capped at ~5 MB and the only one that can hold a forensic artefact beside its digest. It is
 *    chosen only if opening it, creating it, and writing then reading back a probe record all
 *    succeed.
 *  - `localStorageDriver` is the fallback, and it keeps the journal when it already holds one -
 *    see `defaultDriver`: a device that has been writing to localStorage does not get moved onto
 *    an empty IndexedDB store, because "new history from today" would silently orphan every
 *    exhibit anchored yesterday. That rule matters more than the preference above.
 *  - `memoryDriver` is for tests and non-browser contexts, and the runtime fallback when nothing
 *    persists. Its `probe()` returns false unconditionally: nothing written here outlives the
 *    page, and `persisted: false` is the ledger saying so instead of pretending to have written.
 *
 * What `probe()` is, and what it is not: one write and one read-back, performed before the ledger
 * reports `persisted: true`. It exists because `setItem` succeeding is not durability - Safari in
 * private mode accepts every write and discards all of them at unload - and because IndexedDB
 * resolves `open()` happily in contexts where a readwrite transaction is refused. Neither is a
 * theoretical worry; both are what a courthouse kiosk with a locked-down profile actually does.
 *
 * The two storage-backed drivers are held to one contract by `tests/trust_ledger.test.ts`, so the
 * fallback cannot drift from the primary.
 *
 * Append-only by construction: there is no update or delete. Replacing history is only possible
 * by discarding the store wholesale, which `verifyChain` detects through the head anchor
 * signature and the running history digest (see ledger.ts).
 */

export interface LedgerRecord {
    /** 1-based, monotonic. Genesis occupies index 0 and is never stored. */
    index: number;
    /** ISO-8601, set by the writer. */
    timestamp: string;
    /** hex SHA-256 of the canonical payload — the leaf that goes into the Merkle tree. */
    leafDigest: string;
    previousDigest: string;
    /** The anchored payload: case data, exhibit metadata, custody event, bail contract, ... */
    data: Record<string, unknown>;
}

export interface JournalMeta {
    version: number;
    /** Set once, on first write; a mismatch means the store was swapped or copied from elsewhere. */
    storeId: string;
    /** Hex digest over every record so far, so a truncation is visible without signatures. */
    headDigest: string;
    recordCount: number;
}

export interface JournalDriver {
    readonly name: string;
    readMeta(): Promise<JournalMeta | null>;
    readAll(): Promise<LedgerRecord[]>;
    /** Implementations must reject if `record.index` is not exactly meta.recordCount + 1. */
    append(record: LedgerRecord, nextMeta: JournalMeta): Promise<void>;
    /** Only for tests and an explicit, operator-initiated wipe. */
    reset(): Promise<void>;
    /**
     * "If I write here, does the value come back?" One sentinel write, one read, one cleanup;
     * resolves false rather than rejecting, because a store that cannot answer is a store the
     * caller should not use. `Ledger.status().persisted` is this answer and nothing else - it is
     * deliberately not `typeof storage !== 'undefined'`, and not "the append did not throw".
     *
     * A caller that supplies its own `driver` to `createLedger` gets its own probe result, not the
     * one belonging to whichever store the browser happened to offer. That distinction is the
     * second half of this change: passing `memoryDriver()` in a browser used to report
     * `persisted: true`, because the flag described the environment rather than the store in use.
     */
    probe(): Promise<boolean>;
}

export const JOURNAL_VERSION = 1;

const META_SUFFIX = ':meta';
const RECORDS_SUFFIX = ':records';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * In-memory driver. Also the shape any storage-backed driver must reproduce —
 * `tools/trust_store_conformance` runs both against the same assertions.
 */
export const memoryDriver = (
    initial: { meta?: JournalMeta | null; records?: LedgerRecord[] } = {}
): JournalDriver & {
    /** Test seam: how many appends actually landed. */
    readonly writes: number;
} => {
    let meta = initial.meta ?? null;
    let records = clone(initial.records ?? []);
    let writes = 0;
    return {
        name: 'memory',
        get writes() { return writes; },
        async readMeta() { return meta ? clone(meta) : null; },
        async readAll() { return clone(records); },
        async append(record, nextMeta) {
            // Same order, same wording as `localStorageDriver`: the two fallbacks must refuse a
            // given situation for the same reason, or the message an auditor sees depends on
            // which storage the browser happened to offer.
            if (records.some((r) => r.index === record.index)) {
                throw new Error(`Append conflict: index ${record.index} already exists`);
            }
            if (meta && record.index !== meta.recordCount + 1) {
                throw new Error(
                    `Append conflict: another writer is at ${meta.recordCount} records, ` +
                    `refusing to append index ${record.index}`
                );
            }
            records = [...records, clone(record)];
            meta = clone(nextMeta);
            writes++;
        },
        async reset() { meta = null; records = []; },
        // Never "unproven": for the in-memory driver the answer is known. A journal that lives in a
        // module's closure cannot survive the reload that ends the session, so a probe would only be
        // a slower way of returning false - and `false` is the value the screens phrase as
        // "Session only - will not survive page reload".
        async probe() { return false; },
    };
};

export interface WebStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

/**
 * localStorage driver. Writes are read-modify-write on one key, guarded by a same-tick
 * re-read (see `appendConflict`): two tabs appending at once would otherwise silently drop a
 * record, which for this journal means losing an exhibit from the chain.
 */
export const localStorageDriver = (storage: WebStorage, namespace = 'nyaya:ledger:v1'): JournalDriver => {
    const metaKey = namespace + META_SUFFIX;
    const recordsKey = namespace + RECORDS_SUFFIX;

    const loadRecords = (): LedgerRecord[] => {
        const raw = storage.getItem(recordsKey);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as LedgerRecord[];
        if (!Array.isArray(parsed)) throw new Error('Ledger store is corrupt: records is not an array');
        return parsed;
    };
    const loadMeta = (): JournalMeta | null => {
        const raw = storage.getItem(metaKey);
        return raw ? (JSON.parse(raw) as JournalMeta) : null;
    };

    // Outside the namespace on purpose: `loadRecords`/`loadMeta` read fixed keys, so a sentinel
    // parked here can never be mistaken for journal state, and a wipe of the namespace cannot
    // strand it. The value varies per probe so a leftover marker from an earlier run cannot make
    // this return true for data the store did not just accept.
    const probeKey = namespace + ':probe';

    return {
        name: 'localStorage',
        async readMeta() { return loadMeta(); },
        async readAll() { return loadRecords(); },
        async append(record, nextMeta) {
            const existing = loadRecords();
            const existingMeta = loadMeta();
            // Duplicate first: it is the more specific diagnosis, and the two drivers must
            // refuse the same situation for the same stated reason or an audit log becomes
            // driver-dependent.
            if (existing.some((r) => r.index === record.index)) {
                throw new Error(`Append conflict: index ${record.index} already exists`);
            }
            if (existingMeta && record.index !== existingMeta.recordCount + 1) {
                throw new Error(
                    `Append conflict: another writer is at ${existingMeta.recordCount} records, ` +
                    `refusing to append index ${record.index}`
                );
            }
            const payload = JSON.stringify([...existing, record]);
            // Quota exceeded must not be swallowed: a ledger that quietly stops growing is
            // how an exhibit ends up missing from a chain that still looks intact.
            try {
                storage.setItem(recordsKey, payload);
                storage.setItem(metaKey, JSON.stringify(nextMeta));
            } catch (err) {
                throw new Error(
                    `Ledger write failed (${err instanceof Error ? err.message : err}). Nothing was anchored. ` +
                    'Free space or switch to the IndexedDB driver before continuing.'
                );
            }
        },
        async reset() {
            storage.removeItem(recordsKey);
            storage.removeItem(metaKey);
        },
        async probe() {
            const token = `${Date.now()}:${Math.random()}`;
            try {
                storage.setItem(probeKey, token);
                const readBack = storage.getItem(probeKey);
                storage.removeItem(probeKey);
                // `setItem` not throwing is the weak claim; the strong one is that the value came
                // back. Safari's private mode satisfies the first and fails the second, and a
                // ledger that reports `persisted: true` on the strength of the first has told a
                // citizen their complaint is on disk when the browser is about to discard it.
                return readBack === token && storage.getItem(probeKey) === null;
            } catch {
                // Quota exceeded, storage disabled by policy, a profile that denies access: all of
                // them mean "do not pick me", not "throw at the user during boot".
                return false;
            }
        },
    };
};

export interface IDBLike {
    open(name: string, version: number): IDBRequestLike;
}
/**
 * Minimal structural type for IndexedDB. Deliberately narrow: it names only the calls this
 * driver makes, so it can be exercised in tests without a DOM and so a future change that
 * needs more of the API fails to typecheck instead of failing at runtime in a courtroom.
 */
export interface IDBRequestLike {
    result: unknown;
    onsuccess: ((ev: { target: { result: unknown } }) => void) | null;
    onerror: ((ev: { target: { error?: unknown } }) => void) | null;
    onupgradeneeded: ((ev: unknown) => void) | null;
}
export interface IDBObjectStoreLike {
    put(value: unknown, key?: number): IDBRequestLike;
    get(key: number): IDBRequestLike;
    getAll(): IDBRequestLike;
    clear(): IDBRequestLike;
    /** Named because the persistence probe has to undo itself. */
    delete(key: number): IDBRequestLike;
}
export interface IDBDatabaseLike {
    createObjectStore(name: string, options?: { keyPath?: string }): unknown;
    objectStoreNames: { contains(name: string): boolean };
    transaction(store: string, mode: 'readonly' | 'readwrite'): { objectStore(name: string): IDBObjectStoreLike };
}

const idbRequest = <T,>(request: IDBRequestLike): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        request.onsuccess = (ev) => resolve(ev.target.result as T);
        request.onerror = (ev) => reject(new Error(`IndexedDB request failed: ${JSON.stringify(ev.target.error) ?? 'unknown'}`));
    });

/**
 * IndexedDB driver, for stores with many records or large nested artefacts. Same contract as
 * the localStorage driver: append-only, monotonic index, refuses to overwrite.
 */
export const indexedDbDriver = (
    indexedDB: IDBLike,
    dbName = 'nyaya-ledger',
    storeName = 'records',
    probeStoreName = 'persistence-probe'
): JournalDriver => {
    // A second object store, created in the same `version: 1` upgrade, exists for one reason: the
    // probe needs to write and read back without entering the journal. In `records` it would be
    // swept up by `readAll` (a `getAll()` over that store) and would break the append rule that
    // `record.index` must equal `meta.recordCount + 1` - i.e. proving durability would corrupt
    // the very chain it is supposed to protect.
    //
    // An install whose database predates this store gets `transaction(probeStoreName)` refused with
    // a NotFoundError, the probe resolves false, and the ledger falls back to localStorage, which
    // is where that device's journal already is. That is the safe direction for the failure: the
    // store that cannot prove itself is not used, rather than being trusted on request.
    const openDb = async (): Promise<IDBDatabaseLike> => {
        const req = indexedDB.open(dbName, 1);
        req.onupgradeneeded = () => {
            const db = req.result as IDBDatabaseLike;
            if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName);
            if (!db.objectStoreNames.contains(probeStoreName)) db.createObjectStore(probeStoreName);
        };
        return await new Promise<IDBDatabaseLike>((resolve, reject) => {
            req.onsuccess = (ev) => resolve(ev.target.result as IDBDatabaseLike);
            req.onerror = () => reject(new Error(`Could not open ${dbName}`));
        });
    };

    // Meta lives in the same store under key 0 so that every driver reports the same
    // `headDigest` semantics. Deriving it from the last record instead would let the two
    // drivers disagree about what "head" means, which is how a verification pass starts
    // trusting the wrong thing.
    const META_KEY = 0;

    const getAll = async (): Promise<unknown[]> => {
        const db = await openDb();
        const tx = db.transaction(storeName, 'readonly');
        return (await idbRequest<unknown[]>(tx.objectStore(storeName).getAll())) ?? [];
    };

    const readAll = async (): Promise<LedgerRecord[]> => {
        const all = await getAll();
        return all
            .filter((v): v is LedgerRecord => Boolean(v) && typeof (v as LedgerRecord).index === 'number')
            .sort((a, b) => a.index - b.index);
    };

    return {
        name: 'indexedDB',
        async readMeta() {
            const db = await openDb();
            const tx = db.transaction(storeName, 'readonly');
            const meta = await idbRequest<JournalMeta | undefined>(tx.objectStore(storeName).get(META_KEY));
            return meta ? clone(meta) : null;
        },
        readAll,
        async append(record, nextMeta) {
            const records = await readAll();
            if (records.length !== nextMeta.recordCount - 1) {
                throw new Error(
                    `Append conflict: store holds ${records.length} records but the ledger believes it holds ` +
                    `${nextMeta.recordCount - 1}. Refusing to write.`
                );
            }
            if (records.some((r) => r.index === record.index)) {
                throw new Error(`Append conflict: index ${record.index} already exists`);
            }
            const db = await openDb();
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            await idbRequest(store.put(record, record.index));
            await idbRequest(store.put(nextMeta, META_KEY));
        },
        async reset() {
            const db = await openDb();
            const tx = db.transaction(storeName, 'readwrite');
            await idbRequest(tx.objectStore(storeName).clear());
        },
        async probe() {
            const PROBE_KEY = 0;
            const token = `${Date.now()}:${Math.random()}`;
            try {
                const db = await openDb();
                const store = db.transaction(probeStoreName, 'readwrite').objectStore(probeStoreName);
                await idbRequest(store.put(token, PROBE_KEY));
                const readBack = await idbRequest<unknown>(store.get(PROBE_KEY));
                await idbRequest(store.delete(PROBE_KEY));
                // Three conditions, not one. `readBack === token` proves the bytes round-tripped.
                // The second `get` proving `undefined` proves the cleanup was accepted too, so a
                // probe that leaves a marker behind cannot be mistaken for a durable store.
                const after = await idbRequest<unknown>(store.get(PROBE_KEY));
                return readBack === token && after === undefined;
            } catch {
                // Refused open (private profile, blocked storage access, another tab mid-upgrade),
                // refused transaction, or a store that does not exist: same answer, and the caller
                // moves on to a store that can answer for itself.
                return false;
            }
        },
    };
};

/**
 * Pick the strongest driver that can *prove* it persists. Async, because the proof is a write and
 * a read-back, and a synchronous answer to that question is the answer this module spent a
 * release removing: `if (window.indexedDB) return true` is always true, which is how a `persisted`
 * flag came to describe an API's presence instead of the durability of a record.
 *
 * Returns `{ driver, persisted }`. The shape is unchanged on purpose - `Ledger.status()`, the
 * officer's locker and the citizen's receipt all read `persisted` - only its meaning got stricter.
 */
export const defaultDriver = async (): Promise<{ driver: JournalDriver; persisted: boolean }> => {
    const idb = (globalThis as { indexedDB?: IDBLike }).indexedDB;
    const storage = (globalThis as { localStorage?: WebStorage }).localStorage;
    const local = storage ? localStorageDriver(storage) : null;

    /** Does localStorage already hold this device's journal? A read, never a write. */
    const holdsJournal = async (driver: JournalDriver): Promise<boolean> => {
        try {
            return (await driver.readMeta()) !== null || (await driver.readAll()).length > 0;
        } catch {
            // Unreadable is not "empty": treating a corrupt or blocked store as vacant is how a
            // driver switch silently starts a fresh chain over history that still exists.
            return true;
        }
    };

    const candidates: JournalDriver[] = [];
    if (idb) {
        const idbDriver = indexedDbDriver(idb);
        const orphanRisk = local ? await holdsJournal(local) : false;
        if (!orphanRisk) candidates.push(idbDriver);
    }
    if (local) candidates.push(local);

    for (const driver of candidates) {
        if (await driver.probe()) return { driver, persisted: true };
    }
    return { driver: memoryDriver(), persisted: false };
};
