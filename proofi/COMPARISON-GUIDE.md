# Proofi Wallet vs Cere Wallet — Comparison Guide

## Executive Summary

| Aspect | Cere Wallet | Proofi Wallet |
|--------|-------------|---------------|
| **Custody Model** | Server-side (Web3Auth) | Self-custodial (client-side) |
| **Key Security** | Server holds keys | Keys never leave browser |
| **Authentication** | OAuth (Google, Apple, etc.) | Email OTP + PIN |
| **Recovery** | OAuth provider recovery | PIN + encrypted backup |
| **User Experience** | Familiar OAuth flow | Email + 6-digit PIN |
| **Trust Model** | Trust Cere + Web3Auth | Trust only yourself |

---

## Architecture Comparison

### Cere Wallet (Current)

```
┌─────────────────────────────────────────────────────────────┐
│ User Device                                                  │
│ ┌─────────────────┐                                         │
│ │ Cere Wallet UI  │                                         │
│ │ (React + MobX)  │                                         │
│ └────────┬────────┘                                         │
│          │                                                   │
│          ▼                                                   │
│ ┌─────────────────┐                                         │
│ │ Web3Auth SDK    │ ◄─── OAuth flow (Google, Apple, etc.)   │
│ └────────┬────────┘                                         │
└──────────│──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ Web3Auth Infrastructure                                      │
│ ┌─────────────────┐  ┌─────────────────┐                    │
│ │ Auth Servers    │  │ Key Sharding    │                    │
│ │ (OAuth verify)  │  │ (TSS/MPC)       │                    │
│ └─────────────────┘  └────────┬────────┘                    │
│                               │                              │
│                     ┌─────────▼─────────┐                   │
│                     │ Key Reconstruction│ ◄── Server-side   │
│                     │ (private key)     │                   │
│                     └───────────────────┘                   │
└─────────────────────────────────────────────────────────────┘

⚠️  Private key is reconstructed on Web3Auth servers
⚠️  User must trust Web3Auth infrastructure
⚠️  If Web3Auth is compromised, all keys are at risk
```

### Proofi Wallet (New)

```
┌─────────────────────────────────────────────────────────────┐
│ User Device (Browser)                                        │
│ ┌─────────────────┐                                         │
│ │ Proofi UI       │                                         │
│ │ (React + Zustand)│                                        │
│ └────────┬────────┘                                         │
│          │                                                   │
│          ▼                                                   │
│ ┌─────────────────┐                                         │
│ │ PIN Input       │ ◄─── User enters 6-digit PIN            │
│ └────────┬────────┘                                         │
│          │                                                   │
│          ▼                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Client-side Key Derivation                              │ │
│ │                                                          │ │
│ │  derivationSalt (from server)                            │ │
│ │         +                                                │ │
│ │  PIN (from user)                                         │ │
│ │         ↓                                                │ │
│ │  PBKDF2(PIN, salt, 100k iterations)                      │ │
│ │         ↓                                                │ │
│ │  32-byte seed                                            │ │
│ │         ↓                                                │ │
│ │  sr25519 keypair (Cere-compatible)                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ✅ Private key NEVER leaves the browser                    │
│  ✅ Server only sees public address                         │
│  ✅ Even if server is compromised, keys are safe            │
└─────────────────────────────────────────────────────────────┘
           │
           │ (only public address)
           ▼
┌─────────────────────────────────────────────────────────────┐
│ Proofi Server                                                │
│ ┌─────────────────┐  ┌─────────────────┐                    │
│ │ Auth API        │  │ Address Store   │                    │
│ │ (OTP + JWT)     │  │ (email→address) │                    │
│ └─────────────────┘  └─────────────────┘                    │
│                                                              │
│  Server knows: email, public address, derivation salt       │
│  Server CANNOT: derive private key (missing PIN)            │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Deep Dive

### Key Generation

| Step | Cere Wallet | Proofi Wallet |
|------|-------------|---------------|
| 1 | OAuth login | Email OTP verification |
| 2 | Web3Auth generates key shards | Server sends `derivationSalt` |
| 3 | Shards distributed to servers | User enters PIN locally |
| 4 | Key reconstructed server-side | `PBKDF2(PIN, salt)` → seed |
| 5 | Key sent to client | `sr25519(seed)` → keypair |

### Attack Scenarios

| Attack | Cere Wallet | Proofi Wallet |
|--------|-------------|---------------|
| **Server breach** | ⚠️ Keys at risk (MPC shares) | ✅ Safe (server has no key material) |
| **OAuth provider breach** | ⚠️ Account takeover possible | ✅ N/A (no OAuth) |
| **Man-in-the-middle** | ⚠️ Could intercept key | ✅ Only salt transmitted |
| **Phishing (fake login)** | ⚠️ OAuth token theft | ⚠️ OTP + PIN theft |
| **Device theft** | ✅ Need OAuth access | ✅ Need PIN to unlock |
| **Brute force PIN** | N/A | ✅ 100k PBKDF2 iterations |

### Trust Requirements

**Cere Wallet requires trusting:**
1. Web3Auth infrastructure (key custody)
2. OAuth provider (Google, Apple, etc.)
3. Cere backend servers
4. All TSS/MPC participants

**Proofi Wallet requires trusting:**
1. Your own PIN memory
2. Browser's WebCrypto API
3. That's it.

---

## User Experience Comparison

### Onboarding Flow

**Cere Wallet (7 steps):**
1. Click "Connect Wallet"
2. Choose OAuth provider (Google/Apple/etc.)
3. Redirect to OAuth
4. Login with OAuth credentials
5. Authorize Cere Wallet
6. Wait for key generation
7. Wallet ready

**Proofi Wallet (5 steps):**
1. Enter email
2. Enter OTP from email
3. Create 6-digit PIN
4. Confirm PIN
5. Wallet ready

### Recovery Flow

**Cere Wallet:**
- Login with same OAuth provider
- Key automatically reconstructed

**Proofi Wallet:**
- Enter email + OTP
- Enter PIN
- Key derived locally
- (Optional: restore from encrypted DDC backup)

---

## Feature Comparison

| Feature | Cere | Proofi |
|---------|------|--------|
| Email login | ❌ | ✅ |
| Social login (Google) | ✅ | ❌ |
| PIN protection | ❌ | ✅ |
| Self-custody | ❌ | ✅ |
| NFT management | ✅ | 🚧 |
| Token balance | ✅ | 🚧 |
| DDC integration | ✅ | ✅ |
| Credential signing | ✅ | ✅ |
| Verifiable credentials | ❌ | ✅ |
| Embedded iframe | ✅ | ✅ |
| Standalone mode | ✅ | ✅ |
| Polkadot extension compat | ❌ | ✅ |
| Open source | Partial | Full |

---

## Technical Specifications

### Key Derivation (Proofi v2)

```typescript
// Server generates deterministic salt per email
derivationSalt = HMAC-SHA256(masterSecret, email + ":proofi-salt-v2")

// Client derives seed from PIN + salt
seed = PBKDF2(
  password: PIN,
  salt: derivationSalt,
  iterations: 100000,
  hash: SHA-256,
  length: 32 bytes
)

// Keypair from seed
keypair = sr25519.fromSeed(seed)
address = SS58.encode(keypair.publicKey, prefix: 54)
```

### Storage

| Data | Cere | Proofi |
|------|------|--------|
| Private key | Web3Auth servers | Never stored |
| Encrypted seed | ❌ | Browser localStorage |
| Session | OAuth token | JWT + encrypted seed |
| Credentials | Cere DDC | Cere DDC (bucket 1229) |

---

## Migration Path

For existing Cere Wallet users who want to migrate to Proofi:

1. **Export public address** from Cere Wallet
2. **Create Proofi account** with same email
3. **Link existing credentials** via address verification
4. **Optionally**: Keep Cere Wallet for legacy integrations

Note: Private keys cannot be migrated (different derivation). New Proofi wallet = new address.

---

## Summary

### When to use Cere Wallet
- Need familiar OAuth login
- Trust Web3Auth infrastructure
- Already integrated with Cere ecosystem
- Don't need true self-custody

### When to use Proofi Wallet
- Want true self-custody (your keys, your crypto)
- Prefer PIN-based security
- Need verifiable credentials
- Want open-source transparency
- Building credential-based applications

---

## Screenshots

### Before (Cere Wallet)
- OAuth provider selection
- Server-side key generation
- Standard wallet UI

### After (Proofi Wallet)
- Clean email input
- PIN creation flow
- Dashboard with credentials tab
- Self-custody indicators
- Gradient header design

---

*Built in 5 hours. Self-custodial. No compromises.*
