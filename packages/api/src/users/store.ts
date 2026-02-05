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

// ── In-Memory Store (primary implementation) ────────────────────────
// Persisted to DDC via DdcUserStore wrapper (see below)

export class MemoryUserStore implements UserStore {
  private store = new Map<string, UserRecord>();

  setAddress(email: string, address: string): UserRecord {
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date().toISOString();
    const existing = this.store.get(normalizedEmail);
    
    const record: UserRecord = {
      email: normalizedEmail,
      address,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    
    this.store.set(normalizedEmail, record);
    return record;
  }

  getAddress(email: string): string | null {
    const record = this.store.get(email.toLowerCase().trim());
    return record?.address ?? null;
  }

  getByAddress(address: string): UserRecord | null {
    for (const record of this.store.values()) {
      if (record.address === address) return record;
    }
    return null;
  }

  getEmailByAddress(address: string): string | null {
    const record = this.getByAddress(address);
    return record?.email ?? null;
  }

  list(): UserRecord[] {
    return Array.from(this.store.values());
  }

  /** Bulk load records (for DDC restore) */
  loadAll(records: UserRecord[]): void {
    for (const r of records) {
      this.store.set(r.email.toLowerCase().trim(), r);
    }
  }

  /** Export all records (for DDC persistence) */
  exportAll(): UserRecord[] {
    return Array.from(this.store.values());
  }
}

// ── DDC-backed User Store ───────────────────────────────────────────
// Wraps MemoryUserStore with DDC persistence.
// On writes: updates in-memory + async DDC persist.
// On startup: loads from DDC into memory.

type DdcStoreFunc = (content: string, tags: { key: string; value: string }[]) => Promise<string>;
type DdcReadFunc = (cid: string) => Promise<string>;
type DdcResolveFunc = (bucketId: bigint, name: string) => Promise<any>;
type DdcStoreNamedFunc = (content: string, name: string, tags: { key: string; value: string }[]) => Promise<string>;

export class DdcUserStore implements UserStore {
  private inner = new MemoryUserStore();
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private ddcStoreNamed: DdcStoreNamedFunc | null = null;
  private loaded = false;

  /**
   * Initialize with DDC functions. Call after DDC client is ready.
   */
  async initDdc(
    ddcStoreNamed: DdcStoreNamedFunc,
    ddcRead: DdcReadFunc,
    ddcResolve: DdcResolveFunc,
    bucketId: bigint,
  ): Promise<void> {
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
    } catch (e: any) {
      console.log(`👥 No existing user index on DDC (${e.message}) — starting fresh`);
    }
    this.loaded = true;
  }

  setAddress(email: string, address: string): UserRecord {
    const record = this.inner.setAddress(email, address);
    this.schedulePersist();
    return record;
  }

  getAddress(email: string): string | null {
    return this.inner.getAddress(email);
  }

  getByAddress(address: string): UserRecord | null {
    return this.inner.getByAddress(address);
  }

  getEmailByAddress(address: string): string | null {
    return this.inner.getEmailByAddress(address);
  }

  list(): UserRecord[] {
    return this.inner.list();
  }

  /** Debounced persist to DDC (batches rapid writes) */
  private schedulePersist(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => this.persistToDdc(), 2000);
  }

  private async persistToDdc(): Promise<void> {
    if (!this.ddcStoreNamed) return;
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
    } catch (e: any) {
      console.error(`❌ Failed to persist user index to DDC: ${e.message}`);
    }
  }
}
