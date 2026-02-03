/**
 * Configuration for the ProofiWallet SDK.
 */
export interface WalletConfig {
  /** Application identifier registered with Proofi */
  appId: string;
  /** Environment */
  env: 'dev' | 'prod';
  /** URL of the hosted wallet UI (iframe source) */
  walletUrl?: string;
}

/** Default wallet URLs per environment */
export const DEFAULT_WALLET_URLS: Record<WalletConfig['env'], string> = {
  dev: 'https://wallet-dev.proofi.com',
  prod: 'https://wallet.proofi.com',
};

/**
 * Signer interface for message and payload signing.
 * Matches the core package Signer contract.
 */
export interface Signer {
  /** Sign an arbitrary message */
  signMessage(message: string | Uint8Array): Promise<string>;
  /** Sign a structured payload (extrinsic/transaction) */
  signPayload(payload: SignerPayload): Promise<SignerResult>;
  /** Get the wallet address */
  getAddress(): string;
}

export interface SignerPayload {
  /** The encoded data */
  data?: string;
  /** The type of the payload (e.g., 'bytes' or 'payload') */
  type?: string;
  [key: string]: unknown;
}

export interface SignerResult {
  /** Signing id */
  id: number;
  /** The resulting signature as hex */
  signature: string;
}

/**
 * Provider interface for chain queries and transaction submission.
 */
export interface Provider {
  /** Send a JSON-RPC request to the wallet/chain */
  request<T = unknown>(args: { method: string; params?: unknown[] }): Promise<T>;
}

/** Wallet lifecycle events */
export type WalletEvent =
  | 'connected'
  | 'disconnected'
  | 'accountChanged'
  | 'chainChanged'
  | 'ready'
  | 'error'
  | 'statusChanged';

/** Wallet status */
export type WalletStatus =
  | 'not-ready'
  | 'initializing'
  | 'ready'
  | 'connected'
  | 'connecting'
  | 'disconnecting'
  | 'errored';
