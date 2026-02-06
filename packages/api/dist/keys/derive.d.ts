/**
 * Key derivation utilities for Proofi.
 *
 * v2: Server NEVER sees user's private key.
 * - Server generates a derivation salt (HMAC of email with master secret)
 * - Client derives key locally: PBKDF2(email + PIN, salt) → seed
 * - Client sends only PUBLIC address to server
 *
 * The salt is safe to share — without the user's PIN, you can't derive the key.
 */
/**
 * Generate a deterministic derivation salt for a given email.
 * Uses HMAC-SHA256(masterSecret, email) → hex string.
 *
 * This salt is sent to the client after OTP verification.
 * The client combines it with their PIN to derive a private key.
 * Without the PIN, the salt alone reveals nothing.
 */
export declare function generateDerivationSalt(email: string): Promise<string>;
/**
 * @deprecated v1 server-side key derivation — kept for migration only.
 * DO NOT USE for new flows. The server should never derive user keys.
 */
export declare function deriveUserSeed(email: string): Promise<Uint8Array>;
/**
 * Convert seed bytes to hex string
 */
export declare function seedToHex(seed: Uint8Array): string;
//# sourceMappingURL=derive.d.ts.map