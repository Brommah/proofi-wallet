import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// ── SQLite (persistent) ─────────────────────────────────────────────

export class SqliteUserStore implements UserStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    // Default to a file in the data directory for persistence
    const defaultPath = join(__dirname, '../../data/users.db');
    this.db = new Database(dbPath || defaultPath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        address TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_users_address ON users(address);
    `);
  }

  setAddress(email: string, address: string): UserRecord {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Upsert: insert or update if email exists
    const stmt = this.db.prepare(`
      INSERT INTO users (email, address)
      VALUES (?, ?)
      ON CONFLICT(email) DO UPDATE SET
        address = excluded.address,
        updated_at = datetime('now')
      RETURNING *
    `);
    
    const row = stmt.get(normalizedEmail, address) as Record<string, unknown>;
    return toUserRecord(row);
  }

  getAddress(email: string): string | null {
    const normalizedEmail = email.toLowerCase().trim();
    const row = this.db.prepare(
      'SELECT address FROM users WHERE email = ?'
    ).get(normalizedEmail) as { address: string } | undefined;
    
    return row?.address ?? null;
  }

  getByAddress(address: string): UserRecord | null {
    const row = this.db.prepare(
      'SELECT * FROM users WHERE address = ?'
    ).get(address) as Record<string, unknown> | undefined;
    
    return row ? toUserRecord(row) : null;
  }

  getEmailByAddress(address: string): string | null {
    const record = this.getByAddress(address);
    return record?.email ?? null;
  }

  list(): UserRecord[] {
    const rows = this.db.prepare(
      'SELECT * FROM users ORDER BY created_at DESC'
    ).all() as Record<string, unknown>[];
    
    return rows.map(toUserRecord);
  }
}

function toUserRecord(row: Record<string, unknown>): UserRecord {
  return {
    email: row.email as string,
    address: row.address as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ── In-Memory Store (for testing) ───────────────────────────────────

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
}
