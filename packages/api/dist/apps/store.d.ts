/**
 * App store: registered application metadata.
 *
 * In-memory only — apps are configured at startup or via env.
 * No database needed. This is configuration, not user data.
 */
export interface AppRecord {
    appId: string;
    name: string;
    allowedOrigins: string[];
    createdAt: string;
}
export interface AppStore {
    create(app: Omit<AppRecord, 'createdAt'>): AppRecord;
    get(appId: string): AppRecord | null;
    list(): AppRecord[];
}
export declare class MemoryAppStore implements AppStore {
    private store;
    create(app: Omit<AppRecord, 'createdAt'>): AppRecord;
    get(appId: string): AppRecord | null;
    list(): AppRecord[];
}
//# sourceMappingURL=store.d.ts.map