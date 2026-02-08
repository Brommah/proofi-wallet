# Proofi Security Model

This document provides a comprehensive security analysis of the Proofi agent system, including the cryptographic protocols, threat model, and security requirements.

---

## 📋 Table of Contents

1. [Security Principles](#security-principles)
2. [Cryptographic Protocols](#cryptographic-protocols)
3. [Threat Model](#threat-model)
4. [Trust Boundaries](#trust-boundaries)
5. [Attack Vectors & Mitigations](#attack-vectors--mitigations)
6. [Agent Security Requirements](#agent-security-requirements)
7. [Key Management](#key-management)
8. [Audit Trail](#audit-trail)
9. [Incident Response](#incident-response)

---

## Security Principles

Proofi operates on a **zero-trust, capability-based** security model:

### 1. Minimal Access

Agents receive only the data they need, for only as long as they need it.

```
❌ Traditional: "Give me access to your entire Google account"
✅ Proofi: "Give me read access to health/steps/* for 1 hour"
```

### 2. Cryptographic Enforcement

Access control isn't just policy — it's cryptography:

- User data is **encrypted at rest** with AES-256-GCM
- Agent receives a **wrapped DEK** (Data Encryption Key)
- DEK is encrypted with X25519 key exchange
- Only the intended agent can unwrap and decrypt

### 3. Stateless Processing

Agents process data in-memory and return insights. They do NOT:

- Store user data on disk
- Cache data between requests
- Log raw data values
- Transmit data to third parties

### 4. Time-Limited Tokens

Every capability token has an expiration:

| Use Case | Typical TTL | Renewal |
|----------|-------------|---------|
| One-time analysis | 1 hour | None |
| Daily health check | 24 hours | Manual |
| Ongoing monitoring | 7 days | Auto-refresh |

### 5. User-Controlled Revocation

Users can revoke any token at any time via on-chain revocation records.

---

## Cryptographic Protocols

### Key Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           KEY HIERARCHY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User Wallet (generated locally)                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  sr25519 Keypair (Identity/Signing)                                │   │
│  │  ├── Public Key → Substrate Address (5DSxCBjQ...)                  │   │
│  │  └── Private Key → Signs tokens, attestations                      │   │
│  │                                                                     │   │
│  │  X25519 Keypair (Encryption)                                       │   │
│  │  ├── Public Key → Shared with agents for DEK wrapping             │   │
│  │  └── Private Key → Unwraps DEKs when needed                        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                           │                                                 │
│                           │ Derives                                         │
│                           ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Data Encryption Keys (DEKs) — per data category                   │   │
│  │  ├── health/steps   → AES-256 key (32 bytes)                       │   │
│  │  ├── health/sleep   → AES-256 key (32 bytes)                       │   │
│  │  └── health/mood    → AES-256 key (32 bytes)                       │   │
│  │                                                                     │   │
│  │  DEKs are:                                                         │   │
│  │  • Generated randomly (not derived from wallet)                    │   │
│  │  • Stored encrypted in user vault                                  │   │
│  │  • Wrapped per-agent using X25519 key exchange                     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Agent Keypair (generated on agent)                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  X25519 Keypair                                                    │   │
│  │  ├── Public Key → Exposed via /agent-info                          │   │
│  │  └── Private Key → Unwraps DEKs from capability tokens             │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### DEK Wrapping (X25519 + NaCl Box)

When granting access, the user wraps the DEK for the agent:

```
Alice (User)                                    Bob (Agent)
────────────────────────────────────────────────────────────────

1. Alice knows:
   - DEK (32 bytes, the data encryption key)
   - Bob's public X25519 key (from /agent-info)

2. Alice generates ephemeral X25519 keypair:
   (ephPublic, ephSecret) = X25519.keyPair()

3. Alice computes shared secret:
   shared = X25519(ephSecret, bobPublic)

4. Alice encrypts DEK:
   nonce = random(24 bytes)
   wrappedDEK = NaCl.secretbox(DEK, nonce, shared)

5. Alice sends to Bob:
   {
     ciphertext: base64(wrappedDEK),
     ephemeralPublicKey: base64(ephPublic),
     nonce: base64(nonce)
   }

────────────────────────────────────────────────────────────────

6. Bob receives the wrapped DEK

7. Bob computes shared secret:
   shared = X25519(bobSecret, ephPublic)

8. Bob decrypts DEK:
   DEK = NaCl.secretbox.open(wrappedDEK, nonce, shared)

9. Bob uses DEK to decrypt user data with AES-256-GCM
```

### Data Encryption (AES-256-GCM)

All user data is encrypted before leaving the device:

```
Encryption:
───────────
plaintext = JSON.stringify(healthData)
DEK = 32-byte AES key
IV = random(12 bytes)  // 96 bits for GCM

cipher = AES-256-GCM(DEK)
ciphertext = cipher.update(plaintext) + cipher.final()
authTag = cipher.getAuthTag()  // 128 bits

stored = {
  ciphertext: base64(ciphertext + authTag),  // Tag appended
  iv: base64(IV)
}
```

### Token Signing (sr25519)

Capability tokens are signed with the user's sr25519 key:

```typescript
// Signing (user side)
const payload = JSON.stringify({
  v: 1,
  id: 'tok_abc123',
  iss: userAddress,
  sub: agentPublicKey,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  scopes: [{ path: 'health/*', permissions: ['read'] }],
  bucketId: '1229',
  wrappedDEK: { /* ... */ }
});

const signature = sr25519.sign(payload, userSecretKey);

token.sig = base64(signature);
token.sigAlg = 'sr25519';
token.issuerPubKey = base64(userPublicKey);

// Verification (agent side)
const isValid = sr25519.verify(payload, signature, issuerPubKey);
```

---

## Threat Model

### What We Protect Against

| Threat | Description | Mitigation |
|--------|-------------|------------|
| **Unauthorized access** | Attacker tries to access user data without permission | Scoped tokens, cryptographic enforcement |
| **Token replay** | Attacker reuses old/stolen token | Expiration, revocation checking |
| **Token forgery** | Attacker creates fake tokens | sr25519 signatures |
| **Data exfiltration** | Malicious agent extracts raw data | Stateless processing, output validation |
| **Key compromise** | Agent's private key is stolen | Key rotation, limited token scope |
| **Man-in-the-middle** | Attacker intercepts network traffic | TLS everywhere, encrypted payloads |
| **Storage breach** | DDC storage is compromised | AES-256-GCM encryption at rest |
| **Model inference attacks** | Extract training data from AI | Local models, no persistent memory |

### What We Don't Protect Against

| Threat | Reason | Mitigation Approach |
|--------|--------|---------------------|
| **Malicious user device** | User device is trusted boundary | User responsibility |
| **Compromised Ollama** | Local AI is semi-trusted | Verify model digests |
| **Physical access** | Physical access = game over | Full-disk encryption |
| **Side-channel attacks** | Complex to prevent | Future: TEE support |

---

## Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TRUST BOUNDARIES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗ │
│  ║ FULLY TRUSTED — User Device                                           ║ │
│  ║                                                                       ║ │
│  ║  • Wallet private keys (sr25519, X25519)                             ║ │
│  ║  • DEKs in memory                                                    ║ │
│  ║  • Plaintext data in memory                                          ║ │
│  ║  • Token generation & signing                                        ║ │
│  ║                                                                       ║ │
│  ║  Security: User is responsible for device security                   ║ │
│  ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                   │                                         │
│                                   ▼                                         │
│  ╔═══════════════════════════════════════════════════════════════════════╗ │
│  ║ SEMI-TRUSTED — Agent (when running locally)                           ║ │
│  ║                                                                       ║ │
│  ║  Has access to (during processing):                                  ║ │
│  ║  • Agent's X25519 private key                                        ║ │
│  ║  • Unwrapped DEK (in memory)                                         ║ │
│  ║  • Decrypted data (in memory)                                        ║ │
│  ║  • AI model weights                                                  ║ │
│  ║                                                                       ║ │
│  ║  Constrained by:                                                     ║ │
│  ║  • Token expiration (checked every operation)                        ║ │
│  ║  • Scope restrictions (only granted paths)                           ║ │
│  ║  • Stateless processing (no persistence)                             ║ │
│  ║  • Full audit logging (every action recorded)                        ║ │
│  ║                                                                       ║ │
│  ║  Verified by:                                                        ║ │
│  ║  • On-chain attestations                                             ║ │
│  ║  • Reproducible audit logs                                           ║ │
│  ║  • Model digest verification                                         ║ │
│  ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                   │                                         │
│                                   ▼                                         │
│  ╔═══════════════════════════════════════════════════════════════════════╗ │
│  ║ UNTRUSTED — Network & Storage                                         ║ │
│  ║                                                                       ║ │
│  ║  • DDC storage nodes (see only encrypted blobs)                      ║ │
│  ║  • CDN edge servers (serve encrypted content)                        ║ │
│  ║  • Network transport (TLS encrypted)                                 ║ │
│  ║  • Blockchain (public attestation hashes only)                       ║ │
│  ║                                                                       ║ │
│  ║  Cannot access:                                                      ║ │
│  ║  • Plaintext data (encrypted with user's DEK)                        ║ │
│  ║  • DEKs (only wrapped versions transit network)                      ║ │
│  ║  • Private keys (never leave their devices)                          ║ │
│  ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Attack Vectors & Mitigations

### 1. Token Theft

**Attack:** Attacker steals a valid capability token

**Mitigations:**
- Tokens expire (typically 1 hour)
- Tokens are scoped to specific paths
- User can revoke token on-chain
- Agent checks revocation before processing

```typescript
// Agent-side validation
async function validateToken(token: CapabilityToken): Promise<void> {
  // 1. Check expiration
  if (Date.now() > token.exp * 1000) {
    throw new Error('Token expired');
  }
  
  // 2. Verify signature
  if (!await verifyTokenSignature(token)) {
    throw new Error('Invalid signature');
  }
  
  // 3. Check revocation
  if (await isTokenRevoked(token)) {
    throw new Error('Token revoked');
  }
}
```

### 2. Agent Key Compromise

**Attack:** Attacker obtains agent's X25519 private key

**Impact:** Can unwrap DEKs from tokens issued to this agent

**Mitigations:**
- Key rotation (generate new keypair, update /agent-info)
- Existing tokens become useless (new tokens use new key)
- Short token TTLs limit exposure window

```bash
# Key rotation procedure
1. Stop agent
2. rm ./keys/agent-keypair.json
3. Restart agent (new keypair generated)
4. Users must re-grant access using new public key
```

### 3. Replay Attack

**Attack:** Attacker replays a valid token multiple times

**Current Mitigations:**
- Token expiration limits replay window
- Audit logs show repeated usage

**Future Enhancements:**
- Add nonce to tokens (one-time use)
- On-chain token usage tracking

### 4. Malicious Agent

**Attack:** Agent is compromised or intentionally malicious

**Mitigations:**
- Agent can only access scoped data
- Agent can only use data for token lifetime
- All operations are logged in audit trail
- On-chain attestations create permanent record
- Open-source agent code for inspection

**Detection:**
- Audit log shows exactly what agent accessed
- Attestation hash can be verified against outputs
- Model digest shows which AI was used

### 5. Data Exfiltration

**Attack:** Agent sends raw data to external server

**Mitigations:**
- Run agent locally (100% on your machine)
- No network calls except:
  - DDC fetch (encrypted data)
  - DDC store (encrypted output)
  - Blockchain attestation (hashes only)
- Audit log records all operations

**Verification:**
```bash
# Network monitoring during agent execution
tcpdump -i any host your-agent-host

# Should only see:
# - DDC CDN requests (encrypted payloads)
# - Cere blockchain RPC (attestation hashes)
```

### 6. Model Manipulation

**Attack:** Malicious AI model extracts or memorizes data

**Mitigations:**
- Use local Ollama models (weights verified)
- Model digest recorded in attestation
- No model fine-tuning on user data
- Inference is stateless (no memory between requests)

```typescript
// Model verification
async function getModelInfo(): Promise<ModelInfo> {
  const response = await fetch(`${OLLAMA_URL}/api/show`, {
    method: 'POST',
    body: JSON.stringify({ name: OLLAMA_MODEL }),
  });
  
  const data = await response.json();
  
  // Extract SHA256 of model weights
  const digestMatch = data.modelfile.match(/sha256-([a-f0-9]{64})/);
  
  return {
    name: OLLAMA_MODEL,
    digest: `sha256:${digestMatch[1]}`,
    ollamaVersion: data.version,
  };
}
```

---

## Agent Security Requirements

Every Proofi-compatible agent MUST implement:

### 1. Token Validation

```typescript
// REQUIRED: Validate every token
function validateToken(token: CapabilityToken): void {
  // Expiration check
  if (Date.now() > token.exp * 1000) {
    throw new Error('Token expired');
  }
  
  // Subject check (token is for this agent)
  if (token.sub !== getAgentPublicKey()) {
    throw new Error('Token not for this agent');
  }
  
  // Signature verification
  if (!verifySignature(token)) {
    throw new Error('Invalid signature');
  }
}
```

### 2. Scope Enforcement

```typescript
// REQUIRED: Respect scope boundaries
function checkAccess(token: CapabilityToken, path: string, permission: 'read' | 'write'): boolean {
  return token.scopes.some(scope => {
    const pathMatch = matchGlob(scope.path, path);
    const permMatch = scope.permissions.includes(permission);
    return pathMatch && permMatch;
  });
}

// Usage
if (!checkAccess(token, 'health/metrics', 'read')) {
  throw new Error('Access denied: insufficient scope');
}
```

### 3. Stateless Processing

```typescript
// REQUIRED: No data persistence
class HealthAnalyzer {
  // ❌ NEVER
  private cache: Map<string, HealthData> = new Map();
  
  // ✅ OK: Process in memory, discard immediately
  async analyze(data: HealthData): Promise<HealthInsights> {
    const insights = await this.runInference(data);
    // data and insights are garbage collected after return
    return insights;
  }
}
```

### 4. Private Key Protection

```typescript
// REQUIRED: Never expose private key
function loadKeypair(): AgentKeypair {
  const keypair = readKeypairFromDisk();
  
  // Set restrictive permissions
  fs.chmodSync(KEYPAIR_PATH, 0o600);
  
  // ❌ NEVER log
  console.log(keypair.privateKey);
  
  // ❌ NEVER include in errors
  throw new Error(`Key: ${keypair.privateKey}`);
  
  return keypair;
}
```

### 5. Audit Logging

```typescript
// REQUIRED: Log every operation
auditLog.log('token_received', { tokenId: token.id });
auditLog.log('data_fetched', { path, hash: hashData(data) });
auditLog.log('inference_completed', { model, outputHash });
auditLog.log('output_stored', { cid });
```

---

## Key Management

### Agent Key Storage

```
./keys/
└── agent-keypair.json     # chmod 600
```

**File format:**
```json
{
  "publicKey": "base64...",
  "privateKey": "base64...",
  "createdAt": "2024-02-08T12:00:00.000Z",
  "algorithm": "X25519"
}
```

### Key Rotation Procedure

1. **Stop the agent**
   ```bash
   pkill -f "node.*health-analyzer"
   ```

2. **Backup old key (if needed for audit)**
   ```bash
   mv ./keys/agent-keypair.json ./keys/agent-keypair.backup.json
   ```

3. **Delete old key**
   ```bash
   rm ./keys/agent-keypair.json
   ```

4. **Restart agent (new key generated)**
   ```bash
   npm start
   ```

5. **Verify new key**
   ```bash
   curl http://localhost:3100/agent-info | jq '.publicKey'
   ```

6. **Notify users**
   - Update documentation
   - Revoke old tokens (they won't work anyway)
   - Users must re-grant access

### Production Key Management

For production deployments:

| Approach | Pros | Cons |
|----------|------|------|
| File system | Simple | Requires disk encryption |
| Environment variable | No disk persistence | Visible in process list |
| Secrets manager (Vault, AWS SM) | Best security | Additional infrastructure |
| Hardware Security Module | Highest security | Expensive |

---

## Audit Trail

### Audit Log Structure

Every analysis session generates a complete audit log:

```typescript
interface LocalAuditLog {
  sessionId: string;        // Unique session identifier
  startedAt: string;        // ISO timestamp
  completedAt?: string;     // ISO timestamp
  
  config: {
    bucketId: string;       // DDC bucket
    outputPath: string;     // Where log was saved
    useLocalAI: boolean;    // Local vs API
  };
  
  model?: {
    name: string;           // e.g., "llama3.2:3b"
    digest: string;         // SHA256 of model weights
    ollamaVersion: string;
  };
  
  inputData: unknown;       // FULL input for reproducibility
  dataHash: string;         // SHA256 of input
  resultHash?: string;      // SHA256 of output
  outputCid?: string;       // DDC CID of encrypted output
  
  signature?: string;       // HMAC signature
  
  entries: AuditEntry[];    // All logged operations
  insights?: HealthInsights;
}
```

### Audit Verification

```bash
# 1. Load audit log
cat ./audit-logs/health-analysis-*.json | jq

# 2. Verify data hash
echo -n '{"steps":[...]}' | sha256sum
# Compare with .dataHash

# 3. Verify on-chain attestation
curl "https://explorer.cere.network/api/block/24282779" | \
  jq '.extrinsics[] | select(.method == "remark")'
# Should contain PROOFI:{attestationHash}

# 4. Fetch and verify output from DDC
curl "https://cdn.ddc-dragon.com/1229/${outputCid}" | \
  jq '.ciphertext' | base64 -d | sha256sum
# Compare with stored hash
```

---

## Incident Response

### If Agent Key is Compromised

1. **Immediately rotate key** (see Key Rotation Procedure)
2. **Review audit logs** for suspicious activity
3. **Notify affected users** to revoke their tokens
4. **Check attestations** for unauthorized operations

### If Token is Leaked

1. **User revokes token** via wallet interface
2. **Revocation recorded on-chain**
3. **Agent checks revocation** before processing

```typescript
// Revocation check
async function isTokenRevoked(token: CapabilityToken): Promise<boolean> {
  // Check local revocation file
  const localRevoked = checkLocalRevocations(token.id);
  if (localRevoked) return true;
  
  // Check on-chain (query for PROOFI_REVOKE:{tokenId})
  const onChainRevoked = await checkOnChainRevocation(token.id, token.iss);
  return onChainRevoked;
}
```

### If Data Breach Suspected

1. **Review audit logs** for all sessions
2. **Check attestation hashes** match stored outputs
3. **Verify model digests** are expected values
4. **Network forensics** (tcpdump, firewall logs)

---

## Security Checklist

### For Agent Developers

- [ ] Token validation (expiration, signature, revocation)
- [ ] Scope enforcement (only access granted paths)
- [ ] Stateless processing (no data persistence)
- [ ] Private key protection (chmod 600, never log)
- [ ] Audit logging (every operation)
- [ ] On-chain attestation (hash of operations)
- [ ] Error handling (no sensitive data in errors)

### For Production Deployment

- [ ] TLS enabled (HTTPS only)
- [ ] Key stored in secrets manager
- [ ] Rate limiting enabled
- [ ] Logging excludes sensitive data
- [ ] Health checks configured
- [ ] Monitoring/alerting set up
- [ ] Backup/recovery tested
- [ ] Security headers configured

### For Users

- [ ] Review agent's public key before granting access
- [ ] Set appropriate token TTL
- [ ] Limit scopes to minimum required
- [ ] Monitor audit logs for unusual activity
- [ ] Revoke tokens when access no longer needed

---

## Reporting Security Issues

### ⚠️ DO NOT open a public GitHub issue for security vulnerabilities.

### Responsible Disclosure

1. **Email**: security@proofi.com
2. **Subject**: `[SECURITY] Brief description`
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

| Timeline | Action |
|----------|--------|
| 24 hours | Acknowledgment of report |
| 7 days | Initial assessment |
| 30 days | Fix developed (for valid issues) |
| 90 days | Public disclosure (coordinated) |

---

## Next Steps

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System architecture details
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Secure deployment guide
- [SDK.md](./SDK.md) — Implementation reference
