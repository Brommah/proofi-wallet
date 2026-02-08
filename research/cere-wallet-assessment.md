# Cere Wallet — Full Code Assessment

**Date:** 2025-07-14  
**Repos forked to:** `Brommah/cere-wallet-client` + `Brommah/cere-wallet-api`  
**Cloned to:** `~/clawd/cere-wallet-client` + `~/clawd/cere-wallet-api`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Host App (e.g. Proofi)                                     │
│  └─ @cere/embed-wallet (SDK)                                │
│       └─ uses @cere/torus-embed (iframe injector)           │
│            └─ postMessage / BroadcastChannel                │
│                 ↕                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  cere-wallet-client (iframe / popup)                  │   │
│  │  ├─ React 18 + MobX stores (24 stores!)              │   │
│  │  ├─ @cere-wallet/communication (JSON-RPC mux)        │   │
│  │  ├─ @cere-wallet/wallet-engine (key mgmt + signing)   │   │
│  │  ├─ @cere-wallet/ui (MUI component kit)              │   │
│  │  └─ @cere-wallet/storage (localStorage wrapper)      │   │
│  └──────────────────────────────────────────────────────┘   │
│                 ↕ HTTP                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  cere-wallet-api (NestJS)                             │   │
│  │  ├─ Auth (OTP email, Firebase social, Telegram)       │   │
│  │  ├─ Applications (CRUD, webhooks)                     │   │
│  │  ├─ Analytics (wallet counts)                         │   │
│  │  └─ Web3Auth integration (Torus key retrieval)        │   │
│  └──────────────────────────────────────────────────────┘   │
│                 ↕                                           │
│  Web3Auth / Torus Network (key sharding)                    │
│  PostgreSQL (applications table)                            │
│  Firebase (social auth)                                     │
│  Redis (OTP caching)                                        │
└─────────────────────────────────────────────────────────────┘
```

**How it works:** The embed-wallet SDK injects an iframe (via Torus embed fork). The iframe loads the full React wallet app. Communication between host and iframe is JSON-RPC over postMessage/BroadcastChannel. The wallet-engine manages private keys derived from Web3Auth/Torus and creates chain-specific signing engines (Ethereum, Polkadot/Cere, Solana). The API handles auth token issuance and application registration.

---

## Package-by-Package Assessment

### 1. `@cere/embed-wallet` — SDK for host apps
- **Purpose:** Public-facing SDK that host apps import. Manages wallet lifecycle (init → connect → ready), exposes provider/signer interfaces.
- **Size:** 8 files, 803 LOC
- **Dependencies:** `@cere/torus-embed` (forked Torus), `bn.js`
- **Quality:** Decent TypeScript. Clean public API surface. Event emitter pattern works. The `Signer` class is simple and functional.
- **Issues:**
  - Hard dependency on Torus embed (iframe injection, specific build environments)
  - Balance creation uses BN.js manually — fragile decimal handling
  - Address comparison is case-insensitive `.toUpperCase()` with a TODO acknowledging it's wrong
  - No tests
- **Verdict:** **Keep the interface, rewrite the internals.** The public API shape (init/connect/provider/signer) is fine. The Torus dependency needs to go or be abstracted.

### 2. `@cere/embed-wallet-inject` — Polkadot extension injection
- **Purpose:** Makes the wallet appear as a Polkadot browser extension (via `@polkadot/extension-inject`)
- **Size:** 3 files, 145 LOC
- **Dependencies:** `@polkadot/extension-inject`
- **Quality:** Tiny, focused, clean
- **Verdict:** **Keep as-is.** It's small and does one thing well.

### 3. `@cere-wallet/wallet-engine` — Core signing engine
- **Purpose:** JSON-RPC engine that handles all blockchain signing. Creates chain-specific sub-engines for Ethereum, Polkadot, and Solana. Manages accounts and key derivation.
- **Size:** 17 files, 1434 LOC
- **Dependencies:** Heavy — `@polkadot/api` (massive), `ethers`, `@web3auth/ethereum-provider`, `@biconomy/mexa`, `@solana/web3.js`, `json-rpc-engine`, `tweetnacl`
- **Quality:**
  - Clean engine abstraction (`Engine` extends `JsonRpcEngine` with event forwarding)
  - `createAsyncEngine` pattern is clever — lazy initialization
  - Account derivation in `accounts.ts` is well-structured with factory map
  - Multi-chain support (ETH, Polkadot/Cere, Solana) in ~1400 LOC is efficient
- **Issues:**
  - **The keypair signing is all derived from a single Torus/Web3Auth private key** — this is the hardcoded signing model that limits Proofi
  - No concept of "which key to use for what" — one key rules all chains
  - Biconomy integration is outdated (gasless tx relayer)
  - `@cere/freeport-sc-sdk` dependency for smart contract addresses — ties it to Cere's specific NFT infrastructure
  - Gas limit hardcoded to 500000 in asset stores
  - Solana support is a stub ("TODO: Rethink after hackathon")
  - `ed25519_signPayload` marked as "dangerous permission" in constants
  - No tests
- **Verdict:** **Gut and rebuild.** The engine pattern is salvageable but the key management model is fundamentally wrong for Proofi's needs. Need: manifest-based key selection, tag-query support, multi-keypair management.

### 4. `@cere-wallet/communication` — JSON-RPC messaging
- **Purpose:** Handles all communication between embed-wallet SDK and the iframe wallet. Creates multiplexed channels over postMessage and BroadcastChannel.
- **Size:** 16 files, 749 LOC
- **Dependencies:** `@toruslabs/openlogin-jrpc`, `bowser` (browser detection), `broadcast-channel`
- **Quality:**
  - Well-structured: wallet channels, RPC connections, popup connections
  - Separation of concerns: wallet connection vs popup connection
  - Uses multiplexing (createMux) for multiple logical channels over single transport
- **Issues:**
  - Depends on `@toruslabs/openlogin-jrpc` — Torus-specific RPC utilities
  - BroadcastChannel usage is for cross-tab communication — complex but necessary
  - The popup management (preopenInstanceId pattern) is convoluted
- **Verdict:** **Simplify significantly.** The core channel abstraction is fine but the Torus-specific stuff and popup complexity can be stripped. For Proofi, a simpler postMessage protocol may suffice.

### 5. `@cere-wallet/ui` — Component library
- **Purpose:** Reusable UI building blocks built on Material UI (MUI)
- **Size:** 86 files, 3713 LOC, 18 components
- **Dependencies:** `@mui/material`, `@mui/icons-material`, `@mui/lab`, `@emotion/react`, `@emotion/styled`, `react-qr-code`
- **Components:** Address, AddressDropdown, AmountInput, Banner, CommingSoon (typo), CopyButton, Dialog, Dropdown, IconButton, InfoTable, List, Loading, Logo, OtpInput, QRCode, Truncate, Typography
- **Quality:**
  - Standard MUI wrapper pattern
  - Theme configuration exists but has `any` types and TODOs
  - Hardcoded shadows and borders (should use theme)
  - "CommingSoon" typo shows lack of review
- **Verdict:** **Probably rewrite.** If rebuilding, you'd want a leaner UI layer. MUI is heavy. These are mostly thin wrappers that don't save much time. Keep the design patterns, ditch MUI.

### 6. `@cere-wallet/storage` — LocalStorage abstraction
- **Purpose:** Provides a storage interface with InMemoryStorage fallback when localStorage isn't available
- **Size:** 4 files, 83 LOC
- **Quality:** Simple and clean
- **Verdict:** **Keep or trivially rewrite.** 83 lines. Barely a package.

### 7. Main App (`src/`) — The wallet React app
- **Purpose:** Full wallet UI with authentication, account management, transaction signing, asset display, collectibles, permissions
- **Size:** 271 files, 10,791 LOC
- **Architecture:** 24 MobX stores, React routes, component layer
- **Quality:**
  - **Massively over-engineered for what it does.** 24 stores for a wallet that primarily needs to: authenticate, show balance, sign transactions
  - MobX stores are tightly coupled — WalletStore constructor creates 14 other stores in sequence
  - WalletStore is a god object (every other store depends on it)
  - Reaction chains between stores create implicit dependencies that are hard to trace
  - No unit tests at all — only 14 e2e test config files (WebdriverIO setup, no actual test logic)
  - Lots of game-specific code (`metaverse-dash-run`, `candy-jam`, `cere-game-portal`) — promotional hacks
  - Multiple TODOs about broken/incomplete features (payments, gas fees, address validation)
- **Verdict:** **Rewrite from scratch.** The store architecture is the main problem — too many stores, too tightly coupled, impossible to test. A clean rebuild with a simpler state management approach (zustand or even just React context) would be more maintainable.

---

## API Repo Assessment (`cere-wallet-api`)

### Overview
- **Framework:** NestJS (v8 — outdated, current is v10)
- **Size:** 50 files, 1673 LOC
- **Database:** PostgreSQL via TypeORM (single `application` table)
- **Caching:** Redis (for OTP)

### Endpoints
| Endpoint | Method | Purpose |
|---|---|---|
| `/auth/jwks` | GET | JWKS endpoint for JWT verification |
| `/auth/otp/send` | POST | Send OTP email |
| `/auth/otp/validate` | POST | Validate OTP |
| `/auth/token-by-email` | POST | Get JWT by email+OTP |
| `/auth/token-by-social` | POST | JWT from Firebase token |
| `/auth/token-by-link` | POST | JWT from auth link code |
| `/auth/token-by-telegram-mini-app-init-data` | POST | JWT from Telegram Mini App |
| `/auth/token-by-telegram-login-widget` | POST | JWT from Telegram Login Widget |
| `/auth/s2s/wallet-by-email` | POST | Server-to-server wallet lookup |
| `/auth/s2s/wallet-by-telegram-user-id` | GET | S2S wallet by Telegram ID |
| `/applications` | GET | List all apps |
| `/applications` | POST | Create/update app |
| `/applications/find` | POST | Find apps by address |
| `/analytics/wallets/total` | GET | Total wallets count |
| `/analytics/applications/*` | GET | App analytics |

### Auth Model
- OTP email flow → JWT token
- Firebase social login → validate Firebase JWT → issue own JWT
- Telegram Mini App → validate init data signature → JWT
- Telegram Login Widget → validate via bot token → JWT
- S2S endpoints protected by `CereS2SAuthKeyGuard` (shared API key)
- JWTs are signed by the API's own keypair, verified via JWKS endpoint

### Web3Auth Integration
The `Web3authApiClientService` is **critically important** — it's the server-side wallet derivation:
- Takes an email → creates a JWT → calls Torus network to get the user's private key shards
- Derives Ethereum, Polkadot/Cere, or Solana addresses from the combined key
- This is how S2S wallet lookups work (no user interaction needed)
- **Risk:** This service holds the ability to reconstruct user private keys server-side

### Issues
- NestJS v8 is outdated (v10 is current)
- TypeORM v0.3 is old
- `tslint.json` present — TSLint is deprecated (should be ESLint)
- Uses `@cere/ms-core` (Cere internal package) — dependency on their infrastructure
- No unit tests
- `getCereAddress()` throws `Method not implemented` — dead code
- The `application` entity is minimal (appId, address, data blob, timestamps) — barely a registry
- Webhook integration is fire-and-forget with error swallowing

### Verdict
**Mostly replaceable.** The auth flows are the only complex part. For Proofi:
- OTP email auth → keep or replace with simpler auth
- Telegram auth → keep if needed
- Firebase social → might not need
- Web3Auth server-side derivation → keep but needs security review
- Applications CRUD → trivially replaceable
- Analytics → not needed

---

## Dependencies Audit

### Critical / Heavy
| Package | Size | Status | Action |
|---|---|---|---|
| `@polkadot/api` + types | ~50MB installed | v15.5.1 (recent) | Keep — essential for Cere chain |
| `ethers` | ~15MB | v5.6.9 (v6 is current) | Upgrade to v6 or drop if not needed |
| `@mui/material` + icons | ~30MB | Used | **Replace** — too heavy for a wallet UI |
| `@toruslabs/*` (5 packages) | ~10MB | v3-13 mixed | **Abstract** — core dependency but versions are scattered |
| `@web3auth/*` | ~5MB | v7.3.2 | Keep — essential for key management |
| `firebase` | ~15MB | v9.12.1 | **Drop if possible** — only for social login |
| `@biconomy/mexa` | ~5MB | Legacy | **Drop** — gasless tx is unused/broken |
| `@cere/freeport-sc-sdk` | Unknown | Cere internal | **Drop** — NFT marketplace specific |
| `@cere/torus-embed` | Fork | Cere's fork | **Replace** — this is the iframe injector |
| `react-scripts` / `craco` | ~50MB | Legacy CRA | **Replace** with Vite |
| `mobx` | ~5MB | v6.6.2 | **Replace** with lighter state mgmt |

### Outdated
- TypeScript 4.8 → should be 5.x
- React Scripts 5.0 (CRA) → dead project, use Vite
- NestJS 8 → should be 10
- `tslint` → use ESLint

---

## Known Issues from Proofi Work

1. **Hardcoded keypair signing:** All chains derive from a single Web3Auth private key. No way to use different keys for different purposes (e.g., signing with a credential-specific key vs wallet key). The engine has `getPrivateKey()` as a single function — one key to rule them all.

2. **No manifest system:** No concept of "this app needs these capabilities" or "this credential requires this signing method." The application registration is just `appId + address + data blob`.

3. **No tag-query:** The application model has no metadata, no tagging, no querying by capability. You can only look up by `appId` and `address`.

4. **Popup-based signing flow:** Every sign request opens a popup/modal for user confirmation. This is fine for user-initiated transactions but terrible for automated/batch operations that Proofi needs.

5. **No delegated signing:** Can't sign on behalf of a user with a scoped key. It's all-or-nothing with the master key.

6. **ed25519_signPayload marked as "dangerous":** The codebase itself acknowledges this is a security concern but doesn't address it.

---

## Recommended Approach

### Keep (extract and clean up)
1. **embed-wallet public API shape** — The `init/connect/provider/signer` pattern is a good interface. Keep the contract, rewrite internals.
2. **wallet-engine Engine abstraction** — The `Engine` class extending `JsonRpcEngine` with event forwarding and `pushEngine` for sub-engines is clever. Worth keeping as a pattern.
3. **Account derivation** (`accounts.ts`) — The `pairFactoryMap` pattern for multi-chain key derivation is clean. Keep and extend.
4. **embed-wallet-inject** — 145 LOC, works fine, keep as-is.
5. **Auth flows from API** — OTP email + Telegram auth are battle-tested. Port to a simpler framework.

### Gut (strip out, don't need)
1. **All 24 MobX stores** — God object pattern, untestable, over-engineered
2. **MUI component library** — Too heavy, too generic
3. **Firebase social login** — Unless you need Google/Apple sign-in
4. **Biconomy gasless transactions** — Broken/unused
5. **Freeport/NFT marketplace code** — Cere-specific, not relevant to Proofi
6. **Game-specific promotional code** — Dead weight
7. **Analytics module** — Not needed
8. **Collectibles/Assets/TopUp/Exchange stores** — Wallet features Proofi doesn't need

### Rewrite from scratch
1. **Key management layer** — Need multi-keypair support, manifest-based key selection, scoped signing
2. **State management** — Replace MobX god-object with focused, composable state (zustand or lightweight stores)
3. **Build system** — Replace CRA/CRACO with Vite
4. **UI layer** — Tailwind + headless components (Radix) instead of MUI
5. **API** — Ditch NestJS for something lighter (Hono, Fastify, or even Cloudflare Workers)
6. **Communication layer** — Simplify the JSON-RPC mux. Keep postMessage but strip Torus-specific abstractions

---

## Effort Estimate

| Component | Action | Effort | Priority |
|---|---|---|---|
| Key management / signing | Rewrite | 2-3 weeks | 🔴 P0 — Core |
| Manifest system + tag-query | New | 1-2 weeks | 🔴 P0 — Core |
| Auth flows (OTP + Telegram) | Port | 3-5 days | 🟠 P1 — Needed early |
| SDK (embed-wallet interface) | Rewrite internals | 1 week | 🟠 P1 — Public API |
| Communication layer | Simplify | 3-5 days | 🟡 P2 — After core |
| Wallet UI (minimal) | Rewrite | 1-2 weeks | 🟡 P2 — Can iterate |
| Build/tooling (Vite, TS5) | Setup | 2-3 days | 🟢 P3 — One-time |
| Polkadot extension inject | Keep as-is | 0 days | 🟢 Done |
| API (simplified) | Rewrite | 1 week | 🟡 P2 |

**Total estimate:** 6-10 weeks for a clean, focused rebuild.

---

## Priority Order for Clean Rebuild

1. **Scaffolding** (2-3 days) — Vite monorepo, TS5, ESLint, basic CI
2. **Key management engine** (2-3 weeks) — Multi-keypair, manifest-aware signing, scoped keys
3. **Auth service** (3-5 days) — Port OTP + Telegram auth to lightweight API
4. **SDK interface** (1 week) — New embed-wallet with clean internals, no Torus dependency
5. **Communication** (3-5 days) — Simplified postMessage protocol
6. **Minimal wallet UI** (1-2 weeks) — Just auth + sign confirmation + account view
7. **Tag-query + manifest system** (1-2 weeks) — The key differentiator for Proofi
8. **Polish + testing** (1 week) — Unit tests for signing, integration tests for auth

---

## Bottom Line

The cere-wallet codebase is a **standard Web3 wallet with too much complexity for what it does.** It was built for a general-purpose crypto wallet (assets, collectibles, top-up, exchange rates) when what Proofi needs is a **credential signing engine with a thin wallet UI.**

**~70% of the code is irrelevant to Proofi's needs.** The remaining 30% (key derivation, engine pattern, auth flows) is worth understanding but not worth patching — the architectural assumptions (single master key, popup-for-everything, MobX god-object) make incremental refactoring more expensive than a clean rebuild.

**Recommendation: Start fresh, cherry-pick patterns, don't fork-and-modify.**

The wallet-engine's `Engine` class and `accounts.ts` key derivation are the most valuable code to reference. Everything else should be rebuilt with Proofi's specific requirements in mind.
