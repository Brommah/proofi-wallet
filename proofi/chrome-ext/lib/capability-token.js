/**
 * Proofi Capability Token Engine
 * 
 * Core innovation: User-controlled access tokens for agent data access.
 * 
 * Token Structure:
 * {
 *   issuer: string;           // user's wallet address
 *   grantee: string;          // agent's public key
 *   scope: string[];          // ["health/*", "prefs/theme"]
 *   permissions: string[];    // ["read", "write", "append"]
 *   expiry: number;           // unix timestamp
 *   wrappedDEK: string;       // DEK encrypted with grantee's pubkey
 *   signature: string;        // signed by issuer
 * }
 */

const CapabilityTokenEngine = (() => {
  // ── Constants ────────────────────────────────────────────────────

  const STORAGE_KEY = 'proofi_tokens';
  const TOKEN_VERSION = 1;

  // ── Duration Presets ─────────────────────────────────────────────

  const DURATION_PRESETS = {
    '1h':   60 * 60 * 1000,
    '24h':  24 * 60 * 60 * 1000,
    '7d':   7 * 24 * 60 * 60 * 1000,
    '30d':  30 * 24 * 60 * 60 * 1000,
    '90d':  90 * 24 * 60 * 60 * 1000,
    '1y':   365 * 24 * 60 * 60 * 1000,
  };

  // ── Scope Presets ────────────────────────────────────────────────

  const SCOPE_PRESETS = {
    'health': {
      label: 'Health Data',
      icon: '❤️',
      scopes: ['health/*'],
      description: 'Heart rate, steps, sleep, workouts',
    },
    'prefs': {
      label: 'Preferences',
      icon: '⚙️',
      scopes: ['prefs/*'],
      description: 'Theme, language, notification settings',
    },
    'identity': {
      label: 'Identity',
      icon: '🆔',
      scopes: ['identity/basic'],
      description: 'Name, email (not private keys)',
    },
    'credentials': {
      label: 'Credentials',
      icon: '📜',
      scopes: ['credentials/*'],
      description: 'Verifiable credentials and badges',
    },
    'social': {
      label: 'Social',
      icon: '👥',
      scopes: ['social/*'],
      description: 'Connections, reputation scores',
    },
    'financial': {
      label: 'Financial',
      icon: '💰',
      scopes: ['financial/summary'],
      description: 'Balance summaries (not transactions)',
    },
  };

  // ── State ────────────────────────────────────────────────────────

  let tokenCache = null;

  // ── Token Storage ────────────────────────────────────────────────

  async function loadTokens() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      tokenCache = result[STORAGE_KEY] || { tokens: [], revokedTokenIds: [] };
      return tokenCache;
    } catch (e) {
      console.error('[TokenEngine] Failed to load tokens:', e);
      tokenCache = { tokens: [], revokedTokenIds: [] };
      return tokenCache;
    }
  }

  async function saveTokens() {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: tokenCache });
    } catch (e) {
      console.error('[TokenEngine] Failed to save tokens:', e);
      throw e;
    }
  }

  // ── Generate Token ID ────────────────────────────────────────────

  async function generateTokenId() {
    const random = CryptoUtils.randomBytes(16);
    const timestamp = Date.now().toString(16);
    return `tok_${timestamp}_${CryptoUtils.bytesToHex(random).slice(0, 16)}`;
  }

  // ── Create Capability Token ──────────────────────────────────────

  async function createToken({
    granteePublicKey,
    granteeName = 'Unknown Agent',
    scope = [],
    permissions = ['read'],
    duration = '24h',
    expiryTimestamp = null,
  }) {
    await loadTokens();

    // Calculate expiry
    const now = Date.now();
    const expiry = expiryTimestamp || (now + (DURATION_PRESETS[duration] || DURATION_PRESETS['24h']));

    // Get issuer (user's wallet address)
    const issuer = await KeyManager.getWalletAddress();

    // Generate token ID
    const tokenId = await generateTokenId();

    // Derive DEKs for each scope and wrap them
    const wrappedDEKs = {};
    for (const scopePath of scope) {
      // For wildcard scopes, use the base path
      const basePath = scopePath.replace(/\/\*$/, '');
      const dek = await KeyManager.deriveDEKForResource(basePath);
      wrappedDEKs[scopePath] = await KeyManager.wrapDEKForGrantee(dek.hex, granteePublicKey);
    }

    // Create token payload (without signature)
    const tokenPayload = {
      version: TOKEN_VERSION,
      tokenId,
      issuer,
      grantee: granteePublicKey,
      granteeName,
      scope,
      permissions,
      expiry,
      wrappedDEKs,
      createdAt: now,
    };

    // Sign the token
    const signaturePayload = JSON.stringify({
      tokenId: tokenPayload.tokenId,
      issuer: tokenPayload.issuer,
      grantee: tokenPayload.grantee,
      scope: tokenPayload.scope,
      permissions: tokenPayload.permissions,
      expiry: tokenPayload.expiry,
    });
    
    const signature = await KeyManager.signMessage(signaturePayload);

    // Complete token
    const token = {
      ...tokenPayload,
      signature,
    };

    // Store token
    tokenCache.tokens.push({
      ...token,
      status: 'active',
    });

    await saveTokens();

    console.log('[TokenEngine] Token created:', tokenId);
    return token;
  }

  // ── Get Active Tokens ────────────────────────────────────────────

  async function getActiveTokens() {
    await loadTokens();
    const now = Date.now();
    
    return tokenCache.tokens.filter(t => 
      t.status === 'active' && 
      t.expiry > now &&
      !tokenCache.revokedTokenIds.includes(t.tokenId)
    );
  }

  // ── Get All Tokens ───────────────────────────────────────────────

  async function getAllTokens() {
    await loadTokens();
    const now = Date.now();
    
    return tokenCache.tokens.map(t => ({
      ...t,
      isExpired: t.expiry <= now,
      isRevoked: tokenCache.revokedTokenIds.includes(t.tokenId),
    }));
  }

  // ── Get Token by ID ──────────────────────────────────────────────

  async function getToken(tokenId) {
    await loadTokens();
    return tokenCache.tokens.find(t => t.tokenId === tokenId);
  }

  // ── Get Tokens for Grantee ───────────────────────────────────────

  async function getTokensForGrantee(granteePublicKey) {
    await loadTokens();
    const now = Date.now();
    
    return tokenCache.tokens.filter(t => 
      t.grantee === granteePublicKey &&
      t.status === 'active' &&
      t.expiry > now &&
      !tokenCache.revokedTokenIds.includes(t.tokenId)
    );
  }

  // ── Revoke Token ─────────────────────────────────────────────────

  async function revokeToken(tokenId, regenerateDEKs = false) {
    await loadTokens();

    const tokenIndex = tokenCache.tokens.findIndex(t => t.tokenId === tokenId);
    if (tokenIndex === -1) {
      throw new Error(`Token not found: ${tokenId}`);
    }

    // Mark as revoked
    tokenCache.tokens[tokenIndex].status = 'revoked';
    tokenCache.tokens[tokenIndex].revokedAt = Date.now();
    tokenCache.revokedTokenIds.push(tokenId);

    // Optionally regenerate master key (invalidates all DEKs)
    if (regenerateDEKs) {
      await KeyManager.regenerateMasterKey();
      console.log('[TokenEngine] Master key regenerated - all existing DEKs invalidated');
    }

    await saveTokens();
    console.log('[TokenEngine] Token revoked:', tokenId);

    return true;
  }

  // ── Revoke All Tokens for Grantee ────────────────────────────────

  async function revokeAllForGrantee(granteePublicKey, regenerateDEKs = false) {
    await loadTokens();
    const now = Date.now();
    let revokedCount = 0;

    for (const token of tokenCache.tokens) {
      if (token.grantee === granteePublicKey && token.status === 'active') {
        token.status = 'revoked';
        token.revokedAt = now;
        tokenCache.revokedTokenIds.push(token.tokenId);
        revokedCount++;
      }
    }

    if (regenerateDEKs && revokedCount > 0) {
      await KeyManager.regenerateMasterKey();
    }

    await saveTokens();
    console.log(`[TokenEngine] Revoked ${revokedCount} tokens for grantee`);

    return revokedCount;
  }

  // ── Export Token (for giving to agent) ───────────────────────────

  async function exportToken(tokenId) {
    const token = await getToken(tokenId);
    if (!token) {
      throw new Error(`Token not found: ${tokenId}`);
    }

    // Check if valid
    if (token.status !== 'active') {
      throw new Error('Token is not active');
    }
    if (token.expiry <= Date.now()) {
      throw new Error('Token has expired');
    }
    if (tokenCache.revokedTokenIds.includes(token.tokenId)) {
      throw new Error('Token has been revoked');
    }

    // Create export format
    const exportData = {
      version: token.version,
      tokenId: token.tokenId,
      issuer: token.issuer,
      grantee: token.grantee,
      scope: token.scope,
      permissions: token.permissions,
      expiry: token.expiry,
      wrappedDEKs: token.wrappedDEKs,
      signature: token.signature,
      exportedAt: Date.now(),
    };

    // Encode as base64 for easy transport
    return CryptoUtils.arrayBufferToBase64(
      new TextEncoder().encode(JSON.stringify(exportData))
    );
  }

  // ── Parse Token (for agent receiving token) ──────────────────────

  function parseToken(tokenBase64) {
    try {
      const tokenBytes = CryptoUtils.base64ToArrayBuffer(tokenBase64);
      return JSON.parse(new TextDecoder().decode(new Uint8Array(tokenBytes)));
    } catch (e) {
      throw new Error('Invalid token format');
    }
  }

  // ── Verify Token Signature ───────────────────────────────────────

  async function verifyToken(token, issuerPublicKeyHex) {
    const signaturePayload = JSON.stringify({
      tokenId: token.tokenId,
      issuer: token.issuer,
      grantee: token.grantee,
      scope: token.scope,
      permissions: token.permissions,
      expiry: token.expiry,
    });

    const publicKey = await CryptoUtils.importSigningPublicKey(issuerPublicKeyHex);
    return await CryptoUtils.verify(signaturePayload, token.signature, publicKey);
  }

  // ── Check Token Permissions ──────────────────────────────────────

  function checkPermission(token, requiredScope, requiredPermission) {
    // Check expiry
    if (token.expiry <= Date.now()) {
      return { allowed: false, reason: 'Token expired' };
    }

    // Check permission
    if (!token.permissions.includes(requiredPermission)) {
      return { allowed: false, reason: `Permission '${requiredPermission}' not granted` };
    }

    // Check scope
    const scopeMatch = token.scope.some(s => {
      if (s.endsWith('/*')) {
        // Wildcard scope
        const base = s.slice(0, -2);
        return requiredScope.startsWith(base);
      }
      return s === requiredScope;
    });

    if (!scopeMatch) {
      return { allowed: false, reason: `Scope '${requiredScope}' not granted` };
    }

    return { allowed: true };
  }

  // ── Cleanup Expired Tokens ───────────────────────────────────────

  async function cleanupExpired() {
    await loadTokens();
    const now = Date.now();
    const expiredCount = tokenCache.tokens.filter(t => 
      t.status === 'active' && t.expiry <= now
    ).length;

    // Mark expired tokens
    for (const token of tokenCache.tokens) {
      if (token.status === 'active' && token.expiry <= now) {
        token.status = 'expired';
        token.expiredAt = now;
      }
    }

    // Remove very old tokens (> 90 days old)
    const cutoff = now - (90 * 24 * 60 * 60 * 1000);
    const initialLength = tokenCache.tokens.length;
    tokenCache.tokens = tokenCache.tokens.filter(t => 
      t.createdAt > cutoff || t.status === 'active'
    );
    const removedCount = initialLength - tokenCache.tokens.length;

    await saveTokens();

    console.log(`[TokenEngine] Cleanup: ${expiredCount} expired, ${removedCount} removed`);
    return { expiredCount, removedCount };
  }

  // ── Statistics ───────────────────────────────────────────────────

  async function getStats() {
    await loadTokens();
    const now = Date.now();

    const active = tokenCache.tokens.filter(t => 
      t.status === 'active' && t.expiry > now
    ).length;

    const expired = tokenCache.tokens.filter(t => 
      t.status === 'expired' || (t.status === 'active' && t.expiry <= now)
    ).length;

    const revoked = tokenCache.tokens.filter(t => 
      t.status === 'revoked'
    ).length;

    const uniqueGrantees = new Set(
      tokenCache.tokens
        .filter(t => t.status === 'active' && t.expiry > now)
        .map(t => t.grantee)
    ).size;

    return {
      total: tokenCache.tokens.length,
      active,
      expired,
      revoked,
      uniqueGrantees,
    };
  }

  // ── Public API ───────────────────────────────────────────────────

  return {
    // Presets
    DURATION_PRESETS,
    SCOPE_PRESETS,

    // Token CRUD
    createToken,
    getToken,
    getActiveTokens,
    getAllTokens,
    getTokensForGrantee,

    // Revocation
    revokeToken,
    revokeAllForGrantee,

    // Export/Import
    exportToken,
    parseToken,

    // Verification
    verifyToken,
    checkPermission,

    // Maintenance
    cleanupExpired,
    getStats,
  };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CapabilityTokenEngine;
}
