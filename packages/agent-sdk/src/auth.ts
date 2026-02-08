/**
 * @module auth
 * Sr25519 signing and verification for Proofi ↔ ProofiAgent agent communication.
 */
import { u8aToHex, hexToU8a } from '@polkadot/util';
import {
  cryptoWaitReady,
  signatureVerify,
  decodeAddress,
  randomAsU8a,
} from '@polkadot/util-crypto';
import nacl from 'tweetnacl';
import type {
  AgentRequest,
  AgentResponse,
  CredentialSigner,
  VerificationResult,
  DDCEncryptedEnvelope,
} from './types.js';

let _ready = false;

/** Ensure Polkadot WASM crypto is initialised */
export async function ensureCryptoReady(): Promise<void> {
  if (_ready) return;
  await cryptoWaitReady();
  _ready = true;
}

/**
 * Canonicalise a payload for deterministic signing.
 * Recursively sorts object keys and produces a stable JSON string.
 */
export function canonicalise(payload: Record<string, unknown>): string {
  return JSON.stringify(sortDeep(payload));
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortDeep);
  }
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortDeep((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Generate a random nonce for replay-attack prevention.
 */
export function generateNonce(): string {
  return u8aToHex(randomAsU8a(16));
}

/**
 * Sign an agent request payload using a Proofi credential signer.
 *
 * @param signer - CredentialSigner (e.g. from a Polkadot KeyringPair)
 * @param payload - The request data to sign
 * @returns A complete AgentRequest with signature and metadata
 */
export function signAgentRequest(
  signer: CredentialSigner,
  payload: Record<string, unknown>,
): AgentRequest {
  const timestamp = new Date().toISOString();
  const nonce = generateNonce();

  const signable = canonicalise({ payload, timestamp, nonce, signer: signer.address });
  const signableBytes = new TextEncoder().encode(signable);
  const signatureBytes = signer.sign(signableBytes);

  return {
    payload,
    timestamp,
    signer: signer.address,
    signature: u8aToHex(signatureBytes),
    nonce,
  };
}

/**
 * Verify a signed agent response.
 *
 * @param response - The agent response to verify
 * @param agentPublicKeyOrAddress - Agent's SS58 address or raw public key
 * @returns VerificationResult with validity and any errors
 */
export function verifyAgentResponse(
  response: AgentResponse,
  agentPublicKeyOrAddress: string | Uint8Array,
): VerificationResult {
  const errors: string[] = [];

  if (!response.signature || typeof response.signature !== 'string') {
    errors.push('Missing or invalid signature');
  }
  if (!response.agentId || typeof response.agentId !== 'string') {
    errors.push('Missing or invalid agentId');
  }
  if (!response.timestamp || typeof response.timestamp !== 'string') {
    errors.push('Missing or invalid timestamp');
  }
  if (!response.payload || typeof response.payload !== 'object') {
    errors.push('Missing or invalid payload');
  }
  if (!response.nonce || typeof response.nonce !== 'string') {
    errors.push('Missing or invalid nonce');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  try {
    const signable = canonicalise({
      payload: response.payload,
      timestamp: response.timestamp,
      nonce: response.nonce,
      agentId: response.agentId,
    });
    const signableBytes = new TextEncoder().encode(signable);
    const signatureBytes = hexToU8a(response.signature);

    const publicKey =
      typeof agentPublicKeyOrAddress === 'string'
        ? decodeAddress(agentPublicKeyOrAddress)
        : agentPublicKeyOrAddress;

    const result = signatureVerify(signableBytes, signatureBytes, publicKey);
    if (!result.isValid) {
      errors.push('Signature verification failed');
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  } catch (err) {
    errors.push(`Signature verification error: ${(err as Error).message}`);
    return { valid: false, errors };
  }
}

/**
 * Encrypt data for DDC storage using x25519 (NaCl box).
 *
 * @param data - Raw data to encrypt
 * @param teePublicKey - DDC's x25519 public key (32 bytes)
 * @returns DDCEncryptedEnvelope with ciphertext, ephemeral key, and nonce
 */
export function encryptForDDC(
  data: Uint8Array,
  teePublicKey: Uint8Array,
): DDCEncryptedEnvelope {
  const ephemeralKeyPair = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const ciphertext = nacl.box(data, nonce, teePublicKey, ephemeralKeyPair.secretKey);
  if (!ciphertext) {
    throw new Error('Encryption failed');
  }

  return {
    ciphertext,
    ephemeralPublicKey: ephemeralKeyPair.publicKey,
    nonce,
  };
}

/**
 * Decrypt data from a DDC envelope (used by the DDC side).
 *
 * @param envelope - The encrypted envelope
 * @param teeSecretKey - DDC's x25519 secret key (32 bytes)
 * @returns Decrypted data bytes
 * @throws Error if decryption fails
 */
export function decryptFromDDC(
  envelope: DDCEncryptedEnvelope,
  teeSecretKey: Uint8Array,
): Uint8Array {
  const plaintext = nacl.box.open(
    envelope.ciphertext,
    envelope.nonce,
    envelope.ephemeralPublicKey,
    teeSecretKey,
  );
  if (!plaintext) {
    throw new Error('Decryption failed — invalid key or corrupted data');
  }
  return plaintext;
}
