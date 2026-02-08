/**
 * Cryptographic utilities for Proofi Mobile
 *
 * Key derivation uses @noble/hashes (pure JS, React Native compatible)
 * to match the web wallet's PBKDF2-SHA256 derivation exactly.
 *
 * Encryption uses AES-GCM via @noble/ciphers for secure seed storage.
 */
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes as nobleHexToBytes } from '@noble/hashes/utils.js';
import { gcm } from '@noble/ciphers/aes.js';
import { randomBytes } from '@noble/ciphers/webcrypto.js';

// IV size for AES-GCM (12 bytes recommended by NIST)
const IV_SIZE = 12;
// Salt size for PBKDF2 key derivation
const SALT_SIZE = 16;

/**
 * Derive a 32-byte hex seed from PIN + derivation salt.
 * Uses PBKDF2-HMAC-SHA256 with 100k iterations — identical to web wallet.
 *
 * Web equivalent (crypto.subtle):
 *   deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256)
 */
export function deriveSeedFromPin(pin: string, salt: string): string {
  const encoder = new TextEncoder();
  const derived = pbkdf2(sha256, encoder.encode(pin), encoder.encode(salt), {
    c: 100000,
    dkLen: 32,
  });
  return '0x' + bytesToHex(derived);
}

/**
 * Derive a 32-byte AES key from PIN using PBKDF2.
 * Uses a separate salt from seed derivation for key separation.
 */
function deriveEncryptionKey(pin: string, salt: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const pinBytes = encoder.encode(pin);
  
  // Use 100k iterations for strong key derivation
  return pbkdf2(sha256, pinBytes, salt, {
    c: 100000,
    dkLen: 32,
  });
}

/**
 * Encrypt seed with PIN using AES-256-GCM.
 * 
 * Output format: base64(salt || iv || ciphertext || authTag)
 * - salt: 16 bytes (for PBKDF2 key derivation)
 * - iv: 12 bytes (nonce for AES-GCM)
 * - ciphertext: variable length
 * - authTag: 16 bytes (included by GCM automatically)
 */
export async function encryptSeed(seed: string, pin: string): Promise<string> {
  // Generate random salt and IV
  const salt = randomBytes(SALT_SIZE);
  const iv = randomBytes(IV_SIZE);
  
  // Derive encryption key from PIN
  const key = deriveEncryptionKey(pin, salt);
  
  // Encrypt seed using AES-256-GCM
  const seedBytes = new TextEncoder().encode(seed);
  const cipher = gcm(key, iv);
  const ciphertext = cipher.encrypt(seedBytes);
  
  // Combine salt + iv + ciphertext (includes auth tag)
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(ciphertext, salt.length + iv.length);
  
  return uint8ArrayToBase64(combined);
}

/**
 * Decrypt seed with PIN using AES-256-GCM.
 * 
 * Input format: base64(salt || iv || ciphertext || authTag)
 * Throws if authentication fails (wrong PIN or tampered data).
 */
export async function decryptSeed(encrypted: string, pin: string): Promise<string> {
  const combined = base64ToUint8Array(encrypted);
  
  // Extract components
  const salt = combined.slice(0, SALT_SIZE);
  const iv = combined.slice(SALT_SIZE, SALT_SIZE + IV_SIZE);
  const ciphertext = combined.slice(SALT_SIZE + IV_SIZE);
  
  // Derive encryption key from PIN
  const key = deriveEncryptionKey(pin, salt);
  
  // Decrypt using AES-256-GCM (throws if auth tag invalid)
  const cipher = gcm(key, iv);
  const plaintext = cipher.decrypt(ciphertext);
  
  return new TextDecoder().decode(plaintext);
}

/**
 * Verify a PIN can decrypt the seed (for PIN validation).
 * Returns true if successful, false if wrong PIN.
 */
export async function verifyPin(encrypted: string, pin: string): Promise<boolean> {
  try {
    await decryptSeed(encrypted, pin);
    return true;
  } catch {
    return false;
  }
}

// --- Helpers ---

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  return nobleHexToBytes(clean);
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
