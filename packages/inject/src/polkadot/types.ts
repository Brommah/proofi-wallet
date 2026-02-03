/**
 * Minimal type stubs for @polkadot/extension-inject and @polkadot/types.
 * These match the subset used by PolkadotInjector.
 * When @polkadot packages are installed as peer deps, these can be replaced
 * with the real imports.
 */

export interface InjectedAccount {
  address: string;
  genesisHash?: string | null;
  name?: string;
  type?: string;
}

export interface InjectedAccounts {
  get: () => Promise<InjectedAccount[]>;
  subscribe: (cb: (accounts: InjectedAccount[]) => void) => () => void;
}

export interface SignerPayloadRaw {
  address: string;
  data: string;
  type: 'bytes' | 'payload';
}

export interface SignerPayloadJSON {
  address: string;
  blockHash: string;
  blockNumber: string;
  era: string;
  genesisHash: string;
  method: string;
  nonce: string;
  specVersion: string;
  tip: string;
  transactionVersion: string;
  signedExtensions: string[];
  version: number;
}

export interface SignerResult {
  id: number;
  signature: string;
}

export interface Signer {
  signRaw?: (raw: SignerPayloadRaw) => Promise<SignerResult>;
  signPayload?: (payload: SignerPayloadJSON) => Promise<SignerResult>;
}

export interface Injected {
  accounts: InjectedAccounts;
  signer: Signer;
}

export type InjectExtensionFn = (
  enable: () => Promise<Injected>,
  info: { name: string; version: string },
) => void;
