import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProofiAgent } from '../agent';
import { generateKeyPair, wrapDEK, encryptBlob, encodeBase64 } from '../crypto';
import { TokenExpiredError, ScopeError } from '../errors';
import type { CapabilityToken } from '../types';

// Mock fetch for DDC requests
const mockFetch = vi.fn();
global.fetch = mockFetch;

function createTestSetup() {
  const agentKeyPair = generateKeyPair();
  const dek = crypto.getRandomValues(new Uint8Array(32));
  const wrappedDEK = wrapDEK(dek, agentKeyPair.publicKey);

  const now = Math.floor(Date.now() / 1000);
  const token: CapabilityToken = {
    version: 1,
    id: 'test-token',
    issuer: 'did:proofi:user123',
    audience: 'did:proofi:agent456',
    issuedAt: now - 3600,
    expiresAt: now + 3600,
    scopes: [
      { path: 'health/**', permissions: ['read', 'write'] },
      { path: 'identity/email', permissions: ['read'] },
    ],
    wrappedDEK,
    bucketId: 'test-bucket',
    signature: 'test-signature',
  };

  return { agentKeyPair, dek, token };
}

describe('ProofiAgent', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('constructor', () => {
    it('creates agent with token object', () => {
      const { agentKeyPair, token } = createTestSetup();

      const agent = new ProofiAgent({
        token,
        privateKey: agentKeyPair.privateKey,
      });

      expect(agent.getTokenId()).toBe('test-token');
      expect(agent.getIssuer()).toBe('did:proofi:user123');
    });

    it('creates agent with token string', () => {
      const { agentKeyPair, token } = createTestSetup();
      const tokenString = btoa(JSON.stringify(token));

      const agent = new ProofiAgent({
        token: tokenString,
        privateKey: encodeBase64(agentKeyPair.privateKey),
      });

      expect(agent.getTokenId()).toBe('test-token');
    });
  });

  describe('validateToken', () => {
    it('returns valid for non-expired token', async () => {
      const { agentKeyPair, token } = createTestSetup();

      const agent = new ProofiAgent({
        token,
        privateKey: agentKeyPair.privateKey,
      });

      const result = await agent.validateToken();
      expect(result.valid).toBe(true);
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('returns invalid for expired token', async () => {
      const { agentKeyPair, token } = createTestSetup();
      token.expiresAt = Math.floor(Date.now() / 1000) - 3600;

      const agent = new ProofiAgent({
        token,
        privateKey: agentKeyPair.privateKey,
      });

      const result = await agent.validateToken();
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('expired');
    });
  });

  describe('isValid / getExpiresIn / getExpiresAt', () => {
    it('returns correct validity state', () => {
      const { agentKeyPair, token } = createTestSetup();

      const agent = new ProofiAgent({
        token,
        privateKey: agentKeyPair.privateKey,
      });

      expect(agent.isValid()).toBe(true);
      expect(agent.getExpiresIn()).toBeGreaterThan(0);
      expect(agent.getExpiresAt()).toBeInstanceOf(Date);
    });
  });

  describe('listScope', () => {
    it('returns all scopes from token', () => {
      const { agentKeyPair, token } = createTestSetup();

      const agent = new ProofiAgent({
        token,
        privateKey: agentKeyPair.privateKey,
      });

      const scopes = agent.listScope();
      expect(scopes).toHaveLength(2);
      expect(scopes[0]).toEqual({
        path: 'health/**',
        permissions: ['read', 'write'],
      });
    });
  });

  describe('hasPermission', () => {
    it('checks permission correctly', () => {
      const { agentKeyPair, token } = createTestSetup();

      const agent = new ProofiAgent({
        token,
        privateKey: agentKeyPair.privateKey,
      });

      expect(agent.hasPermission('health/metrics', 'read')).toBe(true);
      expect(agent.hasPermission('health/metrics', 'write')).toBe(true);
      expect(agent.hasPermission('identity/email', 'read')).toBe(true);
      expect(agent.hasPermission('identity/email', 'write')).toBe(false);
      expect(agent.hasPermission('files/doc', 'read')).toBe(false);
    });
  });

  describe('getAccessiblePaths', () => {
    it('returns paths for given permission', () => {
      const { agentKeyPair, token } = createTestSetup();

      const agent = new ProofiAgent({
        token,
        privateKey: agentKeyPair.privateKey,
      });

      const readable = agent.getAccessiblePaths('read');
      expect(readable).toContain('health/**');
      expect(readable).toContain('identity/email');

      const writable = agent.getAccessiblePaths('write');
      expect(writable).toContain('health/**');
      expect(writable).not.toContain('identity/email');
    });
  });

  describe('read', () => {
    it('fetches and decrypts data', async () => {
      const { agentKeyPair, dek, token } = createTestSetup();
      const testData = { heartRate: 72, steps: 5000 };

      // Encrypt test data with the DEK
      const encrypted = await encryptBlob(JSON.stringify(testData), dek);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ciphertext: encrypted.ciphertext,
          nonce: encrypted.nonce,
          tag: '',
          metadata: { path: 'health/metrics' },
        }),
      });

      const agent = new ProofiAgent({
        token,
        privateKey: agentKeyPair.privateKey,
      });

      const data = await agent.read<typeof testData>('health/metrics');

      expect(data).toEqual(testData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('health/metrics'),
        expect.any(Object)
      );
    });

    it('throws ScopeError for unauthorized path', async () => {
      const { agentKeyPair, token } = createTestSetup();

      const agent = new ProofiAgent({
        token,
        privateKey: agentKeyPair.privateKey,
      });

      await expect(agent.read('files/document')).rejects.toThrow(ScopeError);
    });

    it('throws TokenExpiredError for expired token', async () => {
      const { agentKeyPair, token } = createTestSetup();
      token.expiresAt = Math.floor(Date.now() / 1000) - 1;

      const agent = new ProofiAgent({
        token,
        privateKey: agentKeyPair.privateKey,
      });

      await expect(agent.read('health/metrics')).rejects.toThrow(TokenExpiredError);
    });
  });

  describe('write', () => {
    it('encrypts and stores data', async () => {
      const { agentKeyPair, token } = createTestSetup();
      const testData = { analysis: 'Good health!' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          path: 'health/insights',
          size: 100,
          contentType: 'application/json',
          lastModified: Date.now(),
          checksum: 'abc123',
        }),
      });

      const agent = new ProofiAgent({
        token,
        privateKey: agentKeyPair.privateKey,
      });

      const result = await agent.write('health/insights', testData);

      expect(result.path).toBe('health/insights');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('health/insights'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('throws ScopeError for read-only path', async () => {
      const { agentKeyPair, token } = createTestSetup();

      const agent = new ProofiAgent({
        token,
        privateKey: agentKeyPair.privateKey,
      });

      await expect(
        agent.write('identity/email', { email: 'new@example.com' })
      ).rejects.toThrow(ScopeError);
    });
  });

  describe('delete', () => {
    it('throws ScopeError without delete permission', async () => {
      const { agentKeyPair, token } = createTestSetup();

      const agent = new ProofiAgent({
        token,
        privateKey: agentKeyPair.privateKey,
      });

      await expect(agent.delete('health/metrics')).rejects.toThrow(ScopeError);
    });
  });

  describe('getToken', () => {
    it('returns frozen token copy', () => {
      const { agentKeyPair, token } = createTestSetup();

      const agent = new ProofiAgent({
        token,
        privateKey: agentKeyPair.privateKey,
      });

      const retrieved = agent.getToken();

      expect(retrieved.id).toBe(token.id);
      expect(Object.isFrozen(retrieved)).toBe(true);
    });
  });
});
