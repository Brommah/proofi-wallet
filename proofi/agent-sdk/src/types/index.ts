/**
 * Core types for Proofi Agent SDK
 */

/** Permission levels for data access */
export type Permission = 'read' | 'write' | 'delete';

/** Scope definition for a capability token */
export interface TokenScope {
  /** Resource path pattern (e.g., 'health/*', 'identity/email') */
  path: string;
  /** Allowed operations on this path */
  permissions: Permission[];
}

/** Wrapped Data Encryption Key */
export interface WrappedDEK {
  /** DEK encrypted with agent's public key (X25519) */
  ciphertext: string;
  /** Ephemeral public key used for encryption */
  ephemeralPublicKey: string;
  /** Nonce used for encryption */
  nonce: string;
}

/** Capability token structure */
export interface CapabilityToken {
  /** Token version */
  version: number;
  /** Token unique identifier */
  id: string;
  /** User's DID who granted the token */
  issuer: string;
  /** Agent's DID receiving the token */
  audience: string;
  /** Unix timestamp when token was issued */
  issuedAt: number;
  /** Unix timestamp when token expires */
  expiresAt: number;
  /** Scopes granted to the agent */
  scopes: TokenScope[];
  /** Wrapped DEK for data decryption */
  wrappedDEK: WrappedDEK;
  /** DDC bucket ID where user data is stored */
  bucketId: string;
  /** User's signature over the token */
  signature: string;
}

/** Configuration for ProofiAgent */
export interface ProofiAgentConfig {
  /** The capability token received from user */
  token: string | CapabilityToken;
  /** Agent's X25519 private key (base64 or Uint8Array) */
  privateKey: string | Uint8Array;
  /** DDC endpoint URL */
  ddcEndpoint?: string;
  /** Optional timeout for DDC requests (ms) */
  timeout?: number;
}

/** Resource metadata returned from DDC */
export interface ResourceMetadata {
  /** Resource path */
  path: string;
  /** Size in bytes */
  size: number;
  /** Content type */
  contentType: string;
  /** Last modified timestamp */
  lastModified: number;
  /** Resource checksum */
  checksum: string;
}

/** Encrypted blob from DDC */
export interface EncryptedBlob {
  /** Encrypted data (base64) */
  ciphertext: string;
  /** Nonce used for AES-GCM */
  nonce: string;
  /** Authentication tag */
  tag: string;
  /** Metadata */
  metadata: ResourceMetadata;
}

/** Result of token validation */
export interface ValidationResult {
  /** Whether token is valid */
  valid: boolean;
  /** Reason if invalid */
  reason?: string;
  /** Time until expiry (ms), negative if expired */
  expiresIn?: number;
}

/** Options for read operations */
export interface ReadOptions {
  /** Expected content type */
  contentType?: string;
  /** Whether to return raw bytes instead of parsed JSON */
  raw?: boolean;
}

/** Options for write operations */
export interface WriteOptions {
  /** Content type of data being written */
  contentType?: string;
  /** Custom metadata */
  metadata?: Record<string, string>;
}

/** Options for list operations */
export interface ListOptions {
  /** Path prefix to filter by */
  prefix?: string;
  /** Maximum number of results */
  limit?: number;
  /** Pagination cursor */
  cursor?: string;
}

/** List result with pagination */
export interface ListResult {
  /** Resources matching the query */
  resources: ResourceMetadata[];
  /** Cursor for next page, if any */
  nextCursor?: string;
  /** Whether there are more results */
  hasMore: boolean;
}
