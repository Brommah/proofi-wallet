import type { ProofiWallet } from '@proofi/sdk';
import type {
  Injected,
  InjectedAccount,
  InjectedAccounts,
  SignerPayloadRaw,
  SignerResult,
  Signer,
  SignerPayloadJSON,
} from './types.js';

export type PolkadotInjectorOptions = {
  name?: string;
  version?: string;
  autoConnect?: boolean;
};

export class PolkadotInjector {
  private name: string;
  private version: string;
  private injected: boolean = false;
  private shouldConnect: boolean;

  constructor(
    readonly wallet: ProofiWallet,
    { name, version, autoConnect = false }: PolkadotInjectorOptions = {},
  ) {
    this.name = name || 'Proofi Wallet';
    this.version = version || '0.0.1';
    this.shouldConnect = autoConnect;
  }

  get isInjected() {
    return this.injected;
  }

  readonly getAccounts = async (): Promise<InjectedAccount[]> => {
    if (!this.wallet.isConnected || !this.wallet.address) return [];
    return [{
      address: this.wallet.address,
      name: 'Proofi Wallet',
      type: 'ed25519' as const,
    }];
  };

  readonly subscribeAccounts = (onReceive: (accounts: InjectedAccount[]) => void): (() => void) => {
    const handler = () => {
      void this.getAccounts().then(onReceive);
    };

    this.wallet.on('accountChanged', handler);
    this.wallet.on('connected', handler);
    this.wallet.on('disconnected', handler);

    // Emit current state immediately
    void this.getAccounts().then(onReceive);

    return () => {
      this.wallet.off('accountChanged', handler);
      this.wallet.off('connected', handler);
      this.wallet.off('disconnected', handler);
    };
  };

  readonly signRaw = async (raw: SignerPayloadRaw): Promise<SignerResult> => {
    const signer = this.wallet.getSigner();
    const signature = await signer.signMessage(raw.data);
    return { id: 0, signature };
  };

  readonly signPayload = async (payload: SignerPayloadJSON): Promise<SignerResult> => {
    const signer = this.wallet.getSigner();
    const result = await signer.signPayload({
      data: payload.method,
      type: 'payload',
      ...payload,
    });
    return result;
  };

  readonly enable = async (): Promise<Injected> => {
    if (this.shouldConnect && this.wallet.status === 'ready') {
      await this.wallet.connect();
    }

    const accounts: InjectedAccounts = {
      get: this.getAccounts,
      subscribe: this.subscribeAccounts,
    };

    const signer: Signer = {
      signRaw: this.signRaw,
      signPayload: this.signPayload,
    };

    return { accounts, signer };
  };

  /**
   * Injects the wallet into the global `window.injectedWeb3` object.
   * Requires @polkadot/extension-inject as a peer dependency.
   */
  async inject() {
    try {
      const { injectExtension } = await import('@polkadot/extension-inject');
      // Cast needed because our minimal type stubs use `string` for `type`
      // whereas @polkadot/extension-inject expects `KeypairType`
      injectExtension(
        ((_origin: string) => this.enable()) as unknown as (origin: string) => Promise<import('@polkadot/extension-inject/types').Injected>,
        { version: this.version, name: this.name },
      );
      this.injected = true;
    } catch {
      console.warn(
        '[@proofi/inject] @polkadot/extension-inject not available. Install it as a peer dependency to use inject().',
      );
    }
  }
}
