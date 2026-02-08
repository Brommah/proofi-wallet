/**
 * Tests for crypto.ts
 * Tests key derivation and AES-GCM encryption
 */

// Don't mock @noble/ciphers for crypto tests - we need real crypto
jest.unmock('@noble/ciphers/webcrypto.js');

import {
  deriveSeedFromPin,
  encryptSeed,
  decryptSeed,
  verifyPin,
} from '../src/lib/crypto';

describe('crypto', () => {
  describe('deriveSeedFromPin', () => {
    it('derives consistent seed from same PIN and salt', () => {
      const pin = '123456';
      const salt = 'test-salt';
      
      const seed1 = deriveSeedFromPin(pin, salt);
      const seed2 = deriveSeedFromPin(pin, salt);
      
      expect(seed1).toBe(seed2);
    });

    it('returns hex string with 0x prefix', () => {
      const seed = deriveSeedFromPin('1234', 'salt');
      
      expect(seed).toMatch(/^0x[a-f0-9]{64}$/i);
    });

    it('produces different seeds for different PINs', () => {
      const salt = 'same-salt';
      
      const seed1 = deriveSeedFromPin('1111', salt);
      const seed2 = deriveSeedFromPin('2222', salt);
      
      expect(seed1).not.toBe(seed2);
    });

    it('produces different seeds for different salts', () => {
      const pin = '1234';
      
      const seed1 = deriveSeedFromPin(pin, 'salt-1');
      const seed2 = deriveSeedFromPin(pin, 'salt-2');
      
      expect(seed1).not.toBe(seed2);
    });

    it('handles empty PIN', () => {
      const seed = deriveSeedFromPin('', 'salt');
      
      expect(seed).toMatch(/^0x[a-f0-9]{64}$/i);
    });

    it('handles unicode characters', () => {
      const seed = deriveSeedFromPin('密码', 'ソルト');
      
      expect(seed).toMatch(/^0x[a-f0-9]{64}$/i);
    });
  });

  describe('encryptSeed / decryptSeed', () => {
    const testSeed = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const testPin = '123456';

    it('encrypts and decrypts seed correctly', async () => {
      const encrypted = await encryptSeed(testSeed, testPin);
      const decrypted = await decryptSeed(encrypted, testPin);
      
      expect(decrypted).toBe(testSeed);
    });

    it('produces different ciphertext each time (random IV)', async () => {
      const encrypted1 = await encryptSeed(testSeed, testPin);
      const encrypted2 = await encryptSeed(testSeed, testPin);
      
      // Should be different due to random IV/salt
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('returns base64 encoded string', async () => {
      const encrypted = await encryptSeed(testSeed, testPin);
      
      // Should be valid base64
      expect(() => atob(encrypted)).not.toThrow();
    });

    it('throws on wrong PIN', async () => {
      const encrypted = await encryptSeed(testSeed, testPin);
      
      await expect(decryptSeed(encrypted, 'wrongpin')).rejects.toThrow();
    });

    it('throws on tampered ciphertext', async () => {
      const encrypted = await encryptSeed(testSeed, testPin);
      
      // Tamper with the ciphertext
      const tampered = encrypted.slice(0, -4) + 'XXXX';
      
      await expect(decryptSeed(tampered, testPin)).rejects.toThrow();
    });

    it('handles short seeds', async () => {
      const shortSeed = '0x1234';
      
      const encrypted = await encryptSeed(shortSeed, testPin);
      const decrypted = await decryptSeed(encrypted, testPin);
      
      expect(decrypted).toBe(shortSeed);
    });

    it('handles long seeds', async () => {
      const longSeed = '0x' + 'a'.repeat(256);
      
      const encrypted = await encryptSeed(longSeed, testPin);
      const decrypted = await decryptSeed(encrypted, testPin);
      
      expect(decrypted).toBe(longSeed);
    });

    it('handles special characters in seed', async () => {
      const specialSeed = 'seed-with-special-chars: !@#$%^&*()';
      
      const encrypted = await encryptSeed(specialSeed, testPin);
      const decrypted = await decryptSeed(encrypted, testPin);
      
      expect(decrypted).toBe(specialSeed);
    });
  });

  describe('verifyPin', () => {
    const testSeed = '0xtest-seed-hex';
    const testPin = '654321';

    it('returns true for correct PIN', async () => {
      const encrypted = await encryptSeed(testSeed, testPin);
      
      const result = await verifyPin(encrypted, testPin);
      
      expect(result).toBe(true);
    });

    it('returns false for wrong PIN', async () => {
      const encrypted = await encryptSeed(testSeed, testPin);
      
      const result = await verifyPin(encrypted, 'wrongpin');
      
      expect(result).toBe(false);
    });

    it('returns false for tampered data', async () => {
      const encrypted = await encryptSeed(testSeed, testPin);
      const tampered = encrypted.slice(0, -2) + 'XX';
      
      const result = await verifyPin(tampered, testPin);
      
      expect(result).toBe(false);
    });
  });

  describe('encryption format', () => {
    it('includes salt + iv + ciphertext + tag in output', async () => {
      const seed = 'test';
      const pin = '1234';
      
      const encrypted = await encryptSeed(seed, pin);
      const bytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
      
      // salt (16) + iv (12) + ciphertext (4 for 'test') + tag (16) = 48 bytes
      // But ciphertext might be padded, so check minimum
      expect(bytes.length).toBeGreaterThanOrEqual(16 + 12 + 4 + 16);
    });
  });
});
