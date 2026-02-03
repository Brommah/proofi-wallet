import Database from 'better-sqlite3';

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

// ── SQLite (development) ────────────────────────────────────────────

export class SqliteAppStore implements AppStore {
  private db: Database.Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS apps (
        app_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        allowed_origins TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  create(app: Omit<AppRecord, 'createdAt'>): AppRecord {
    const stmt = this.db.prepare(
      'INSERT INTO apps (app_id, name, allowed_origins) VALUES (?, ?, ?) RETURNING *',
    );
    const row = stmt.get(app.appId, app.name, JSON.stringify(app.allowedOrigins)) as Record<string, unknown>;
    return toRecord(row);
  }

  get(appId: string): AppRecord | null {
    const row = this.db.prepare('SELECT * FROM apps WHERE app_id = ?').get(appId) as Record<string, unknown> | undefined;
    return row ? toRecord(row) : null;
  }

  list(): AppRecord[] {
    const rows = this.db.prepare('SELECT * FROM apps ORDER BY created_at DESC').all() as Record<string, unknown>[];
    return rows.map(toRecord);
  }
}

function toRecord(row: Record<string, unknown>): AppRecord {
  return {
    appId: row.app_id as string,
    name: row.name as string,
    allowedOrigins: JSON.parse(row.allowed_origins as string),
    createdAt: row.created_at as string,
  };
}

// ── Postgres adapter interface (production) ─────────────────────────

export interface AsyncAppStore {
  create(app: Omit<AppRecord, 'createdAt'>): Promise<AppRecord>;
  get(appId: string): Promise<AppRecord | null>;
  list(): Promise<AppRecord[]>;
}
