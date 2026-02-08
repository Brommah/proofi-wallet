/**
 * Cryptographic utilities for Proofi Agent SDK
 * Uses tweetnacl for X25519 and Web Crypto API for AES-256-GCM
 */

import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

const { decodeBase64, encodeBase64, decodeUTF8, encodeUTF8 } = naclUtil;
import { DEKUnwrapError, DecryptionError, EncryptionError, CryptoError } from '../errors';
import type { WrappedDEK } from '../types';

/** AES-256-GCM key length in bytes */
const AES_KEY_LENGTH = 32;
/** AES-256-GCM nonce length in bytes */
const AES_NONCE_LENGTH = 12;
/** AES-256-GCM tag length in bytes */
const AES_TAG_LENGTH = 16;

/**
 * Normalize private key input to Uint8Array
 */
export function normalizePrivateKey(key: string | Uint8Array): Uint8Array {
  if (key instanceof Uint8Array) {
    return key;
  }
  try {
    return decodeBase64(key);
  } catch {
    throw new CryptoError('key normalization', 'Invalid base64 private key');
  }
}

/**
 * Derive X25519 public key from private key
 */
export function derivePublicKey(privateKey: Uint8Array): Uint8Array {
  const keyPair = nacl.box.keyPair.fromSecretKey(privateKey);
  return keyPair.publicKey;
}

/**
 * Generate a new X25519 keypair
 */
export function generateKeyPair(): { publicKey: Uint8Array; privateKey: Uint8Array } {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.secretKey,
  };
}

/**
 * Unwrap DEK using X25519 (ECDH + XSalsa20-Poly1305)
 * 
 * The wrapped DEK was encrypted by the user using:
 * 1. ECDH between user's ephemeral key and agent's public key
 * 2. XSalsa20-Poly1305 with the shared secret
 */
export function unwrapDEK(wrappedDEK: WrappedDEK, agentPrivateKey: Uint8Array): Uint8Array {
  try {
    const ciphertext = decodeBase64(wrappedDEK.ciphertext);
    const ephemeralPublicKey = decodeBase64(wrappedDEK.ephemeralPublicKey);
    const nonce = decodeBase64(wrappedDEK.nonce);

    // Decrypt using nacl.box.open (X25519 + XSalsa20-Poly1305)
    const dek = nacl.box.open(ciphertext, nonce, ephemeralPublicKey, agentPrivateKey);

    if (!dek) {
      throw new DEKUnwrapError('Decryption failed - invalid key or corrupted ciphertext');
    }

    if (dek.length !== AES_KEY_LENGTH) {
      throw new DEKUnwrapError(`Invalid DEK length: expected ${AES_KEY_LENGTH}, got ${dek.length}`);
    }

    return dek;
  } catch (error) {
    if (error instanceof DEKUnwrapError) {
      throw error;
    }
    throw new DEKUnwrapError(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Wrap DEK for a recipient using X25519
 * Used when writing data back to DDC
 */
export function wrapDEK(dek: Uint8Array, recipientPublicKey: Uint8Array): WrappedDEK {
  try {
    const ephemeralKeyPair = nacl.box.keyPair();
    const nonce = nacl.randomBytes(nacl.box.nonceLength);

    const ciphertext = nacl.box(dek, nonce, recipientPublicKey, ephemeralKeyPair.secretKey);

    return {
      ciphertext: encodeBase64(ciphertext),
      ephemeralPublicKey: encodeBase64(ephemeralKeyPair.publicKey),
      nonce: encodeBase64(nonce),
    };
  } catch (error) {
    throw new CryptoError('DEK wrapping', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Convert Uint8Array to ArrayBuffer (handles SharedArrayBuffer case)
 */
function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  if (arr.buffer instanceof ArrayBuffer && arr.byteOffset === 0 && arr.byteLength === arr.buffer.byteLength) {
    return arr.buffer;
  }
  // Create a new ArrayBuffer and copy data
  const buffer = new ArrayBuffer(arr.byteLength);
  new Uint8Array(buffer).set(arr);
  return buffer;
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decryptData(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  dek: Uint8Array
): Promise<Uint8Array> {
  try {
    // Import the DEK as a CryptoKey
    const key = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(dek),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decrypt with AES-256-GCM
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: toArrayBuffer(nonce),
        tagLength: AES_TAG_LENGTH * 8,
      },
      key,
      toArrayBuffer(ciphertext)
    );

    return new Uint8Array(plaintext);
  } catch (error) {
    throw new DecryptionError(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encryptData(
  plaintext: Uint8Array,
  dek: Uint8Array
): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
  try {
    // Generate random nonce
    const nonce = crypto.getRandomValues(new Uint8Array(AES_NONCE_LENGTH));

    // Import the DEK as a CryptoKey
    const key = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(dek),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Encrypt with AES-256-GCM
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: toArrayBuffer(nonce),
        tagLength: AES_TAG_LENGTH * 8,
      },
      key,
      toArrayBuffer(plaintext)
    );

    return {
      ciphertext: new Uint8Array(ciphertext),
      nonce,
    };
  } catch (error) {
    throw new EncryptionError(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Decrypt data from base64-encoded encrypted blob
 */
export async function decryptBlob(
  encryptedData: { ciphertext: string; nonce: string },
  dek: Uint8Array
): Promise<Uint8Array> {
  const ciphertext = decodeBase64(encryptedData.ciphertext);
  const nonce = decodeBase64(encryptedData.nonce);
  return decryptData(ciphertext, nonce, dek);
}

/**
 * Encrypt data and return base64-encoded result
 */
export async function encryptBlob(
  data: Uint8Array | string,
  dek: Uint8Array
): Promise<{ ciphertext: string; nonce: string }> {
  const plaintext = typeof data === 'string' ? decodeUTF8(data) : data;
  const { ciphertext, nonce } = await encryptData(plaintext, dek);
  return {
    ciphertext: encodeBase64(ciphertext),
    nonce: encodeBase64(nonce),
  };
}

/**
 * Verify Ed25519 signature
 */
export function verifySignature(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  try {
    return nacl.sign.detached.verify(message, signature, publicKey);
  } catch {
    return false;
  }
}

// Re-export utilities
export { decodeBase64, encodeBase64, decodeUTF8, encodeUTF8 };
