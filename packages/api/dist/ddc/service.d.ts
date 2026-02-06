/**
 * DDC Storage Service — powered by existing Cere wallet (JSON file)
 *
 * Uses the funded cere-wallet.json as signer/payer for all DDC operations.
 * The Proofi user's email/wallet is stored as metadata in the credential.
 *
 * This mirrors the ddc-wallet-ui/server-v3.mjs architecture:
 * - Server wallet pays for storage
 * - User identity is embedded in the credential
 */
/**
 * Initialize DDC client with the funded Cere wallet.
 * Only called once on first use.
 */
export declare function initDdc(): Promise<void>;
export declare function ddcStore(content: string, tags?: {
    key: string;
    value: string;
}[]): Promise<string>;
export declare function ddcRead(cid: string): Promise<string>;
export interface StoreCredentialResult {
    cid: string;
    credential: any;
    cdnUrl: string;
}
/**
 * Store a memo/credential on DDC.
 * The server wallet pays, the user's Proofi identity is embedded.
 */
export declare function storeCredential(userEmail: string, userWalletAddress: string, claimType: string, claimData: any): Promise<StoreCredentialResult>;
/**
 * Read and verify a credential from DDC.
 */
export declare function readCredential(cid: string): Promise<{
    credential: any;
    verified: boolean;
}>;
/**
 * Store a simple memo on DDC (not a credential, just text).
 * Also adds to the wallet's decentralized index.
 */
export declare function storeMemo(userEmail: string, walletAddress: string, memo: string): Promise<{
    cid: string;
    cdnUrl: string;
}>;
export declare function getIssuerAddress(): string;
export declare function getBucketId(): string;
export interface IndexEntry {
    cid: string;
    cdnUrl: string;
    type: 'memo' | 'credential';
    credentialType?: string;
    /** Source app name (e.g. 'skillbadge', 'snake', 'cryptoquest') */
    game?: string;
    /** Human-readable label */
    label?: string;
    createdAt: string;
}
export interface WalletIndex {
    version: 1;
    wallet: string;
    entries: IndexEntry[];
    updatedAt: string;
}
/**
 * Read a wallet's index from DDC.
 * Uses in-memory cache to avoid CNS eventual consistency issues.
 * Returns empty index if not found.
 */
export declare function readWalletIndex(walletAddress: string): Promise<WalletIndex>;
/**
 * Add an entry to a wallet's index on DDC.
 * Uses write lock to prevent concurrent modifications losing data.
 * This is fully decentralized - no database!
 */
export declare function addToWalletIndex(walletAddress: string, entry: Omit<IndexEntry, 'createdAt'>): Promise<void>;
//# sourceMappingURL=service.d.ts.map