/**
 * Cryptographic utilities for Proofi Mobile
 *
 * Key derivation uses @noble/hashes (pure JS, React Native compatible)
 * to match the web wallet's PBKDF2-SHA256 derivation exactly.
 */
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

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
 * Encrypt seed with PIN for secure local storage.
 * Uses SHA-256 derived key + XOR (prototype — replace with AES-GCM in production).
 */
export async function encryptSeed(seed: string, pin: string): Promise<string> {
  const ExpoCrypto = require('expo-crypto');
  const key = await ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    `${pin}:proofi-encrypt`,
  );
  // Simple XOR encryption with the key (prototype)
  const seedBytes = new TextEncoder().encode(seed);
  const keyBytes = hexToBytes(key);
  const encrypted = new Uint8Array(seedBytes.length);
  for (let i = 0; i < seedBytes.length; i++) {
    encrypted[i] = seedBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return uint8ArrayToBase64(encrypted);
}

/**
 * Decrypt seed with PIN.
 */
export async function decryptSeed(encrypted: string, pin: string): Promise<string> {
  const ExpoCrypto = require('expo-crypto');
  const key = await ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    `${pin}:proofi-encrypt`,
  );
  const encBytes = base64ToUint8Array(encrypted);
  const keyBytes = hexToBytes(key);
  const decrypted = new Uint8Array(encBytes.length);
  for (let i = 0; i < encBytes.length; i++) {
    decrypted[i] = encBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return new TextDecoder().decode(decrypted);
}

// --- Helpers ---

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
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
