/**
 * @module CredentialGrant
 * Manages agent access grants to verifiable credentials.
 *
 * A grant binds an agent to a specific credential with a set of permissions
 * (read, present, derive). Grants can be time-limited and revoked.
 */
import { cryptoWaitReady, randomAsHex } from '@polkadot/util-crypto';
import { PermissionLevel } from './types.js';

/** Valid permission values */
const VALID_PERMISSIONS = new Set([
  PermissionLevel.READ,
  PermissionLevel.PRESENT,
  PermissionLevel.DERIVE,
]);

/**
 * CredentialGrantManager controls which agents can access which credentials.
 *
 * @example
 * ```js
 * const grants = new CredentialGrantManager();
 * await grants.init();
 * const grant = grants.grantCredentialAccess(credId, agentId, ['read', 'present']);
 * const access = grants.checkAccess(agentId, credId);
 * ```
 */
export class CredentialGrantManager {
  grants = new Map();
  ready = false;

  /**
   * Initialise the WASM crypto backend.
   * Must be called before any grant operations.
   */
  async init() {
    if (this.ready) return;
    await cryptoWaitReady();
    this.ready = true;
  }

  ensureReady() {
    if (!this.ready) {
      throw new Error('CredentialGrantManager not initialised — call init() first');
    }
  }

  /**
   * Grant an agent access to a credential.
   *
   * @param {string} credentialId - The credential ID on DDC
   * @param {string} agentId - The agent being granted access
   * @param {string[]} permissions - Array of permission levels ('read', 'present', 'derive')
   * @param {object} [options] - Optional grant configuration
   * @param {number} [options.ttlMs] - Grant lifetime in ms (default: no expiry)
   * @param {string} [options.grantedBy] - Wallet address of the grantor
   * @returns {{ id: string, credentialId: string, agentId: string, permissions: string[], createdAt: string, expiresAt: string|null, revoked: boolean }}
   */
  grantCredentialAccess(credentialId, agentId, permissions, options = {}) {
    this.ensureReady();

    if (!credentialId || typeof credentialId !== 'string') {
      throw new Error('credentialId is required');
    }
    if (!agentId || typeof agentId !== 'string') {
      throw new Error('agentId is required');
    }
    if (!Array.isArray(permissions) || permissions.length === 0) {
      throw new Error('permissions must be a non-empty array');
    }

    // Validate all permissions
    for (const perm of permissions) {
      if (!VALID_PERMISSIONS.has(perm)) {
        throw new Error(`Invalid permission: ${perm}. Valid: ${[...VALID_PERMISSIONS].join(', ')}`);
      }
    }

    const id = randomAsHex(16);
    const createdAt = new Date().toISOString();
    const expiresAt = options.ttlMs
      ? new Date(Date.now() + options.ttlMs).toISOString()
      : null;

    const grant = {
      id,
      credentialId,
      agentId,
      permissions: [...new Set(permissions)], // deduplicate
      grantedBy: options.grantedBy || null,
      createdAt,
      expiresAt,
      revoked: false,
    };

    // Key by agentId:credentialId for fast lookup
    const key = `${agentId}:${credentialId}`;
    this.grants.set(key, grant);

    return grant;
  }

  /**
   * Check whether an agent has access to a credential.
   *
   * @param {string} agentId - The agent ID to check
   * @param {string} credentialId - The credential ID to check
   * @param {string} [requiredPermission] - Optionally check for a specific permission
   * @returns {{ granted: boolean, permissions: string[], error?: string }}
   */
  checkAccess(agentId, credentialId, requiredPermission) {
    this.ensureReady();

    const key = `${agentId}:${credentialId}`;
    const grant = this.grants.get(key);

    if (!grant) {
      return { granted: false, permissions: [], error: 'No grant found' };
    }

    if (grant.revoked) {
      return { granted: false, permissions: [], error: 'Grant has been revoked' };
    }

    // Check expiry
    if (grant.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(grant.expiresAt);
      if (now > expiresAt) {
        return { granted: false, permissions: [], error: 'Grant has expired' };
      }
    }

    // Check specific permission if requested
    if (requiredPermission && !grant.permissions.includes(requiredPermission)) {
      return {
        granted: false,
        permissions: grant.permissions,
        error: `Missing required permission: ${requiredPermission}`,
      };
    }

    return { granted: true, permissions: grant.permissions };
  }

  /**
   * Revoke an agent's access to a credential.
   *
   * @param {string} agentId - The agent ID
   * @param {string} credentialId - The credential ID
   * @returns {boolean} true if revoked, false if grant not found
   */
  revokeAccess(agentId, credentialId) {
    this.ensureReady();

    const key = `${agentId}:${credentialId}`;
    const grant = this.grants.get(key);

    if (!grant) {
      return false;
    }

    grant.revoked = true;
    return true;
  }

  /**
   * Get all grants for an agent.
   *
   * @param {string} agentId - The agent ID to query
   * @returns {object[]} Array of active grants
   */
  getGrantsForAgent(agentId) {
    this.ensureReady();
    const now = new Date();
    return Array.from(this.grants.values()).filter(
      g =>
        g.agentId === agentId &&
        !g.revoked &&
        (!g.expiresAt || new Date(g.expiresAt) > now),
    );
  }

  /** Number of stored grants */
  get size() {
    return this.grants.size;
  }

  /** Clear all grants */
  clear() {
    this.grants.clear();
  }
}
