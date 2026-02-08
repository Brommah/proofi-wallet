/**
 * Custom error classes for Proofi Agent SDK
 */

/** Base error class for all Proofi SDK errors */
export class ProofiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProofiError';
    Object.setPrototypeOf(this, ProofiError.prototype);
  }
}

/** Token has expired */
export class TokenExpiredError extends ProofiError {
  public readonly expiredAt: Date;
  public readonly expiredAgo: number;

  constructor(expiredAt: number) {
    const expiredAgo = Date.now() - expiredAt;
    super(`Token expired ${Math.round(expiredAgo / 1000)} seconds ago`);
    this.name = 'TokenExpiredError';
    this.expiredAt = new Date(expiredAt);
    this.expiredAgo = expiredAgo;
    Object.setPrototypeOf(this, TokenExpiredError.prototype);
  }
}

/** Token is malformed or invalid */
export class InvalidTokenError extends ProofiError {
  public readonly reason: string;

  constructor(reason: string) {
    super(`Invalid token: ${reason}`);
    this.name = 'InvalidTokenError';
    this.reason = reason;
    Object.setPrototypeOf(this, InvalidTokenError.prototype);
  }
}

/** Token signature verification failed */
export class SignatureVerificationError extends ProofiError {
  constructor(message = 'Token signature verification failed') {
    super(message);
    this.name = 'SignatureVerificationError';
    Object.setPrototypeOf(this, SignatureVerificationError.prototype);
  }
}

/** Access denied - operation not in token scope */
export class ScopeError extends ProofiError {
  public readonly path: string;
  public readonly requiredPermission: string;
  public readonly availableScopes: string[];

  constructor(path: string, requiredPermission: string, availableScopes: string[]) {
    super(`Access denied: '${requiredPermission}' permission not granted for path '${path}'`);
    this.name = 'ScopeError';
    this.path = path;
    this.requiredPermission = requiredPermission;
    this.availableScopes = availableScopes;
    Object.setPrototypeOf(this, ScopeError.prototype);
  }
}

/** Cryptographic operation failed */
export class CryptoError extends ProofiError {
  public readonly operation: string;

  constructor(operation: string, details?: string) {
    super(`Crypto error during ${operation}${details ? `: ${details}` : ''}`);
    this.name = 'CryptoError';
    this.operation = operation;
    Object.setPrototypeOf(this, CryptoError.prototype);
  }
}

/** DEK unwrapping failed */
export class DEKUnwrapError extends CryptoError {
  constructor(details?: string) {
    super('DEK unwrapping', details);
    this.name = 'DEKUnwrapError';
    Object.setPrototypeOf(this, DEKUnwrapError.prototype);
  }
}

/** Data decryption failed */
export class DecryptionError extends CryptoError {
  constructor(details?: string) {
    super('data decryption', details);
    this.name = 'DecryptionError';
    Object.setPrototypeOf(this, DecryptionError.prototype);
  }
}

/** Data encryption failed */
export class EncryptionError extends CryptoError {
  constructor(details?: string) {
    super('data encryption', details);
    this.name = 'EncryptionError';
    Object.setPrototypeOf(this, EncryptionError.prototype);
  }
}

/** DDC network or API error */
export class DDCError extends ProofiError {
  public readonly statusCode?: number;
  public readonly endpoint: string;

  constructor(endpoint: string, message: string, statusCode?: number) {
    super(`DDC error at ${endpoint}: ${message}${statusCode ? ` (HTTP ${statusCode})` : ''}`);
    this.name = 'DDCError';
    this.endpoint = endpoint;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, DDCError.prototype);
  }
}

/** Resource not found in DDC */
export class ResourceNotFoundError extends DDCError {
  public readonly path: string;

  constructor(path: string, endpoint: string) {
    super(endpoint, `Resource not found: ${path}`, 404);
    this.name = 'ResourceNotFoundError';
    this.path = path;
    Object.setPrototypeOf(this, ResourceNotFoundError.prototype);
  }
}
