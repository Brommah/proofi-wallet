## Release Notes:

### v0.18.0

- Add new RPC method to sign messages by any Cere Wallet managed account (`wallet_signMessage`)
- Added new method to the SDK to create a multi-chain signer instance (`getSigner()`)

### v0.17.0

- Add `loginHint` option to the wallet connect configuration

### v0.16.0

- Add `biconomy` init option to allow configure Cere Wallet + Biconomy

### v0.14.0

- Switch Cere Wallet Client to new domain

### v0.13.0

- Add Wallet Permission System ([EIP-2255](https://eips.ethereum.org/EIPS/eip-2255)) support
- Added `initializing` wallet instance status

### v0.12.3

- Added `skipLoginIntro` prop

### v0.12.0

- Add support for `White Label` configuration

### v0.11.0

- Switch web3auth network to `Cyan Mainnet`

### v0.10.0

- Update the wallet client to the version including improved login flow

### v0.9.0

- Add `sessionNamespace` option to the Wallet SDK configuration
- Restore focus on host window when closing the wallet widget

### v0.8.1

- Fix issue with first connect in mobile browsers

### v0.8.0

- Add CERE ERC20 balance and transfer support
- Add `isReady` promise property to the wallet instance
- Fix account changed event delay after wallet connect
