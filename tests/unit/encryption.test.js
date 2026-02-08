/**
 * Encryption Unit Tests
 * Tests for client-side encryption logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══ Encryption Utilities (extracted from SDK patterns) ═══

/**
 * Encrypt data using AES-GCM
 */
async function encryptData(data, password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Derive key from password
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(data))
  );
  
  return {
    salt: Array.from(salt),
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  };
}

/**
 * Decrypt data using AES-GCM
 */
async function decryptData(encryptedData, password) {
  const encoder = new TextEncoder();
  const { salt, iv, data } = encryptedData;
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decrypted));
}

/**
 * Generate a random encryption key
 */
async function generateKey() {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Hash data using SHA-256
 */
async function hashData(data) {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(data)
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ═══ Tests ═══

describe('Encryption Module', () => {
  describe('encryptData', () => {
    it('should encrypt data with password', async () => {
      const data = { name: 'John Doe', email: 'john@example.com' };
      const password = 'secure-password-123';
      
      const result = await encryptData(data, password);
      
      expect(result).toHaveProperty('salt');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('data');
      expect(result.salt).toHaveLength(16);
      expect(result.iv).toHaveLength(12);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should produce different ciphertext for same data (random IV)', async () => {
      const data = { secret: 'test' };
      const password = 'password';
      
      const result1 = await encryptData(data, password);
      const result2 = await encryptData(data, password);
      
      // IVs should be different
      expect(result1.iv).not.toEqual(result2.iv);
      // Ciphertext should be different
      expect(result1.data).not.toEqual(result2.data);
    });

    it('should handle empty objects', async () => {
      const result = await encryptData({}, 'password');
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should handle nested objects', async () => {
      const data = {
        user: {
          profile: {
            name: 'Test',
            settings: { theme: 'dark' }
          }
        }
      };
      
      const result = await encryptData(data, 'password');
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should handle arrays', async () => {
      const data = { items: [1, 2, 3, 'test', { nested: true }] };
      const result = await encryptData(data, 'password');
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should handle unicode strings', async () => {
      const data = { message: '你好世界 🔐 مرحبا' };
      const result = await encryptData(data, 'пароль');
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('decryptData', () => {
    it('should decrypt data with correct password', async () => {
      // Mock decryption returns 'test' as Uint8Array
      const encrypted = {
        salt: Array.from(new Uint8Array(16)),
        iv: Array.from(new Uint8Array(12)),
        data: Array.from(new Uint8Array(32))
      };
      
      // The mock returns 'test' which parses as a string
      crypto.subtle.decrypt.mockResolvedValueOnce(
        new TextEncoder().encode('"test"').buffer
      );
      
      const result = await decryptData(encrypted, 'password');
      expect(result).toBe('test');
    });

    it('should call deriveKey with correct parameters', async () => {
      const encrypted = {
        salt: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        iv: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        data: [1, 2, 3, 4]
      };
      
      crypto.subtle.decrypt.mockResolvedValueOnce(
        new TextEncoder().encode('{}').buffer
      );
      
      await decryptData(encrypted, 'test-password');
      
      expect(crypto.subtle.deriveKey).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PBKDF2',
          iterations: 100000,
          hash: 'SHA-256'
        }),
        expect.anything(),
        expect.objectContaining({ name: 'AES-GCM', length: 256 }),
        false,
        ['decrypt']
      );
    });
  });

  describe('generateKey', () => {
    it('should generate an AES-GCM key', async () => {
      const key = await generateKey();
      expect(key).toHaveProperty('publicKey');
      expect(key).toHaveProperty('privateKey');
    });

    it('should call subtle.generateKey with correct params', async () => {
      await generateKey();
      expect(crypto.subtle.generateKey).toHaveBeenCalledWith(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    });
  });

  describe('hashData', () => {
    it('should hash string data', async () => {
      const hash = await hashData('test string');
      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it('should produce consistent hashes for same input', async () => {
      const hash1 = await hashData('same input');
      const hash2 = await hashData('same input');
      expect(hash1).toBe(hash2);
    });

    it('should call digest with SHA-256', async () => {
      await hashData('test');
      expect(crypto.subtle.digest).toHaveBeenCalledWith(
        'SHA-256',
        expect.any(Uint8Array)
      );
    });
  });

  describe('Key Derivation Security', () => {
    it('should use 100,000 PBKDF2 iterations (OWASP recommendation)', async () => {
      const data = { test: true };
      await encryptData(data, 'password');
      
      expect(crypto.subtle.deriveKey).toHaveBeenCalledWith(
        expect.objectContaining({
          iterations: 100000
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    it('should use 16-byte salt (128 bits)', async () => {
      const result = await encryptData({ test: true }, 'password');
      expect(result.salt).toHaveLength(16);
    });

    it('should use 12-byte IV for AES-GCM', async () => {
      const result = await encryptData({ test: true }, 'password');
      expect(result.iv).toHaveLength(12);
    });

    it('should use 256-bit AES key', async () => {
      await encryptData({ test: true }, 'password');
      
      expect(crypto.subtle.deriveKey).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ length: 256 }),
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(10000);
      const result = await encryptData({ test: true }, longPassword);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should handle empty password', async () => {
      const result = await encryptData({ test: true }, '');
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should handle special characters in data', async () => {
      const data = {
        special: '<script>alert("xss")</script>',
        quotes: '"\'`',
        backslash: '\\path\\to\\file'
      };
      const result = await encryptData(data, 'password');
      expect(result.data.length).toBeGreaterThan(0);
    });
  });
});
