# Proofi Security Audit Report

**Date:** 2026-02-08  
**Auditor:** Clawdbot Security Auditor  
**Scope:** Proofi main repo, agent SDK, chrome extension, health-analyzer agent  
**Severity Levels:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low | ℹ️ Info

---

## Executive Summary

The Proofi system implements a privacy-first architecture with end-to-end encryption using industry-standard cryptographic primitives (AES-256-GCM, X25519, Ed25519/sr25519). Overall security posture is **Good** with some issues requiring attention. The main concerns are around secrets management in development environments and some API security hardening.

| Category | Status |
|----------|--------|
| Token Generation & Validation | ✅ Good |
| Encryption (AES-256-GCM, X25519) | ✅ Excellent |
| Key Management | 🟡 Needs Improvement |
| DDC Storage Security | ✅ Good |
| Wallet Integration | ✅ Good |
| API Endpoints | 🟡 Needs Improvement |
| Secrets in Code | 🟠 Issues Found |
| Sensitive Data Leaks | 🟡 Minor Issues |

---

## Findings

### 🔴 CRITICAL

#### C1: Plaintext Wallet Passphrase in .env File
**Location:** `/private/tmp/proofi-agents-check/health-analyzer/.env`
```
USER_WALLET_PASSPHRASE=roezel
AGENT_WALLET_PASSPHRASE=agent-secret
```

**Risk:** If this file is accidentally committed or leaked, wallet keys can be compromised.

**Recommendation:**
- Use environment-specific secret management (Vercel secrets, AWS Secrets Manager, HashiCorp Vault)
- Never store plaintext passphrases in files that could be version controlled
- Consider using hardware security modules (HSM) for production wallet operations

---

### 🟠 HIGH

#### H1: Private Keys Stored in JSON Files
**Locations:**
- `~/clawd/proofi/agents/health-analyzer/keys/agent-keypair.json`
- `/private/tmp/proofi-agents-check/health-analyzer/keys/agent-keypair.json`

**Content:**
```json
{
  "publicKey": "...",
  "privateKey": "zh2hCqbVaJ5Ipq01GGztF1iN13euxxsguLp8Y5zhGHs=",
  "createdAt": "...",
  "algorithm": "X25519"
}
```

**Risk:** Private keys are stored unencrypted on disk. While chmod 600 is set, this is insufficient for production.

**Recommendation:**
- Encrypt private keys at rest using a master key derived from a passphrase or HSM
- Use secure enclaves (SGX, AWS Nitro Enclaves) for key operations in production
- Consider using PKCS#11 or similar key management standards

#### H2: Debug Endpoint Leaks Sensitive Information
**Location:** `~/clawd/proofi/api/debug-env.js`
```javascript
passwordPreview: password ? password.slice(0, 3) + '***' : null,
```

**Risk:** Even partial password disclosure is a security risk. This endpoint should not exist in production.

**Recommendation:**
- Remove this endpoint entirely
- If debugging is needed, use proper logging with redaction
- Add authentication to any debug endpoints

#### H3: Vercel OIDC Tokens in Local Files
**Locations:**
- `~/clawd/proofi/.env.local`
- `~/clawd/proofi/.env.vercel`

**Risk:** These files contain JWTs that could be used to impersonate the deployment.

**Recommendation:**
- Verify `.gitignore` includes `.env*` (✅ already present)
- Add file monitoring/alerts for unauthorized access
- Rotate tokens regularly

---

### 🟡 MEDIUM

#### M1: CORS Allows All Origins
**Multiple Locations:**
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
```

**Files Affected:**
- `api/ddc/store.js`
- `api/ddc/revoke.js`
- `api/drop/upload.js`
- `health-analyzer/src/server.ts`

**Risk:** Any website can call these APIs, potentially enabling CSRF attacks or unauthorized data access.

**Recommendation:**
- Whitelist specific origins for production
- Implement proper CORS configuration:
```javascript
const allowedOrigins = ['https://proofi.vercel.app', 'https://proofi.io'];
const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
}
```

#### M2: Token Revocation Uses In-Memory Storage
**Location:** `~/clawd/proofi/api/ddc/revoke.js`
```javascript
const revocationList = new Map();
```

**Risk:** Revocations are lost on server restart/cold start. Tokens could be used after revocation.

**Recommendation:**
- Implement persistent storage (Redis, Vercel KV, or on-chain)
- The code already has comments about on-chain storage - prioritize this
- Add revocation synchronization across instances

#### M3: Signature Verification Fails Open in Revocation
**Location:** `~/clawd/proofi/api/ddc/revoke.js:109-112`
```javascript
} catch (error) {
    console.error('Signature verification failed:', error);
    // For demo purposes, accept the revocation
    return true;
}
```

**Risk:** Anyone can revoke any token without proper authorization.

**Recommendation:**
- Remove the `return true` fallback
- Properly implement Ed25519 signature verification
- Return `false` on verification failure

#### M4: Console Logging May Leak Sensitive Data
**Various Locations:** Audit logs and server logs contain:
- Token IDs
- Wallet addresses
- Data hashes

**Risk:** Log aggregation could expose sensitive information.

**Recommendation:**
- Implement structured logging with automatic redaction
- Never log tokens, keys, or passphrases
- Use log levels appropriately

#### M5: No Rate Limiting on API Endpoints
**All API Routes**

**Risk:** APIs can be abused for:
- DoS attacks
- Token brute-forcing
- Resource exhaustion

**Recommendation:**
- Implement rate limiting per IP/user
- Add request size limits (✅ partially done: 150MB for drops)
- Consider using Vercel Edge Config or Upstash for rate limiting

---

### 🟢 LOW

#### L1: PBKDF2 Iteration Count Could Be Higher
**Location:** `~/clawd/proofi-chrome-extension/src/lib/crypto.js`
```javascript
const ENCRYPT_ITERATIONS = 50000;
const DERIVE_ITERATIONS = 100000;
```

**Recommendation:** OWASP recommends 600,000 iterations for PBKDF2-SHA256 as of 2023. Consider increasing or migrating to Argon2id.

#### L2: Token Expiry Allows 1-Minute Clock Skew
**Location:** `~/clawd/proofi/agent-sdk/src/token/index.ts:75-80`
```javascript
if (issuedAtMs > now + 60000) {
  return { valid: false, reason: 'Token not yet valid' };
}
```

**Info:** 1 minute is reasonable, but document this behavior for integrators.

#### L3: Default Timeout Could Be Too Long
**Location:** `~/clawd/proofi/agent-sdk/src/ddc/index.ts`
```javascript
const DEFAULT_TIMEOUT = 30000;
```

**Recommendation:** Consider 10-15 seconds for better failure detection.

---

### ℹ️ INFORMATIONAL

#### I1: Good Cryptographic Practices Observed
- ✅ AES-256-GCM with proper nonce handling (12 bytes, crypto.getRandomValues)
- ✅ X25519 for key exchange (using tweetnacl)
- ✅ Ed25519/sr25519 for signatures
- ✅ Proper key derivation for wrapping DEKs
- ✅ Auth tags properly concatenated in ciphertext

#### I2: Good Token Structure
- ✅ JWT-like format with clear fields
- ✅ Expiry and issuedAt checks
- ✅ Scope enforcement before data access
- ✅ Signature verification supported

#### I3: Audit Trail Implementation
- ✅ Comprehensive audit logging in health-analyzer
- ✅ Data hashes logged for verification
- ✅ Session IDs for traceability
- ✅ On-chain attestation support

#### I4: .gitignore Configuration
**Good:** The main repo correctly ignores:
- `node_modules/`
- `.env*`
- `.vercel/`
- `keys/` (in proofi-agents-check)

---

## Recommendations Summary

### Immediate Actions (Before Production)

1. **Remove debug endpoint** (`api/debug-env.js`)
2. **Fix revocation signature verification** (don't fail open)
3. **Implement persistent revocation storage**
4. **Encrypt private keys at rest**
5. **Remove plaintext passphrases from .env files**

### Short-Term (1-2 Sprints)

1. **Implement CORS whitelisting** for production origins
2. **Add rate limiting** to all API endpoints
3. **Increase PBKDF2 iterations** or migrate to Argon2id
4. **Add request authentication** for sensitive endpoints
5. **Implement structured logging** with automatic redaction

### Long-Term (Roadmap)

1. **On-chain revocation registry** (already planned)
2. **HSM integration** for wallet operations
3. **Security monitoring and alerting**
4. **Penetration testing** by external auditor
5. **Bug bounty program**

---

## Appendix: Files Reviewed

### Main Repository (`~/clawd/proofi`)
- `agent-sdk/src/crypto/index.ts` ✅
- `agent-sdk/src/token/index.ts` ✅
- `agent-sdk/src/ddc/index.ts` ✅
- `agent-sdk/src/revocation/index.ts` ✅
- `agent-sdk/src/agent.ts` ✅
- `api/ddc/store.js` ✅
- `api/ddc/revoke.js` ✅
- `api/debug-env.js` ⚠️
- `api/drop/upload.js` ✅
- `chrome-ext/lib/crypto-utils.js` ✅
- `chrome-ext/lib/key-manager.js` ✅
- `.env.local` ⚠️
- `.env.vercel` ⚠️

### Chrome Extension (`~/clawd/proofi-chrome-extension`)
- `src/lib/crypto.js` ✅
- `src/lib/keyring.js` ✅
- `src/lib/capability.js` ✅
- `src/lib/storage.js` ✅
- `src/background.js` ✅

### Agent SDK Check (`/private/tmp/proofi-agents-check`)
- `agent-sdk/src/internal/crypto.ts` ✅
- `agent-sdk/src/internal/keys.ts` ✅
- `agent-sdk/src/agent.ts` ✅
- `health-analyzer/src/crypto.ts` ✅
- `health-analyzer/src/attestation.ts` ✅
- `health-analyzer/src/audit.ts` ✅
- `health-analyzer/src/server.ts` ✅
- `health-analyzer/.env` ⚠️
- `health-analyzer/keys/agent-keypair.json` ⚠️

---

*This audit was performed as a source code review. Runtime testing and penetration testing are recommended for a complete security assessment.*
