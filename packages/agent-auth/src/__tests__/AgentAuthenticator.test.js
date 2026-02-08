import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { Keyring } from '@polkadot/keyring';
import { AgentAuthenticator } from '../AgentAuthenticator.js';
import { SessionStatus } from '../types.js';

const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('AgentAuthenticator', () => {
  let auth;
  let walletAddress;

  beforeAll(async () => {
    await cryptoWaitReady();
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 42 });
    const pair = keyring.addFromUri(TEST_MNEMONIC);
    walletAddress = pair.address;
  });

  beforeEach(async () => {
    auth = new AgentAuthenticator();
    await auth.init();
  });

  // ── Initialisation ──────────────────────────────────────────────────────
  describe('init', () => {
    it('throws if not initialised', () => {
      const uninit = new AgentAuthenticator();
      expect(() => uninit.generateAgentSession(walletAddress)).toThrow('not initialised');
    });

    it('can be initialised multiple times safely', async () => {
      await auth.init();
      await auth.init();
      // No error thrown
      const session = auth.generateAgentSession(walletAddress);
      expect(session.id).toBeTruthy();
    });
  });

  // ── Session generation ──────────────────────────────────────────────────
  describe('generateAgentSession', () => {
    it('generates a session with all required fields', () => {
      const session = auth.generateAgentSession(walletAddress);
      expect(session.id).toMatch(/^0x[0-9a-f]+$/);
      expect(session.token).toMatch(/^0x[0-9a-f]+$/);
      expect(session.walletAddress).toBe(walletAddress);
      expect(session.agentId).toMatch(/^0x[0-9a-f]+$/);
      expect(session.createdAt).toBeTruthy();
      expect(session.expiresAt).toBeTruthy();
      expect(session.scopes).toEqual(['credential:read']);
    });

    it('generates unique session IDs', () => {
      const a = auth.generateAgentSession(walletAddress);
      const b = auth.generateAgentSession(walletAddress);
      expect(a.id).not.toBe(b.id);
      expect(a.token).not.toBe(b.token);
    });

    it('accepts custom agentId', () => {
      const session = auth.generateAgentSession(walletAddress, {
        agentId: 'agent-007',
      });
      expect(session.agentId).toBe('agent-007');
    });

    it('accepts custom scopes', () => {
      const session = auth.generateAgentSession(walletAddress, {
        scopes: ['credential:read', 'credential:present'],
      });
      expect(session.scopes).toEqual(['credential:read', 'credential:present']);
    });

    it('throws on empty walletAddress', () => {
      expect(() => auth.generateAgentSession('')).toThrow('walletAddress is required');
    });

    it('throws on null walletAddress', () => {
      expect(() => auth.generateAgentSession(null)).toThrow('walletAddress is required');
    });

    it('increments size on each session', () => {
      expect(auth.size).toBe(0);
      auth.generateAgentSession(walletAddress);
      expect(auth.size).toBe(1);
      auth.generateAgentSession(walletAddress);
      expect(auth.size).toBe(2);
    });

    it('sets expiry in the future', () => {
      const session = auth.generateAgentSession(walletAddress);
      const expiresAt = new Date(session.expiresAt);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  // ── Session validation ──────────────────────────────────────────────────
  describe('validateSession', () => {
    it('validates a freshly generated session', () => {
      const session = auth.generateAgentSession(walletAddress);
      const result = auth.validateSession(session.token);
      expect(result.valid).toBe(true);
      expect(result.session.id).toBe(session.id);
      expect(result.session.walletAddress).toBe(walletAddress);
      expect(result.session.agentId).toBe(session.agentId);
      expect(result.session.scopes).toEqual(session.scopes);
    });

    it('rejects empty token', () => {
      const result = auth.validateSession('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token is required');
    });

    it('rejects null token', () => {
      const result = auth.validateSession(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token is required');
    });

    it('rejects invalid hex', () => {
      const result = auth.validateSession('not-a-hex-token');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token format');
    });

    it('rejects token with unknown session ID', () => {
      // Craft a valid hex token with a fake session ID
      const fakePayload = JSON.stringify({ id: '0xdeadbeef' });
      const fakeToken = '0x' + Buffer.from(fakePayload).toString('hex');
      const result = auth.validateSession(fakeToken);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Session not found');
    });

    it('rejects revoked session', () => {
      const session = auth.generateAgentSession(walletAddress);
      auth.revokeSession(session.id);
      const result = auth.validateSession(session.token);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Session has been revoked');
    });

    it('rejects expired session', () => {
      auth.setSessionTtl(1); // 1ms TTL
      const session = auth.generateAgentSession(walletAddress);

      // Wait for expiry
      const start = Date.now();
      while (Date.now() - start < 10) { /* spin */ }

      const result = auth.validateSession(session.token);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Session has expired');
    });
  });

  // ── Session revocation ──────────────────────────────────────────────────
  describe('revokeSession', () => {
    it('revokes an active session', () => {
      const session = auth.generateAgentSession(walletAddress);
      const revoked = auth.revokeSession(session.id);
      expect(revoked).toBe(true);
    });

    it('returns false for unknown session', () => {
      const revoked = auth.revokeSession('nonexistent');
      expect(revoked).toBe(false);
    });

    it('revoked session cannot be validated', () => {
      const session = auth.generateAgentSession(walletAddress);
      auth.revokeSession(session.id);
      const result = auth.validateSession(session.token);
      expect(result.valid).toBe(false);
    });
  });

  // ── Session TTL ─────────────────────────────────────────────────────────
  describe('setSessionTtl', () => {
    it('configures session TTL', () => {
      auth.setSessionTtl(30000);
      const session = auth.generateAgentSession(walletAddress);
      const expiresAt = new Date(session.expiresAt);
      const createdAt = new Date(session.createdAt);
      const diff = expiresAt.getTime() - createdAt.getTime();
      expect(diff).toBeGreaterThanOrEqual(29000);
      expect(diff).toBeLessThanOrEqual(31000);
    });

    it('throws on non-positive TTL', () => {
      expect(() => auth.setSessionTtl(0)).toThrow('TTL must be positive');
      expect(() => auth.setSessionTtl(-1)).toThrow('TTL must be positive');
    });
  });

  // ── Active sessions query ───────────────────────────────────────────────
  describe('getActiveSessions', () => {
    it('returns active sessions for a wallet', () => {
      auth.generateAgentSession(walletAddress);
      auth.generateAgentSession(walletAddress);
      const sessions = auth.getActiveSessions(walletAddress);
      expect(sessions).toHaveLength(2);
    });

    it('excludes revoked sessions', () => {
      const s1 = auth.generateAgentSession(walletAddress);
      auth.generateAgentSession(walletAddress);
      auth.revokeSession(s1.id);
      const sessions = auth.getActiveSessions(walletAddress);
      expect(sessions).toHaveLength(1);
    });

    it('returns empty for unknown wallet', () => {
      auth.generateAgentSession(walletAddress);
      const sessions = auth.getActiveSessions('5UnknownAddress');
      expect(sessions).toHaveLength(0);
    });
  });

  // ── Cleanup ─────────────────────────────────────────────────────────────
  describe('clear', () => {
    it('removes all sessions', () => {
      auth.generateAgentSession(walletAddress);
      auth.generateAgentSession(walletAddress);
      expect(auth.size).toBe(2);
      auth.clear();
      expect(auth.size).toBe(0);
    });
  });
});
