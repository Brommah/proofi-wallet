# API Reference

Complete reference for the `@proofi/agent-sdk` and related APIs.

---

## Table of Contents

1. [ProofiAgent Class](#proofiagent-class)
2. [Types](#types)
3. [Capability Token Format](#capability-token-format)
4. [Crypto Utilities](#crypto-utilities)
5. [HTTP Endpoints](#http-endpoints)
6. [CLI Commands](#cli-commands)

---

## ProofiAgent Class

The main class for building Proofi-compatible agents.

### Constructor

```typescript
import { ProofiAgent } from '@proofi/agent-sdk';

const agent = new ProofiAgent<T>(config: AgentConfig);
```

#### AgentConfig

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `model` | `string` | ✅ | — | AI model name (e.g., `'llama3.2:3b'`, `'gpt-4o-mini'`) |
| `attestation` | `boolean` | ✅ | — | Enable on-chain attestation |
| `ollamaUrl` | `string` | ❌ | `'http://localhost:11434'` | Ollama API URL |
| `openaiApiKey` | `string` | ❌ | — | OpenAI API key (for cloud models) |
| `ddcBucketId` | `string` | ❌ | — | DDC bucket for storing results |
| `keypairPath` | `string` | ❌ | `'./keys/agent-keypair.json'` | Path to keypair file |
| `walletPath` | `string` | ❌ | — | Path to Cere wallet JSON |
| `walletPassphrase` | `string` | ❌ | — | Wallet passphrase |

---

### Methods

#### `getPublicKey(): string`

Returns the agent's X25519 public key (base64-encoded).

```typescript
const publicKey = agent.getPublicKey();
// "d+YpS3K8h2vJ1cR9wXmFgHiJkLmNoPqRsTuVwXyZ0A="
```

Users need this key to encrypt the DEK when creating capability tokens for your agent.

---

#### `waitForToken(options?): Promise<CapabilityToken>`

Start an HTTP server and wait for a capability token.

```typescript
const token = await agent.waitForToken({
  port: 3100,
  timeout: 300000,
  onProgress: (msg) => console.log(msg)
});
```

##### WaitForTokenOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `port` | `number` | `3100` | HTTP port to listen on |
| `timeout` | `number` | `300000` | Timeout in ms (5 min default) |
| `onProgress` | `(msg: string) => void` | — | Progress callback |

##### Endpoints Created

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/token` | Receive capability token |
| `GET` | `/info` | Get agent public key & info |

---

#### `acceptToken(token): Promise<void>`

Accept a token programmatically (without HTTP server).

```typescript
const token = JSON.parse(tokenString);
await agent.acceptToken(token);
```

Throws if token is invalid, expired, or revoked.

---

#### `analyze(token): Promise<AnalysisResult<T>>`

Analyze data using a capability token.

```typescript
const result = await agent.analyze(token);

if (result.success) {
  console.log(result.data);          // Your analysis output (type T)
  console.log(result.inputHash);     // SHA-256 of input data
  console.log(result.outputHash);    // SHA-256 of output
  console.log(result.outputCid);     // DDC CID (if stored)
  console.log(result.attestation);   // On-chain attestation
  console.log(result.auditTrail);    // Full audit log
}
```

##### What happens inside `analyze()`:

1. **Validate token** (expiry, signature, revocation)
2. **Unwrap DEK** using agent's private key
3. **Fetch encrypted data** from DDC (using token's resource CIDs)
4. **Decrypt data** with the DEK (AES-256-GCM)
5. **Run AI inference** (Ollama → OpenAI → fallback)
6. **Encrypt output** with same DEK
7. **Store to DDC** (if configured)
8. **Submit attestation** (if enabled)
9. **Return result** with full audit trail

---

#### `setAnalysisHandler(handler): void`

Set a custom analysis function.

```typescript
agent.setAnalysisHandler(async (data: unknown) => {
  // data = the decrypted user data
  
  // Your custom logic here
  const result = await myCustomModel.analyze(data);
  
  return {
    summary: result.summary,
    score: result.score
  };
});
```

If not set, the agent uses the default flow:
1. Try Ollama with the configured model
2. Fall back to OpenAI (if API key provided)
3. Fall back to a basic summary

---

#### `revokeAccess(tokenId): Promise<void>`

Revoke a token (agent-side revocation list).

```typescript
await agent.revokeAccess('token-uuid-123');
```

Stores revoked token IDs in `./revoked-tokens.json`.

---

## Types

### CapabilityToken

```typescript
interface CapabilityToken {
  // Version
  v: number;                           // Token format version (1)
  
  // Identity
  id: string;                          // Unique token ID (UUID)
  iss: string;                         // Issuer (user's address/DID)
  sub: string;                         // Subject (agent's public key)
  
  // Timing
  iat: number;                         // Issued at (Unix timestamp)
  exp: number;                         // Expires at (Unix timestamp)
  
  // Permissions
  scopes: Array<{
    path: string;                      // e.g., "health/*", "health/steps"
    permissions: ('read' | 'write')[];
  }>;
  
  // Data access
  bucketId: string;                    // DDC bucket ID
  resources: string[];                 // Specific CIDs to access
  cdnUrl: string;                      // DDC CDN endpoint
  
  // Encrypted key
  wrappedDEK: WrappedDEK;
  
  // Signature
  sig: string;                         // sr25519 signature (base64)
  sigAlg: string;                      // "sr25519"
  issuerPubKey?: string;               // For verification
}
```

### WrappedDEK

```typescript
interface WrappedDEK {
  ciphertext: string;         // NaCl box encrypted DEK (base64)
  ephemeralPublicKey: string; // Ephemeral X25519 pubkey (base64)
  nonce: string;              // 24-byte nonce (base64)
}
```

### AnalysisResult<T>

```typescript
interface AnalysisResult<T = unknown> {
  success: boolean;
  sessionId: string;
  timestamp: string;
  
  // Success fields
  data?: T;                            // Your analysis output
  inputHash: string;                   // SHA-256 of input data
  outputHash?: string;                 // SHA-256 of output
  outputCid?: string;                  // DDC CID of stored output
  
  // Error fields
  error?: string;
  
  // Model info
  model: {
    name: string;
    digest?: string;                   // Model weights hash
  };
  
  // On-chain proof
  attestation?: AttestationResult;
  
  // Transparency
  auditTrail: AuditEntry[];
}
```

### AttestationResult

```typescript
interface AttestationResult {
  blockHash: string;         // Block containing attestation
  blockNumber: number;       // Block number
  extrinsicHash: string;     // Transaction hash
  attestationHash: string;   // SHA-256 of attestation payload
}
```

### AuditEntry

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
  durationMs?: number;
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
  | 'access_revoked'
  | 'error';
```

---

## Capability Token Format

### Token Lifecycle

```
Created → Active → Used/Expired/Revoked
```

### Creating a Token (User Side)

```typescript
import nacl from 'tweetnacl';
import { encodeBase64 } from 'tweetnacl-util';

// 1. Generate a random DEK
const dek = nacl.randomBytes(32);

// 2. Encrypt user data with DEK
const encrypted = await encryptAES(userData, dek);

// 3. Upload encrypted data to DDC
const { cid } = await ddcClient.store(bucketId, encrypted);

// 4. Wrap DEK for the agent
const ephemeralKeypair = nacl.box.keyPair();
const agentPubKey = decodeBase64(agent.publicKey);
const nonce = nacl.randomBytes(24);
const encryptedDEK = nacl.box(dek, nonce, agentPubKey, ephemeralKeypair.secretKey);

const wrappedDEK = {
  ciphertext: encodeBase64(encryptedDEK),
  ephemeralPublicKey: encodeBase64(ephemeralKeypair.publicKey),
  nonce: encodeBase64(nonce)
};

// 5. Create token
const token: CapabilityToken = {
  v: 1,
  id: crypto.randomUUID(),
  iss: userAddress,
  sub: agent.publicKey,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  scopes: [{ path: 'health/*', permissions: ['read'] }],
  bucketId: '1229',
  resources: [cid],
  cdnUrl: 'https://cdn.ddc-dragon.com',
  wrappedDEK,
  sig: '',
  sigAlg: 'sr25519'
};

// 6. Sign token (optional but recommended)
const payload = JSON.stringify(token);
const signature = sr25519.sign(payload, userSecretKey);
token.sig = encodeBase64(signature);
token.issuerPubKey = encodeBase64(userPublicKey);
```

### Scope Patterns

| Pattern | Matches |
|---------|---------|
| `health/*` | All health data |
| `health/steps` | Only step data |
| `health/sleep,mood` | Sleep and mood data |
| `*` | Everything (use carefully!) |

---

## Crypto Utilities

Exported from `@proofi/agent-sdk` for advanced usage:

### `hashData(data: unknown): string`

SHA-256 hash of data (stringified if needed).

```typescript
import { hashData } from '@proofi/agent-sdk';

const hash = hashData({ steps: 10000 });
// "a4dfb32ae0f210ef68bf9c32..."
```

### `getOrCreateKeypair(path?): AgentKeypair`

Load or generate X25519 keypair.

```typescript
import { getOrCreateKeypair } from '@proofi/agent-sdk';

const keypair = getOrCreateKeypair('./my-keys/agent.json');
```

### `getPublicKeyBase64(keypair): string`

Get base64-encoded public key.

```typescript
import { getPublicKeyBase64 } from '@proofi/agent-sdk';

const pubKey = getPublicKeyBase64(keypair);
```

---

## HTTP Endpoints

### Agent Endpoints (via `waitForToken`)

#### POST /token

Receive a capability token.

**Request:**
```json
{
  "v": 1,
  "id": "token-uuid",
  "iss": "5DSxCBjQ...",
  "sub": "d+YpS3K8h2...",
  "iat": 1707345600,
  "exp": 1707349200,
  "scopes": [{ "path": "health/*", "permissions": ["read"] }],
  "bucketId": "1229",
  "resources": ["baebb4icrfih..."],
  "cdnUrl": "https://cdn.ddc-dragon.com",
  "wrappedDEK": { ... },
  "sig": "...",
  "sigAlg": "sr25519"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "Token accepted"
}
```

**Response (error):**
```json
{
  "success": false,
  "error": "Token has expired"
}
```

#### GET /info

Get agent information.

**Response:**
```json
{
  "publicKey": "d+YpS3K8h2vJ1cR9wXmFgHiJkLmNoPqRsTuVwXyZ0A=",
  "model": "llama3.2:3b",
  "attestation": true
}
```

### Health Analyzer Agent Endpoints

#### GET /status

Health check.

**Response:**
```json
{
  "status": "healthy",
  "service": "health-analyzer-agent",
  "version": "1.0.0",
  "timestamp": "2024-02-07T22:30:00.000Z",
  "uptime": 123.456
}
```

#### GET /agent-info

Extended agent information.

**Response:**
```json
{
  "name": "Health Analyzer Agent",
  "version": "1.0.0",
  "publicKey": "d+YpS3K8h2...",
  "capabilities": [
    "health-analysis",
    "steps-trends",
    "sleep-quality",
    "mood-patterns",
    "ai-insights"
  ],
  "endpoints": {
    "analyze": "/analyze",
    "status": "/status"
  }
}
```

#### POST /analyze

Analyze health data.

**Request:**
```json
{
  "token": "base64-encoded-capability-token"
}
```

**Response:**
```json
{
  "success": true,
  "insights": {
    "generatedAt": "2024-02-07T22:30:00.000Z",
    "summary": "Analyzed 3 health categories...",
    "trends": [...],
    "recommendations": [...]
  },
  "tokenInfo": {
    "id": "token-uuid",
    "issuer": "5DSxCBjQ...",
    "expiresAt": "2024-02-08T22:30:00.000Z",
    "scopes": ["health/* (read)"]
  }
}
```

---

## CLI Commands

### proofi init

Initialize agent wallet and config.

```bash
proofi init [--force] [--name <agent-name>]
```

Creates:
- `~/.proofi/config.json` - Configuration
- `~/.proofi/wallet.json` - Agent wallet
- `~/.proofi/keys/agent-keypair.json` - X25519 keypair

### proofi analyze

Run analysis on local data.

```bash
proofi analyze --input <file> [--token <file>] [--output <dir>] [--verbose]
```

| Flag | Description |
|------|-------------|
| `-i, --input` | Input JSON file (required) |
| `-t, --token` | Capability token file (optional) |
| `-o, --output` | Output directory for audit logs |
| `--verbose` | Enable verbose output |

### proofi verify

Verify on-chain attestation.

```bash
proofi verify --block <number> [--hash <hash>] [--verbose]
```

| Flag | Description |
|------|-------------|
| `-b, --block` | Block number to check (required) |
| `-h, --hash` | Specific attestation hash to find |

### proofi wallet create

Create a new agent wallet.

```bash
proofi wallet create [--force]
```

### proofi wallet fund

Show wallet funding instructions.

```bash
proofi wallet fund
```

### proofi wallet info

Display wallet information.

```bash
proofi wallet info
```

---

## Health Data Types

### HealthMetrics

```typescript
interface HealthMetrics {
  steps?: StepsData[];
  sleep?: SleepData[];
  mood?: MoodData[];
  heartRate?: HeartRateData[];
  weight?: WeightData[];
}

interface StepsData {
  date: string;       // "YYYY-MM-DD"
  count: number;
  distance?: number;  // meters
}

interface SleepData {
  date: string;
  duration: number;   // hours
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
}

interface MoodData {
  date: string;
  score: number;      // 1-10
  notes?: string;
}

interface HeartRateData {
  date: string;
  resting?: number;
  average?: number;
  max?: number;
}

interface WeightData {
  date: string;
  weight: number;     // kg
  bodyFat?: number;   // percentage
}
```

### HealthInsights

```typescript
interface HealthInsights {
  generatedAt: string;
  summary: string;
  trends: Array<{
    category: string;
    direction: 'improving' | 'stable' | 'declining';
    description: string;
    period: string;
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    actionable: boolean;
  }>;
  alerts?: Array<{
    severity: 'info' | 'warning' | 'critical';
    message: string;
  }>;
}
```

---

## Error Codes

| Error | Cause | Solution |
|-------|-------|----------|
| `Token has expired` | `exp` timestamp passed | User creates new token |
| `Token signature verification failed` | Invalid signature | Check signing process |
| `Token has been revoked` | Token in revocation list | User creates new token |
| `DEK unwrapping failed` | Wrong public key used | User re-encrypts DEK for correct agent |
| `DDC fetch failed` | Network/permission issue | Check bucket access |
| `No resources in token` | Empty resources array | Token must include CIDs |

---

## Next Steps

- [Architecture Guide](./ARCHITECTURE.md) - How everything connects
- [Runbook](./RUNBOOK.md) - Deployment & operations
- [Design Practices](./DESIGN-PRACTICES.md) - UX patterns
