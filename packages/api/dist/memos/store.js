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
/**
 * Stub memo store — returns empty results.
 * Legacy SQLite data should be migrated via /ddc/migrate.
 */
export class LegacyMemoStore {
    add(_email, _walletAddress, _cid, _cdnUrl, _type, _credentialType) {
        throw new Error('Legacy memo store is read-only. Use DDC directly.');
    }
    listByEmail(_email) {
        return [];
    }
    listByWallet(_walletAddress) {
        return [];
    }
    getByCid(_cid) {
        return null;
    }
    delete(_cid) {
        return false;
    }
}
//# sourceMappingURL=store.js.map