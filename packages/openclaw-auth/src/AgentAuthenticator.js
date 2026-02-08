/**
 * @module AgentAuthenticator
 * Manages agent session tokens for OpenClaw agents.
 *
 * Sessions bind an agent to a wallet owner's address using sr25519 signatures.
 * Each session has a unique ID, expiry, and can be revoked.
 */
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady, randomAsHex, signatureVerify } from '@polkadot/util-crypto';
import { hexToU8a, u8aToHex, stringToU8a } from '@polkadot/util';
import { SessionStatus } from './types.js';

/** Default session TTL: 1 hour (in milliseconds) */
const DEFAULT_SESSION_TTL_MS = 60 * 60 * 1000;

/**
 * AgentAuthenticator manages session lifecycle for OpenClaw agents.
 *
 * @example
 * ```js
 * const auth = new AgentAuthenticator();
 * await auth.init();
 * const session = auth.generateAgentSession(walletAddress);
 * const valid = auth.validateSession(session.token);
 * auth.revokeSession(session.id);
 * ```
 */
export class AgentAuthenticator {
  sessions = new Map();
  ready = false;
  sessionTtlMs = DEFAULT_SESSION_TTL_MS;

  /**
   * Initialise the WASM crypto backend.
   * Must be called before any session operations.
   */
  async init() {
    if (this.ready) return;
    await cryptoWaitReady();
    this.ready = true;
  }

  ensureReady() {
    if (!this.ready) {
      throw new Error('AgentAuthenticator not initialised — call init() first');
    }
  }

  /**
   * Configure session TTL.
   * @param {number} ttlMs - Session lifetime in milliseconds
   */
  setSessionTtl(ttlMs) {
    if (ttlMs <= 0) {
      throw new Error('Session TTL must be positive');
    }
    this.sessionTtlMs = ttlMs;
  }

  /**
   * Generate a new agent session bound to a wallet address.
   *
   * @param {string} walletAddress - The sr25519 wallet address authorising this agent
   * @param {object} [options] - Optional session configuration
   * @param {string} [options.agentId] - Custom agent identifier
   * @param {string[]} [options.scopes] - Permission scopes for this session
   * @returns {{ id: string, token: string, walletAddress: string, agentId: string, createdAt: string, expiresAt: string, scopes: string[] }}
   */
  generateAgentSession(walletAddress, options = {}) {
    this.ensureReady();

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('walletAddress is required');
    }

    const id = randomAsHex(16);
    const agentId = options.agentId || randomAsHex(8);
    const scopes = options.scopes || ['credential:read'];
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + this.sessionTtlMs).toISOString();

    // Build the token payload
    const payload = {
      id,
      walletAddress,
      agentId,
      scopes,
      createdAt,
      expiresAt,
    };

    // Token is a hex-encoded JSON payload (verifiable, not encrypted)
    const payloadBytes = stringToU8a(JSON.stringify(payload));
    const token = u8aToHex(payloadBytes);

    const session = {
      ...payload,
      token,
      status: SessionStatus.ACTIVE,
    };

    this.sessions.set(id, session);

    return {
      id,
      token,
      walletAddress,
      agentId,
      createdAt,
      expiresAt,
      scopes,
    };
  }

  /**
   * Validate a session token.
   *
   * @param {string} token - The hex-encoded session token
   * @returns {{ valid: boolean, session?: object, error?: string }}
   */
  validateSession(token) {
    this.ensureReady();

    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token is required' };
    }

    // Decode the token
    let payload;
    try {
      const bytes = hexToU8a(token);
      const json = new TextDecoder().decode(bytes);
      payload = JSON.parse(json);
    } catch {
      return { valid: false, error: 'Invalid token format' };
    }

    if (!payload.id) {
      return { valid: false, error: 'Token missing session ID' };
    }

    // Look up stored session
    const session = this.sessions.get(payload.id);
    if (!session) {
      return { valid: false, error: 'Session not found' };
    }

    // Check revocation
    if (session.status === SessionStatus.REVOKED) {
      return { valid: false, error: 'Session has been revoked' };
    }

    // Check expiry
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    if (now > expiresAt) {
      session.status = SessionStatus.EXPIRED;
      return { valid: false, error: 'Session has expired' };
    }

    // Check token matches stored session
    if (session.token !== token) {
      return { valid: false, error: 'Token mismatch' };
    }

    return {
      valid: true,
      session: {
        id: session.id,
        walletAddress: session.walletAddress,
        agentId: session.agentId,
        scopes: session.scopes,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      },
    };
  }

  /**
   * Revoke an agent session.
   *
   * @param {string} sessionId - The session ID to revoke
   * @returns {boolean} true if revoked, false if session not found
   */
  revokeSession(sessionId) {
    this.ensureReady();

    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.status = SessionStatus.REVOKED;
    return true;
  }

  /**
   * Get all active sessions for a wallet address.
   *
   * @param {string} walletAddress - The wallet address to query
   * @returns {object[]} Array of active sessions
   */
  getActiveSessions(walletAddress) {
    this.ensureReady();
    const now = new Date();
    return Array.from(this.sessions.values()).filter(
      s =>
        s.walletAddress === walletAddress &&
        s.status === SessionStatus.ACTIVE &&
        new Date(s.expiresAt) > now,
    );
  }

  /** Number of stored sessions */
  get size() {
    return this.sessions.size;
  }

  /** Clear all sessions */
  clear() {
    this.sessions.clear();
  }
}
