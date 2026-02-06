/**
 * User store: email ↔ wallet address mapping.
 *
 * Architecture: In-memory Map with DDC persistence.
 * On startup, the index is loaded from DDC (if it exists).
 * On every write, the index is persisted back to DDC.
 *
 * This replaces the SQLite implementation — no traditional databases.
 * The in-memory map is the hot cache; DDC is the durable store.
 */
export interface UserRecord {
    email: string;
    address: string;
    createdAt: string;
    updatedAt: string;
}
export interface UserStore {
    setAddress(email: string, address: string): UserRecord;
    getAddress(email: string): string | null;
    getByAddress(address: string): UserRecord | null;
    getEmailByAddress(address: string): string | null;
    list(): UserRecord[];
}
export declare class MemoryUserStore implements UserStore {
    private store;
    setAddress(email: string, address: string): UserRecord;
    getAddress(email: string): string | null;
    getByAddress(address: string): UserRecord | null;
    getEmailByAddress(address: string): string | null;
    list(): UserRecord[];
    /** Bulk load records (for DDC restore) */
    loadAll(records: UserRecord[]): void;
    /** Export all records (for DDC persistence) */
    exportAll(): UserRecord[];
}
type DdcReadFunc = (cid: string) => Promise<string>;
type DdcResolveFunc = (bucketId: bigint, name: string) => Promise<any>;
type DdcStoreNamedFunc = (content: string, name: string, tags: {
    key: string;
    value: string;
}[]) => Promise<string>;
export declare class DdcUserStore implements UserStore {
    private inner;
    private persistTimer;
    private ddcStoreNamed;
    private loaded;
    /**
     * Initialize with DDC functions. Call after DDC client is ready.
     */
    initDdc(ddcStoreNamed: DdcStoreNamedFunc, ddcRead: DdcReadFunc, ddcResolve: DdcResolveFunc, bucketId: bigint): Promise<void>;
    setAddress(email: string, address: string): UserRecord;
    getAddress(email: string): string | null;
    getByAddress(address: string): UserRecord | null;
    getEmailByAddress(address: string): string | null;
    list(): UserRecord[];
    /** Debounced persist to DDC (batches rapid writes) */
    private schedulePersist;
    private persistToDdc;
}
export {};
//# sourceMappingURL=store.d.ts.map