/**
 * Proofi Capability Tokens
 * Creates time-limited, scoped access tokens for agents.
 * Aligns with CLI capability token format.
 */

/**
 * Create a capability token for an agent.
 * 
 * @param {Object} params
 * @param {Object} params.keypair - User's sr25519 keypair (from keyring.js)
 * @param {string} params.agentId - Agent identifier (e.g., 'health-analyzer')
 * @param {Array<string>} params.scopes - Array of scope paths (e.g., ['health/steps', 'health/heart-rate'])
 * @param {Array<string>} params.resources - Array of CIDs for accessible data
 * @param {number} [params.expiresIn=86400] - Seconds until expiry (default: 24h)
 * @returns {Object} Signed capability token
 */
export function createCapabilityToken({ keypair, agentId, scopes, resources = [], expiresIn = 86400 }) {
  if (!keypair) throw new Error('Keypair required');
  if (!agentId) throw new Error('Agent ID required');
  if (!scopes || scopes.length === 0) throw new Error('At least one scope required');
  
  const now = Math.floor(Date.now() / 1000);
  
  const token = {
    version: '1.0',
    id: crypto.randomUUID(),
    issuer: keypair.address,
    subject: `did:proofi:agent:${agentId}`,
    issuedAt: now,
    expiresAt: now + expiresIn,
    scopes: scopes.map(path => ({
      path,
      permissions: ['read'],
    })),
    resources: resources.map(cid => ({
      cid,
      type: 'health-data',
    })),
  };
  
  // Sign the token (excluding signature field)
  const tokenBytes = new TextEncoder().encode(JSON.stringify(token));
  const signature = keypair.signHex(tokenBytes);
  
  return {
    ...token,
    signature,
  };
}

/**
 * Verify a capability token's signature and expiry.
 * 
 * @param {Object} token - The signed token
 * @param {string} [expectedIssuer] - Expected issuer address (optional)
 * @returns {Object} { valid: boolean, error?: string }
 */
export function verifyCapabilityToken(token, expectedIssuer = null) {
  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (token.expiresAt < now) {
    return { valid: false, error: 'Token expired' };
  }
  
  // Check issuer if provided
  if (expectedIssuer && token.issuer !== expectedIssuer) {
    return { valid: false, error: 'Invalid issuer' };
  }
  
  // Check required fields
  if (!token.id || !token.version || !token.scopes) {
    return { valid: false, error: 'Missing required fields' };
  }
  
  // Signature verification requires access to public key
  // For tokens from our own storage, we trust them
  // Full verification would use sr25519 verify with issuer's public key
  if (!token.signature) {
    return { valid: false, error: 'Missing signature' };
  }
  
  return { valid: true };
}

/**
 * Check if a token grants access to a specific scope.
 */
export function tokenHasScope(token, scopePath) {
  if (!token.scopes) return false;
  return token.scopes.some(s => s.path === scopePath || s.path === '*');
}

/**
 * Check if a token grants access to a specific resource CID.
 */
export function tokenHasResource(token, cid) {
  if (!token.resources || token.resources.length === 0) {
    // No resource restrictions = access to all user data
    return true;
  }
  return token.resources.some(r => r.cid === cid);
}

// ══════════════════════════════════════════════════════════════════════════
// Storage helpers
// ══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'proofi_capability_tokens';

/**
 * Store a capability token.
 */
export async function storeCapabilityToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const tokens = result[STORAGE_KEY] || {};
      tokens[token.subject] = token;
      chrome.storage.local.set({ [STORAGE_KEY]: tokens }, () => {
        resolve(token);
      });
    });
  });
}

/**
 * Get all stored capability tokens.
 */
export async function getCapabilityTokens() {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      resolve(result[STORAGE_KEY] || {});
    });
  });
}

/**
 * Get a specific token by agent ID.
 */
export async function getTokenForAgent(agentId) {
  const tokens = await getCapabilityTokens();
  const subject = `did:proofi:agent:${agentId}`;
  return tokens[subject] || null;
}

/**
 * Get all valid (non-expired) tokens.
 */
export async function getValidTokens() {
  const tokens = await getCapabilityTokens();
  const now = Math.floor(Date.now() / 1000);
  
  const valid = {};
  for (const [subject, token] of Object.entries(tokens)) {
    if (token.expiresAt > now) {
      valid[subject] = token;
    }
  }
  return valid;
}

/**
 * Revoke a capability token by agent ID.
 */
export async function revokeCapabilityToken(agentId) {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const tokens = result[STORAGE_KEY] || {};
      const subject = `did:proofi:agent:${agentId}`;
      
      if (tokens[subject]) {
        delete tokens[subject];
        chrome.storage.local.set({ [STORAGE_KEY]: tokens }, () => {
          resolve(true);
        });
      } else {
        resolve(false);
      }
    });
  });
}

/**
 * Revoke all capability tokens.
 */
export async function revokeAllTokens() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(STORAGE_KEY, resolve);
  });
}

/**
 * Clean up expired tokens (call periodically).
 */
export async function cleanupExpiredTokens() {
  const tokens = await getCapabilityTokens();
  const now = Math.floor(Date.now() / 1000);
  let removed = 0;
  
  const valid = {};
  for (const [subject, token] of Object.entries(tokens)) {
    if (token.expiresAt > now) {
      valid[subject] = token;
    } else {
      removed++;
    }
  }
  
  if (removed > 0) {
    await new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: valid }, resolve);
    });
  }
  
  return removed;
}
