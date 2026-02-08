/**
 * @module types
 * Type definitions for the Proofi ↔ OpenClaw integration SDK.
 */

/** Supported key types for agent signing */
export type AgentKeyType = 'sr25519' | 'ed25519';

/** Configuration for connecting to an OpenClaw agent */
export interface OpenClawConfig {
  /** OpenClaw agent endpoint URL */
  agentUrl: string;
  /** Agent identifier (NEAR account or DID) */
  agentId: string;
  /** TEE public key for encrypted communication */
  teePublicKey?: Uint8Array;
  /** Request timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
}

/** A signed request payload sent to an OpenClaw agent */
export interface AgentRequest {
  /** The payload data */
  payload: Record<string, unknown>;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Signer's SS58 address */
  signer: string;
  /** Hex-encoded signature */
  signature: string;
  /** Nonce to prevent replay attacks */
  nonce: string;
}

/** A signed response from an OpenClaw agent */
export interface AgentResponse {
  /** Response payload */
  payload: Record<string, unknown>;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Agent's identifier */
  agentId: string;
  /** Hex-encoded signature from the agent */
  signature: string;
  /** Nonce matching the request */
  nonce: string;
}

/** Result of verifying an agent response */
export interface VerificationResult {
  /** Whether the verification passed */
  valid: boolean;
  /** Error messages if verification failed */
  errors: string[];
}

/** TEE-encrypted data envelope */
export interface TEEEncryptedEnvelope {
  /** Encrypted data bytes */
  ciphertext: Uint8Array;
  /** Ephemeral public key for decryption */
  ephemeralPublicKey: Uint8Array;
  /** Encryption nonce */
  nonce: Uint8Array;
}

/** Credential signer interface (matches @proofi/core pattern) */
export interface CredentialSigner {
  /** Sign raw bytes */
  sign(message: Uint8Array): Uint8Array;
  /** Signer's SS58 address */
  address: string;
}

/** Agent memory entry for TEE storage */
export interface AgentMemory {
  /** Memory entry key */
  key: string;
  /** Encrypted value */
  value: TEEEncryptedEnvelope;
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}
