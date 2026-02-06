/**
 * Wallet-signature based authentication.
 * Fully decentralized — no server-side secrets needed.
 *
 * Client signs: `proofi:{timestamp}:{address}`
 * Server verifies signature against registered address.
 */
import { Keyring } from '@polkadot/keyring';
import { u8aToHex } from '@polkadot/util';
import { signatureVerify, cryptoWaitReady } from '@polkadot/util-crypto';
let cryptoReady = false;
async function ensureCrypto() {
    if (!cryptoReady) {
        await cryptoWaitReady();
        cryptoReady = true;
    }
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
export async function verifySignatureAuth(authHeader, maxAgeMs = 5 * 60 * 1000) {
    await ensureCrypto();
    // Parse header: "Signature {address}:{timestamp}:{signature}"
    if (!authHeader.startsWith('Signature ')) {
        return { valid: false, address: '', timestamp: 0, error: 'Invalid auth format' };
    }
    const parts = authHeader.slice(10).split(':');
    if (parts.length !== 3) {
        return { valid: false, address: '', timestamp: 0, error: 'Invalid signature format' };
    }
    const [address, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    // Check timestamp freshness
    const now = Date.now();
    if (isNaN(timestamp) || Math.abs(now - timestamp) > maxAgeMs) {
        return { valid: false, address, timestamp, error: 'Signature expired or invalid timestamp' };
    }
    // Reconstruct the message that was signed
    const message = `proofi:${timestamp}:${address}`;
    try {
        // Verify the signature
        const result = signatureVerify(message, signature, address);
        if (result.isValid) {
            return { valid: true, address, timestamp };
        }
        else {
            return { valid: false, address, timestamp, error: 'Invalid signature' };
        }
    }
    catch (e) {
        return { valid: false, address, timestamp, error: e.message || 'Signature verification failed' };
    }
}
/**
 * Create a signature auth header (for testing / server-side calls).
 */
export async function createSignatureAuth(secretKey, address) {
    await ensureCrypto();
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 54 });
    const pair = keyring.addFromSeed(secretKey.slice(0, 32));
    const timestamp = Date.now();
    const message = `proofi:${timestamp}:${address}`;
    const signature = u8aToHex(pair.sign(message));
    return `Signature ${address}:${timestamp}:${signature}`;
}
//# sourceMappingURL=signature.js.map