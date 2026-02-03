import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface MemoRecord {
  id: number;
  email: string;
  walletAddress: string;
  cid: string;
  cdnUrl: string;
  type: 'memo' | 'credential';
  credentialType?: string;
  createdAt: string;
}

export interface MemoStore {
  add(email: string, walletAddress: string, cid: string, cdnUrl: string, type: 'memo' | 'credential', credentialType?: string): MemoRecord;
  listByEmail(email: string): MemoRecord[];
  listByWallet(walletAddress: string): MemoRecord[];
  getByCid(cid: string): MemoRecord | null;
  delete(cid: string): boolean;
}

export class SqliteMemoStore implements MemoStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const defaultPath = join(__dirname, '../../data/memos.db');
    this.db = new Database(dbPath || defaultPath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        wallet_address TEXT NOT NULL,
        cid TEXT NOT NULL UNIQUE,
        cdn_url TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'memo',
        credential_type TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_memos_email ON memos(email);
      CREATE INDEX IF NOT EXISTS idx_memos_wallet ON memos(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_memos_cid ON memos(cid);
    `);
  }

  add(email: string, walletAddress: string, cid: string, cdnUrl: string, type: 'memo' | 'credential', credentialType?: string): MemoRecord {
    const stmt = this.db.prepare(`
      INSERT INTO memos (email, wallet_address, cid, cdn_url, type, credential_type)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `);
    const row = stmt.get(email.toLowerCase().trim(), walletAddress, cid, cdnUrl, type, credentialType || null) as Record<string, unknown>;
    return toMemoRecord(row);
  }

  listByEmail(email: string): MemoRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM memos WHERE email = ? ORDER BY created_at DESC
    `);
    const rows = stmt.all(email.toLowerCase().trim()) as Record<string, unknown>[];
    return rows.map(toMemoRecord);
  }

  listByWallet(walletAddress: string): MemoRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM memos WHERE wallet_address = ? ORDER BY created_at DESC
    `);
    const rows = stmt.all(walletAddress) as Record<string, unknown>[];
    return rows.map(toMemoRecord);
  }

  getByCid(cid: string): MemoRecord | null {
    const stmt = this.db.prepare(`SELECT * FROM memos WHERE cid = ?`);
    const row = stmt.get(cid) as Record<string, unknown> | undefined;
    return row ? toMemoRecord(row) : null;
  }

  delete(cid: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM memos WHERE cid = ?`);
    const result = stmt.run(cid);
    return result.changes > 0;
  }
}

function toMemoRecord(row: Record<string, unknown>): MemoRecord {
  return {
    id: row.id as number,
    email: row.email as string,
    walletAddress: row.wallet_address as string,
    cid: row.cid as string,
    cdnUrl: row.cdn_url as string,
    type: row.type as 'memo' | 'credential',
    credentialType: row.credential_type as string | undefined,
    createdAt: row.created_at as string,
  };
}
