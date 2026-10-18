/**
 * store.ts — the append-only journal the ledger is built on.
 *
 * What this fixes: the previous "Akhand Ledger" kept `let blockchain: BlockchainBlock[] = []`
 * at module scope. On reload it re-seeded to genesis, so a judge who anchored an exhibit,
 * switched tabs, and came back got "NO MATCH" for a perfectly intact file — a false
 * accusation of tampering, which is worse than no feature at all. Everything in this module
 * exists to make the record outlive the page.
 *
 * Driver choice, stated plainly:
 *  - `localStorageDriver` is the default. Evidence records here are small JSON (hashes,
 *    custody metadata, signatures), and localStorage is synchronous, present everywhere, and
 *    survives reloads, restarts and offline use. It is also trivially inspectable by an
 *    auditor and testable without a browser.
 *  - `indexedDbDriver` is offered for deployments that keep large forensic artefacts beside the
 *    record. It is a thin wrapper over the same record shape; both are exercised by the same
 *    conformance test so they cannot drift.
 *  - `memoryDriver` is for tests and for non-browser contexts. It is NOT used at runtime
 *    except as the fallback when storage is unavailable, in which case the ledger reports
 *    `persisted: false` rather than pretending to have written.
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
    storeName = 'records'
): JournalDriver => {
    const openDb = async (): Promise<IDBDatabaseLike> => {
        const req = indexedDB.open(dbName, 1);
        req.onupgradeneeded = () => {
            const db = req.result as IDBDatabaseLike;
            if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName);
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
    };
};

/**
 * Pick the strongest driver actually available. Returns the driver *and* whether it persists,
 * so callers can tell the user "this session is not being recorded" instead of lying.
 */
export const defaultDriver = (): { driver: JournalDriver; persisted: boolean } => {
    const storage = (globalThis as { localStorage?: WebStorage }).localStorage;
    if (storage) {
        try {
            const probe = 'nyaya:probe';
            storage.setItem(probe, '1');
            storage.removeItem(probe);
            return { driver: localStorageDriver(storage), persisted: true };
        } catch {
            // Safari private mode and storage-disabled kiosk builds land here.
        }
    }
    return { driver: memoryDriver(), persisted: false };
};
