/**
 * Token Revocation Module
 * 
 * Checks token revocation status before allowing data access.
 * Agents MUST check revocation before using any capability token.
 */

import type { CapabilityToken } from '../types';
import { InvalidTokenError } from '../errors';

/** Revocation registry configuration */
export interface RevocationConfig {
  /** API endpoint for revocation checks */
  endpoint: string;
  /** Cache TTL in milliseconds (default: 60000 = 1 minute) */
  cacheTTL?: number;
  /** Whether to fail-open if revocation check fails (default: false) */
  failOpen?: boolean;
}

/** Revocation status */
export interface RevocationStatus {
  /** Whether the token is revoked */
  revoked: boolean;
  /** Token ID checked */
  tokenId: string;
  /** When the token was revoked (if revoked) */
  revokedAt?: number;
  /** Who revoked the token (if revoked) */
  revokedBy?: string;
  /** Reason for revocation (if revoked) */
  reason?: string;
  /** When this status was checked */
  checkedAt: number;
}

/** Cached revocation status */
interface CachedStatus extends RevocationStatus {
  expiresAt: number;
}

// In-memory cache for revocation status
const revocationCache = new Map<string, CachedStatus>();

// Default configuration
const DEFAULT_CONFIG: RevocationConfig = {
  endpoint: 'https://proofi.vercel.app/api/ddc/revoke',
  cacheTTL: 60000, // 1 minute
  failOpen: false
};

let globalConfig: RevocationConfig = { ...DEFAULT_CONFIG };

/**
 * Configure the revocation checker
 */
export function configureRevocation(config: Partial<RevocationConfig>): void {
  globalConfig = { ...DEFAULT_CONFIG, ...config };
}

/**
 * Check if a token has been revoked
 * 
 * This MUST be called before using any capability token.
 * Returns true if the token is still valid (not revoked).
 * 
 * @throws InvalidTokenError if the token is revoked
 */
export async function checkRevocation(
  token: CapabilityToken,
  config?: Partial<RevocationConfig>
): Promise<RevocationStatus> {
  const cfg = { ...globalConfig, ...config };
  const tokenId = token.id;
  
  // Check cache first
  const cached = revocationCache.get(tokenId);
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.revoked) {
      throw new InvalidTokenError(
        `Token ${tokenId} was revoked: ${cached.reason || 'No reason provided'}`
      );
    }
    return cached;
  }
  
  // Fetch fresh status
  try {
    const response = await fetch(`${cfg.endpoint}?tokenId=${encodeURIComponent(tokenId)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Revocation check failed: ${response.status}`);
    }
    
    const status: RevocationStatus = await response.json();
    status.checkedAt = Date.now();
    
    // Cache the result
    const cachedStatus: CachedStatus = {
      ...status,
      expiresAt: Date.now() + (cfg.cacheTTL || DEFAULT_CONFIG.cacheTTL!)
    };
    revocationCache.set(tokenId, cachedStatus);
    
    // Throw if revoked
    if (status.revoked) {
      throw new InvalidTokenError(
        `Token ${tokenId} was revoked at ${new Date(status.revokedAt!).toISOString()}: ${status.reason || 'No reason provided'}`
      );
    }
    
    return status;
    
  } catch (error) {
    // Handle network/API errors
    if (error instanceof InvalidTokenError) {
      throw error;
    }
    
    console.error('Revocation check error:', error);
    
    // Fail-closed by default (deny access if we can't verify)
    if (!cfg.failOpen) {
      throw new InvalidTokenError(
        `Cannot verify token revocation status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
    
    // Fail-open mode (risky, not recommended for production)
    console.warn('Revocation check failed, but failOpen=true. Allowing token.');
    return {
      revoked: false,
      tokenId,
      checkedAt: Date.now()
    };
  }
}

/**
 * Assert that a token is not revoked
 * 
 * Convenience method that throws if revoked.
 */
export async function assertNotRevoked(
  token: CapabilityToken,
  config?: Partial<RevocationConfig>
): Promise<void> {
  await checkRevocation(token, config);
}

/**
 * Clear the revocation cache
 * 
 * Useful for testing or when you need fresh checks.
 */
export function clearRevocationCache(): void {
  revocationCache.clear();
}

/**
 * Revoke a token (issuer-side)
 * 
 * This should be called by the wallet/user to revoke their own tokens.
 */
export async function revokeToken(
  tokenId: string,
  signature: string,
  publicKey: string,
  reason?: string,
  config?: Partial<RevocationConfig>
): Promise<RevocationStatus> {
  const cfg = { ...globalConfig, ...config };
  
  const response = await fetch(cfg.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tokenId,
      signature,
      publicKey,
      reason
    })
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Revocation failed: ${error.error || response.status}`);
  }
  
  const result = await response.json();
  
  // Update cache to mark as revoked
  const cachedStatus: CachedStatus = {
    revoked: true,
    tokenId,
    revokedAt: result.revokedAt,
    revokedBy: publicKey,
    reason: reason || 'User requested revocation',
    checkedAt: Date.now(),
    expiresAt: Date.now() + (cfg.cacheTTL || DEFAULT_CONFIG.cacheTTL!)
  };
  revocationCache.set(tokenId, cachedStatus);
  
  return {
    revoked: true,
    tokenId,
    revokedAt: result.revokedAt,
    revokedBy: publicKey,
    reason,
    checkedAt: Date.now()
  };
}
