import { describe, it, expect } from 'vitest';
import {
  parseToken,
  validateToken,
  pathMatchesPattern,
  hasPermission,
  getAccessiblePaths,
} from '../token';
import { InvalidTokenError } from '../errors';
import type { CapabilityToken } from '../types';

// Helper to create a valid token
function createTestToken(overrides: Partial<CapabilityToken> = {}): CapabilityToken {
  const now = Math.floor(Date.now() / 1000);
  return {
    version: 1,
    id: 'test-token-123',
    issuer: 'did:proofi:user123',
    audience: 'did:proofi:agent456',
    issuedAt: now - 3600, // 1 hour ago
    expiresAt: now + 3600, // 1 hour from now
    scopes: [
      { path: 'health/**', permissions: ['read', 'write'] },
      { path: 'identity/email', permissions: ['read'] },
    ],
    wrappedDEK: {
      ciphertext: 'dGVzdC1jaXBoZXJ0ZXh0',
      ephemeralPublicKey: 'dGVzdC1wdWJsaWMta2V5',
      nonce: 'dGVzdC1ub25jZQ==',
    },
    bucketId: 'bucket-abc123',
    signature: 'dGVzdC1zaWduYXR1cmU=',
    ...overrides,
  };
}

describe('Token utilities', () => {
  describe('parseToken', () => {
    it('parses base64-encoded JSON token', () => {
      const token = createTestToken();
      const encoded = btoa(JSON.stringify(token));

      const parsed = parseToken(encoded);

      expect(parsed.id).toBe(token.id);
      expect(parsed.issuer).toBe(token.issuer);
      expect(parsed.scopes).toHaveLength(2);
    });

    it('parses JWT-like token format', () => {
      const header = { typ: 'PCT', alg: 'Ed25519' };
      const payload = {
        jti: 'token-456',
        iss: 'did:proofi:user789',
        aud: 'did:proofi:agent111',
        iat: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) + 3600,
        scopes: [{ path: 'data/**', permissions: ['read'] }],
        wrappedDEK: {
          ciphertext: 'Y2lwaGVy',
          ephemeralPublicKey: 'cHVia2V5',
          nonce: 'bm9uY2U=',
        },
        bucketId: 'bucket-xyz',
      };

      const token = [
        btoa(JSON.stringify(header)),
        btoa(JSON.stringify(payload)),
        'c2lnbmF0dXJl',
      ].join('.');

      const parsed = parseToken(token);

      expect(parsed.id).toBe('token-456');
      expect(parsed.issuer).toBe('did:proofi:user789');
    });

    it('throws on invalid token structure', () => {
      const incomplete = { id: 'test' };
      const encoded = btoa(JSON.stringify(incomplete));

      expect(() => parseToken(encoded)).toThrow(InvalidTokenError);
    });

    it('throws on empty scopes', () => {
      const token = createTestToken({ scopes: [] });
      const encoded = btoa(JSON.stringify(token));

      expect(() => parseToken(encoded)).toThrow(InvalidTokenError);
    });
  });

  describe('validateToken', () => {
    it('validates non-expired token', () => {
      const token = createTestToken();
      const result = validateToken(token);

      expect(result.valid).toBe(true);
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('rejects expired token', () => {
      const token = createTestToken({
        expiresAt: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      });

      const result = validateToken(token);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('expired');
      expect(result.expiresIn).toBeLessThan(0);
    });

    it('rejects token issued in future', () => {
      const token = createTestToken({
        issuedAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      });

      const result = validateToken(token);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('future');
    });
  });

  describe('pathMatchesPattern', () => {
    it('matches exact paths', () => {
      expect(pathMatchesPattern('health/metrics', 'health/metrics')).toBe(true);
      expect(pathMatchesPattern('health/metrics', 'health/sleep')).toBe(false);
    });

    it('matches single wildcard', () => {
      expect(pathMatchesPattern('health/metrics', 'health/*')).toBe(true);
      expect(pathMatchesPattern('health/sleep', 'health/*')).toBe(true);
      expect(pathMatchesPattern('health/sleep/quality', 'health/*')).toBe(false);
    });

    it('matches double wildcard', () => {
      expect(pathMatchesPattern('health/metrics', 'health/**')).toBe(true);
      expect(pathMatchesPattern('health/sleep/quality', 'health/**')).toBe(true);
      expect(pathMatchesPattern('health/a/b/c/d', 'health/**')).toBe(true);
      expect(pathMatchesPattern('identity/email', 'health/**')).toBe(false);
    });

    it('handles leading/trailing slashes', () => {
      expect(pathMatchesPattern('/health/metrics/', 'health/metrics')).toBe(true);
      expect(pathMatchesPattern('health/metrics', '/health/metrics/')).toBe(true);
    });

    it('matches root pattern', () => {
      expect(pathMatchesPattern('health', 'health')).toBe(true);
      expect(pathMatchesPattern('health/metrics', 'health')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('returns true for granted permission', () => {
      const token = createTestToken();

      expect(hasPermission(token, 'health/metrics', 'read')).toBe(true);
      expect(hasPermission(token, 'health/metrics', 'write')).toBe(true);
      expect(hasPermission(token, 'identity/email', 'read')).toBe(true);
    });

    it('returns false for denied permission', () => {
      const token = createTestToken();

      expect(hasPermission(token, 'identity/email', 'write')).toBe(false);
      expect(hasPermission(token, 'files/document', 'read')).toBe(false);
    });

    it('respects wildcard scopes', () => {
      const token = createTestToken();

      expect(hasPermission(token, 'health/sleep/quality', 'read')).toBe(true);
      expect(hasPermission(token, 'health/any/deep/path', 'write')).toBe(true);
    });
  });

  describe('getAccessiblePaths', () => {
    it('returns paths with read permission', () => {
      const token = createTestToken();
      const paths = getAccessiblePaths(token, 'read');

      expect(paths).toContain('health/**');
      expect(paths).toContain('identity/email');
    });

    it('returns paths with write permission', () => {
      const token = createTestToken();
      const paths = getAccessiblePaths(token, 'write');

      expect(paths).toContain('health/**');
      expect(paths).not.toContain('identity/email');
    });

    it('returns empty array for no matches', () => {
      const token = createTestToken();
      const paths = getAccessiblePaths(token, 'delete');

      expect(paths).toHaveLength(0);
    });
  });
});
