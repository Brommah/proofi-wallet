/**
 * @module types
 * Core type definitions for the Proofi wallet signing engine.
 */

import type { SignerPayloadJSON } from '@polkadot/types/types';

// ── Key Types ──────────────────────────────────────────────────────────────────

/** Supported cryptographic key types */
export type KeyType = 'ed25519' | 'sr25519' | 'secp256k1';

/** Chain namespace a key is associated with */
export type ChainNamespace = 'substrate' | 'ethereum';

/** Maps key types to their natural chain namespace */
export const KEY_TYPE_NAMESPACE: Record<KeyType, ChainNamespace> = {
  ed25519: 'substrate',
  sr25519: 'substrate',
  secp256k1: 'ethereum',
};

/** Purpose tag for scoped signing */
export type SigningPurpose =
  | 'transaction'
  | 'credential'
  | 'authentication'
  | 'encryption'
  | (string & {});

// ── Key Pair ───────────────────────────────────────────────────────────────────

/** A keypair stored in the keyring */
export interface KeyPairData {
  /** Unique identifier (typically the address) */
  id: string;
  /** Key type */
  type: KeyType;
  /** On-chain or off-chain address */
  address: string;
  /** Public key bytes */
  publicKey: Uint8Array;
  /** Secret key bytes (kept in memory, never serialised) */
  secretKey: Uint8Array;
  /** Optional human-readable label */
  label?: string;
  /** Optional purpose tags */
  purposes?: SigningPurpose[];
}

/**
 * Internal extension of KeyPairData that may carry runtime-only objects.
 * These are never serialised.
 */
export interface KeyPairInternal extends KeyPairData {
  /** @internal Polkadot KeyringPair for Substrate signing */
  _polkadotPair?: import('@polkadot/keyring/types').KeyringPair;
  /** @internal Ethers Wallet for Ethereum signing */
  _ethersWallet?: import('ethers').Wallet;
}

// ── Signer Interface ───────────────────────────────────────────────────────────

/** Result of signing an extrinsic payload */
export interface SignerResult {
  /** Unique incrementing id */
  id: number;
  /** Hex-encoded signature */
  signature: string;
}

/**
 * Unified signer interface.
 * Implementations wrap a single keypair and expose chain-agnostic signing.
 */
export interface Signer {
  /** Sign an arbitrary message, returns hex-encoded signature */
  signMessage(message: string | Uint8Array): Promise<string>;

  /** Sign a Substrate extrinsic payload */
  signPayload(payload: SignerPayloadJSON): Promise<SignerResult>;

  /** Get the address for this signer */
  getAddress(): string;

  /** Get the raw public key bytes */
  getPublicKey(): Uint8Array;
}

// ── Engine Types ───────────────────────────────────────────────────────────────

/** Configuration for the Substrate signing engine */
export interface SubstrateEngineConfig {
  /** WebSocket RPC endpoint (optional — only needed for on-chain ops) */
  rpcUrl?: string;
  /** SS58 prefix for address encoding (default: 42) */
  ss58Prefix?: number;
}

/** Configuration for the Ethereum signing engine */
export interface EthereumEngineConfig {
  /** JSON-RPC endpoint */
  rpcUrl?: string;
  /** Chain ID */
  chainId?: number;
}

/** Top-level engine configuration */
export interface ProofiEngineConfig {
  substrate?: SubstrateEngineConfig;
  ethereum?: EthereumEngineConfig;
}
