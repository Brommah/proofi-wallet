import EventEmitter from 'eventemitter3';
import { RpcChannel, WalletEventEmitter } from '@proofi/comm';
import type { WalletEvent as CommWalletEvent } from '@proofi/comm';

import { IframeManager } from './IframeManager';
import { ProofiSigner } from './ProofiSigner';
import { ProofiProvider } from './ProofiProvider';
import type {
  WalletConfig,
  WalletEvent,
  WalletStatus,
  Signer,
  Provider,
} from './types';
import { DEFAULT_WALLET_URLS } from './types';

type EventHandler = (...args: unknown[]) => void;

/**
 * ProofiWallet — the main SDK entry point.
 *
 * Manages the wallet iframe lifecycle, communication, and provides
 * a clean API for connecting, signing, and querying the chain.
 *
 * @example
 * ```typescript
 * import { ProofiWallet } from '@proofi/sdk';
 *
 * const wallet = new ProofiWallet({
 *   appId: 'my-app',
 *   env: 'dev',
 * });
 *
 * await wallet.init();
 * const address = await wallet.connect();
 * console.log('Connected:', address);
 *
 * const signer = wallet.getSigner();
 * const signature = await signer.signMessage('Hello Proofi!');
 * ```
 */
export class ProofiWallet {
  private config: WalletConfig;
  private walletUrl: string;
  private iframeManager: IframeManager;
  private rpc: RpcChannel | null = null;
  private walletEvents: WalletEventEmitter;
  private eventEmitter = new EventEmitter();
  private currentAddress: string | null = null;
  private currentStatus: WalletStatus = 'not-ready';

  constructor(config: WalletConfig) {
    this.config = config;
    this.walletUrl = config.walletUrl ?? DEFAULT_WALLET_URLS[config.env];
    this.iframeManager = new IframeManager(this.walletUrl);
    this.walletEvents = new WalletEventEmitter();
  }

  /**
   * Initialize the wallet SDK.
   * Creates the hidden iframe and establishes the communication channel.
   */
  async init(): Promise<void> {
    if (this.currentStatus !== 'not-ready') {
      throw new Error(`Wallet already initialized (status: ${this.currentStatus})`);
    }

    this.setStatus('initializing');

    try {
      // Create the hidden iframe
      await this.iframeManager.create();

      // Set up RPC communication
      this.rpc = new RpcChannel({
        targetWindow: this.iframeManager.getWindow(),
        targetOrigin: this.iframeManager.getOrigin(),
        timeout: 30_000,
      });

      // Forward wallet events to our public emitter
      this.setupEventForwarding();

      // Notify the wallet iframe about the host app
      await this.rpc.request('wallet_init', {
        appId: this.config.appId,
        env: this.config.env,
        origin: window.location.origin,
      });

      this.setStatus('ready');
    } catch (error) {
      this.setStatus('errored');
      throw error;
    }
  }

  /**
   * Connect to the wallet and get the user's address.
   * May trigger an authentication flow in the iframe.
   */
  async connect(): Promise<string> {
    this.ensureInitialized();

    if (this.currentAddress) {
      return this.currentAddress;
    }

    this.setStatus('connecting');

    try {
      const result = await this.rpc!.request<{ address: string }>(
        'wallet_connect',
        { appId: this.config.appId },
      );

      this.currentAddress = result.address;
      this.setStatus('connected');
      this.eventEmitter.emit('connected', { address: result.address });

      return result.address;
    } catch (error) {
      this.setStatus('ready');
      throw error;
    }
  }

  /**
   * Disconnect the wallet.
   */
  async disconnect(): Promise<void> {
    this.ensureInitialized();

    if (!this.currentAddress) return;

    this.setStatus('disconnecting');

    try {
      await this.rpc!.request('wallet_disconnect');
    } finally {
      this.currentAddress = null;
      this.setStatus('ready');
      this.eventEmitter.emit('disconnected');
    }
  }

  /**
   * Get a Signer instance for the connected wallet.
   * The signer delegates all operations to the wallet iframe.
   */
  getSigner(): Signer {
    this.ensureConnected();
    return new ProofiSigner(this.rpc!, this.currentAddress!);
  }

  /**
   * Get a Provider instance for chain queries and transactions.
   */
  getProvider(): Provider {
    this.ensureInitialized();
    return new ProofiProvider(this.rpc!);
  }

  /**
   * The currently connected wallet address, or null if not connected.
   */
  get address(): string | null {
    return this.currentAddress;
  }

  /**
   * Whether the wallet is currently connected.
   */
  get isConnected(): boolean {
    return this.currentStatus === 'connected' && this.currentAddress !== null;
  }

  /**
   * Current wallet status.
   */
  get status(): WalletStatus {
    return this.currentStatus;
  }

  /**
   * Subscribe to wallet events.
   */
  on(event: WalletEvent, handler: EventHandler): void {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Subscribe to a wallet event (fires once).
   */
  once(event: WalletEvent, handler: EventHandler): void {
    this.eventEmitter.once(event, handler);
  }

  /**
   * Unsubscribe from a wallet event.
   */
  off(event: WalletEvent, handler: EventHandler): void {
    this.eventEmitter.off(event, handler);
  }

  /**
   * Clean up all resources: iframe, listeners, RPC channel.
   */
  destroy(): void {
    this.rpc?.destroy();
    this.rpc = null;
    this.iframeManager.destroy();
    this.walletEvents.removeAllListeners();
    this.eventEmitter.removeAllListeners();
    this.currentAddress = null;
    this.setStatus('not-ready');
  }

  // --- Private ---

  private setStatus(status: WalletStatus): void {
    const prev = this.currentStatus;
    if (prev !== status) {
      this.currentStatus = status;
      this.eventEmitter.emit('statusChanged', { status, previousStatus: prev });
    }
  }

  private setupEventForwarding(): void {
    const events: CommWalletEvent[] = [
      'connected',
      'disconnected',
      'accountChanged',
      'chainChanged',
    ];

    for (const event of events) {
      this.walletEvents.on(event, (data: unknown) => {
        // Handle account changes from the wallet side
        if (event === 'accountChanged' && data && typeof data === 'object' && 'address' in data) {
          this.currentAddress = (data as { address: string }).address;
        }

        if (event === 'disconnected') {
          this.currentAddress = null;
          this.setStatus('ready');
        }

        this.eventEmitter.emit(event, data);
      });
    }
  }

  private ensureInitialized(): void {
    if (!this.rpc) {
      throw new Error('Wallet not initialized. Call init() first.');
    }
  }

  private ensureConnected(): void {
    this.ensureInitialized();
    if (!this.currentAddress) {
      throw new Error('Wallet not connected. Call connect() first.');
    }
  }
}
