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
// ── In-Memory Store (primary implementation) ────────────────────────
// Persisted to DDC via DdcUserStore wrapper (see below)
export class MemoryUserStore {
    store = new Map();
    setAddress(email, address) {
        const normalizedEmail = email.toLowerCase().trim();
        const now = new Date().toISOString();
        const existing = this.store.get(normalizedEmail);
        const record = {
            email: normalizedEmail,
            address,
            createdAt: existing?.createdAt || now,
            updatedAt: now,
        };
        this.store.set(normalizedEmail, record);
        return record;
    }
    getAddress(email) {
        const record = this.store.get(email.toLowerCase().trim());
        return record?.address ?? null;
    }
    getByAddress(address) {
        for (const record of this.store.values()) {
            if (record.address === address)
                return record;
        }
        return null;
    }
    getEmailByAddress(address) {
        const record = this.getByAddress(address);
        return record?.email ?? null;
    }
    list() {
        return Array.from(this.store.values());
    }
    /** Bulk load records (for DDC restore) */
    loadAll(records) {
        for (const r of records) {
            this.store.set(r.email.toLowerCase().trim(), r);
        }
    }
    /** Export all records (for DDC persistence) */
    exportAll() {
        return Array.from(this.store.values());
    }
}
export class DdcUserStore {
    inner = new MemoryUserStore();
    persistTimer = null;
    ddcStoreNamed = null;
    loaded = false;
    /**
     * Initialize with DDC functions. Call after DDC client is ready.
     */
    async initDdc(ddcStoreNamed, ddcRead, ddcResolve, bucketId) {
        this.ddcStoreNamed = ddcStoreNamed;
        try {
            const cid = await ddcResolve(bucketId, 'proofi-users-v1');
            if (cid) {
                const content = await ddcRead(cid.toString());
                const data = JSON.parse(content);
                if (Array.isArray(data.users)) {
                    this.inner.loadAll(data.users);
                    console.log(`👥 Loaded ${data.users.length} users from DDC`);
                }
            }
        }
        catch (e) {
            console.log(`👥 No existing user index on DDC (${e.message}) — starting fresh`);
        }
        this.loaded = true;
    }
    setAddress(email, address) {
        const record = this.inner.setAddress(email, address);
        this.schedulePersist();
        return record;
    }
    getAddress(email) {
        return this.inner.getAddress(email);
    }
    getByAddress(address) {
        return this.inner.getByAddress(address);
    }
    getEmailByAddress(address) {
        return this.inner.getEmailByAddress(address);
    }
    list() {
        return this.inner.list();
    }
    /** Debounced persist to DDC (batches rapid writes) */
    schedulePersist() {
        if (this.persistTimer)
            clearTimeout(this.persistTimer);
        this.persistTimer = setTimeout(() => this.persistToDdc(), 2000);
    }
    async persistToDdc() {
        if (!this.ddcStoreNamed)
            return;
        try {
            const data = JSON.stringify({
                type: 'proofi-user-index',
                version: 1,
                users: this.inner.exportAll(),
                updatedAt: new Date().toISOString(),
            });
            await this.ddcStoreNamed(data, 'proofi-users-v1', [
                { key: 'type', value: 'proofi-user-index' },
                { key: 'version', value: '1' },
            ]);
            console.log(`👥 User index persisted to DDC (${this.inner.list().length} users)`);
        }
        catch (e) {
            console.error(`❌ Failed to persist user index to DDC: ${e.message}`);
        }
    }
}
//# sourceMappingURL=store.js.map