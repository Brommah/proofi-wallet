/**
 * App store: registered application metadata.
 *
 * In-memory only — apps are configured at startup or via env.
 * No database needed. This is configuration, not user data.
 */
// ── In-Memory Store ─────────────────────────────────────────────────
export class MemoryAppStore {
    store = new Map();
    create(app) {
        if (this.store.has(app.appId)) {
            throw new Error(`App ${app.appId} already exists`);
        }
        const record = {
            ...app,
            createdAt: new Date().toISOString(),
        };
        this.store.set(app.appId, record);
        return record;
    }
    get(appId) {
        return this.store.get(appId) ?? null;
    }
    list() {
        return Array.from(this.store.values());
    }
}
//# sourceMappingURL=store.js.map