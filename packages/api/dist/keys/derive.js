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
import { env } from '../config/env.js';
/**
 * Generate a deterministic derivation salt for a given email.
 * Uses HMAC-SHA256(masterSecret, email) → hex string.
 *
 * This salt is sent to the client after OTP verification.
 * The client combines it with their PIN to derive a private key.
 * Without the PIN, the salt alone reveals nothing.
 */
export async function generateDerivationSalt(email) {
    const encoder = new TextEncoder();
    const normalizedEmail = email.toLowerCase().trim();
    // Import master secret as HMAC key
    const key = await crypto.subtle.importKey('raw', encoder.encode(env.MASTER_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    // HMAC(masterSecret, email + context)
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(normalizedEmail + ':proofi-salt-v2'));
    // Return as hex string
    return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
/**
 * @deprecated v1 server-side key derivation — kept for migration only.
 * DO NOT USE for new flows. The server should never derive user keys.
 */
export async function deriveUserSeed(email) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(env.MASTER_SECRET), 'HKDF', false, ['deriveBits']);
    const derivedBits = await crypto.subtle.deriveBits({
        name: 'HKDF',
        hash: 'SHA-256',
        salt: encoder.encode(email.toLowerCase().trim()),
        info: encoder.encode('proofi-wallet-v1'),
    }, keyMaterial, 256);
    return new Uint8Array(derivedBits);
}
/**
 * Convert seed bytes to hex string
 */
export function seedToHex(seed) {
    return '0x' + Array.from(seed).map((b) => b.toString(16).padStart(2, '0')).join('');
}
//# sourceMappingURL=derive.js.map