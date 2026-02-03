import type { ProofiWallet } from '@proofi/sdk';

import { PolkadotInjector } from './polkadot/index.js';

type InjectTarget = 'polkadot';

export type EnableOptions = {
  name?: string;
  target?: InjectTarget;
  autoConnect?: boolean;
};

export type InjectOptions = Omit<EnableOptions, 'target'> & {
  targets?: InjectTarget[];
};

/**
 * Enables the injected wallet and returns the injected application
 */
export const enable = async (wallet: ProofiWallet, { target = 'polkadot', ...options }: EnableOptions = {}) => {
  if (target !== 'polkadot') {
    throw new Error(`Unsupported target: ${target}`);
  }

  return new PolkadotInjector(wallet, options).enable();
};

/**
 * Injects the wallet into the global object (Window)
 */
export const inject = async (wallet: ProofiWallet, { targets = ['polkadot'], ...options }: InjectOptions = {}) => {
  if (targets.includes('polkadot')) {
    await new PolkadotInjector(wallet, options).inject();
  }
};

export { PolkadotInjector } from './polkadot/index.js';
export type { PolkadotInjectorOptions } from './polkadot/index.js';
