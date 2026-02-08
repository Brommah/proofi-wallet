import { describe, it, expect, beforeAll } from 'vitest';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { Keyring } from '@polkadot/keyring';
import {
  signAgentRequest,
  verifyAgentResponse,
  encryptForDDC,
  decryptFromDDC,
  canonicalise,
  generateNonce,
  ensureCryptoReady,
} from '../auth.js';
import type { CredentialSigner, AgentResponse } from '../types.js';
import nacl from 'tweetnacl';

const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('auth', () => {
  let sr25519Pair: ReturnType<InstanceType<typeof Keyring>['addFromUri']>;
  let ed25519Pair: ReturnType<InstanceType<typeof Keyring>['addFromUri']>;

  beforeAll(async () => {
    await ensureCryptoReady();
    const sr25519Keyring = new Keyring({ type: 'sr25519', ss58Format: 42 });
    sr25519Pair = sr25519Keyring.addFromUri(TEST_MNEMONIC);
    const ed25519Keyring = new Keyring({ type: 'ed25519', ss58Format: 42 });
    ed25519Pair = ed25519Keyring.addFromUri(TEST_MNEMONIC);
  });

  describe('canonicalise', () => {
    it('produces deterministic JSON with sorted keys', () => {
      const a = canonicalise({ z: 1, a: 2, m: 3 });
      const b = canonicalise({ a: 2, m: 3, z: 1 });
      expect(a).toBe(b);
      expect(a).toBe('{"a":2,"m":3,"z":1}');
    });

    it('handles nested objects', () => {
      const result = canonicalise({ b: { z: 1, a: 2 }, a: 'first' });
      expect(result).toBe('{"a":"first","b":{"a":2,"z":1}}');
    });

    it('handles arrays without reordering', () => {
      const result = canonicalise({ items: [3, 1, 2] });
      expect(result).toBe('{"items":[3,1,2]}');
    });
  });

  describe('generateNonce', () => {
    it('returns a hex string', () => {
      const nonce = generateNonce();
      expect(nonce).toMatch(/^0x[0-9a-f]+$/);
    });

    it('generates unique nonces', () => {
      const a = generateNonce();
      const b = generateNonce();
      expect(a).not.toBe(b);
    });
  });

  describe('signAgentRequest', () => {
    it('signs a payload with sr25519 and returns a complete request', () => {
      const signer: CredentialSigner = {
        sign: (msg) => sr25519Pair.sign(msg),
        address: sr25519Pair.address,
      };

      const request = signAgentRequest(signer, { action: 'query', data: 'test' });

      expect(request.signer).toBe(sr25519Pair.address);
      expect(request.payload).toEqual({ action: 'query', data: 'test' });
      expect(request.signature).toMatch(/^0x[0-9a-f]+$/);
      expect(request.timestamp).toBeTruthy();
      expect(request.nonce).toMatch(/^0x[0-9a-f]+$/);
    });

    it('signs a payload with ed25519', () => {
      const signer: CredentialSigner = {
        sign: (msg) => ed25519Pair.sign(msg),
        address: ed25519Pair.address,
      };

      const request = signAgentRequest(signer, { hello: 'world' });

      expect(request.signer).toBe(ed25519Pair.address);
      expect(request.signature).toMatch(/^0x[0-9a-f]+$/);
    });

    it('produces different signatures for different payloads', () => {
      const signer: CredentialSigner = {
        sign: (msg) => sr25519Pair.sign(msg),
        address: sr25519Pair.address,
      };

      const r1 = signAgentRequest(signer, { a: 1 });
      const r2 = signAgentRequest(signer, { b: 2 });

      expect(r1.signature).not.toBe(r2.signature);
    });
  });

  describe('verifyAgentResponse', () => {
    function makeSignedResponse(
      pair: typeof ed25519Pair,
      payload: Record<string, unknown>,
    ): AgentResponse {
      const timestamp = new Date().toISOString();
      const nonce = generateNonce();
      const agentId = pair.address;

      const signable = canonicalise({ payload, timestamp, nonce, agentId });
      const signableBytes = new TextEncoder().encode(signable);
      const signatureBytes = pair.sign(signableBytes);
      const { u8aToHex } = require('@polkadot/util');

      return {
        payload,
        timestamp,
        agentId,
        signature: u8aToHex(signatureBytes),
        nonce,
      };
    }

    it('verifies a valid ed25519 response', () => {
      const response = makeSignedResponse(ed25519Pair, { status: 'ok' });
      const result = verifyAgentResponse(response, ed25519Pair.address);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects response with tampered payload', () => {
      const response = makeSignedResponse(ed25519Pair, { score: 100 });
      response.payload.score = 999;

      const result = verifyAgentResponse(response, ed25519Pair.address);
      expect(result.valid).toBe(false);
    });

    it('rejects response with wrong agent address', () => {
      const response = makeSignedResponse(ed25519Pair, { ok: true });
      const otherKeyring = new Keyring({ type: 'ed25519', ss58Format: 42 });
      const otherPair = otherKeyring.addFromUri('//Other');

      const result = verifyAgentResponse(response, otherPair.address);
      expect(result.valid).toBe(false);
    });

    it('rejects response with missing fields', () => {
      const result = verifyAgentResponse(
        { payload: {}, timestamp: '', agentId: '', signature: '', nonce: '' } as AgentResponse,
        ed25519Pair.address,
      );
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('encryptForDDC / decryptFromDDC', () => {
    it('encrypts and decrypts data round-trip', () => {
      const teeKeyPair = nacl.box.keyPair();
      const plaintext = new TextEncoder().encode('secret agent memory');

      const envelope = encryptForDDC(plaintext, teeKeyPair.publicKey);

      expect(envelope.ciphertext).toBeInstanceOf(Uint8Array);
      expect(envelope.ephemeralPublicKey).toBeInstanceOf(Uint8Array);
      expect(envelope.ephemeralPublicKey.length).toBe(32);
      expect(envelope.nonce).toBeInstanceOf(Uint8Array);
      expect(envelope.nonce.length).toBe(nacl.box.nonceLength);

      const decrypted = decryptFromDDC(envelope, teeKeyPair.secretKey);
      expect(new TextDecoder().decode(decrypted)).toBe('secret agent memory');
    });

    it('produces different ciphertext for same data (ephemeral keys)', () => {
      const teeKeyPair = nacl.box.keyPair();
      const plaintext = new TextEncoder().encode('same data');

      const e1 = encryptForDDC(plaintext, teeKeyPair.publicKey);
      const e2 = encryptForDDC(plaintext, teeKeyPair.publicKey);

      // Ephemeral keys differ
      expect(e1.ephemeralPublicKey).not.toEqual(e2.ephemeralPublicKey);
    });

    it('fails decryption with wrong key', () => {
      const teeKeyPair = nacl.box.keyPair();
      const wrongKeyPair = nacl.box.keyPair();
      const plaintext = new TextEncoder().encode('secret');

      const envelope = encryptForDDC(plaintext, teeKeyPair.publicKey);

      expect(() => decryptFromDDC(envelope, wrongKeyPair.secretKey)).toThrow(
        'Decryption failed',
      );
    });

    it('handles empty data', () => {
      const teeKeyPair = nacl.box.keyPair();
      const plaintext = new Uint8Array(0);

      const envelope = encryptForDDC(plaintext, teeKeyPair.publicKey);
      const decrypted = decryptFromDDC(envelope, teeKeyPair.secretKey);

      expect(decrypted.length).toBe(0);
    });
  });
});
