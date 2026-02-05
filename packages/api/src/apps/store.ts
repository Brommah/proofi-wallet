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

// ── In-Memory Store ─────────────────────────────────────────────────

export class MemoryAppStore implements AppStore {
  private store = new Map<string, AppRecord>();

  create(app: Omit<AppRecord, 'createdAt'>): AppRecord {
    if (this.store.has(app.appId)) {
      throw new Error(`App ${app.appId} already exists`);
    }
    const record: AppRecord = {
      ...app,
      createdAt: new Date().toISOString(),
    };
    this.store.set(app.appId, record);
    return record;
  }

  get(appId: string): AppRecord | null {
    return this.store.get(appId) ?? null;
  }

  list(): AppRecord[] {
    return Array.from(this.store.values());
  }
}
