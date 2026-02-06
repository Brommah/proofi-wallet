# Cere Wallet Inject

The package provides API to inject Cere Wallet into global `injectedWeb3` to be later accessed by DApps (eg. with [@polkadot/extension-dapp](https://www.npmjs.com/package/@polkadot/extension-dapp) package)

# Installation

Using `NPM`:

```bash
npm install @cere/embed-wallet-inject --save
```

Using `yarn`:

```bash
yarn add @cere/embed-wallet-inject
```

# API

- [inject()](#inject)

## inject

The `SDK` constructor does not accepts any arguments.

```ts
import { EmbedWallet } from '@cere/embed-wallet';
import { inject } from '@cere/embed-wallet-inject';

const wallet = new EmbedWallet();

await inject(wallet, {
  name: 'Cere Wallet',
  permissions: {
    ed25519_signRaw: {},
  },
});
```
