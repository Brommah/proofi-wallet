# 🔬 Health Analyzer - Complete E2E Walkthrough

## Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        USER'S DEVICE (Proofi Wallet)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Generate DEK (Data Encryption Key)                                      │
│  2. Encrypt health data with AES-256-GCM                                    │
│  3. Store encrypted data to DDC                                             │
│  4. Wrap DEK with agent's X25519 public key                                 │
│  5. Create capability token with wrapped DEK                                │
│  6. Send token to agent                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DDC (Cere Mainnet)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  Bucket: 1229                                                               │
│  Input CID:  baebb4icsj3mtqapdu5m3yoqpfuntt3vnj4xdydilwjfclaby65txdtgrjq   │
│  Output CID: baebb4ifu3xacabhde76fkk44fznmsermxhsgvzynfvhrd5ipyiip37zn6m   │
│                                                                             │
│  ✅ Encrypted at rest                                                       │
│  ✅ Content-addressed (immutable)                                           │
│  ✅ Verifiable via CDN                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AGENT (Local Machine)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Receive capability token from user                                      │
│  2. Fetch encrypted data from DDC (via CDN)                                 │
│  3. Unwrap DEK with agent's X25519 private key                              │
│  4. Decrypt data with AES-256-GCM                                           │
│  5. Run LOCAL inference with Ollama (llama3.2:3b)                           │
│  6. Encrypt output with same DEK                                            │
│  7. Store encrypted output to DDC                                           │
│  8. Return output CID to user                                               │
│  9. Save audit log locally                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Demo Run: 2026-02-08T12:29:51Z

### Step 1: Demo Setup (User Simulation)

```bash
npx tsx demo/setup-demo.ts
```

**Output:**
- Generated agent X25519 keypair
- Generated DEK: `31edfd6b2a23a565...`
- Encrypted 1195 bytes → 1616 bytes
- Stored to DDC: `baebb4icsj3mtqapdu5m3yoqpfuntt3vnj4xdydilwjfclaby65txdtgrjq`
- Created capability token with wrapped DEK

### Step 2: Agent Analysis

```bash
npx tsx src/local.ts \
  --bucket 1229 \
  --cid baebb4icsj3mtqapdu5m3yoqpfuntt3vnj4xdydilwjfclaby65txdtgrjq \
  --token demo/artifacts/capability-token.json \
  --agent-key demo/artifacts/agent-key.json
```

**Detailed Flow:**

| Step | Action | Details |
|------|--------|---------|
| 1 | Fetch model info | `llama3.2:3b` (sha256:dde5aa3fc5ffc...) |
| 2 | Fetch from DDC | Downloaded 1657 bytes via CDN |
| 3 | Load token | Token valid, expires in 3557s |
| 4 | Load agent key | 32 bytes X25519 private key |
| 5 | Unwrap DEK | NaCl box.open with ephemeral pubkey |
| 6 | Decrypt data | AES-256-GCM, 1195 bytes output |
| 7 | Run inference | Ollama llama3.2:3b, 14 seconds |
| 8 | Encrypt output | AES-256-GCM, 2004 bytes ciphertext |
| 9 | Store to DDC | CID: baebb4ifu3xacabhde76fkk44fznmsermxhsgvzynfvhrd5ipyiip37zn6m |
| 10 | Sign audit log | HMAC-SHA256 |
| 11 | Save locally | ~/clawd/audit-logs/health-analyzer/ |

---

## Verification

### Input Data (Encrypted on DDC)

```bash
curl -s "https://cdn.ddc-dragon.com/1229/baebb4icsj3mtqapdu5m3yoqpfuntt3vnj4xdydilwjfclaby65txdtgrjq"
```

Returns encrypted blob:
```json
{
  "ciphertext": "QeWJSt8KzQP...",
  "iv": "IMsxuPknxdPhgmAn..."
}
```

### Output Data (Encrypted on DDC)

```bash
curl -s "https://cdn.ddc-dragon.com/1229/baebb4ifu3xacabhde76fkk44fznmsermxhsgvzynfvhrd5ipyiip37zn6m"
```

Returns encrypted output (only decryptable by user with DEK).

### Audit Log

```bash
cat ~/clawd/audit-logs/health-analyzer/health-analysis-audit-2026-02-08T12-30-08-094Z.json | jq
```

Contains:
- `sessionId`: Unique session identifier
- `model.digest`: Exact model weights hash
- `inputData`: Full input (for reproducibility)
- `dataHash`: SHA-256 of input
- `resultHash`: SHA-256 of output
- `outputCid`: DDC location of encrypted output
- `signature`: HMAC for tamper detection

---

## Cryptographic Details

### Key Exchange
- **User → Agent**: X25519 ECDH with ephemeral keypair
- **DEK wrapping**: NaCl `box` (Curve25519 + XSalsa20-Poly1305)

### Data Encryption
- **Algorithm**: AES-256-GCM
- **IV**: 12 bytes random per encryption
- **Auth tag**: 16 bytes appended to ciphertext

### Audit Signing
- **Algorithm**: HMAC-SHA256
- **Key**: 32 bytes, stored in `.signing-key`
- **Payload**: sessionId + timestamps + hashes

---

## Model Versioning

```json
{
  "name": "llama3.2:3b",
  "digest": "sha256:dde5aa3fc5ffc17176b5e8bdc82f587b24b2678c6c66101bf7da77af9f7ccdff",
  "ollamaVersion": "0.15.5",
  "parameters": {
    "format": "gguf",
    "family": "llama",
    "parameter_size": "3.2B",
    "quantization_level": "Q4_K_M"
  }
}
```

---

## Security Properties

| Property | Guarantee |
|----------|-----------|
| **Data Privacy** | User data encrypted, only decryptable with DEK |
| **Agent Can't Exfiltrate** | No plaintext stored, output encrypted |
| **Reproducibility** | Full input + model digest in audit log |
| **Tamper Detection** | HMAC signature on audit log |
| **Verifiability** | CIDs are content-addressed (hash of content) |
| **Local Inference** | No API calls, Ollama runs on-device |

---

## Files

```
health-analyzer/
├── demo/
│   ├── setup-demo.ts           # Creates encrypted input + token
│   └── artifacts/
│       ├── agent-key.json      # Agent X25519 private key
│       ├── capability-token.json # User-issued token
│       └── demo-info.json      # CIDs, hashes
├── src/
│   ├── local.ts                # Main analyzer
│   ├── crypto.ts               # AES-GCM + DEK wrapping
│   ├── ddc.ts                  # DDC storage
│   ├── analyze.ts              # Ollama inference
│   └── audit.ts                # Audit logging
└── audit-logs/
    └── health-analysis-audit-*.json
```

---

## Commands

### Setup Demo Data
```bash
cd /private/tmp/proofi-agents-check/health-analyzer
npx tsx demo/setup-demo.ts
```

### Run Full Analysis
```bash
npx tsx src/local.ts \
  --bucket 1229 \
  --cid <INPUT_CID> \
  --token demo/artifacts/capability-token.json \
  --agent-key demo/artifacts/agent-key.json
```

### Verify Output on DDC
```bash
curl -s "https://cdn.ddc-dragon.com/1229/<OUTPUT_CID>" | jq
```

---

*Generated: 2026-02-08T12:30:08Z*
