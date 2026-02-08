/**
 * Auth Flow E2E Tests — Proofi ↔ OpenClaw
 *
 * Covers the authorization lifecycle: wallet authorizes agent,
 * agent requests credential access, wallet signs requests,
 * agent performs actions, and session expiry/renewal.
 * 
 * Uses REAL Proofi wallet with actual Ed25519/Sr25519 signing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RealProofiWallet,
  MockOpenClawAgent,
  createRealWallet,
  createTestCredential,
} from './test-setup';

describe('Auth Flow', () => {
  let wallet: RealProofiWallet;
  let agent: MockOpenClawAgent;

  beforeEach(async () => {
    wallet = await createRealWallet();
    agent = new MockOpenClawAgent();
  });

  // ──────────────────────────────────────────────────────
  // 1. Wallet owner authorizes agent
  // ──────────────────────────────────────────────────────
  describe('wallet owner authorizes agent', () => {
    it('should create a valid session when wallet authorizes agent', () => {
      const session = agent.requestAuthorization(wallet, ['credential', 'identity']);

      expect(session).toBeDefined();
      expect(session.agentId).toBe(agent.agentId);
      expect(session.walletDid).toBe(wallet.did);
      expect(session.scopes).toEqual(['credential', 'identity']);
      expect(session.active).toBe(true);
    });

    it('should set correct expiry (default 1 hour)', () => {
      const before = Date.now();
      const session = agent.requestAuthorization(wallet, ['credential']);
      const after = Date.now();

      // Default TTL = 3600_000ms (1 hour)
      expect(session.expiresAt).toBeGreaterThanOrEqual(before + 3600_000);
      expect(session.expiresAt).toBeLessThanOrEqual(after + 3600_000);
    });

    it('should support custom TTL', () => {
      const ttl = 600_000; // 10 min
      const session = agent.requestAuthorization(wallet, ['credential'], ttl);

      const expectedExpiry = session.createdAt + ttl;
      expect(session.expiresAt).toBe(expectedExpiry);
    });

    it('should store session on the agent', () => {
      agent.requestAuthorization(wallet, ['credential']);

      expect(agent.getSession()).toBeDefined();
      expect(agent.getSession()!.agentId).toBe(agent.agentId);
    });

    it('should validate session on the wallet side', () => {
      const session = agent.requestAuthorization(wallet, ['credential']);

      expect(wallet.isSessionValid(session.sessionId)).toBe(true);
    });

    it('should generate unique session IDs', () => {
      const s1 = wallet.authorizeAgent(agent.agentId, ['credential']);
      const s2 = wallet.authorizeAgent(agent.agentId, ['credential']);

      expect(s1.sessionId).not.toBe(s2.sessionId);
    });
  });

  // ──────────────────────────────────────────────────────
  // 2. Agent requests credential access
  // ──────────────────────────────────────────────────────
  describe('agent requests credential access', () => {
    beforeEach(() => {
      agent.requestAuthorization(wallet, ['credential']);
    });

    it('should succeed when scope matches', () => {
      const result = agent.requestCredentialAccess(wallet, 'credential:read', {
        credentialId: 'cred-123',
      });

      expect(result).not.toBeNull();
      expect(result!.signature).toBeTruthy();
      expect(result!.signedPayload).toBeTruthy();
    });

    it('should fail when scope does not match', () => {
      const result = agent.requestCredentialAccess(wallet, 'payment:send', {
        amount: 100,
      });

      expect(result).toBeNull();
    });

    it('should fail without an active session', () => {
      const orphanAgent = new MockOpenClawAgent();

      const result = orphanAgent.requestCredentialAccess(
        wallet,
        'credential:read',
        {},
      );

      expect(result).toBeNull();
    });

    it('should include session ID in signed payload', () => {
      const session = agent.getSession()!;
      const result = agent.requestCredentialAccess(wallet, 'credential:read', {
        credentialId: 'cred-123',
      });

      const payload = JSON.parse(result!.signedPayload);
      expect(payload.sessionId).toBe(session.sessionId);
    });

    it('should include timestamp in signed payload', () => {
      const before = Date.now();
      const result = agent.requestCredentialAccess(wallet, 'credential:read', {});
      const after = Date.now();

      const payload = JSON.parse(result!.signedPayload);
      expect(payload.timestamp).toBeGreaterThanOrEqual(before);
      expect(payload.timestamp).toBeLessThanOrEqual(after);
    });
  });

  // ──────────────────────────────────────────────────────
  // 3. Wallet signs agent request
  // ──────────────────────────────────────────────────────
  describe('wallet signs agent request', () => {
    beforeEach(() => {
      agent.requestAuthorization(wallet, ['credential']);
    });

    it('should produce a deterministic signature for the same payload', () => {
      const sig1 = wallet.sign('test-payload');
      const sig2 = wallet.sign('test-payload');

      expect(sig1).toBe(sig2);
    });

    it('should produce different signatures for different payloads', () => {
      const sig1 = wallet.sign('payload-a');
      const sig2 = wallet.sign('payload-b');

      expect(sig1).not.toBe(sig2);
    });

    it('should reject signing if session was revoked', () => {
      const session = agent.getSession()!;
      wallet.revokeSession(session.sessionId);

      const result = wallet.signAgentRequest(
        session.sessionId,
        'credential:read',
        {},
      );

      expect(result).toBeNull();
    });

    it('should reject signing for out-of-scope action', () => {
      const session = agent.getSession()!;

      const result = wallet.signAgentRequest(
        session.sessionId,
        'admin:delete',
        {},
      );

      expect(result).toBeNull();
    });

    it('should allow wildcard scope', () => {
      const wildcardSession = wallet.authorizeAgent(agent.agentId, ['*']);

      const result = wallet.signAgentRequest(
        wildcardSession.sessionId,
        'anything:goes',
        {},
      );

      expect(result).not.toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────
  // 4. Agent performs action with credential
  // ──────────────────────────────────────────────────────
  describe('agent performs action with credential', () => {
    beforeEach(() => {
      const cred = createTestCredential();
      wallet.addCredential(cred);
      agent.requestAuthorization(wallet, ['credential']);
    });

    it('should execute action with signed result', () => {
      const signed = agent.requestCredentialAccess(
        wallet,
        'credential:read',
        { credentialId: 'cred-1' },
      );

      const actionResult = agent.performAction(signed!, 'verify-identity');

      expect(actionResult.success).toBe(true);
      expect(actionResult.action).toBe('verify-identity');
      expect(actionResult.result).toContain('Executed verify-identity');
    });

    it('should include partial signature in result description', () => {
      const signed = agent.requestCredentialAccess(
        wallet,
        'credential:read',
        {},
      );

      const actionResult = agent.performAction(signed!, 'check-age');

      // Result contains "sig " (signature) from the mock agent
      expect(actionResult.result).toMatch(/sig[:\s]/);
    });
  });

  // ──────────────────────────────────────────────────────
  // 5. Session expiry and renewal
  // ──────────────────────────────────────────────────────
  describe('session expiry and renewal', () => {
    it('should mark session invalid after expiry', () => {
      // Create session with 0ms TTL (instantly expired)
      const session = wallet.authorizeAgent(agent.agentId, ['credential'], 0);

      expect(wallet.isSessionValid(session.sessionId)).toBe(false);
    });

    it('should reject requests after session expires', () => {
      const session = wallet.authorizeAgent(agent.agentId, ['credential'], 0);

      const result = wallet.signAgentRequest(
        session.sessionId,
        'credential:read',
        {},
      );

      expect(result).toBeNull();
    });

    it('should renew an expired session', () => {
      const session = wallet.authorizeAgent(agent.agentId, ['credential'], 0);

      // Session is expired
      expect(wallet.isSessionValid(session.sessionId)).toBe(false);

      // Renew
      const renewed = wallet.renewSession(session.sessionId, 3600_000);

      expect(renewed).not.toBeNull();
      expect(renewed!.active).toBe(true);
      expect(wallet.isSessionValid(session.sessionId)).toBe(true);
    });

    it('should extend expiry on renewal', () => {
      const session = wallet.authorizeAgent(agent.agentId, ['credential'], 1000);
      const originalExpiry = session.expiresAt;

      const renewed = wallet.renewSession(session.sessionId, 7200_000);

      expect(renewed!.expiresAt).toBeGreaterThan(originalExpiry);
    });

    it('should return null when renewing unknown session', () => {
      const result = wallet.renewSession('nonexistent-session');

      expect(result).toBeNull();
    });

    it('should allow requests after renewal', () => {
      const session = wallet.authorizeAgent(agent.agentId, ['credential'], 0);

      // Expired — request fails
      expect(
        wallet.signAgentRequest(session.sessionId, 'credential:read', {}),
      ).toBeNull();

      // Renew
      wallet.renewSession(session.sessionId, 3600_000);

      // Now request succeeds
      const result = wallet.signAgentRequest(
        session.sessionId,
        'credential:read',
        {},
      );
      expect(result).not.toBeNull();
    });
  });
});
