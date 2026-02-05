# Proofi Wallet — PRD v1: "Best Data Wallet Ever Built"

**Date:** 2026-02-05
**Author:** Claudemart (AI) + Mart (Human)
**Status:** Draft → Ready for execution
**Repo:** `Brommah/proofi-wallet`
**Deployment:** Railway (API) + Vercel (UI)

---

## 0. Executive Summary

Proofi Wallet is a self-custodial credential wallet built on Cere Network. It lets users sign verifiable credentials with keys they own, store data on DDC (decentralized data cloud), and send/receive CERE tokens.

**Current state:** Working MVP with auth (OTP + PIN), key derivation, DDC storage, credential issuance, token transfers, and Polkadot extension injection. Deployed on mainnet.

**Goal:** Harden this into a production-grade data wallet that is secure, reliable, and delightful to use. This PRD identifies every gap and organizes work into parallel workstreams.

---

## 1. E2E Audit — Issues Found

### 🔴 CRITICAL (Security)

| # | Issue | Location | Risk |
|---|-------|----------|------|
| C1 | **MASTER_SECRET defaults to `dev-master-secret-change-in-production`** | `api/config/env.ts` | If not overridden in Railway, all derivation salts are predictable → anyone can derive any wallet |
| C2 | **JWT_SECRET defaults to `dev-secret-change-me`** | `api/config/env.ts` | Predictable JWT signing key in production |
| C3 | **Wallet passphrase hardcoded as `roezel`** | `api/ddc/service.ts` | Server wallet passphrase in source code |
| C4 | **OTP dev backdoor `000000` active when NODE_ENV=development** | `api/otp/service.ts` | Must ensure NODE_ENV=production on Railway |
| C5 | **In-memory OTP store (MemoryOtpStore)** used in production | `api/server.ts` | OTPs lost on server restart; no rate limiting per IP; brute-force possible |
| C6 | **Backup index is in-memory (`backupIndex = new Map()`)** | `api/server.ts` | Key backups lost on server restart — users lose access to their backup CIDs |
| C7 | **`postMessage` origin validation uses `'*'`** in multiple places | `ui/stores/authStore.ts`, `ui/stores/walletStore.ts` | Any page can intercept wallet events |
| C8 | **No rate limiting on any API endpoint** | `api/server.ts` | OTP brute-force, DDoS on DDC storage endpoints |
| C9 | **CORS allows wildcard in config** | `api/middleware/cors.ts` | If `CORS_ORIGINS=*`, any domain can call the API |
| C10 | **JWT keys regenerated on every server restart** | `api/jwt/service.ts` | All existing JWTs invalidated on deploy; no key persistence |

### 🟡 HIGH (Reliability / Data Integrity)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| H1 | **No input validation/sanitization** on API endpoints | `api/server.ts` | Malformed JSON, XSS via memo content, oversized payloads |
| H2 | **DDC index race condition** partially solved (in-memory lock) but **not cross-instance** | `api/ddc/service.ts` | Multiple Railway instances = lost index entries |
| H3 | **No health check for DDC connection** (lazy init, fails silently) | `api/ddc/service.ts` | Users get cryptic errors if DDC is down |
| H4 | **`better-sqlite3` databases in `packages/api/data/`** — ephemeral on Railway | `api/users/store.ts`, `api/memos/store.ts` | Users lose their email→address mapping on redeploy |
| H5 | **No backup/recovery flow** if user forgets PIN | UI + API | Wallet is gone forever (by design, but no warning/recovery UX) |
| H6 | **`localStorage` as sole key storage** — cleared on browser data wipe | `ui/stores/authStore.ts` | Encrypted seed gone → wallet gone |
| H7 | **No credential revocation mechanism** | Core/API | Issued credentials can never be revoked |
| H8 | **SignScreen not implemented** — referenced in App.tsx but empty/missing handler | `ui/src/screens/SignScreen.tsx` | SDK sign requests from host apps may fail silently |

### 🟢 MEDIUM (UX / Code Quality)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| M1 | **No error boundaries** in React app | `ui/src/App.tsx` | Unhandled errors show white screen |
| M2 | **No loading states** for DDC operations (can take 5-10s) | `ui/src/screens/DdcScreen.tsx` | Users think app is frozen |
| M3 | **No offline support** — requires API + DDC connectivity | UI | Dead app without internet |
| M4 | **Test coverage is minimal** — only KeyringManager + Credentials | All packages | Regressions likely |
| M5 | **SDK `ProofiProvider` is a stub** — no actual chain queries | `sdk/src/ProofiProvider.ts` | Host apps can't query chain via SDK |
| M6 | **No TypeScript strict mode** | `tsconfig.json` | Type safety gaps |
| M7 | **Console logs everywhere** in production code | All packages | Noisy, potential info leak |
| M8 | **No API versioning** | `api/server.ts` | Breaking changes affect all clients |
| M9 | **Dockerfile installs ALL dependencies** including devDependencies | `Dockerfile` | Larger image, slower deploys |
| M10 | **No CI/CD pipeline** | Repository | No automated testing/linting on PR |

### 🔵 LOW (Nice-to-have)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| L1 | **No multi-language support** | UI | International users excluded |
| L2 | **No dark/light theme toggle** (dark only) | UI | Accessibility |
| L3 | **No transaction history view** | UI | Users can't see past transfers |
| L4 | **No credential sharing/presentation protocol** | Core/SDK | Can't selectively disclose credentials |
| L5 | **No mobile-optimized PWA manifest** | UI | Can't install as app |
| L6 | **No analytics/telemetry** | All | No usage insights |

---

## 2. Workstreams

### WS1: Security Hardening 🔴
**Priority:** IMMEDIATE — blocks everything else
**Estimated effort:** 4-6 hours

| Task | Issue | Action |
|------|-------|--------|
| 1.1 | C1, C2 | Add startup validation: crash if MASTER_SECRET or JWT_SECRET are default values in production |
| 1.2 | C3 | Move wallet passphrase to env var `CERE_WALLET_PASSPHRASE` (already partially done, just remove default) |
| 1.3 | C4 | Gate OTP backdoor behind explicit `ALLOW_DEV_OTP=true` env var |
| 1.4 | C5 | Replace `MemoryOtpStore` with `RedisOtpStore` (Redis adapter already exists, just need Redis on Railway) |
| 1.5 | C6 | Persist backup index to DDC or SQLite, not in-memory |
| 1.6 | C7 | Replace all `window.parent.postMessage(data, '*')` with specific origin |
| 1.7 | C8 | Add rate limiting middleware: 5 OTP/min/IP, 20 req/min/IP for DDC, 100 req/min/IP global |
| 1.8 | C9 | Validate CORS_ORIGINS on startup; reject `*` in production |
| 1.9 | C10 | Persist JWT keypair to file/env or use symmetric HS256 with env secret |
| 1.10 | H1 | Add Zod schemas for all request bodies; max payload size middleware |

### WS2: Data Persistence & Reliability 🟡
**Priority:** HIGH — data loss on redeploy is unacceptable
**Estimated effort:** 3-4 hours

| Task | Issue | Action |
|------|-------|--------|
| 2.1 | H4 | Migrate user store from SQLite to DDC or Railway-persistent volume |
| 2.2 | H2 | Implement DDC-level CAS (compare-and-swap) for index updates, or single-writer pattern |
| 2.3 | H3 | Add DDC connection health check endpoint + retry logic with exponential backoff |
| 2.4 | H6 | Implement cross-device key backup: encrypt seed → DDC, restore via email+PIN |
| 2.5 | C6 | Store backup CID index on DDC (tagged search) instead of in-memory Map |

### WS3: Core Wallet Features 🟡
**Priority:** HIGH — completing the wallet experience
**Estimated effort:** 4-5 hours

| Task | Issue | Action |
|------|-------|--------|
| 3.1 | H8 | Implement SignScreen: handle `wallet_signMessage` and `wallet_signPayload` RPC from SDK |
| 3.2 | H5 | Add PIN recovery UX: warn users, optional recovery phrase export |
| 3.3 | H7 | Add credential revocation: on-chain remark or DDC status update |
| 3.4 | L3 | Add transaction history screen (query Cere subscan or chain directly) |
| 3.5 | M5 | Implement `ProofiProvider` with actual chain queries (balance, transfer) |
| 3.6 | L4 | Selective disclosure: generate verifiable presentations from stored credentials |

### WS4: Code Quality & Testing 🟢
**Priority:** MEDIUM — prevents regressions
**Estimated effort:** 3-4 hours

| Task | Issue | Action |
|------|-------|--------|
| 4.1 | M4 | Add API integration tests (OTP flow, DDC store/read, auth) |
| 4.2 | M4 | Add UI component tests (auth flow, PIN screen, wallet store) |
| 4.3 | M6 | Enable TypeScript strict mode across all packages |
| 4.4 | M7 | Replace console.log with structured logger (pino) with log levels |
| 4.5 | M1 | Add React error boundaries with user-friendly fallback |
| 4.6 | M10 | Set up GitHub Actions CI: lint, typecheck, test on PR |
| 4.7 | M8 | Add `/v1/` prefix to all API routes |
| 4.8 | M9 | Multi-stage Dockerfile: build in full image, run in slim |

### WS5: UX Polish 🔵
**Priority:** LOW — after stability
**Estimated effort:** 2-3 hours

| Task | Issue | Action |
|------|-------|--------|
| 5.1 | M2 | Add skeleton loaders + optimistic updates for DDC operations |
| 5.2 | M3 | Basic offline mode: cache last-known data, show stale indicator |
| 5.3 | L5 | Add PWA manifest + service worker for installability |
| 5.4 | L2 | Add theme toggle (dark default, light option) |
| 5.5 | - | Onboarding flow: explain what Proofi is, what credentials are, why it matters |

---

## 3. Execution Plan

```
Phase 1 (NOW):     WS1 (Security) + WS2 (Persistence)  ← parallel
Phase 2 (NEXT):    WS3 (Features) + WS4 (Quality)      ← parallel  
Phase 3 (POLISH):  WS5 (UX)                             ← sequential
```

Each workstream is assigned to a sub-agent that works independently. They commit to the same repo on feature branches and PR to main.

### Branch Strategy
- `security/hardening` — WS1
- `fix/data-persistence` — WS2
- `feat/core-wallet` — WS3
- `chore/quality` — WS4
- `feat/ux-polish` — WS5

---

## 4. Success Criteria

- [ ] Zero hardcoded secrets in production
- [ ] OTP brute-force protected (rate limit + Redis)
- [ ] User data survives server restarts and redeploys
- [ ] All postMessage calls use specific origins
- [ ] JWT keys persist across restarts
- [ ] SignScreen handles SDK sign requests
- [ ] ≥80% test coverage on core + API
- [ ] CI pipeline catches regressions
- [ ] PIN recovery flow exists (even if "export recovery phrase")
- [ ] Transaction history visible in wallet

---

## 5. Architecture Decision: What Makes This "The Best"

The best data wallet isn't the one with the most features — it's the one users trust. Trust comes from:

1. **Zero-knowledge key derivation** ✅ (server never sees private key)
2. **Decentralized storage** ✅ (DDC, not a database)
3. **Verifiable credentials** ✅ (W3C standard, cryptographic proof)
4. **Wallet-signature auth** ✅ (no passwords, no sessions)
5. **Self-custody** ✅ (user owns keys)

What's missing for "best ever":
- **Formal security audit** (after hardening)
- **Key backup that actually works cross-device**
- **Credential presentation protocol** (selective disclosure)
- **Transaction history** (users need to see what happened)
- **Recovery flow** (PIN forgotten ≠ life ruined)

This PRD addresses all of these.
