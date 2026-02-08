import { describe, it, expect, beforeEach } from 'vitest';
import { CredentialGrantManager } from '../CredentialGrant.js';
import { PermissionLevel } from '../types.js';

describe('CredentialGrantManager', () => {
  let grants;
  const agentId = 'agent-001';
  const credentialId = 'cred-abc-123';

  beforeEach(async () => {
    grants = new CredentialGrantManager();
    await grants.init();
  });

  // ── Initialisation ──────────────────────────────────────────────────────
  describe('init', () => {
    it('throws if not initialised', () => {
      const uninit = new CredentialGrantManager();
      expect(() => uninit.grantCredentialAccess(credentialId, agentId, ['read'])).toThrow(
        'not initialised',
      );
    });
  });

  // ── Grant creation ──────────────────────────────────────────────────────
  describe('grantCredentialAccess', () => {
    it('creates a grant with all required fields', () => {
      const grant = grants.grantCredentialAccess(credentialId, agentId, ['read']);
      expect(grant.id).toMatch(/^0x[0-9a-f]+$/);
      expect(grant.credentialId).toBe(credentialId);
      expect(grant.agentId).toBe(agentId);
      expect(grant.permissions).toEqual(['read']);
      expect(grant.createdAt).toBeTruthy();
      expect(grant.expiresAt).toBeNull();
      expect(grant.revoked).toBe(false);
    });

    it('accepts multiple permissions', () => {
      const grant = grants.grantCredentialAccess(credentialId, agentId, ['read', 'present', 'derive']);
      expect(grant.permissions).toEqual(['read', 'present', 'derive']);
    });

    it('deduplicates permissions', () => {
      const grant = grants.grantCredentialAccess(credentialId, agentId, ['read', 'read', 'present']);
      expect(grant.permissions).toEqual(['read', 'present']);
    });

    it('accepts optional TTL', () => {
      const grant = grants.grantCredentialAccess(credentialId, agentId, ['read'], {
        ttlMs: 60000,
      });
      expect(grant.expiresAt).toBeTruthy();
      const expiresAt = new Date(grant.expiresAt);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('accepts grantedBy option', () => {
      const grant = grants.grantCredentialAccess(credentialId, agentId, ['read'], {
        grantedBy: '5WalletAddress',
      });
      expect(grant.grantedBy).toBe('5WalletAddress');
    });

    it('throws on empty credentialId', () => {
      expect(() => grants.grantCredentialAccess('', agentId, ['read'])).toThrow(
        'credentialId is required',
      );
    });

    it('throws on empty agentId', () => {
      expect(() => grants.grantCredentialAccess(credentialId, '', ['read'])).toThrow(
        'agentId is required',
      );
    });

    it('throws on empty permissions array', () => {
      expect(() => grants.grantCredentialAccess(credentialId, agentId, [])).toThrow(
        'permissions must be a non-empty array',
      );
    });

    it('throws on invalid permission', () => {
      expect(() =>
        grants.grantCredentialAccess(credentialId, agentId, ['read', 'delete']),
      ).toThrow('Invalid permission: delete');
    });

    it('overwrites previous grant for same agent+credential', () => {
      grants.grantCredentialAccess(credentialId, agentId, ['read']);
      grants.grantCredentialAccess(credentialId, agentId, ['read', 'present']);
      expect(grants.size).toBe(1);
      const access = grants.checkAccess(agentId, credentialId);
      expect(access.permissions).toEqual(['read', 'present']);
    });
  });

  // ── Access checks ───────────────────────────────────────────────────────
  describe('checkAccess', () => {
    it('returns granted for valid grant', () => {
      grants.grantCredentialAccess(credentialId, agentId, ['read', 'present']);
      const result = grants.checkAccess(agentId, credentialId);
      expect(result.granted).toBe(true);
      expect(result.permissions).toEqual(['read', 'present']);
    });

    it('returns not granted for unknown agent', () => {
      const result = grants.checkAccess('unknown-agent', credentialId);
      expect(result.granted).toBe(false);
      expect(result.error).toBe('No grant found');
    });

    it('returns not granted for unknown credential', () => {
      grants.grantCredentialAccess(credentialId, agentId, ['read']);
      const result = grants.checkAccess(agentId, 'other-cred');
      expect(result.granted).toBe(false);
      expect(result.error).toBe('No grant found');
    });

    it('checks specific permission', () => {
      grants.grantCredentialAccess(credentialId, agentId, ['read']);
      const readResult = grants.checkAccess(agentId, credentialId, 'read');
      expect(readResult.granted).toBe(true);

      const deriveResult = grants.checkAccess(agentId, credentialId, 'derive');
      expect(deriveResult.granted).toBe(false);
      expect(deriveResult.error).toBe('Missing required permission: derive');
    });

    it('rejects revoked grant', () => {
      grants.grantCredentialAccess(credentialId, agentId, ['read']);
      grants.revokeAccess(agentId, credentialId);
      const result = grants.checkAccess(agentId, credentialId);
      expect(result.granted).toBe(false);
      expect(result.error).toBe('Grant has been revoked');
    });

    it('rejects expired grant', () => {
      grants.grantCredentialAccess(credentialId, agentId, ['read'], { ttlMs: 1 });

      // Wait for expiry
      const start = Date.now();
      while (Date.now() - start < 10) { /* spin */ }

      const result = grants.checkAccess(agentId, credentialId);
      expect(result.granted).toBe(false);
      expect(result.error).toBe('Grant has expired');
    });
  });

  // ── Revocation ──────────────────────────────────────────────────────────
  describe('revokeAccess', () => {
    it('revokes an existing grant', () => {
      grants.grantCredentialAccess(credentialId, agentId, ['read']);
      const revoked = grants.revokeAccess(agentId, credentialId);
      expect(revoked).toBe(true);
    });

    it('returns false for unknown grant', () => {
      const revoked = grants.revokeAccess('unknown', 'unknown');
      expect(revoked).toBe(false);
    });
  });

  // ── Agent grants query ──────────────────────────────────────────────────
  describe('getGrantsForAgent', () => {
    it('returns all active grants for an agent', () => {
      grants.grantCredentialAccess('cred-1', agentId, ['read']);
      grants.grantCredentialAccess('cred-2', agentId, ['read', 'present']);
      const agentGrants = grants.getGrantsForAgent(agentId);
      expect(agentGrants).toHaveLength(2);
    });

    it('excludes revoked grants', () => {
      grants.grantCredentialAccess('cred-1', agentId, ['read']);
      grants.grantCredentialAccess('cred-2', agentId, ['read']);
      grants.revokeAccess(agentId, 'cred-1');
      const agentGrants = grants.getGrantsForAgent(agentId);
      expect(agentGrants).toHaveLength(1);
    });

    it('returns empty for unknown agent', () => {
      const agentGrants = grants.getGrantsForAgent('unknown');
      expect(agentGrants).toHaveLength(0);
    });
  });

  // ── Permission constants ────────────────────────────────────────────────
  describe('PermissionLevel', () => {
    it('exports expected values', () => {
      expect(PermissionLevel.READ).toBe('read');
      expect(PermissionLevel.PRESENT).toBe('present');
      expect(PermissionLevel.DERIVE).toBe('derive');
    });
  });

  // ── Cleanup ─────────────────────────────────────────────────────────────
  describe('clear', () => {
    it('removes all grants', () => {
      grants.grantCredentialAccess('cred-1', agentId, ['read']);
      grants.grantCredentialAccess('cred-2', agentId, ['present']);
      expect(grants.size).toBe(2);
      grants.clear();
      expect(grants.size).toBe(0);
    });
  });
});
