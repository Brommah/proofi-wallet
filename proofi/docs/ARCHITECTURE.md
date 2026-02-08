# Proofi Architecture

This document describes the complete technical architecture of the Proofi agent system, including cryptographic protocols, data flows, and component interactions.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Cryptographic Protocols](#cryptographic-protocols)
4. [Data Flow](#data-flow)
5. [Token Lifecycle](#token-lifecycle)
6. [Storage Architecture](#storage-architecture)
7. [Attestation System](#attestation-system)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  PROOFI ECOSYSTEM                                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              USER LAYER                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │   │
│  │  │ Proofi App  │  │   Wallet    │  │   Vault     │  │  Token Grant Interface  │ │   │
│  │  │  (Web/iOS)  │  │ (sr25519)   │  │ (encrypted) │  │                         │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────┘ │   │
│  └───────────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                              │
│                                          │ Capability Token                              │
│                                          ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                             AGENT LAYER                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐│   │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     ││   │
│  │  │  │    Token     │  │    Data      │  │   Inference  │  │   Output     │     ││   │
│  │  │  │  Validator   │─▶│  Decryptor   │─▶│   Engine     │─▶│  Encryptor   │     ││   │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     ││   │
│  │  │         │                 ▲                  │                  │           ││   │
│  │  │         │                 │                  │                  │           ││   │
│  │  │         ▼                 │                  ▼                  ▼           ││   │
│  │  │  ┌──────────────┐         │           ┌──────────────┐  ┌──────────────┐    ││   │
│  │  │  │   Keypair    │         │           │  Audit Log   │  │  Attestation │    ││   │
│  │  │  │  (X25519)    │         │           │              │  │  Submitter   │    ││   │
│  │  │  └──────────────┘         │           └──────────────┘  └──────────────┘    ││   │
│  │  └─────────────────────────────────────────────────────────────────────────────┘│   │
│  │                                Health Analyzer Agent                            │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                    │         ▲                        │                │
│                                    │         │                        │                │
│  ┌─────────────────────────────────▼─────────┴────────────────────────┴───────────┐   │
│  │                          INFRASTRUCTURE LAYER                                   │   │
│  │  ┌─────────────────────────────────┐  ┌─────────────────────────────────────┐  │   │
│  │  │                                 │  │                                     │  │   │
│  │  │     Cere DDC (Storage)          │  │     Cere Blockchain (Attestation)   │  │   │
│  │  │                                 │  │                                     │  │   │
│  │  │  • Encrypted data blobs         │  │  • system.remark attestations       │  │   │
│  │  │  • CDN distribution             │  │  • Token revocation records         │  │   │
│  │  │  • CID-addressable              │  │  • Permanent audit trail            │  │   │
│  │  │                                 │  │                                     │  │   │
│  │  └─────────────────────────────────┘  └─────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                          LOCAL INFERENCE LAYER                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────────────┐   │   │
│  │  │   Ollama     │  │  llama3.2    │  │  Model weights (2-7GB, local only)   │   │   │
│  │  │   Server     │  │  mistral     │  │                                      │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### User Components

#### Proofi Wallet

The wallet is the user's identity and key management system.

```typescript
// Wallet structure
interface ProofiWallet {
  // Identity
  address: string;              // Substrate address (e.g., 5DSxCBjQ...)
  
  // Keys
  sr25519: {
    publicKey: Uint8Array;      // For signing tokens
    secretKey: Uint8Array;      // Never leaves device
  };
  
  // Encryption
  x25519: {
    publicKey: Uint8Array;      // For receiving encrypted data
    secretKey: Uint8Array;      // For decrypting
  };
  
  // Data Encryption Keys (DEKs)
  deks: Map<string, {           // Path → DEK mapping
    dek: Uint8Array;            // 256-bit AES key
    createdAt: number;
  }>;
}
```

**Key derivation:**
- Email + device entropy → deterministic seed
- Seed → sr25519 keypair (signing)
- Seed → X25519 keypair (encryption)
- Random → DEKs (per data category)

#### Proofi Vault

The vault manages encrypted data in DDC.

```
vault/
├── health/
│   ├── metrics.enc          # Encrypted health data
│   └── insights.enc         # Encrypted AI insights
├── finance/
│   └── transactions.enc
└── .keys/
    └── dek-manifest.enc     # Encrypted DEK list
```

---

### Agent Components

#### Token Validator

Validates capability tokens before processing.

```typescript
// Token validation steps
async function validateToken(token: CapabilityToken): Promise<ValidationResult> {
  // 1. Check structure
  if (!token.id || !token.scopes || !token.wrappedDEK) {
    return { valid: false, reason: 'Invalid token structure' };
  }
  
  // 2. Check expiration
  if (Date.now() > token.exp * 1000) {
    return { valid: false, reason: 'Token expired' };
  }
  
  // 3. Verify signature (if present)
  if (token.sig && token.issuerPubKey) {
    const isValid = await verifySignature(token);
    if (!isValid) {
      return { valid: false, reason: 'Invalid signature' };
    }
  }
  
  // 4. Check revocation
  const isRevoked = await checkRevocation(token.id);
  if (isRevoked) {
    return { valid: false, reason: 'Token revoked' };
  }
  
  return { valid: true };
}
```

#### Data Decryptor

Handles DEK unwrapping and AES decryption.

```typescript
// Decryption pipeline
async function decryptData(
  encryptedBlob: Uint8Array,
  wrappedDEK: WrappedDEK,
  agentPrivateKey: Uint8Array
): Promise<Uint8Array> {
  // 1. Unwrap DEK using X25519 key exchange
  const dek = nacl.box.open(
    decodeBase64(wrappedDEK.ciphertext),
    decodeBase64(wrappedDEK.nonce),
    decodeBase64(wrappedDEK.ephemeralPublicKey),
    agentPrivateKey
  );
  
  // 2. Parse encrypted blob
  const { ciphertext, iv } = JSON.parse(encryptedBlob);
  
  // 3. Decrypt with AES-256-GCM
  const decipher = createDecipheriv('aes-256-gcm', dek, decodeBase64(iv));
  decipher.setAuthTag(/* last 16 bytes of ciphertext */);
  
  return Buffer.concat([
    decipher.update(decodeBase64(ciphertext)),
    decipher.final()
  ]);
}
```

#### Inference Engine

Runs AI analysis using local or remote models.

```typescript
// Model priority: Ollama > OpenAI > Rule-based
async function analyzeHealthData(metrics: HealthMetrics): Promise<HealthInsights> {
  // Try Ollama first (100% local)
  if (await isOllamaAvailable()) {
    return analyzeWithOllama(metrics);
  }
  
  // Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    return analyzeWithOpenAI(metrics);
  }
  
  // Final fallback: rule-based
  return analyzeWithRules(metrics);
}
```

#### Audit Logger

Maintains a complete audit trail.

```typescript
interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  details: Record<string, unknown>;
  hashes: {
    input?: string;   // SHA-256 of input
    output?: string;  // SHA-256 of output
  };
  duration_ms?: number;
}

type AuditAction = 
  | 'token_received'
  | 'token_validated'
  | 'token_rejected'
  | 'dek_unwrapped'
  | 'data_fetched'
  | 'data_decrypted'
  | 'inference_started'
  | 'inference_completed'
  | 'output_encrypted'
  | 'output_stored'
  | 'attestation_submitted'
  | 'error';
```

---

## Cryptographic Protocols

### Key Exchange (X25519)

Used for wrapping DEKs:

```
Alice (User)                           Bob (Agent)
─────────────────────────────────────────────────────
                                       Generate keypair:
                                       (bobPub, bobPriv) = X25519.keyPair()
                                       
                                       Publish bobPub via /agent-info
                                       ◀─────────────────────────────────
                                       
Generate ephemeral keypair:
(ephPub, ephPriv) = X25519.keyPair()

Compute shared secret:
shared = X25519(ephPriv, bobPub)

Encrypt DEK:
nonce = random(24)
wrapped = NaCl.box(DEK, nonce, bobPub, ephPriv)

Send token with:
{ ciphertext, nonce, ephemeralPublicKey: ephPub }
────────────────────────────────────────────────▶
                                       
                                       Compute shared secret:
                                       shared = X25519(bobPriv, ephPub)
                                       
                                       Decrypt DEK:
                                       DEK = NaCl.box.open(ciphertext, nonce, ephPub, bobPriv)
```

### Data Encryption (AES-256-GCM)

Used for encrypting user data:

```
Encryption:
───────────
IV = random(12)  // 96 bits for GCM
key = DEK        // 256-bit key

cipher = AES-256-GCM(key)
ciphertext = cipher.update(plaintext) + cipher.final()
authTag = cipher.getAuthTag()  // 128 bits

output = ciphertext || authTag  // Concatenate

Decryption:
───────────
authTag = ciphertext[-16:]      // Last 16 bytes
encrypted = ciphertext[:-16]

decipher = AES-256-GCM(key)
decipher.setAuthTag(authTag)
plaintext = decipher.update(encrypted) + decipher.final()
```

### Token Signing (sr25519)

Used for signing capability tokens:

```
Signing:
────────
payload = JSON.stringify(tokenWithoutSig)
signature = sr25519.sign(payload, issuerSecretKey)
token.sig = base64(signature)
token.sigAlg = 'sr25519'
token.issuerPubKey = base64(issuerPublicKey)

Verification:
─────────────
payload = reconstructPayload(token)
isValid = sr25519.verify(
  payload,
  base64Decode(token.sig),
  base64Decode(token.issuerPubKey)
)
```

---

## Data Flow

### Complete Analysis Flow

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                            HEALTH ANALYSIS DATA FLOW                                 │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  PHASE 1: TOKEN GRANT                                                               │
│  ────────────────────                                                               │
│                                                                                      │
│  User Wallet                           Agent                                         │
│  ┌───────────────┐                    ┌───────────────┐                             │
│  │ 1. Generate   │                    │               │                             │
│  │    DEK        │─────────────────▶  │ 2. Get agent  │                             │
│  │               │ GET /agent-info    │    public key │                             │
│  │ 3. Wrap DEK   │◀─────────────────  │               │                             │
│  │    with agent │  { publicKey }     │               │                             │
│  │    pubkey     │                    │               │                             │
│  │               │                    │               │                             │
│  │ 4. Create &   │                    │               │                             │
│  │    sign token │─────────────────▶  │ 5. Store      │                             │
│  │               │  capability token  │    token      │                             │
│  └───────────────┘                    └───────────────┘                             │
│                                                                                      │
│  PHASE 2: DATA UPLOAD                                                               │
│  ────────────────────                                                               │
│                                                                                      │
│  User Wallet                           DDC                                           │
│  ┌───────────────┐                    ┌───────────────┐                             │
│  │ 1. Encrypt    │                    │               │                             │
│  │    health     │─────────────────▶  │ 2. Store      │                             │
│  │    data with  │  encrypted blob    │    blob       │                             │
│  │    DEK        │                    │               │                             │
│  │               │◀─────────────────  │ 3. Return     │                             │
│  │ 4. Record CID │  CID               │    CID        │                             │
│  └───────────────┘                    └───────────────┘                             │
│                                                                                      │
│  PHASE 3: ANALYSIS                                                                  │
│  ─────────────────                                                                  │
│                                                                                      │
│  Agent                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────────┐     │
│  │ 1. Validate token (expiry, signature, revocation)                          │     │
│  │    ↓                                                                        │     │
│  │ 2. Unwrap DEK using agent private key                                       │     │
│  │    ↓                                                                        │     │
│  │ 3. Fetch encrypted data from DDC (using CID from token)                     │     │
│  │    ↓                                                                        │     │
│  │ 4. Decrypt data with DEK (AES-256-GCM)                                      │     │
│  │    ↓                                                                        │     │
│  │ 5. Run AI inference (Ollama llama3.2:3b)                                    │     │
│  │    ├── Input hash: SHA256(healthData)                                       │     │
│  │    └── Output hash: SHA256(insights)                                        │     │
│  │    ↓                                                                        │     │
│  │ 6. Encrypt insights with same DEK                                           │     │
│  │    ↓                                                                        │     │
│  │ 7. Store encrypted insights to DDC                                          │     │
│  │    ↓                                                                        │     │
│  │ 8. Submit attestation to Cere blockchain                                    │     │
│  │    └── PROOFI:{hash of audit summary}                                       │     │
│  │    ↓                                                                        │     │
│  │ 9. Return insights to user                                                  │     │
│  └────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              TOKEN LIFECYCLE                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│                              ┌──────────────────┐                                   │
│                              │     CREATED      │                                   │
│                              │                  │                                   │
│                              │  • ID generated  │                                   │
│                              │  • Scopes set    │                                   │
│                              │  • DEK wrapped   │                                   │
│                              │  • Signed        │                                   │
│                              └────────┬─────────┘                                   │
│                                       │                                             │
│                                       ▼                                             │
│                              ┌──────────────────┐                                   │
│                              │     ACTIVE       │◀─────────────────┐                │
│                              │                  │                  │                │
│                              │  • Valid         │                  │                │
│                              │  • Usable        │                  │                │
│                              │  • Not expired   │                  │                │
│                              └────────┬─────────┘                  │                │
│                   ┌───────────────────┼───────────────────┐        │                │
│                   │                   │                   │        │                │
│                   ▼                   ▼                   ▼        │                │
│          ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │                │
│          │    USED      │    │   EXPIRED    │    │   REVOKED    │ │                │
│          │              │    │              │    │              │ │                │
│          │ • Processed  │    │ • Time limit │    │ • User       │ │                │
│          │ • Audit log  │    │   reached    │    │   revoked    │ │                │
│          │ • Attestation│    │              │    │ • On-chain   │ │                │
│          └──────────────┘    └──────────────┘    │   record     │ │                │
│                   │                              └──────────────┘ │                │
│                   │                                               │                │
│                   │  (if multi-use token)                         │                │
│                   └───────────────────────────────────────────────┘                │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Token Structure

```typescript
interface CapabilityToken {
  // Version
  v: number;                    // Token format version (currently 1)
  
  // Identity
  id: string;                   // Unique token ID (UUID)
  iss: string;                  // Issuer (user's DID or address)
  sub: string;                  // Subject (agent's public key)
  
  // Timing
  iat: number;                  // Issued at (Unix timestamp)
  exp: number;                  // Expires at (Unix timestamp)
  
  // Permissions
  scopes: Array<{
    path: string;               // e.g., "health/*" or "health/steps"
    permissions: ('read' | 'write')[];
  }>;
  
  // Data access
  bucketId: string;             // DDC bucket containing user data
  resources: string[];          // Specific CIDs (optional)
  cdnUrl: string;               // DDC CDN endpoint
  
  // Encrypted key
  wrappedDEK: {
    ciphertext: string;         // NaCl box encrypted DEK
    ephemeralPublicKey: string; // Ephemeral X25519 pubkey
    nonce: string;              // 24-byte nonce
  };
  
  // Signature
  sig: string;                  // sr25519 signature
  sigAlg: string;               // "sr25519"
  issuerPubKey: string;         // For verification
}
```

---

## Storage Architecture

### DDC Bucket Structure

```
bucket-{id}/
├── health/
│   ├── metrics/
│   │   ├── 2026-02/
│   │   │   ├── steps.enc       # CID: baebb4ic...
│   │   │   ├── sleep.enc       # CID: baebb4id...
│   │   │   └── mood.enc        # CID: baebb4ie...
│   │   └── latest.enc          # Symlink to most recent
│   └── insights/
│       ├── 2026-02-08.enc      # Analysis results
│       └── latest.enc
├── finance/
│   └── ...
└── .meta/
    ├── manifest.json           # Bucket metadata
    └── access-log.json         # Access history
```

### Encrypted Blob Format

```typescript
interface EncryptedBlob {
  // Encrypted data (base64)
  ciphertext: string;
  
  // Initialization vector (base64, 12 bytes)
  iv: string;
  
  // Metadata (optional, unencrypted)
  meta?: {
    contentType: string;        // e.g., "application/json"
    createdAt: string;          // ISO timestamp
    version: number;            // Data format version
  };
}
```

---

## Attestation System

### On-Chain Attestation Format

Attestations are stored using `system.remark` extrinsics:

```
PROOFI:{attestation_hash}
```

Where `attestation_hash` is SHA-256 of:

```typescript
interface AttestationPayload {
  v: 1;                         // Attestation format version
  type: 'health-analysis-attestation';
  sessionId: string;            // Unique session ID
  dataHash: string;             // SHA-256 of input data
  resultHash: string;           // SHA-256 of output
  outputCid: string;            // DDC CID of encrypted output
  modelDigest: string;          // SHA-256 of model weights
  timestamp: string;            // ISO timestamp
}
```

### Verification Flow

```
User                             Blockchain                    DDC
┌───────────────┐               ┌───────────────┐            ┌───────────────┐
│ 1. Get block  │               │               │            │               │
│    number     │───────────────▶               │            │               │
│    from agent │               │               │            │               │
│               │◀──────────────│               │            │               │
│               │  block hash   │               │            │               │
│               │               │               │            │               │
│ 2. Query      │               │               │            │               │
│    remarks    │───────────────▶               │            │               │
│               │               │ 3. Return     │            │               │
│               │◀──────────────│    PROOFI:... │            │               │
│               │               │               │            │               │
│ 4. Fetch      │               │               │            │               │
│    output     │───────────────┼───────────────┼────────────▶               │
│               │               │               │            │ 5. Return     │
│               │◀──────────────┼───────────────┼────────────│    blob       │
│               │               │               │            │               │
│ 6. Decrypt &  │               │               │            │               │
│    verify     │               │               │            │               │
│    hash       │               │               │            │               │
│               │               │               │            │               │
│ ✓ Matches!    │               │               │            │               │
└───────────────┘               └───────────────┘            └───────────────┘
```

---

## Security Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              TRUST BOUNDARIES                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │ FULLY TRUSTED (User Device)                                                   │ │
│  │                                                                               │ │
│  │  • Wallet private keys (sr25519, X25519)                                     │ │
│  │  • DEKs in memory                                                            │ │
│  │  • Decrypted data in memory                                                  │ │
│  │  • Token generation                                                          │ │
│  │                                                                               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │ SEMI-TRUSTED (Agent, if running locally)                                      │ │
│  │                                                                               │ │
│  │  • Agent private key (X25519)                                                │ │
│  │  • Unwrapped DEK (in memory, during processing)                              │ │
│  │  • Decrypted data (in memory, during processing)                             │ │
│  │  • AI model (local Ollama)                                                   │ │
│  │                                                                               │ │
│  │  ENFORCED BY:                                                                │ │
│  │  • Token expiration                                                          │ │
│  │  • Scope restrictions                                                        │ │
│  │  • Stateless processing                                                      │ │
│  │  • Audit logging                                                             │ │
│  │                                                                               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │ UNTRUSTED (Network/Storage)                                                   │ │
│  │                                                                               │ │
│  │  • DDC storage (encrypted at rest)                                           │ │
│  │  • CDN delivery (encrypted in transit)                                       │ │
│  │  • Blockchain (public attestations only)                                     │ │
│  │  • Network transport (TLS)                                                   │ │
│  │                                                                               │ │
│  │  PROTECTED BY:                                                               │ │
│  │  • AES-256-GCM encryption                                                    │ │
│  │  • Only hashes on-chain                                                      │ │
│  │  • No plaintext ever stored                                                  │ │
│  │                                                                               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Dependency Graph

```
                                    ┌─────────────┐
                                    │   types.ts  │
                                    │  (shared)   │
                                    └──────┬──────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
            ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
            │  crypto.ts  │        │   keys.ts   │        │  audit.ts   │
            │             │        │             │        │             │
            │ • DEK wrap  │        │ • Keypair   │        │ • Logging   │
            │ • AES enc   │        │   mgmt      │        │ • Hashing   │
            │ • Token     │        │ • Storage   │        │             │
            │   verify    │        │             │        │             │
            └──────┬──────┘        └──────┬──────┘        └──────┬──────┘
                   │                      │                      │
                   └──────────────────────┼──────────────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    │                                           │
                    ▼                                           ▼
            ┌─────────────┐                             ┌─────────────┐
            │  analyze.ts │                             │    ddc.ts   │
            │             │                             │             │
            │ • OpenAI    │                             │ • DDC read  │
            │ • Ollama    │                             │ • DDC write │
            │ • Rules     │                             │             │
            └──────┬──────┘                             └──────┬──────┘
                   │                                           │
                   └─────────────────────┬─────────────────────┘
                                         │
                                         ▼
                                 ┌─────────────────┐
                                 │ attestation.ts  │
                                 │                 │
                                 │ • Blockchain    │
                                 │   submit        │
                                 │ • Verification  │
                                 └────────┬────────┘
                                          │
                          ┌───────────────┴───────────────┐
                          │                               │
                          ▼                               ▼
                  ┌─────────────┐                 ┌─────────────┐
                  │  server.ts  │                 │  local.ts   │
                  │             │                 │             │
                  │ HTTP server │                 │ CLI mode    │
                  │ w/ Hono     │                 │ Interactive │
                  └─────────────┘                 └─────────────┘
```

---

## Next Steps

- [SDK.md](./SDK.md) — API reference for building agents
- [SECURITY.md](./SECURITY.md) — Complete security model
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Self-hosting guide
