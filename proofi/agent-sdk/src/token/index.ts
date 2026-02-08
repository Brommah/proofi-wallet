/**
 * Token parsing, validation, and scope enforcement
 */

import { decodeBase64, decodeUTF8, verifySignature } from '../crypto';
import {
  InvalidTokenError,
  TokenExpiredError,
  ScopeError,
} from '../errors';
import type { CapabilityToken, ValidationResult, Permission } from '../types';

/** Current supported token version */
const CURRENT_TOKEN_VERSION = 1;

/**
 * Parse a capability token from string format
 * Token format: base64url-encoded JSON or JWT-like format
 */
export function parseToken(tokenString: string): CapabilityToken {
  try {
    // Handle JWT-like format (header.payload.signature)
    if (tokenString.includes('.')) {
      return parseJWTToken(tokenString);
    }

    // Handle plain base64 JSON
    const decoded = atob(tokenString.replace(/-/g, '+').replace(/_/g, '/'));
    const token = JSON.parse(decoded) as CapabilityToken;
    validateTokenStructure(token);
    return token;
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      throw error;
    }
    throw new InvalidTokenError(
      error instanceof Error ? error.message : 'Failed to parse token'
    );
  }
}

/**
 * Parse JWT-like token format
 */
function parseJWTToken(tokenString: string): CapabilityToken {
  const parts = tokenString.split('.');
  if (parts.length !== 3) {
    throw new InvalidTokenError('Invalid JWT format: expected 3 parts');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Decode header
  const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
  if (header.typ !== 'PCT' && header.typ !== 'proofi-capability-token') {
    throw new InvalidTokenError(`Unknown token type: ${header.typ}`);
  }

  // Decode payload
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

  // Construct token object
  const token: CapabilityToken = {
    version: payload.v ?? payload.version ?? CURRENT_TOKEN_VERSION,
    id: payload.jti ?? payload.id,
    issuer: payload.iss ?? payload.issuer,
    audience: payload.aud ?? payload.audience,
    issuedAt: payload.iat ?? payload.issuedAt,
    expiresAt: payload.exp ?? payload.expiresAt,
    scopes: payload.scopes ?? payload.scope,
    wrappedDEK: payload.wrappedDEK ?? payload.dek,
    bucketId: payload.bucketId ?? payload.bucket,
    signature: signatureB64,
  };

  validateTokenStructure(token);
  return token;
}

/**
 * Validate token structure has all required fields
 */
function validateTokenStructure(token: CapabilityToken): void {
  const requiredFields: (keyof CapabilityToken)[] = [
    'version',
    'id',
    'issuer',
    'audience',
    'issuedAt',
    'expiresAt',
    'scopes',
    'wrappedDEK',
    'bucketId',
    'signature',
  ];

  for (const field of requiredFields) {
    if (token[field] === undefined || token[field] === null) {
      throw new InvalidTokenError(`Missing required field: ${field}`);
    }
  }

  if (token.version > CURRENT_TOKEN_VERSION) {
    throw new InvalidTokenError(
      `Unsupported token version: ${token.version} (max supported: ${CURRENT_TOKEN_VERSION})`
    );
  }

  if (!Array.isArray(token.scopes) || token.scopes.length === 0) {
    throw new InvalidTokenError('Token must have at least one scope');
  }

  for (const scope of token.scopes) {
    if (!scope.path || typeof scope.path !== 'string') {
      throw new InvalidTokenError('Invalid scope: missing path');
    }
    if (!Array.isArray(scope.permissions) || scope.permissions.length === 0) {
      throw new InvalidTokenError('Invalid scope: missing permissions');
    }
  }

  if (!token.wrappedDEK.ciphertext || !token.wrappedDEK.ephemeralPublicKey || !token.wrappedDEK.nonce) {
    throw new InvalidTokenError('Invalid wrappedDEK structure');
  }
}

/**
 * Validate token expiry and signature
 */
export function validateToken(
  token: CapabilityToken,
  issuerPublicKey?: Uint8Array
): ValidationResult {
  const now = Date.now();

  // Check expiry
  const expiresAtMs = token.expiresAt * 1000; // Convert to milliseconds if in seconds
  const expiresIn = expiresAtMs - now;

  if (expiresIn < 0) {
    return {
      valid: false,
      reason: `Token expired ${Math.round(-expiresIn / 1000)} seconds ago`,
      expiresIn,
    };
  }

  // Check not-before (issued at)
  const issuedAtMs = token.issuedAt * 1000;
  if (issuedAtMs > now + 60000) {
    // Allow 1 minute clock skew
    return {
      valid: false,
      reason: 'Token not yet valid (issued in the future)',
      expiresIn,
    };
  }

  // Verify signature if public key provided
  if (issuerPublicKey) {
    const isSignatureValid = verifyTokenSignature(token, issuerPublicKey);
    if (!isSignatureValid) {
      return {
        valid: false,
        reason: 'Invalid signature',
        expiresIn,
      };
    }
  }

  return {
    valid: true,
    expiresIn,
  };
}

/**
 * Verify token signature
 */
export function verifyTokenSignature(
  token: CapabilityToken,
  issuerPublicKey: Uint8Array
): boolean {
  try {
    // Reconstruct the signed payload (everything except signature)
    const payload = {
      version: token.version,
      id: token.id,
      issuer: token.issuer,
      audience: token.audience,
      issuedAt: token.issuedAt,
      expiresAt: token.expiresAt,
      scopes: token.scopes,
      wrappedDEK: token.wrappedDEK,
      bucketId: token.bucketId,
    };

    const message = decodeUTF8(JSON.stringify(payload));
    const signature = decodeBase64(token.signature);

    return verifySignature(message, signature, issuerPublicKey);
  } catch {
    return false;
  }
}

/**
 * Check if token has expired, throwing if so
 */
export function assertNotExpired(token: CapabilityToken): void {
  const now = Date.now();
  const expiresAtMs = token.expiresAt * 1000;

  if (expiresAtMs < now) {
    throw new TokenExpiredError(expiresAtMs);
  }
}

/**
 * Check if a path matches a scope pattern
 * Supports wildcards: '*' matches any single segment, '**' matches any depth
 */
export function pathMatchesPattern(path: string, pattern: string): boolean {
  // Normalize paths
  const normalizedPath = path.replace(/^\/+|\/+$/g, '');
  const normalizedPattern = pattern.replace(/^\/+|\/+$/g, '');

  // Exact match
  if (normalizedPath === normalizedPattern) {
    return true;
  }

  // Handle double wildcard (matches any depth)
  if (normalizedPattern.endsWith('/**')) {
    const prefix = normalizedPattern.slice(0, -3);
    return normalizedPath === prefix || normalizedPath.startsWith(prefix + '/');
  }

  // Handle single wildcard per segment
  const pathParts = normalizedPath.split('/');
  const patternParts = normalizedPattern.split('/');

  if (pathParts.length !== patternParts.length) {
    return false;
  }

  return patternParts.every((part, i) => {
    if (part === '*') return true;
    return part === pathParts[i];
  });
}

/**
 * Check if token grants permission for a path
 */
export function hasPermission(
  token: CapabilityToken,
  path: string,
  permission: Permission
): boolean {
  return token.scopes.some(
    (scope) =>
      pathMatchesPattern(path, scope.path) && scope.permissions.includes(permission)
  );
}

/**
 * Assert that token grants permission, throwing ScopeError if not
 */
export function assertPermission(
  token: CapabilityToken,
  path: string,
  permission: Permission
): void {
  if (!hasPermission(token, path, permission)) {
    throw new ScopeError(
      path,
      permission,
      token.scopes.map((s) => `${s.path} (${s.permissions.join(', ')})`)
    );
  }
}

/**
 * Get all paths accessible with a given permission
 */
export function getAccessiblePaths(
  token: CapabilityToken,
  permission: Permission
): string[] {
  return token.scopes
    .filter((scope) => scope.permissions.includes(permission))
    .map((scope) => scope.path);
}
