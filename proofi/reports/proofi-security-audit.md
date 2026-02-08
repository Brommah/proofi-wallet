# Proofi Wallet — Security & Encryption Audit

**Date:** 2025-07-15  
**Scope:** Full codebase — `@proofi/api`, `@proofi/ui`, `@proofi/core`, `@proofi/sdk`, `@proofi/comm`, `@proofi/inject`  
**Auditor:** Automated code review (Claude)  
**Risk Levels:** 🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🟢 LOW | ℹ️ INFO

---

## Executive Summary

Proofi Wallet implements a non-custodial identity wallet where private keys are derived client-side from a user's PIN + server-provided salt. The architecture follows good security principles: the server never sees the private key, credentials are stored on Cere DDC (decentralized storage), and authentication supports both JWT and wallet signature-based auth.

**However, the current implementation has significant gaps** in encryption at rest, key derivation strength, session management, SDK sandboxing, and backup security. This report details 27 findings across 8 categories.

**Overall Risk Assessment:** 🟠 **HIGH** — The core architecture is sound, but multiple medium-to-high severity issues need addressing before production readiness.

---

## Table of Contents

1. [Authentication Flow](#1-authentication-flow)
2. [Private Key Storage](#2-private-key-storage)
3. [DDC Storage Security](#3-ddc-storage-security)
4. [PIN & Key Derivation Security](#4-pin--key-derivation-security)
5. [API Security](#5-api-security)
6. [SDK & iframe Security](#6-sdk--iframe-security)
7. [What's Missing](#7-whats-missing)
8. [Recommendations by Priority](#8-recommendations-by-priority)

---

## 1. Authentication Flow

### Current Implementation

The auth flow is a two-phase process:

```
Phase 1: Email OTP Verification
  User enters email → Server sends 6-digit OTP → User verifies OTP
  → Server returns: JWT token + derivation salt + hasAddress flag

Phase 2: PIN-based Wallet Derivation (client-side)
  Client: PBKDF2(PIN, derivationSalt) → 32-byte seed → sr25519 keypair
  Client sends only public address to server for registration
```

**Dual auth modes supported:**
- **Signature auth (primary):** `Authorization: Signature {address}:{timestamp}:{signature}`
- **JWT auth (legacy fallback):** `Authorization: Bearer {token}`

### Findings

#### ✅ F-01: Server Never Sees Private Keys (GOOD)
The v2 architecture correctly keeps key derivation client-side. The server only receives and stores the public wallet address. The `deriveUserSeed()` server-side function is deprecated and marked as migration-only.

#### 🟡 F-02: Dev OTP Backdoor Active
**File:** `api/src/otp/service.ts:40-43`
```typescript
if (env.NODE_ENV === 'development' && otp === '000000') {
  // Accepts 000000 as valid OTP in dev mode
}
```
**Risk:** If `NODE_ENV` is misconfigured in production, any OTP can be bypassed with `000000`.  
**Mitigation:** Add explicit safeguard that checks for actual deployment environment, not just env var.

#### 🟡 F-03: OTP Code Exposed in Dev Response
**File:** `api/src/server.ts:60-63`
```typescript
if (env.NODE_ENV === 'development' && !env.SMTP_HOST) {
  return c.json({ ...result, devCode: record.code });
}
```
**Risk:** Same `NODE_ENV` misconfiguration risk as F-02.

#### 🟡 F-04: Signature Replay Window Is 5 Minutes
**File:** `api/src/auth/signature.ts:36`
```typescript
maxAgeMs = 5 * 60 * 1000  // 5 minutes
```
**Risk:** A captured signature auth header can be replayed for up to 5 minutes. No nonce tracking prevents replay within the window.  
**Impact:** If HTTPS is compromised (MITM, proxy logs), API calls can be replayed.

#### 🟠 F-05: No OTP Rate Limiting Per IP
**File:** `api/src/otp/service.ts:18-22`  
Rate limiting only checks per-email (60s cooldown). There is **no per-IP rate limiting**, allowing an attacker to enumerate emails or brute-force OTPs from a single IP by trying different email addresses.

#### 🟡 F-06: OTP Brute-Force Window
6-digit numeric OTP = 1,000,000 combinations. With no per-IP rate limiting and a 5-minute TTL, an attacker could attempt ~5000 requests/second × 300 seconds = 1.5M attempts — sufficient to brute-force any active OTP.

---

## 2. Private Key Storage

### Current Implementation

```
Client-side key lifecycle:
1. Derive seed: PBKDF2(PIN, serverSalt, 100k iterations, SHA-256) → 32-byte seed
2. Create keypair: sr25519 from seed
3. Encrypt for storage: AES-256-GCM(seed, PBKDF2(PIN, 'proofi-encrypt', 50k iterations))
4. Store in localStorage:
   - proofi_encrypted_seed: base64(IV + ciphertext)
   - proofi_address: public address (plaintext)
   - proofi_token: JWT (plaintext)
   - proofi_email: email (plaintext)
```

### Findings

#### 🟠 F-07: Encrypted Seed in localStorage — XSS Vulnerable
**File:** `ui/src/stores/authStore.ts:140`  
`localStorage` is accessible to any JavaScript running in the same origin. An XSS vulnerability would expose the encrypted seed, JWT token, email, and address. While the seed is encrypted, the JWT and PIN (if keylogged) would allow full account takeover.

**Contrast:** Production wallets typically use:
- `sessionStorage` (survives only the tab lifecycle)
- In-memory only (cleared on page close)
- Web Crypto API's non-exportable keys
- Hardware-backed storage (WebAuthn/FIDO2)

#### 🟡 F-08: Static Encryption Salt for Seed Storage
**File:** `ui/src/stores/authStore.ts:81`
```typescript
salt: encoder.encode('proofi-encrypt'),  // Static salt!
```
PBKDF2 for the AES key derivation uses a **hardcoded string** `'proofi-encrypt'` as the salt. This means:
- All users' encryption keys are derived from PIN + identical salt
- Rainbow tables become viable across users with the same PIN
- Recommended: Use a per-user random salt stored alongside the ciphertext.

#### 🟡 F-09: Lower Iteration Count for Encryption vs Derivation
- Seed derivation: 100,000 iterations (reasonable)
- Seed encryption: 50,000 iterations (weaker)

The encryption PBKDF2 uses half the iterations of the derivation step. Since both protect the same secret (the seed), the encryption step is the weaker link.

#### 🟡 F-10: PinUnlockModal Accepts 4-Digit PIN
**File:** `ui/src/components/PinUnlockModal.tsx:105`
```typescript
disabled={pin.length < 4 || loading}
```
The `PinUnlockModal` allows unlock attempts with PINs as short as 4 digits, while `PinScreen` enforces minimum 6 digits. Inconsistent enforcement.

#### ℹ️ F-11: Keypair Held in Zustand Store (In-Memory)
**File:** `ui/src/stores/walletStore.ts`  
After unlock, the full `KeyPairData` (including `secretKey`) lives in the Zustand store — a plain JavaScript object in memory. This is standard for web wallets but means:
- Browser devtools can inspect the key
- Memory dumps can extract it
- No automatic re-locking after timeout

---

## 3. DDC Storage Security

### Current Implementation

```
Storage architecture:
- Bucket: 1229 (hardcoded, Cere DDC mainnet)
- Server wallet pays for all DDC operations
- Data stored as JSON files on DDC
- Index per wallet: CNS name → CID → JSON index of all entries
- CDN URLs: https://cdn.ddc-dragon.com/1229/{cid}
```

### Findings

#### 🔴 F-12: DDC Data Is NOT Encrypted at Rest
**Files:** `api/src/ddc/service.ts:116-170`  
All memos, credentials, and wallet indexes are stored as **plaintext JSON** on DDC. The CDN URL pattern `https://cdn.ddc-dragon.com/1229/{cid}` means:

1. **Anyone who knows a CID can read the data** — no authentication required
2. **Wallet indexes are public** — the CNS name is derived from the wallet address (`pi-{last16chars}`)
3. **Email addresses are embedded in credentials** in plaintext:
   ```json
   "credentialSubject": {
     "email": "user@example.com",
     "address": "5..."
   }
   ```
4. **Memos contain author email** in plaintext
5. The `/ddc/list/:walletAddress` endpoint is **public (no auth required)** — anyone can enumerate all items for any wallet

**Impact:** Complete privacy failure. All user data (memos, credentials, emails, wallet addresses) is world-readable. This is the most critical finding.

#### 🟠 F-13: DDC Bucket Access Control
The Cere DDC bucket 1229 appears to be a shared bucket with the server wallet as payer. The DDC SDK uses the server wallet's credentials for all read/write operations. However:
- There is no per-user encryption
- There is no access control list (ACL) beyond DDC's bucket-level permissions
- If the bucket is public-read (which the CDN URLs suggest), anyone can enumerate all data

#### 🟡 F-14: Server Wallet Credentials on Filesystem
**File:** `api/src/ddc/service.ts:14-35`  
The Cere wallet JSON file is loaded from disk (`.secrets/cere-wallet.json`) with a **hardcoded default passphrase**:
```typescript
const WALLET_PASSPHRASE = process.env.CERE_WALLET_PASSPHRASE || 'roezel';
```
This wallet controls all DDC storage operations and pays for gas. If compromised, an attacker could:
- Write arbitrary data to the bucket
- Overwrite wallet indexes (CNS names)
- Drain the wallet's CERE balance

#### 🟠 F-15: Backup CID Index Is In-Memory Only
**File:** `api/src/server.ts:225`
```typescript
const backupIndex = new Map<string, string>();
```
The mapping from email → backup CID is stored in a JavaScript `Map` in server memory. On server restart, **all backup references are lost**. Users cannot recover their encrypted backups after a server restart.

#### 🟡 F-16: DDC Read Endpoint Has No Authentication
**File:** `api/src/server.ts:150-156`
```typescript
app.get('/ddc/read/:cid', async (c) => {
  const { cid } = c.req.param();
  const content = await ddcRead(cid);  // No auth check!
  return c.json({ ok: true, cid, content: JSON.parse(content) });
});
```
Anyone can read any CID through the API. Combined with the CDN being public, this doubles the attack surface.

---

## 4. PIN & Key Derivation Security

### Current Implementation

```
Key derivation chain:
  Server: HMAC-SHA256(MASTER_SECRET, email + ':proofi-salt-v2') → derivationSalt
  Client: PBKDF2(PIN, derivationSalt, 100000, SHA-256) → 32-byte seed
  Client: sr25519.fromSeed(seed) → keypair
```

### Findings

#### 🟠 F-17: PIN Entropy Is Low
PINs are 6-8 numeric digits → 10^6 to 10^8 possible values (1M to 100M). Even with PBKDF2 at 100k iterations:
- **6-digit PIN:** 1,000,000 × 100ms/hash ≈ 28 hours to brute-force on a single GPU
- **8-digit PIN:** 100,000,000 × 100ms/hash ≈ 116 days

However, with modern GPU clusters (e.g., 100 GPUs), a 6-digit PIN falls in **~17 minutes**.

If an attacker obtains:
1. The encrypted seed from localStorage (via XSS)
2. The derivation salt (sent over the wire, or derivable if MASTER_SECRET is compromised)

They can brute-force the PIN offline.

#### 🟠 F-18: Derivation Salt Is Deterministic
**File:** `api/src/keys/derive.ts:21-36`
```typescript
// HMAC(masterSecret, email + ':proofi-salt-v2')
```
The derivation salt is deterministic: same email always produces the same salt. This means:
- The salt never rotates
- If `MASTER_SECRET` is compromised, all users' salts are trivially computable
- Combined with a leaked encrypted seed, offline brute-force becomes a single PBKDF2 computation per PIN guess

#### 🟡 F-19: MASTER_SECRET Default Value
**File:** `api/src/config/env.ts:18`
```typescript
MASTER_SECRET: getEnv('PROOFI_MASTER_SECRET', 'dev-master-secret-change-in-production'),
```
Default value in code. If deployment fails to set the env var, all users' derivation salts become trivially predictable.

#### 🟡 F-20: No PIN Attempt Limiting Client-Side
The PIN entry (both PinScreen and PinUnlockModal) has **no lockout mechanism**. An attacker with physical access to the browser can try PINs indefinitely. Each attempt involves local PBKDF2 computation and address comparison — no server call needed.

---

## 5. API Security

### Findings

#### 🟡 F-21: No Rate Limiting on Any Endpoint
**No rate limiting middleware** is applied to any route. Endpoints vulnerable to abuse:
- `/auth/otp/send` — email flooding
- `/auth/otp/verify` — OTP brute-force
- `/ddc/memo`, `/ddc/credential` — storage spam (costs real CERE tokens)
- `/auth/register-address` — address squatting

#### 🟡 F-22: Minimal Input Validation
Input validation is limited to presence checks (`if (!email)`, `if (!memo)`). No validation for:
- Email format (allows arbitrary strings)
- Address format (no SS58 validation on register-address)
- Memo/credential size limits (could store arbitrarily large data on DDC)
- JSON injection in credential `claimData` (passed through to DDC as-is)

#### 🟡 F-23: CORS Configuration Allows Wildcard
**File:** `api/src/middleware/cors.ts:6`
```typescript
if (origins === '*') {
  return cors({ origin: '*' });
}
```
If `CORS_ORIGINS` is set to `'*'`, all origins are allowed. The default includes only localhost ports, but this should be validated in production.

#### 🟡 F-24: JWT Keys Are Ephemeral
**File:** `api/src/jwt/service.ts:16-21`
```typescript
const { privateKey, publicKey } = await jose.generateKeyPair('EdDSA', {
  crv: 'Ed25519',
});
```
A new Ed25519 keypair is generated on **every server restart**. This means:
- All existing JWTs become invalid after restart
- JWKS endpoint (`/.well-known/jwks.json`) returns a new key each time
- No support for key rotation with overlap period
- External verifiers cannot cache the key

---

## 6. SDK & iframe Security

### Findings

#### 🟡 F-25: No iframe `sandbox` Attribute
**File:** `sdk/src/IframeManager.ts:27-29`
```typescript
const iframe = document.createElement('iframe');
iframe.src = this.walletUrl;
iframe.allow = 'clipboard-read; clipboard-write';
// No sandbox attribute!
```
The iframe is created **without a `sandbox` attribute**. This grants the iframe full privileges including:
- Form submission
- Script execution
- Top-level navigation
- Popups

A compromised wallet UI could navigate the parent page, open popups, or submit forms.

**Recommended:** Add `sandbox="allow-scripts allow-same-origin allow-forms"` (minimum required permissions).

#### 🟡 F-26: postMessage Origin Validation Has Fallback to `'*'`
**File:** `sdk/src/IframeManager.ts:53-58`
```typescript
getOrigin(): string {
  try {
    const url = new URL(this.walletUrl);
    return url.origin;
  } catch {
    return '*';  // Falls back to wildcard!
  }
}
```
If `walletUrl` parsing fails, the origin falls back to `'*'`, meaning messages will be accepted from **any origin**. While unlikely in practice, this is a defense-in-depth failure.

#### 🟡 F-27: UI postMessage Uses Wildcard Origin
**File:** `ui/src/stores/authStore.ts:122`
```typescript
window.parent.postMessage({ type: 'PROOFI_OTP_SENT', email }, '*');
```
**All** `postMessage` calls from the wallet UI use `'*'` as the target origin. This means:
- Any parent page can receive wallet events
- Email addresses, wallet addresses, and authentication status are broadcast to all listeners
- A malicious embedding page receives all PROOFI_* events

**Fix:** The UI should track the parent's origin (received during `wallet_init`) and only post messages to that specific origin.

---

## 7. What's MISSING

### 🔴 Critical Missing Features

| Feature | Status | Impact |
|---------|--------|--------|
| **End-to-end encryption for DDC data** | ❌ Missing | All memos/credentials readable by anyone |
| **Key backup persistence** | ❌ In-memory only | Backups lost on server restart |
| **Rate limiting** | ❌ Missing | OTP brute-force, email flooding possible |

### 🟠 High Priority Missing Features

| Feature | Status | Impact |
|---------|--------|--------|
| **Session management / token rotation** | ❌ Missing | JWT valid for 1 hour, no refresh mechanism |
| **Automatic wallet re-locking** | ❌ Missing | Keypair stays in memory indefinitely |
| **PIN attempt limiting** | ❌ Missing | Unlimited PIN guesses offline |
| **Per-user random encryption salt** | ❌ Missing | Same PIN → same encryption key for all users |
| **Production OTP store** | Partial | MemoryOtpStore in use; RedisOtpStore defined but not used |
| **HTTPS enforcement** | ❌ Missing | No HSTS, no redirect from HTTP |

### 🟡 Medium Priority Missing Features

| Feature | Status | Impact |
|---------|--------|--------|
| **2FA / WebAuthn** | ❌ Missing | Single-factor after initial OTP |
| **Mnemonic/recovery phrase** | ❌ Missing | No human-readable backup mechanism |
| **Token refresh / rotation** | ❌ Missing | Must re-authenticate after JWT expiry |
| **Content Security Policy** | ❌ Missing | No CSP headers |
| **Request signing for mutations** | ❌ Missing | JWT-authed requests can be replayed |
| **Audit logging** | ❌ Missing | Only console.log, no structured audit trail |
| **Input sanitization** | ❌ Missing | Credential data stored as-is |
| **Error message information leakage** | Partial | Some errors expose internal details |

### 🟢 Low Priority / Nice-to-Have

| Feature | Status | Impact |
|---------|--------|--------|
| **Key rotation support** | ❌ Missing | Cannot rotate wallet keys |
| **Selective disclosure** | ❌ Missing | Credentials are all-or-nothing |
| **Revocation support** | ❌ Missing | Cannot revoke issued credentials |
| **Multi-device sync** | ❌ Missing | Each device derives independently |
| **Export/import wallet** | Partial | Backup exists but unreliable |
| **Polkadot.js extension compatibility** | ✅ `@proofi/inject` exists | Basic Polkadot injector implemented |

---

## 8. Recommendations by Priority

### 🔴 P0 — Fix Before Any Production Use

#### R-01: Encrypt All DDC Data at Rest
**Addresses:** F-12, F-13  
**Effort:** Large  

Implement client-side encryption before storing to DDC:
```
1. Generate per-item AES-256-GCM key
2. Encrypt data client-side before sending to API
3. Store encrypted blob on DDC
4. Store encryption key in wallet index (itself encrypted with wallet's key)
5. Only the wallet owner can decrypt
```

For public credentials (meant to be verified), use a dual model:
- Private data: encrypted with wallet key
- Verifiable credentials: signed but public (by design)

#### R-02: Implement Rate Limiting
**Addresses:** F-05, F-06, F-21  
**Effort:** Small  

Add rate limiting middleware (e.g., `hono-rate-limiter` or custom):
- `/auth/otp/send`: 3 requests per email per hour, 10 per IP per hour
- `/auth/otp/verify`: 5 attempts per email per OTP lifetime, lockout after
- `/ddc/*` write endpoints: 30 requests per wallet per minute
- Global: 100 requests per IP per minute

#### R-03: Persist Backup Index
**Addresses:** F-15  
**Effort:** Small  

Move backup CID index from `Map<string, string>` to SQLite (like `users.db`). Or better: store the backup CID in the user's DDC wallet index.

### 🟠 P1 — Fix Before Beta

#### R-04: Use Random Salt for Seed Encryption
**Addresses:** F-08  
**Effort:** Small  

Replace static salt `'proofi-encrypt'` with `crypto.getRandomValues(new Uint8Array(16))`. Store the salt alongside the encrypted seed in localStorage.

#### R-05: Add iframe Sandbox Attribute
**Addresses:** F-25  
**Effort:** Small  

```typescript
iframe.sandbox = 'allow-scripts allow-same-origin allow-forms';
```

#### R-06: Fix postMessage Origins
**Addresses:** F-26, F-27  
**Effort:** Medium  

1. UI: Accept parent origin during `wallet_init` RPC call
2. UI: Use specific origin for all `window.parent.postMessage()` calls
3. SDK: Remove `'*'` fallback in `getOrigin()`

#### R-07: Implement Session Management
**Addresses:** Missing session management  
**Effort:** Medium  

- Add refresh token mechanism (long-lived opaque token + short-lived JWT)
- Implement automatic wallet re-lock after configurable inactivity timeout (default: 5 minutes)
- Clear keypair from Zustand store on lock
- Require PIN re-entry for signing after lock

#### R-08: Secure the Dev Backdoors
**Addresses:** F-02, F-03  
**Effort:** Small  

```typescript
// Use explicit flag, not just NODE_ENV
const DEV_BACKDOOR = process.env.PROOFI_DEV_BACKDOOR === 'true' && env.NODE_ENV === 'development';
```

#### R-09: Increase PIN Minimum & Add Passphrase Option
**Addresses:** F-17  
**Effort:** Small  

- Consider allowing alphanumeric passphrases (not just numeric PINs)
- If PIN-only: minimum 8 digits, recommend password manager storage
- Increase PBKDF2 iterations to 600,000 (OWASP 2023 recommendation for SHA-256)

### 🟡 P2 — Fix Before v1.0

#### R-10: Add Content Security Policy
**Effort:** Small  
Add CSP headers to both API and UI:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; frame-ancestors 'self' https://*.proofi.com
```

#### R-11: Add Nonce to Signature Auth
**Addresses:** F-04  
**Effort:** Medium  
Include a server-issued nonce in the signature auth to prevent replay:
```
1. Client requests nonce from server
2. Client signs: proofi:{nonce}:{timestamp}:{address}
3. Server validates nonce hasn't been used
4. Server marks nonce as consumed
```

#### R-12: Add Input Validation
**Addresses:** F-22  
**Effort:** Medium  
Use a validation library (Zod) for all endpoints:
- Email: RFC 5322 format
- Address: SS58 format check
- Memo: Max 10KB
- Credential data: Max 100KB, JSON schema validation

#### R-13: Persist JWT Signing Keys
**Addresses:** F-24  
**Effort:** Medium  
Store the Ed25519 signing key in the secrets directory. Support key rotation with a grace period where both old and new keys are valid.

#### R-14: Add Structured Audit Logging
**Effort:** Medium  
Replace `console.log` with structured logging including:
- Auth events (OTP sent, verified, failed)
- Wallet registrations
- DDC operations
- Failed auth attempts with IP

#### R-15: PIN Lockout Mechanism
**Addresses:** F-20  
**Effort:** Small  
After 5 failed PIN attempts:
- Add exponential backoff (2^n seconds delay)
- After 10 failures, require OTP re-verification

---

## Architecture Diagram (Current State)

```
┌──────────────────────────────────────────────────────────────────┐
│ Host Application                                                  │
│  ┌─────────────────────┐    postMessage     ┌──────────────────┐ │
│  │ @proofi/sdk         │◄──────────────────►│ @proofi/ui       │ │
│  │  ProofiWallet       │    (via @proofi/   │  (iframe)        │ │
│  │  IframeManager      │     comm)          │                  │ │
│  │  ProofiSigner       │                    │  Zustand stores  │ │
│  └─────────────────────┘                    │  - authStore     │ │
│                                              │  - walletStore   │ │
│                                              │  - requestStore  │ │
│                                              └────────┬─────────┘ │
└──────────────────────────────────────────────────────┬───────────┘
                                                        │ HTTPS
                                                        ▼
                                              ┌──────────────────┐
                                              │ @proofi/api      │
                                              │  Hono server     │
                                              │                  │
                                              │  Auth: OTP + JWT │
                                              │  + Signature     │
                                              │                  │
                                              │  SQLite:         │
                                              │  - users.db      │  
                                              │  - memos.db      │
                                              │    (legacy)      │
                                              │                  │
                                              │  In-memory:      │
                                              │  - OTP store ⚠️  │
                                              │  - backup index ⚠️│
                                              └────────┬─────────┘
                                                        │
                                                        ▼
                                              ┌──────────────────┐
                                              │ Cere DDC Mainnet │
                                              │  Bucket #1229    │
                                              │                  │
                                              │  ⚠️ All data     │
                                              │    UNENCRYPTED   │
                                              │                  │
                                              │  ⚠️ Public CDN   │
                                              │    readable      │
                                              └──────────────────┘
```

---

## Security Properties Summary

| Property | Status | Details |
|----------|--------|---------|
| Non-custodial keys | ✅ | Server never sees private keys (v2) |
| Key derivation | ⚠️ | PBKDF2 100k iterations, but low PIN entropy |
| Encrypted seed storage | ⚠️ | AES-GCM but static salt, in localStorage |
| Transport security | ⚠️ | No HTTPS enforcement, no HSTS |
| Data at rest (DDC) | ❌ | Plaintext JSON, world-readable |
| Data at rest (server) | ⚠️ | SQLite unencrypted but only stores email↔address |
| Authentication | ⚠️ | OTP + JWT works but no rate limiting |
| Signature auth | ✅ | sr25519 signature verification is solid |
| Session management | ❌ | No refresh tokens, no auto-lock |
| iframe sandboxing | ❌ | No sandbox attribute |
| Origin validation | ⚠️ | Comm layer validates but UI broadcasts to '*' |
| Credential integrity | ✅ | sr25519 signatures, verifiable on-chain |
| Credential privacy | ❌ | Email and PII in plaintext on DDC |
| Backup/recovery | ❌ | In-memory index, lost on restart |

---

## Appendix: Files Reviewed

### @proofi/api (16 files)
- `src/main.ts`, `src/server.ts`, `src/index.ts`
- `src/config/env.ts`
- `src/middleware/cors.ts`, `src/middleware/auth.ts`
- `src/jwt/service.ts`
- `src/auth/signature.ts`
- `src/keys/derive.ts`
- `src/otp/service.ts`, `src/otp/store.ts`, `src/otp/email.ts`
- `src/ddc/service.ts`
- `src/users/store.ts`, `src/apps/store.ts`, `src/memos/store.ts`

### @proofi/ui (12 files)
- `src/App.tsx`, `src/main.tsx`
- `src/stores/authStore.ts`, `src/stores/walletStore.ts`, `src/stores/requestStore.ts`
- `src/screens/LoginScreen.tsx`, `src/screens/PinScreen.tsx`, `src/screens/SignScreen.tsx`, `src/screens/ConnectScreen.tsx`, `src/screens/AccountScreen.tsx`, `src/screens/DdcScreen.tsx`
- `src/components/PinUnlockModal.tsx`
- `src/lib/signatureAuth.ts`, `src/lib/cere.ts`

### @proofi/core (5 files)
- `src/index.ts`, `src/types.ts`
- `src/keyring/KeyringManager.ts`
- `src/credentials/CredentialBuilder.ts`, `src/credentials/CredentialVerifier.ts`

### @proofi/sdk (5 files)
- `src/index.ts`, `src/types.ts`
- `src/ProofiWallet.ts`, `src/IframeManager.ts`, `src/ProofiSigner.ts`

### @proofi/comm (5 files)
- `src/index.ts`, `src/types.ts`, `src/utils.ts`
- `src/MessageChannel.ts`, `src/RpcChannel.ts`
