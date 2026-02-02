/**
 * @proofi/sdk — Embed-wallet public SDK
 *
 * Responsibilities:
 * - Wallet lifecycle: init → connect → ready
 * - Provider/signer interfaces for host apps
 * - Event emitter for wallet state changes
 * - Iframe management (no Torus dependency)
 */

export const VERSION = '0.0.1';

// --- Stub types (to be fleshed out) ---

export type WalletStatus = 'idle' | 'ready' | 'connected' | 'disconnected';

export interface WalletAccount {
  address: string;
  type: 'ed25519' | 'sr25519' | 'ecdsa';
  name?: string;
}

export interface WalletProvider {
  request<T = unknown>(args: { method: string; params?: unknown[] }): Promise<T>;
}

export interface WalletPermissions {
  [key: string]: unknown;
}

export interface WalletConnectOptions {
  permissions?: WalletPermissions;
}

export interface ProofiWallet {
  readonly status: WalletStatus;
  readonly isReady: Promise<void>;
  readonly provider: WalletProvider;
  connect(options?: WalletConnectOptions): Promise<void>;
  requestPermissions(permissions: WalletPermissions): Promise<void>;
  subscribe(event: string, callback: (...args: unknown[]) => void): () => void;
}
