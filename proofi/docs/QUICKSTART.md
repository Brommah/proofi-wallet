# Developer Quick Start

> From zero to working Proofi agent in 5 minutes ⚡

---

## TL;DR

```bash
# 1. Install SDK
npm install @proofi/agent-sdk

# 2. Create agent (agent.ts)
import { ProofiAgent } from '@proofi/agent-sdk';

const agent = new ProofiAgent({
  model: 'llama3.2:3b',
  attestation: true
});

// 3. Wait for token & analyze
const token = await agent.waitForToken({ port: 3100 });
const result = await agent.analyze(token);
console.log(result.data);

# 4. Run
npx tsx agent.ts
```

That's it. You have a privacy-preserving AI agent. 🎉

---

## What Just Happened?

1. **Your agent started listening** on port 3100
2. **A user can grant you access** by sending a capability token to `/token`
3. **You decrypt & analyze their data** without ever seeing the raw data permanently
4. **Everything is logged** in an audit trail
5. **Optionally attested on-chain** for verifiable proof

---

## Step-by-Step Guide

### Prerequisites

- **Node.js 18+** (check: `node --version`)
- **Ollama** (optional, for local AI): `brew install ollama && ollama pull llama3.2`
- **OpenAI API key** (alternative to Ollama)

### Step 1: Create Your Project

```bash
mkdir my-proofi-agent
cd my-proofi-agent
npm init -y
npm install @proofi/agent-sdk typescript tsx
```

### Step 2: Write Your Agent

Create `agent.ts`:

```typescript
import { ProofiAgent } from '@proofi/agent-sdk';

// Define your output type
interface HealthInsights {
  summary: string;
  recommendations: string[];
  score: number;
}

// Create agent
const agent = new ProofiAgent<HealthInsights>({
  model: 'llama3.2:3b',      // Local Ollama model
  attestation: false,        // Skip blockchain for now
});

// Optional: Custom analysis logic
agent.setAnalysisHandler(async (data: any) => {
  const steps = data.steps || [];
  const avgSteps = steps.length > 0
    ? steps.reduce((sum: number, d: any) => sum + d.count, 0) / steps.length
    : 0;
  
  return {
    summary: `Average ${Math.round(avgSteps)} steps/day over ${steps.length} days`,
    recommendations: avgSteps < 7000 
      ? ['Try to walk 10 minutes more each day'] 
      : ['Keep it up! Your activity is great'],
    score: Math.min(100, Math.round(avgSteps / 100))
  };
});

// Start
async function main() {
  console.log('🔐 Agent public key:', agent.getPublicKey());
  console.log('⏳ Waiting for capability token on port 3100...');
  
  const token = await agent.waitForToken({
    port: 3100,
    timeout: 300000,  // 5 minutes
    onProgress: (msg) => console.log('📡', msg)
  });
  
  console.log('✅ Token received from:', token.iss);
  
  const result = await agent.analyze(token);
  
  if (result.success) {
    console.log('📊 Analysis complete!');
    console.log(result.data);
    console.log('\n📝 Audit trail:', result.auditTrail.length, 'entries');
  } else {
    console.error('❌ Analysis failed:', result.error);
  }
}

main().catch(console.error);
```

### Step 3: Run Your Agent

```bash
npx tsx agent.ts
```

You'll see:
```
🔐 Agent public key: d+YpS3K8h2vJ1cR9wXmFgHiJkLmNoPqRsTuVwXyZ0A=
⏳ Waiting for capability token on port 3100...
📡 Listening for tokens on port 3100...
```

### Step 4: Test with a Token

In another terminal, simulate a user granting access:

```bash
# First, get your agent's public key
curl http://localhost:3100/info

# Send a test token (in production, users send real encrypted tokens)
curl -X POST http://localhost:3100/token \
  -H "Content-Type: application/json" \
  -d '{
    "v": 1,
    "id": "test-token-123",
    "iss": "user-address",
    "sub": "agent-pubkey",
    "iat": '$(date +%s)',
    "exp": '$(($(date +%s) + 3600))',
    "scopes": [{"path": "health/*", "permissions": ["read"]}],
    "bucketId": "1229",
    "resources": [],
    "cdnUrl": "https://cdn.ddc-dragon.com",
    "wrappedDEK": {
      "ciphertext": "...",
      "ephemeralPublicKey": "...",
      "nonce": "..."
    },
    "sig": "",
    "sigAlg": "sr25519"
  }'
```

---

## Common Configurations

### Local AI with Ollama (Recommended)

```typescript
const agent = new ProofiAgent({
  model: 'llama3.2:3b',       // Or 'mistral', 'llama2', etc.
  ollamaUrl: 'http://localhost:11434',
  attestation: false
});
```

### Cloud AI with OpenAI

```typescript
const agent = new ProofiAgent({
  model: 'gpt-4o-mini',
  openaiApiKey: process.env.OPENAI_API_KEY,
  attestation: false
});
```

### Full Production Setup

```typescript
const agent = new ProofiAgent({
  model: 'llama3.2:3b',
  attestation: true,           // On-chain attestation
  ddcBucketId: '1229',         // Store results to DDC
  walletPath: './wallet.json', // Cere wallet for blockchain ops
  walletPassphrase: process.env.WALLET_PASS
});
```

---

## Project Structure

A production agent typically looks like:

```
my-agent/
├── src/
│   ├── index.ts          # Entry point
│   ├── analyze.ts        # Your analysis logic
│   └── types.ts          # Type definitions
├── keys/
│   └── agent-keypair.json # Auto-generated (gitignore this!)
├── audit-logs/            # Local audit trail
├── package.json
├── tsconfig.json
└── .env                   # Secrets (gitignore this!)
```

### `.env` Example

```env
# AI Model
OPENAI_API_KEY=sk-...       # Or use Ollama (no key needed)

# Blockchain (for attestation)
WALLET_PATH=./wallet.json
WALLET_PASSPHRASE=your-secret

# DDC (for storing results)
DDC_BUCKET_ID=1229
```

---

## Using the CLI

The Proofi CLI provides a quick way to run analyses:

```bash
# Install globally
npm install -g @proofi/cli

# Initialize (creates wallet + config)
proofi init

# Analyze a local JSON file
proofi analyze --input health-data.json

# Verify an on-chain attestation
proofi verify --block 24282779
```

---

## What's Next?

| Goal | Guide |
|------|-------|
| Understand how it all works | [Architecture Guide](./ARCHITECTURE.md) |
| Deep-dive into the SDK | [API Reference](./API-REFERENCE.md) |
| Deploy to production | [Runbook](./RUNBOOK.md) |
| Build great UX | [Design Practices](./DESIGN-PRACTICES.md) |

---

## Troubleshooting

### "Ollama not found"

```bash
# Install Ollama
brew install ollama  # macOS
# or
curl -fsSL https://ollama.ai/install.sh | sh  # Linux

# Pull a model
ollama pull llama3.2

# Start Ollama
ollama serve
```

### "DEK unwrapping failed"

This means the token's wrapped DEK wasn't encrypted for your agent's public key. Make sure:
1. You shared your public key (`agent.getPublicKey()`) with the user
2. The user used this exact key when creating the token

### "Token expired"

Tokens have an expiration time (`exp` field). The user needs to create a new token.

### Port 3100 already in use

```typescript
const token = await agent.waitForToken({ port: 3101 }); // Use different port
```

---

## Getting Help

- 📖 [Full Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/proofi/agents/issues)
- 💬 [Discord Community](https://discord.gg/proofi)

---

Happy building! 🚀
