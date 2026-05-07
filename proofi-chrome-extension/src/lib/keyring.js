/**
 * Proofi Keyring Module
 * Cere ed25519 keypair management using @polkadot/keyring.
 * Mirrors Cere Wallet's Web3Auth root key -> openlogin-ed25519 account derivation.
 */

import { Keyring } from '@polkadot/keyring';
import { getED25519Key } from '@toruslabs/openlogin-ed25519';
import { mnemonicToEntropy, validateMnemonic, wordlists } from 'bip39';
import { cryptoWaitReady, encodeAddress } from '@polkadot/util-crypto';
import { hexToU8a, u8aToHex } from '@polkadot/util';

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

export function normalizeWalletSecret(secret) {
  const raw = String(secret || '').trim();
  const compact = raw.replace(/\s+/g, '');
  if (/^(0x)?[0-9a-fA-F]{64,128}$/.test(compact)) return compact.startsWith('0x') ? compact : `0x${compact}`;
  const clean = raw;
  return clean.toLowerCase().split(/\s+/).join(' ');
}

export function getCereEd25519SecretKey(secret) {
  const clean = normalizeWalletSecret(secret);
  if (/^0x[0-9a-fA-F]{128}$/.test(clean)) return hexToU8a(clean);

  let rootPrivateKey = clean;
  if (!clean.startsWith('0x')) {
    const words = clean.split(/\s+/).filter(Boolean);
    if (!validateMnemonic(clean, wordlists.english)) {
      throw new Error(
        words.length === 24
          ? 'Recovery phrase checksum failed. Copy it directly from Cere Wallet or use the exported Cere Network 0x key.'
          : `Recovery phrase must be 24 words. Found ${words.length}.`,
      );
    }
    rootPrivateKey = `0x${mnemonicToEntropy(clean, wordlists.english)}`;
  }

  if (!/^0x[0-9a-fA-F]{64}$/.test(rootPrivateKey)) {
    throw new Error('Invalid Cere root private key or exported ed25519 secret');
  }

  const { sk } = getED25519Key(rootPrivateKey.slice(2));
  return sk;
}

/**
 * Create the same Cere ed25519 keypair that Cere Wallet shows for its Cere Network account.
 * Returns { address, publicKey, sign(message) }
 */
export async function createKeypair(walletSecret) {
  await initCrypto();

  const secretKey = getCereEd25519SecretKey(walletSecret);
  const publicKey = secretKey.slice(32);
  const keyring = new Keyring({ type: 'ed25519', ss58Format: SS58_PREFIX });
  keyring.addFromPair({ publicKey, secretKey });
  const pair = keyring.getPair(encodeAddress(publicKey, SS58_PREFIX));
  
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
