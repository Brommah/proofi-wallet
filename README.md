# Proofi Wallet

Self-custodial credential wallet — sign verifiable credentials with keys you own.

## Quick Start

```bash
pnpm install
pnpm dev
```

This starts:
- **API server** → http://localhost:3847
- **Wallet UI** → http://localhost:5173
- **Demo page** → http://localhost:5173/demo.html

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Host App (e.g., proofi.ai)                     │
│  ┌───────────────┐                              │
│  │  @proofi/sdk   │ ◄── ProofiWallet, Signer    │
│  └───────┬───────┘                              │
│          │ postMessage (via @proofi/comm)        │
│  ┌───────▼───────────────────────────────────┐  │
│  │  Wallet iframe (@proofi/ui)               │  │
│  │  ┌──────────────┐  ┌──────────────────┐   │  │
│  │  │ @proofi/core  │  │ @proofi/inject   │   │  │
│  │  │ KeyringManager│  │ Polkadot compat  │   │  │
│  │  └──────────────┘  └──────────────────┘   │  │
│  └───────┬───────────────────────────────────┘  │
│          │ HTTP                                  │
│  ┌───────▼───────┐                              │
│  │  @proofi/api   │ ◄── OTP auth, JWT, apps     │
│  └───────────────┘                              │
└─────────────────────────────────────────────────┘
```

## Packages

| Package | Description |
|---------|-------------|
| `@proofi/core` | Key management & signing (sr25519, ed25519, secp256k1) |
| `@proofi/sdk` | Host app SDK — ProofiWallet, Signer, Provider |
| `@proofi/comm` | postMessage communication layer (JSON-RPC) |
| `@proofi/api` | Auth API server (Hono) — OTP, JWT, app registry |
| `@proofi/ui` | Wallet UI (React + Vite) — runs in iframe |
| `@proofi/inject` | Polkadot extension injection — makes Proofi appear as a browser extension |

## Scripts

```bash
pnpm dev        # Start API + UI in parallel
pnpm build      # Build all packages
pnpm test       # Run all tests
pnpm lint       # Lint all packages
pnpm typecheck  # TypeScript type checking
pnpm clean      # Remove dist/ and caches
```

## Development

### Environment

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

### Testing the wallet

1. Run `pnpm dev`
2. Open http://localhost:5173/demo.html
3. Click "Connect Wallet" — this simulates a host app embedding the wallet
4. Try signing messages and credentials

### How the SDK works (for host apps)

```typescript
import { ProofiWallet } from '@proofi/sdk';

const wallet = new ProofiWallet({
  appId: 'my-app',
  env: 'dev',
});

// Connect — opens wallet iframe
await wallet.connect();

// Get a signer
const signer = wallet.getSigner();
const signature = await signer.signMessage('Hello');

// Disconnect
await wallet.disconnect();
```

## Tech Stack

- **Runtime:** Node.js 20+, pnpm workspaces
- **API:** Hono (fast, lightweight, Web Standards)
- **UI:** React 19 + Vite
- **Crypto:** @polkadot/keyring, tweetnacl
- **Auth:** OTP via email, JWT tokens
- **Communication:** postMessage + JSON-RPC

## License

Private — Proofi B.V.
