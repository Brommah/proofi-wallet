/**
 * Proofi Agent SDK
 * 
 * SDK for agents to consume Proofi capability tokens and access user data
 * stored in the Cere DDC (Decentralized Data Cloud).
 * 
 * @packageDocumentation
 */

// Main agent class
export { ProofiAgent } from './agent';

// Types
export type {
  CapabilityToken,
  ProofiAgentConfig,
  TokenScope,
  Permission,
  WrappedDEK,
  ValidationResult,
  ReadOptions,
  WriteOptions,
  ListOptions,
  ListResult,
  ResourceMetadata,
  EncryptedBlob,
} from './types';

// Errors
export {
  ProofiError,
  TokenExpiredError,
  InvalidTokenError,
  SignatureVerificationError,
  ScopeError,
  CryptoError,
  DEKUnwrapError,
  DecryptionError,
  EncryptionError,
  DDCError,
  ResourceNotFoundError,
} from './errors';

// Token utilities (for advanced use cases)
export {
  parseToken,
  validateToken,
  verifyTokenSignature,
  hasPermission,
  pathMatchesPattern,
  getAccessiblePaths,
} from './token';

// Crypto utilities (for advanced use cases)
export {
  generateKeyPair,
  derivePublicKey,
  unwrapDEK,
  wrapDEK,
  encryptData,
  decryptData,
  encryptBlob,
  decryptBlob,
  encodeBase64,
  decodeBase64,
} from './crypto';

// DDC client (for advanced use cases)
export { DDCClient, createDDCClient } from './ddc';
export type { DDCClientConfig } from './ddc';

// Revocation utilities
export {
  checkRevocation,
  assertNotRevoked,
  revokeToken,
  clearRevocationCache,
  configureRevocation,
} from './revocation';
export type { RevocationConfig, RevocationStatus } from './revocation';
