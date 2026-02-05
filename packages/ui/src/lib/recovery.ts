/**
 * Wallet recovery utilities.
 * Shared between RecoveryScreen and authStore.
 */

import { KeyringManager } from '@proofi/core';
import { cryptoWaitReady } from '@polkadot/util-crypto';

/**
 * Derive seed from PIN + derivation salt using PBKDF2.
 */
export async function deriveSeedFromPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: encoder.encode(salt),
      iterations: 100000,
    },
    keyMaterial,
    256,
  );

  const bytes = new Uint8Array(derivedBits);
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derive keypair from a hex seed.
 */
export async function deriveKeypairFromSeed(seedHex: string) {
  await cryptoWaitReady();
  const mgr = new KeyringManager();
  mgr.ss58Prefix = 54;
  await mgr.init();

  return mgr.importKey({
    type: 'sr25519',
    secretKey: seedHex,
    label: 'proofi-wallet',
    purposes: ['transaction', 'credential', 'authentication'],
  });
}

/**
 * Encrypt seed with PIN for secure local storage.
 */
export async function encryptSeed(seed: string, pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode('proofi-encrypt'), iterations: 50000 },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(seed),
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}
