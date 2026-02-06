/**
 * Wallet-signature based authentication.
 * Fully decentralized — no server-side secrets needed.
 *
 * Client signs: `proofi:{timestamp}:{address}`
 * Server verifies signature against registered address.
 */
export interface SignatureAuthResult {
    valid: boolean;
    address: string;
    timestamp: number;
    error?: string;
}
/**
 * Parse and verify a signature auth header.
 *
 * Format: `Signature {address}:{timestamp}:{signature}`
 * Message signed: `proofi:{timestamp}:{address}`
 *
 * @param authHeader - The Authorization header value
 * @param maxAgeMs - Maximum age of signature in milliseconds (default: 5 minutes)
 */
export declare function verifySignatureAuth(authHeader: string, maxAgeMs?: number): Promise<SignatureAuthResult>;
/**
 * Create a signature auth header (for testing / server-side calls).
 */
export declare function createSignatureAuth(secretKey: Uint8Array, address: string): Promise<string>;
//# sourceMappingURL=signature.d.ts.map