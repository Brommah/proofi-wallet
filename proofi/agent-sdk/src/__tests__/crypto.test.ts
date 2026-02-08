import { describe, it, expect } from 'vitest';
import {
  generateKeyPair,
  derivePublicKey,
  unwrapDEK,
  wrapDEK,
  encryptData,
  decryptData,
  encryptBlob,
  decryptBlob,
  normalizePrivateKey,
  encodeBase64,
  decodeBase64,
} from '../crypto';
import { DEKUnwrapError, DecryptionError } from '../errors';

describe('Crypto utilities', () => {
  describe('generateKeyPair', () => {
    it('generates valid X25519 keypair', () => {
      const { publicKey, privateKey } = generateKeyPair();

      expect(publicKey).toBeInstanceOf(Uint8Array);
      expect(privateKey).toBeInstanceOf(Uint8Array);
      expect(publicKey.length).toBe(32);
      expect(privateKey.length).toBe(32);
    });

    it('generates unique keypairs', () => {
      const kp1 = generateKeyPair();
      const kp2 = generateKeyPair();

      expect(encodeBase64(kp1.publicKey)).not.toBe(encodeBase64(kp2.publicKey));
      expect(encodeBase64(kp1.privateKey)).not.toBe(encodeBase64(kp2.privateKey));
    });
  });

  describe('derivePublicKey', () => {
    it('derives correct public key from private key', () => {
      const { publicKey, privateKey } = generateKeyPair();
      const derived = derivePublicKey(privateKey);

      expect(encodeBase64(derived)).toBe(encodeBase64(publicKey));
    });
  });

  describe('normalizePrivateKey', () => {
    it('accepts Uint8Array', () => {
      const { privateKey } = generateKeyPair();
      const normalized = normalizePrivateKey(privateKey);

      expect(normalized).toBe(privateKey);
    });

    it('accepts base64 string', () => {
      const { privateKey } = generateKeyPair();
      const base64 = encodeBase64(privateKey);
      const normalized = normalizePrivateKey(base64);

      expect(encodeBase64(normalized)).toBe(base64);
    });

    it('throws on invalid base64', () => {
      expect(() => normalizePrivateKey('not-valid-base64!!!')).toThrow();
    });
  });

  describe('wrapDEK / unwrapDEK', () => {
    it('wraps and unwraps DEK correctly', () => {
      const agentKeyPair = generateKeyPair();
      const dek = crypto.getRandomValues(new Uint8Array(32));

      // Wrap DEK for agent
      const wrapped = wrapDEK(dek, agentKeyPair.publicKey);

      expect(wrapped.ciphertext).toBeDefined();
      expect(wrapped.ephemeralPublicKey).toBeDefined();
      expect(wrapped.nonce).toBeDefined();

      // Unwrap with agent's private key
      const unwrapped = unwrapDEK(wrapped, agentKeyPair.privateKey);

      expect(encodeBase64(unwrapped)).toBe(encodeBase64(dek));
    });

    it('fails to unwrap with wrong private key', () => {
      const agentKeyPair = generateKeyPair();
      const wrongKeyPair = generateKeyPair();
      const dek = crypto.getRandomValues(new Uint8Array(32));

      const wrapped = wrapDEK(dek, agentKeyPair.publicKey);

      expect(() => unwrapDEK(wrapped, wrongKeyPair.privateKey)).toThrow(DEKUnwrapError);
    });
  });

  describe('encryptData / decryptData', () => {
    it('encrypts and decrypts data correctly', async () => {
      const dek = crypto.getRandomValues(new Uint8Array(32));
      const plaintext = new TextEncoder().encode('Hello, Proofi!');

      const { ciphertext, nonce } = await encryptData(plaintext, dek);
      const decrypted = await decryptData(ciphertext, nonce, dek);

      expect(new TextDecoder().decode(decrypted)).toBe('Hello, Proofi!');
    });

    it('produces different ciphertext for same plaintext', async () => {
      const dek = crypto.getRandomValues(new Uint8Array(32));
      const plaintext = new TextEncoder().encode('Same message');

      const result1 = await encryptData(plaintext, dek);
      const result2 = await encryptData(plaintext, dek);

      expect(encodeBase64(result1.ciphertext)).not.toBe(encodeBase64(result2.ciphertext));
      expect(encodeBase64(result1.nonce)).not.toBe(encodeBase64(result2.nonce));
    });

    it('fails to decrypt with wrong key', async () => {
      const dek = crypto.getRandomValues(new Uint8Array(32));
      const wrongDek = crypto.getRandomValues(new Uint8Array(32));
      const plaintext = new TextEncoder().encode('Secret data');

      const { ciphertext, nonce } = await encryptData(plaintext, dek);

      await expect(decryptData(ciphertext, nonce, wrongDek)).rejects.toThrow(DecryptionError);
    });

    it('fails to decrypt with tampered ciphertext', async () => {
      const dek = crypto.getRandomValues(new Uint8Array(32));
      const plaintext = new TextEncoder().encode('Important data');

      const { ciphertext, nonce } = await encryptData(plaintext, dek);

      // Tamper with ciphertext
      ciphertext[0] ^= 0xff;

      await expect(decryptData(ciphertext, nonce, dek)).rejects.toThrow(DecryptionError);
    });
  });

  describe('encryptBlob / decryptBlob', () => {
    it('encrypts and decrypts string data', async () => {
      const dek = crypto.getRandomValues(new Uint8Array(32));
      const data = JSON.stringify({ message: 'Hello, World!' });

      const encrypted = await encryptBlob(data, dek);
      const decrypted = await decryptBlob(encrypted, dek);

      expect(new TextDecoder().decode(decrypted)).toBe(data);
    });

    it('encrypts and decrypts binary data', async () => {
      const dek = crypto.getRandomValues(new Uint8Array(32));
      const data = crypto.getRandomValues(new Uint8Array(1024));

      const encrypted = await encryptBlob(data, dek);
      const decrypted = await decryptBlob(encrypted, dek);

      expect(encodeBase64(decrypted)).toBe(encodeBase64(data));
    });
  });
});
