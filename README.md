# Proofi Wallet

Credential signing engine with an embed-wallet SDK. Built as a clean-room replacement for the Cere wallet, focused on Proofi's specific needs: multi-keypair management, manifest-based key selection, and scoped signing.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Host App (e.g. Proofi dApp)                                │
│  └─ @proofi/sdk (embed-wallet SDK)                          │
│       └─ postMessage / JSON-RPC via @proofi/comm            │
│            ↕                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  @proofi/ui (wallet iframe — React + Vite)            │   │
│  │  ├─ @proofi/core (key management & signing engine)    │   │
│  │  └─ @proofi/comm (communication layer)                │   │
│  └──────────────────────────────────────────────────────┘   │
│                 ↕ HTTP                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  @proofi/api (auth server)                            │   │
│  │  ├─ OTP email auth                                    │   │
│  │  ├─ Telegram auth (Mini App + Login Widget)           │   │
│  │  └─ Web3Auth key retrieval                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  @proofi/inject — Polkadot extension compatibility           │
└─────────────────────────────────────────────────────────────┘
```

## Packages

| Package | Description |
|---|---|
| `@proofi/core` | Key management & signing engine — multi-keypair, manifest-aware, scoped signing |
| `@proofi/sdk` | Public SDK for host apps — init/connect/provider/signer lifecycle |
| `@proofi/comm` | Communication layer — postMessage JSON-RPC transport |
| `@proofi/ui` | Wallet UI — React + Vite, minimal (auth + sign confirmation + account view) |
| `@proofi/api` | Auth API server — OTP, Telegram auth, JWT issuance |
| `@proofi/inject` | Polkadot extension injection — makes wallet appear as a browser extension |

## Key Differences from Cere Wallet

- **Multi-keypair** — not locked to a single Web3Auth master key
- **Manifest-based key selection** — apps declare what signing capabilities they need
- **Tag-query** — credential-specific key lookup
- **No MobX god-object** — lightweight state management
- **No MUI** — lean UI layer (Tailwind + headless components)
- **Vite** — fast builds, no CRA/CRACO legacy
- **No Torus dependency** in communication layer

## Getting Started

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Dev mode (all packages in watch mode)
pnpm dev

# Lint
pnpm lint

# Type check
pnpm typecheck
```

## Tech Stack

- **Runtime:** Node 20+, TypeScript 5.x (strict)
- **Build:** Vite 6, pnpm workspaces
- **UI:** React 19
- **Linting:** ESLint 9 (flat config) + Prettier
- **API:** TBD (Hono / Fastify)
