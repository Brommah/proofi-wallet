# Proofi SDK Reference

This document provides a complete API reference for building Proofi-compatible agents.

---

## 📋 Table of Contents

1. [Installation](#installation)
2. [Core Modules](#core-modules)
3. [Crypto Module](#crypto-module)
4. [Keys Module](#keys-module)
5. [DDC Module](#ddc-module)
6. [Attestation Module](#attestation-module)
7. [Audit Module](#audit-module)
8. [Types Reference](#types-reference)

---

## Installation

```bash
npm install @proofi/agent-sdk
# or
npm install tweetnacl tweetnacl-util @cere-ddc-sdk/ddc-client @polkadot/api
```

For local development with the health analyzer:

```bash
cd health-analyzer
npm install
npm run build
```

---

## Core Modules

### crypto.ts

Cryptographic operations for token validation and data encryption/decryption.

#### `unwrapDEK(wrappedDEK, recipientPrivateKey)`

Unwrap a Data Encryption Key using the agent's X25519 private key.

```typescript
import { unwrapDEK } from './crypto.js';

// Token contains wrapped DEK
const token: CapabilityToken = parseToken(rawToken);

// Agent's X25519 private key (32 bytes)
const agentPrivateKey: Uint8Array = loadAgentPrivateKey();

// Unwrap the DEK
const dek = unwrapDEK(token.wrappedDEK, agentPrivateKey);
// Returns Uint8Array (32 bytes, the AES-256 key)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `wrappedDEK` | `WrappedDEK` | The wrapped DEK from the capability token |
| `recipientPrivateKey` | `Uint8Array` | Agent's X25519 private key (32 bytes) |

**Returns:** `Uint8Array` — The unwrapped DEK (32 bytes)

**Throws:** `Error` if unwrapping fails (wrong key or corrupted data)

---

#### `decryptAES(ciphertextB64, ivB64, key)`

Decrypt AES-256-GCM encrypted data.

```typescript
import { decryptAES } from './crypto.js';

const encryptedBlob = JSON.parse(rawData);
const plaintext = await decryptAES(
  encryptedBlob.ciphertext,  // Base64 encoded
  encryptedBlob.iv,          // Base64 encoded
  dek                        // 32-byte Uint8Array
);
// Returns string (UTF-8 decoded plaintext)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `ciphertextB64` | `string` | Base64-encoded ciphertext (includes auth tag) |
| `ivB64` | `string` | Base64-encoded IV (12 bytes) |
| `key` | `Uint8Array` | DEK (32 bytes) |

**Returns:** `Promise<string>` — Decrypted plaintext

**Throws:** `Error` if decryption fails (wrong key, corrupted data, or auth tag mismatch)

---

#### `encryptAES(plaintext, key)`

Encrypt data with AES-256-GCM.

```typescript
import { encryptAES } from './crypto.js';

const insights = JSON.stringify(analysisResult);
const encrypted = await encryptAES(insights, dek);
// Returns { ciphertext: string, iv: string } (both base64)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `plaintext` | `string` | Data to encrypt |
| `key` | `Uint8Array` | DEK (32 bytes) |

**Returns:** `Promise<{ ciphertext: string; iv: string }>` — Base64-encoded encrypted data

---

#### `isTokenExpired(token)`

Check if a capability token has expired.

```typescript
import { isTokenExpired } from './crypto.js';

if (isTokenExpired(token)) {
  throw new Error('Token expired');
}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `token` | `CapabilityToken` | The capability token to check |

**Returns:** `boolean` — `true` if expired

---

#### `verifyTokenSignature(token)`

Verify the sr25519 signature on a capability token.

```typescript
import { verifyTokenSignature } from './crypto.js';

const isValid = await verifyTokenSignature(token);
if (!isValid) {
  throw new Error('Invalid token signature');
}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `token` | `CapabilityToken` | The capability token to verify |

**Returns:** `Promise<boolean>` — `true` if signature is valid

**Note:** Requires `token.sig`, `token.sigAlg`, and `token.issuerPubKey` to be present.

---

#### `hasScope(token, requiredPath, permission)`

Check if a token grants a specific permission.

```typescript
import { hasScope } from './crypto.js';

if (!hasScope(token, 'health/metrics', 'read')) {
  throw new Error('Token does not grant read access to health/metrics');
}
```

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `token` | `CapabilityToken` | — | The capability token |
| `requiredPath` | `string` | — | The resource path to check |
| `permission` | `string` | `'read'` | The permission type |

**Returns:** `boolean` — `true` if scope is granted

---

#### `isTokenRevoked(token)`

Check if a token has been revoked (via local file or on-chain).

```typescript
import { isTokenRevoked } from './crypto.js';

const revoked = await isTokenRevoked(token);
if (revoked) {
  throw new Error('Token has been revoked');
}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `token` | `CapabilityToken` | The capability token to check |

**Returns:** `Promise<boolean>` — `true` if revoked

---

## Keys Module

### keys.ts

Agent keypair management.

#### `generateKeypair()`

Generate a new X25519 keypair.

```typescript
import { generateKeypair } from './keys.js';

const keypair = generateKeypair();
// keypair.publicKey: Uint8Array (32 bytes)
// keypair.privateKey: Uint8Array (32 bytes)
```

**Returns:** `AgentKeypair` — New keypair

---

#### `getOrCreateKeypair()`

Load existing keypair or create a new one.

```typescript
import { getOrCreateKeypair } from './keys.js';

// Loads from ./keys/agent-keypair.json
// Creates new if doesn't exist
const keypair = getOrCreateKeypair();
```

**Returns:** `AgentKeypair` — Loaded or newly created keypair

**Note:** Keypair is saved to `./keys/agent-keypair.json` with `chmod 600`.

---

#### `getPublicKeyBase64(keypair)`

Get the public key as a Base64 string (for `/agent-info` endpoint).

```typescript
import { getOrCreateKeypair, getPublicKeyBase64 } from './keys.js';

const keypair = getOrCreateKeypair();
const pubKey = getPublicKeyBase64(keypair);
// e.g., "d+YpS3K8h2vJ1cR9wXmFgHiJkLmNoPqRsTuVwXyZ0A="
```

**Returns:** `string` — Base64-encoded public key

---

#### `deleteKeypair()`

Delete the stored keypair (for testing/reset).

```typescript
import { deleteKeypair } from './keys.js';

const deleted = deleteKeypair();
// Returns true if file was deleted
```

**Returns:** `boolean` — `true` if keypair was deleted

---

## DDC Module

### ddc.ts

Decentralized Data Cloud operations.

#### `initDDC()`

Initialize the DDC client with the agent's signer.

```typescript
import { initDDC } from './ddc.js';

// Reads from WALLET_PATH + WALLET_PASSPHRASE or AGENT_MNEMONIC
const client = await initDDC();
```

**Environment Variables:**
| Name | Description |
|------|-------------|
| `WALLET_PATH` | Path to Cere wallet JSON file |
| `WALLET_PASSPHRASE` | Passphrase to decrypt wallet |
| `AGENT_MNEMONIC` | Alternative: 12-word mnemonic |

**Returns:** `Promise<DdcClient>` — Initialized DDC client

**Throws:** `Error` if no wallet credentials are configured

---

#### `storeToDDC(bucketId, encryptedData, metadata?)`

Store encrypted data to a DDC bucket.

```typescript
import { initDDC, storeToDDC } from './ddc.js';

await initDDC();

const encrypted = await encryptAES(insights, dek);
const result = await storeToDDC('1229', encrypted, {
  type: 'health-insights',
  session: sessionId,
});

console.log('Stored CID:', result.cid);
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `bucketId` | `string \| bigint` | DDC bucket ID |
| `encryptedData` | `{ ciphertext: string; iv: string }` | Encrypted blob |
| `metadata` | `Record<string, string>` | Optional metadata |

**Returns:** `Promise<DDCStoreResult>`

```typescript
interface DDCStoreResult {
  cid: string;      // Content identifier
  bucketId: string; // Bucket where stored
  size: number;     // Bytes stored
}
```

---

#### `closeDDC()`

Close the DDC client connection.

```typescript
import { closeDDC } from './ddc.js';

await closeDDC();
```

---

## Attestation Module

### attestation.ts

On-chain attestation operations.

#### `initBlockchain()`

Initialize connection to Cere blockchain.

```typescript
import { initBlockchain } from './attestation.js';

const api = await initBlockchain();
// Connected to wss://archive.mainnet.cere.network/ws
```

**Returns:** `Promise<ApiPromise>` — Polkadot API instance

---

#### `submitAttestation(data, walletPath?, passphrase?)`

Submit an attestation to the blockchain via `system.remark`.

```typescript
import { submitAttestation } from './attestation.js';

const attestation = await submitAttestation({
  sessionId: 'session_12345',
  dataHash: 'a4dfb32ae0f210ef...',
  resultHash: 'b5efc43bf1g321fg...',
  outputCid: 'baebb4icrfih4detjyt3...',
  modelDigest: 'sha256:dde5aa3f...',
  timestamp: new Date().toISOString(),
});

console.log('Block number:', attestation.blockNumber);
console.log('Tx hash:', attestation.extrinsicHash);
```

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `AttestationData` | — | Attestation payload |
| `walletPath` | `string` | env `WALLET_PATH` | Path to wallet JSON |
| `passphrase` | `string` | env `WALLET_PASSPHRASE` | Wallet passphrase |

**Returns:** `Promise<AttestationResult>`

```typescript
interface AttestationResult {
  blockHash: string;      // Block containing the attestation
  blockNumber: number;    // Block number
  extrinsicHash: string;  // Transaction hash
  attestationHash: string; // SHA-256 of attestation payload
}
```

---

#### `verifyAttestation(attestationHash, blockNumber?)`

Verify an attestation exists on-chain.

```typescript
import { verifyAttestation } from './attestation.js';

const exists = await verifyAttestation(
  'a4dfb32ae0f210ef...',  // Attestation hash
  24282779                 // Block number (optional)
);
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `attestationHash` | `string` | Hash to verify |
| `blockNumber` | `number` | Optional: specific block to check |

**Returns:** `Promise<boolean>` — `true` if attestation found

---

#### `closeBlockchain()`

Close the blockchain connection.

```typescript
import { closeBlockchain } from './attestation.js';

await closeBlockchain();
```

---

## Audit Module

### audit.ts

Audit logging for full transparency.

#### `auditLog` (Singleton)

The main audit log instance.

```typescript
import { auditLog } from './audit.js';

// Log an action
auditLog.log('data_fetched', {
  path: 'health/metrics',
  size: 1024,
});

// Get all entries
const entries = auditLog.getEntries();

// Get summary
const summary = auditLog.getSummary();

// Clear for new session
auditLog.clear();
```

---

#### `hashData(data)`

Compute SHA-256 hash of data (for audit trail).

```typescript
import { hashData } from './audit.js';

const inputHash = hashData(healthData);
// e.g., "a4dfb32ae0f210ef68bf9c32..."
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `data` | `unknown` | Data to hash (stringified if not string) |

**Returns:** `string` — Hex-encoded SHA-256 hash

---

#### Convenience Functions

```typescript
import {
  logTokenReceived,
  logTokenValidated,
  logTokenRejected,
  logDEKUnwrapped,
  logDataFetched,
  logDataDecrypted,
  logInferenceStarted,
  logInferenceCompleted,
  logOutputEncrypted,
  logOutputStored,
  logError,
} from './audit.js';

// Example usage
logTokenReceived('token-123', 'user-address');
logTokenValidated('token-123', ['health/*'], 3600000);
logDataFetched('/health/metrics', 'abc123...');
logInferenceStarted('llama3.2:3b', inputHash);
logInferenceCompleted('llama3.2:3b', outputHash, 150);
```

---

## Types Reference

### types.ts

All shared type definitions.

#### Health Data Types

```typescript
/** Health metrics data structure */
interface HealthMetrics {
  steps?: StepsData[];
  sleep?: SleepData[];
  mood?: MoodData[];
  heartRate?: HeartRateData[];
  weight?: WeightData[];
  [key: string]: unknown;
}

interface StepsData {
  date: string;           // ISO date (YYYY-MM-DD)
  count: number;          // Step count
  distance?: number;      // Meters
  duration?: number;      // Minutes
}

interface SleepData {
  date: string;
  duration: number;       // Hours
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
  deepSleep?: number;     // Hours
  remSleep?: number;      // Hours
  awakenings?: number;
}

interface MoodData {
  date: string;
  score: number;          // 1-10
  notes?: string;
  tags?: string[];
}

interface HeartRateData {
  date: string;
  resting?: number;
  average?: number;
  max?: number;
  min?: number;
}

interface WeightData {
  date: string;
  weight: number;         // kg
  bodyFat?: number;       // Percentage
}
```

#### Insight Types

```typescript
/** AI-generated health insights */
interface HealthInsights {
  generatedAt: string;
  summary: string;
  trends: TrendInsight[];
  recommendations: Recommendation[];
  alerts?: Alert[];
}

interface TrendInsight {
  category: 'steps' | 'sleep' | 'mood' | 'heartRate' | 'weight' | 'overall';
  direction: 'improving' | 'stable' | 'declining';
  description: string;
  period: string;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  actionable: boolean;
}

interface Alert {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metric?: string;
  threshold?: number;
  value?: number;
}
```

#### API Types

```typescript
/** Analysis request body */
interface AnalyzeRequest {
  token: string;
  options?: {
    detailed?: boolean;
    categories?: string[];
  };
}

/** Analysis response */
interface AnalyzeResponse {
  success: boolean;
  insights?: HealthInsights;
  error?: string;
  tokenInfo?: {
    id: string;
    issuer: string;
    expiresAt: string;
    scopes: string[];
  };
}

/** Agent info response */
interface AgentInfoResponse {
  name: string;
  version: string;
  publicKey: string;
  capabilities: string[];
  endpoints: {
    analyze: string;
    status: string;
  };
}
```

#### Crypto Types

```typescript
interface WrappedDEK {
  ciphertext: string;         // Base64
  ephemeralPublicKey: string; // Base64
  nonce: string;              // Base64
}

interface CapabilityToken {
  v: number;
  id: string;
  iss: string;
  sub: string;
  iat: number;
  exp: number;
  scopes: Array<{ path: string; permissions: string[] }>;
  bucketId: string;
  resources: string[];
  cdnUrl: string;
  wrappedDEK: WrappedDEK;
  sig: string;
  sigAlg: string;
  issuerPubKey?: string;
}
```

#### Audit Types

```typescript
interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  details: Record<string, unknown>;
  hashes: {
    input?: string;
    output?: string;
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

## Complete Example

Here's how all the pieces fit together:

```typescript
import { getOrCreateKeypair, getPublicKeyBase64 } from './keys.js';
import { unwrapDEK, decryptAES, encryptAES, isTokenExpired, verifyTokenSignature, hasScope } from './crypto.js';
import { initDDC, storeToDDC, closeDDC } from './ddc.js';
import { submitAttestation, closeBlockchain } from './attestation.js';
import { auditLog, hashData } from './audit.js';
import { analyzeHealthData } from './analyze.js';
import type { CapabilityToken, HealthMetrics } from './types.js';

async function processAnalysisRequest(token: CapabilityToken, encryptedData: Uint8Array) {
  // 1. Load agent keypair
  const keypair = getOrCreateKeypair();
  
  // 2. Validate token
  if (isTokenExpired(token)) {
    auditLog.log('token_rejected', { reason: 'expired' });
    throw new Error('Token expired');
  }
  
  if (!await verifyTokenSignature(token)) {
    auditLog.log('token_rejected', { reason: 'invalid_signature' });
    throw new Error('Invalid signature');
  }
  
  if (!hasScope(token, 'health', 'read')) {
    auditLog.log('token_rejected', { reason: 'insufficient_scope' });
    throw new Error('Token lacks health read permission');
  }
  
  auditLog.log('token_validated', { tokenId: token.id });
  
  // 3. Unwrap DEK
  const dek = unwrapDEK(token.wrappedDEK, keypair.privateKey);
  auditLog.log('dek_unwrapped');
  
  // 4. Decrypt data
  const blob = JSON.parse(new TextDecoder().decode(encryptedData));
  const plaintext = await decryptAES(blob.ciphertext, blob.iv, dek);
  const healthData: HealthMetrics = JSON.parse(plaintext);
  
  const inputHash = hashData(healthData);
  auditLog.log('data_decrypted', { hash: inputHash });
  
  // 5. Run analysis
  auditLog.log('inference_started', { model: 'llama3.2:3b' });
  const insights = await analyzeHealthData(healthData);
  const outputHash = hashData(insights);
  auditLog.log('inference_completed', { hash: outputHash });
  
  // 6. Encrypt output
  const encrypted = await encryptAES(JSON.stringify(insights), dek);
  auditLog.log('output_encrypted');
  
  // 7. Store to DDC
  await initDDC();
  const { cid } = await storeToDDC(token.bucketId, encrypted);
  auditLog.log('output_stored', { cid });
  await closeDDC();
  
  // 8. Submit attestation
  const attestation = await submitAttestation({
    sessionId: token.id,
    dataHash: inputHash,
    resultHash: outputHash,
    outputCid: cid,
    modelDigest: 'sha256:abc123...',
    timestamp: new Date().toISOString(),
  });
  auditLog.log('attestation_submitted', { block: attestation.blockNumber });
  await closeBlockchain();
  
  return { insights, attestation, auditLog: auditLog.getSummary() };
}
```

---

## Next Steps

- [CLI.md](./CLI.md) — Command-line reference
- [EXAMPLES.md](./EXAMPLES.md) — More code examples
- [SECURITY.md](./SECURITY.md) — Security requirements for agents
