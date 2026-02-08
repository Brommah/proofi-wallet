# Proofi CLI Reference

This document covers all command-line interfaces available in the Proofi agent system.

---

## 📋 Table of Contents

1. [Health Analyzer CLI](#health-analyzer-cli)
2. [Interactive Mode](#interactive-mode)
3. [Non-Interactive Mode](#non-interactive-mode)
4. [Server Mode](#server-mode)
5. [Environment Variables](#environment-variables)
6. [Exit Codes](#exit-codes)

---

## Health Analyzer CLI

The Health Analyzer can run in three modes:

| Mode | Command | Description |
|------|---------|-------------|
| Interactive | `npm run local` | Step-by-step guided analysis |
| Non-Interactive | `npm run local -- --bucket <id>` | Scripted/automated analysis |
| Server | `npm start` | HTTP server for API access |

---

## Interactive Mode

Run the health analyzer with a guided, step-by-step interface.

### Usage

```bash
npm run local
# or
npx proofi-health-analyzer
# or (after build)
node dist/local.js
```

### What You'll See

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ██████╗ ██╗   ██╗██████╗ ███████╗    ███╗   ███╗ ██████╗ ██████╗ ███████╗  ║
║   ██╔══██╗██║   ██║██╔══██╗██╔════╝    ████╗ ████║██╔═══██╗██╔══██╗██╔════╝  ║
║   ██████╔╝██║   ██║██████╔╝█████╗      ██╔████╔██║██║   ██║██║  ██║█████╗    ║
║   ██╔═══╝ ██║   ██║██╔══██╗██╔══╝      ██║╚██╔╝██║██║   ██║██║  ██║██╔══╝    ║
║   ██║     ╚██████╔╝██║  ██║███████╗    ██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗  ║
║   ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚══════╝    ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝  ║
║                                                                              ║
║                     Health Analyzer - Local Execution                        ║
║                                                                              ║
║   Your data NEVER leaves your device.                                        ║
║   Maximum transparency. Full audit trail.                                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 This tool runs health analysis ENTIRELY on your machine.

   Data Flow:
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │ Your Device │ ←─ │     DDC     │    │   AI Model  │
   │  (decrypt)  │    │ (encrypted) │    │   (local*)  │
   └──────┬──────┘    └─────────────┘    └──────┬──────┘
          │                                      │
          └──────────────┬───────────────────────┘
                         │
                ┌────────▼────────┐
                │   Local Audit   │
                │      Log        │
                └─────────────────┘
```

### Interactive Steps

1. **Enter DDC Bucket ID** — Where your encrypted health data is stored
2. **Wallet/Key File** — Path to your wallet or key for decryption (optional for demo)
3. **Audit Log Location** — Where to save the analysis audit log
4. **Confirm Configuration** — Review and proceed
5. **View Results** — See insights, trends, and recommendations

### Example Session

```
[1/5] 🪣 Enter your DDC Bucket ID
   This is where your encrypted health data is stored.

   Bucket ID: 1229

[2/5] 🔑 Wallet / Key File (optional)
   Path to your wallet or key file for decryption.
   Leave empty to use demo data.

   Key path (or press Enter to skip): ./demo/artifacts/agent-key.json

[3/5] 📁 Audit Log Location
   Where to save the audit log. Default: ./audit-logs

   Output path (Enter for default): 

[4/5] ✅ Confirm Configuration
   • Bucket ID:  1229
   • Key File:   ./demo/artifacts/agent-key.json
   • Output:     ./audit-logs
   • AI Mode:    Ollama llama3.2:3b

   Proceed? (Y/n): y

[5/5] 🔬 Running Analysis

  Session: local_1707388420_abc123
  Started: 2024-02-08T12:00:20.000Z

  → Fetching model info...
  ✓ Model: llama3.2:3b (sha256:dde5aa3f...)
  ✓ Ollama: v0.1.27
  → Connecting to DDC bucket: 1229
  ✓ Fetched 2048 bytes from DDC
  → Loading capability token from ./demo/artifacts/capability-token.json
  ✓ Token loaded (id: tok_abc123...)
  → Verifying token signature...
  ✓ Token signature VERIFIED
  → Checking token revocation...
  ✓ Token not revoked
  → Unwrapping DEK with agent private key...
  ✓ DEK unwrapped (32 bytes)
  → Decrypting with AES-256-GCM...
  ✓ Decrypted 1024 bytes of health data
  ⏳ Analyzing with llama3.2:3b...
  ✓ Analysis complete (hash: b5efc43...)
  → Encrypting output with user DEK...
  ✓ Output encrypted
  → Storing to DDC bucket 1229...
  ✓ Stored to DDC (CID: baebb4ic...)

  📜 Submitting on-chain attestation...
  → Connecting to Cere mainnet...
  ✓ Connected to Cere
  → Submitting attestation from 5DSxCBjQ...
  ✓ Attestation submitted!
    Block: #24282779 (0x1a2b3c4d...)
    Tx: 0x5e6f7a8b...
    Attestation: a4dfb32a...

════════════════════════════════════════════════════════════════
                      ANALYSIS RESULTS
════════════════════════════════════════════════════════════════

📊 Summary: Analyzed 3 health categories. Overall trend is positive.

📈 Trends:
   ↑ [steps] Average 8,500 steps/day over the last week (+15% vs previous)
   → [sleep] Averaging 6.8 hours of sleep recently
   ↑ [mood] Average mood score of 6.4/10 over the last week

💡 Recommendations:
   🟢 Great activity level!
      You're consistently hitting 10,000+ steps. Consider adding 
      strength training to complement your cardio.

   🟡 Consider stress management
      Your mood scores suggest you might be experiencing stress. 
      Consider practices like mindfulness or regular exercise.

════════════════════════════════════════════════════════════════
📝 Audit log saved: ./audit-logs/health-analysis-audit-2024-02-08T12-00-20-000Z.json
   Data hash:   a4dfb32ae0f2...
   Result hash: b5efc43bf1g3...
   Output CID:  baebb4icrfih4detjyt3...
════════════════════════════════════════════════════════════════

✅ Analysis complete! Encrypted output stored to DDC!
```

---

## Non-Interactive Mode

Run the health analyzer with command-line arguments for scripting and automation.

### Usage

```bash
npm run local -- [OPTIONS]
```

### Options

| Option | Short | Description | Required |
|--------|-------|-------------|----------|
| `--bucket <id>` | `-b` | DDC bucket ID containing health data | Yes (non-interactive) |
| `--cid <cid>` | `-c` | Specific CID to fetch from DDC | No |
| `--token <path>` | `-t` | Path to capability token JSON | No |
| `--agent-key <path>` | | Path to agent's X25519 private key | No |
| `--key <path>` | `-k` | Path to wallet/key file | No |
| `--output <path>` | `-o` | Directory for audit logs | No (default: `./audit-logs`) |
| `--verbose` | `-v` | Enable verbose output | No |
| `--help` | `-h` | Show help message | — |

### Examples

#### Basic Analysis with Demo Data

```bash
npm run local -- --bucket demo
```

#### Analysis with Token and Key

```bash
npm run local -- \
  --bucket 1229 \
  --cid baebb4icrfih4detjyt3 \
  --token ./my-token.json \
  --agent-key ./keys/agent-keypair.json \
  --output ./my-audit-logs
```

#### Verbose Mode

```bash
npm run local -- --bucket 1229 --verbose
```

#### In CI/CD Pipeline

```bash
#!/bin/bash
set -e

# Run analysis
npm run local -- \
  --bucket "$DDC_BUCKET_ID" \
  --token "$TOKEN_PATH" \
  --output /tmp/audit-logs

# Check exit code
if [ $? -eq 0 ]; then
  echo "Analysis completed successfully"
  cat /tmp/audit-logs/*.json | jq '.resultHash'
fi
```

---

## Server Mode

Run the Health Analyzer as an HTTP server.

### Start Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm run build
npm start
```

### Default Port

The server listens on port `3100` by default. Override with `PORT` environment variable.

```bash
PORT=8080 npm start
```

### Endpoints

#### GET /status

Health check endpoint.

```bash
curl http://localhost:3100/status
```

**Response:**
```json
{
  "status": "healthy",
  "service": "health-analyzer-agent",
  "version": "1.0.0",
  "timestamp": "2024-02-08T12:00:00.000Z",
  "uptime": 3600.5
}
```

---

#### GET /agent-info

Get agent's public key and capabilities.

```bash
curl http://localhost:3100/agent-info
```

**Response:**
```json
{
  "name": "Health Analyzer Agent",
  "version": "1.0.0",
  "publicKey": "d+YpS3K8h2vJ1cR9wXmFgHiJkLmNoPqRsTuVwXyZ0A=",
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

---

#### POST /analyze

Run health analysis with a capability token.

```bash
curl -X POST http://localhost:3100/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJzci...",
    "options": {
      "detailed": true,
      "categories": ["steps", "sleep"]
    }
  }'
```

**Request Body:**
```typescript
{
  token: string;            // Capability token (JWT-like or raw JSON)
  options?: {
    detailed?: boolean;     // Include detailed analysis
    categories?: string[];  // Limit to specific categories
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "insights": {
    "generatedAt": "2024-02-08T12:00:00.000Z",
    "summary": "Analyzed 3 health categories. Overall trend is positive.",
    "trends": [
      {
        "category": "steps",
        "direction": "improving",
        "description": "Average 8,500 steps/day over the last week (+15%)",
        "period": "Last 7 days"
      }
    ],
    "recommendations": [
      {
        "priority": "low",
        "category": "exercise",
        "title": "Great activity level!",
        "description": "You're consistently hitting 10,000+ steps.",
        "actionable": true
      }
    ],
    "alerts": []
  },
  "tokenInfo": {
    "id": "tok_abc123",
    "issuer": "5DSxCBjQ...",
    "expiresAt": "2024-02-08T13:00:00.000Z",
    "scopes": ["health/* (read, write)"]
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Token validation failed: Token expired"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Analysis failed: DDC connection timeout"
}
```

---

## Environment Variables

### Required

At least one wallet configuration method:

| Variable | Description | Example |
|----------|-------------|---------|
| `WALLET_PATH` | Path to Cere wallet JSON | `./cere-wallet.json` |
| `WALLET_PASSPHRASE` | Passphrase for wallet | `my-secure-passphrase` |
| **OR** | | |
| `AGENT_MNEMONIC` | 12-word mnemonic phrase | `word1 word2 word3...` |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3100` | HTTP server port |
| `DDC_BUCKET_ID` | `1229` | Default DDC bucket for outputs |
| `OPENAI_API_KEY` | — | Use OpenAI instead of local AI |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API endpoint |
| `OLLAMA_MODEL` | `llama3.2:3b` | Ollama model to use |
| `AUDIT_LOG_PATH` | `./audit-logs` | Where to save audit logs |

### Example .env File

```bash
# Wallet (option 1: JSON file)
WALLET_PATH=./cere-wallet.json
WALLET_PASSPHRASE=my-secure-passphrase

# Wallet (option 2: mnemonic)
# AGENT_MNEMONIC="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"

# DDC
DDC_BUCKET_ID=1229

# AI (leave empty for local Ollama)
# OPENAI_API_KEY=sk-...

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# Server
PORT=3100

# Audit
AUDIT_LOG_PATH=./audit-logs
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error |
| `2` | Invalid arguments |
| `3` | Token validation failed |
| `4` | DDC connection failed |
| `5` | AI inference failed |
| `6` | Attestation failed |

### Using in Scripts

```bash
#!/bin/bash

npm run local -- --bucket 1229 --token ./token.json

case $? in
  0) echo "✅ Analysis completed" ;;
  3) echo "❌ Token invalid or expired" ;;
  4) echo "❌ Could not connect to DDC" ;;
  5) echo "❌ AI model not available" ;;
  *) echo "❌ Unknown error" ;;
esac
```

---

## npm Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `npm run build` | `tsc` | Compile TypeScript to JavaScript |
| `npm run start` | `node dist/server.js` | Run production server |
| `npm run dev` | `tsx watch src/server.ts` | Development server with auto-reload |
| `npm run local` | `tsx src/local.ts` | Interactive/CLI local mode |
| `npm test` | `vitest run` | Run test suite |

---

## Next Steps

- [SDK.md](./SDK.md) — API reference for programmatic access
- [EXAMPLES.md](./EXAMPLES.md) — More usage examples
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Production deployment guide
