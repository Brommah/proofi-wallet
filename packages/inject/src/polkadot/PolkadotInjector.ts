import type { ProofiWallet, WalletConnectOptions, WalletAccount } from '@proofi/sdk';
import { injectExtension } from '@polkadot/extension-inject';
import type { Injected, InjectedAccount, InjectedAccounts } from '@polkadot/extension-inject/types';
import type { SignerPayloadRaw, SignerResult, Signer, SignerPayloadJSON } from '@polkadot/types/types';

export type PolkadotInjectorOptions = {
  name?: string;
  version?: string;
  autoConnect?: boolean;
  waitReady?: boolean;
  connectOptions?: WalletConnectOptions;
};

export class PolkadotInjector {
  private name: string;
  private version: string;
  private injected: boolean = false;
  private shouldConnect: boolean;
  private shouldWait: boolean;
  private connectOptions?: WalletConnectOptions;

  constructor(
    readonly wallet: ProofiWallet,
    { name, version, autoConnect = false, waitReady = true, connectOptions }: PolkadotInjectorOptions = {},
  ) {
    this.name = name || 'Proofi Wallet';
    this.version = version || '0.0.1';
    this.shouldConnect = autoConnect;
    this.shouldWait = waitReady;
    this.connectOptions = connectOptions;
  }

  get isInjected() {
    return this.injected;
  }

  private waitReady = () => this.wallet.isReady.then(() => true);
  private filterAccounts = (accounts: WalletAccount[]) => {
    return accounts.filter((account: WalletAccount) => account.type === 'ed25519') as InjectedAccount[];
  };

  readonly getAccounts = async () => {
    const allAccounts = await this.wallet.provider.request({
      method: 'wallet_accounts',
    });

    return this.filterAccounts(allAccounts);
  };

  readonly subscribeAccounts = (onReceive: (accounts: InjectedAccount[]) => void) => {
    return this.wallet.subscribe('accounts-update', (accounts: WalletAccount[]) =>
      onReceive(this.filterAccounts(accounts)),
    );
  };

  readonly signRaw = async (raw: SignerPayloadRaw): Promise<SignerResult> => {
    const signature = await this.wallet.provider.request({
      method: 'ed25519_signRaw',
      params: [raw.address, raw.data],
    });

    return { id: 0, signature };
  };

  readonly signPayload = async (payload: SignerPayloadJSON): Promise<SignerResult> => {
    const signature = await this.wallet.provider.request({
      method: 'ed25519_signPayload',
      params: [payload],
    });

    return { id: 0, signature };
  };

  readonly enable = async (): Promise<Injected> => {
    if (this.shouldWait) {
      await this.waitReady();
    }

    const { permissions } = this.connectOptions || {};

    if (this.shouldConnect && this.wallet.status === 'ready') {
      await this.wallet.connect(this.connectOptions);
    } else if (this.wallet.status === 'connected' && permissions) {
      await this.wallet.requestPermissions(permissions).catch(console.warn);
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

  inject() {
    injectExtension(this.enable, {
      version: this.version,
      name: this.name,
    });

    this.injected = true;
  }
}
