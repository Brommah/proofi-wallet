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

// ── SQLite implementation (development) ─────────────────────────────

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
      'INSERT INTO apps (app_id, name, allowed_origins) VALUES (?, ?, ?) RETURNING *'
    );
    const row = stmt.get(app.appId, app.name, JSON.stringify(app.allowedOrigins)) as any;
    return this.toRecord(row);
  }

  get(appId: string): AppRecord | null {
    const row = this.db.prepare('SELECT * FROM apps WHERE app_id = ?').get(appId) as any;
    return row ? this.toRecord(row) : null;
  }

  list(): AppRecord[] {
    const rows = this.db.prepare('SELECT * FROM apps ORDER BY created_at DESC').all() as any[];
    return rows.map(this.toRecord);
  }

  private toRecord(row: any): AppRecord {
    return {
      appId: row.app_id,
      name: row.name,
      allowedOrigins: JSON.parse(row.allowed_origins),
      createdAt: row.created_at,
    };
  }
}

// ── Postgres adapter interface (production) ─────────────────────────

export class PostgresAppStore implements AppStore {
  private client: any; // pg Pool

  constructor(pgPool: any) {
    this.client = pgPool;
  }

  async init() {
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS apps (
        app_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        allowed_origins JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  create(app: Omit<AppRecord, 'createdAt'>): AppRecord {
    // Async in practice — would need to be wrapped
    throw new Error('Use async createAsync for Postgres');
  }

  async createAsync(app: Omit<AppRecord, 'createdAt'>): Promise<AppRecord> {
    const { rows } = await this.client.query(
      'INSERT INTO apps (app_id, name, allowed_origins) VALUES ($1, $2, $3) RETURNING *',
      [app.appId, app.name, JSON.stringify(app.allowedOrigins)]
    );
    return this.toRecord(rows[0]);
  }

  get(appId: string): AppRecord | null {
    throw new Error('Use async getAsync for Postgres');
  }

  async getAsync(appId: string): Promise<AppRecord | null> {
    const { rows } = await this.client.query('SELECT * FROM apps WHERE app_id = $1', [appId]);
    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  list(): AppRecord[] {
    throw new Error('Use async listAsync for Postgres');
  }

  private toRecord(row: any): AppRecord {
    return {
      appId: row.app_id,
      name: row.name,
      allowedOrigins: row.allowed_origins,
      createdAt: row.created_at,
    };
  }
}
