/**
 * Proofi Keyring Module
 * sr25519 keypair management using @polkadot/keyring.
 * Mirrors the web wallet's KeyringManager for sr25519.
 */

import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { u8aToHex, hexToU8a } from '@polkadot/util';

const SS58_PREFIX = 54; // Cere network

let _ready = false;

/**
 * Initialize the WASM crypto backend.
 * Must be called before any key operations.
 */
export async function initCrypto() {
  if (_ready) return;
  await cryptoWaitReady();
  _ready = true;
}

/**
 * Create an sr25519 keypair from a hex seed.
 * Returns { address, publicKey, sign(message) }
 */
export async function createKeypair(seedHex) {
  await initCrypto();
  
  const keyring = new Keyring({ type: 'sr25519', ss58Format: SS58_PREFIX });
  const pair = keyring.addFromUri(seedHex);
  
  return {
    address: pair.address,
    publicKey: u8aToHex(pair.publicKey),
    sign(message) {
      const msgBytes = typeof message === 'string'
        ? new TextEncoder().encode(message)
        : message;
      return pair.sign(msgBytes);
    },
    signHex(message) {
      const sigBytes = this.sign(message);
      return u8aToHex(sigBytes);
    },
  };
}

/**
 * Create signature auth headers for API requests.
 * Format: Authorization: Signature {address}:{timestamp}:{signature}
 */
export function createAuthHeaders(keypair) {
  if (!keypair) return null;
  
  const timestamp = Date.now();
  const message = `proofi:${timestamp}:${keypair.address}`;
  const signature = keypair.signHex(message);
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Signature ${keypair.address}:${timestamp}:${signature}`,
  };
}
