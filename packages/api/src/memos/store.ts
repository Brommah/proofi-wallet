/**
 * Memo store: LEGACY — kept only for migration compatibility.
 *
 * All NEW data goes directly to DDC (via ddc/service.ts).
 * This in-memory stub satisfies the import in server.ts
 * for the /ddc/migrate endpoint (which reads from legacy SQLite).
 *
 * Since SQLite is removed, this returns empty results.
 * Users who had legacy data should have already migrated.
 */

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

/**
 * Stub memo store — returns empty results.
 * Legacy SQLite data should be migrated via /ddc/migrate.
 */
export class LegacyMemoStore implements MemoStore {
  add(_email: string, _walletAddress: string, _cid: string, _cdnUrl: string, _type: 'memo' | 'credential', _credentialType?: string): MemoRecord {
    throw new Error('Legacy memo store is read-only. Use DDC directly.');
  }

  listByEmail(_email: string): MemoRecord[] {
    return [];
  }

  listByWallet(_walletAddress: string): MemoRecord[] {
    return [];
  }

  getByCid(_cid: string): MemoRecord | null {
    return null;
  }

  delete(_cid: string): boolean {
    return false;
  }
}
