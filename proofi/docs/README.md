# Proofi Developer Documentation

Welcome to the Proofi developer documentation. This guide covers everything you need to build privacy-preserving AI agents.

---

## What is Proofi?

Proofi is a protocol for **privacy-preserving AI agents**. It enables:

- 🔐 **User-controlled data access** via capability tokens
- 🔒 **End-to-end encryption** — agents only see what users explicitly grant
- 📜 **On-chain attestation** — verifiable proof of what happened
- 🏠 **Local AI** — run models on-device for maximum privacy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          THE PROOFI TRUST MODEL                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│    USER                           AGENT                                 │
│    ┌─────────┐                   ┌─────────┐                           │
│    │  Data   │  Capability Token │ Decrypt │                           │
│    │(encrypt)│ ─────────────────▶│ & Run   │                           │
│    │         │  (time-limited)   │   AI    │                           │
│    └─────────┘                   └─────────┘                           │
│         │                              │                                │
│         │                              │ Attestation                    │
│         ▼                              ▼                                │
│    ┌─────────┐                   ┌─────────┐                           │
│    │   DDC   │                   │Blockchain│                           │
│    │(storage)│                   │ (proof) │                           │
│    └─────────┘                   └─────────┘                           │
│                                                                         │
│    ✅ Agent only sees what you permit                                  │
│    ✅ Access expires automatically                                     │
│    ✅ Everything is logged & verifiable                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [**Quick Start**](./QUICKSTART.md) | From zero to working agent in 5 minutes |
| [**Architecture Guide**](./ARCHITECTURE.md) | How everything connects |
| [**API Reference**](./API-REFERENCE.md) | Complete SDK & API documentation |
| [**Runbook**](./RUNBOOK.md) | Deployment, testing, troubleshooting |
| [**Design Practices**](./DESIGN-PRACTICES.md) | UX patterns & UI components |
| [**Security**](./SECURITY.md) | Security model & requirements |

---

## Getting Started

### Build an Agent

```typescript
import { ProofiAgent } from '@proofi/agent-sdk';

const agent = new ProofiAgent({
  model: 'llama3.2:3b',
  attestation: true
});

const token = await agent.waitForToken();
const result = await agent.analyze(token);
```

👉 **[Full Quick Start Guide →](./QUICKSTART.md)**

### Use the CLI

```bash
npm install -g @proofi/cli

proofi init
proofi analyze --input health.json
proofi verify --block 24282779
```

👉 **[CLI Reference →](./API-REFERENCE.md#cli-commands)**

---

## Repository Structure

```
proofi/
├── agent-sdk/              # @proofi/agent-sdk npm package
│   ├── src/
│   │   ├── agent.ts        # Main ProofiAgent class
│   │   ├── types.ts        # Type definitions
│   │   └── internal/       # Crypto, DDC, attestation
│   └── README.md
│
├── cli/                    # @proofi/cli npm package
│   └── src/
│       └── commands/       # init, analyze, verify, wallet
│
├── health-analyzer/        # Example agent
│   ├── src/
│   │   ├── server.ts       # Hono HTTP server
│   │   ├── analyze.ts      # AI analysis logic
│   │   └── local.ts        # Pure Mode (local execution)
│   └── README.md
│
├── docs/                   # This documentation
│   ├── QUICKSTART.md
│   ├── ARCHITECTURE.md
│   ├── API-REFERENCE.md
│   ├── RUNBOOK.md
│   ├── DESIGN-PRACTICES.md
│   └── SECURITY.md
│
└── .github/                # Issue templates, workflows
```

### Related Repositories

| Repo | Description |
|------|-------------|
| `proofi` | Main web app & API |
| `proofi-mobile` | iOS/Android app (Expo) |
| `proofi-chrome-extension` | Browser extension |

---

## Core Concepts

### Capability Tokens

A capability token is a time-limited permission slip that grants an agent access to specific user data.

```typescript
interface CapabilityToken {
  id: string;            // Unique identifier
  iss: string;           // User who granted access
  sub: string;           // Agent receiving access
  exp: number;           // Expiration timestamp
  scopes: Scope[];       // What data can be accessed
  wrappedDEK: WrappedDEK; // Encrypted decryption key
}
```

**Key properties:**
- **Scoped** — Agent only sees granted paths (e.g., `health/steps`)
- **Time-limited** — Expires automatically
- **Revocable** — User can revoke anytime
- **Cryptographically bound** — Only the intended agent can use it

### Data Encryption Keys (DEKs)

User data is encrypted with DEKs. When granting access:

1. User encrypts DEK with agent's public key
2. Wrapped DEK is included in the token
3. Agent unwraps DEK with its private key
4. Agent decrypts data, runs analysis
5. DEK is discarded (never stored)

### On-Chain Attestation

Every analysis can be attested on the Cere blockchain:

```
PROOFI:{sha256(attestation)}
```

The attestation hash commits to:
- Input data hash
- Output data hash
- Model used
- Timestamp

This creates an immutable audit trail without revealing the actual data.

---

## Agent Types

### Server Mode

Agent runs as an HTTP service, receiving tokens from multiple users:

```typescript
// Start server and wait for tokens
const token = await agent.waitForToken({ port: 3100 });
```

**Best for:** APIs, automated processing, multi-user scenarios

### Pure Mode (Local)

Agent runs entirely on the user's device:

```bash
npm run local -- --bucket 1229 --key ./wallet.json
```

**Best for:** Maximum privacy, single-user, verification

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Crypto** | X25519 (key exchange), AES-256-GCM (encryption), sr25519 (signing) |
| **Storage** | Cere DDC (Decentralized Data Cloud) |
| **Blockchain** | Cere Network (Substrate-based) |
| **AI** | Ollama (local), OpenAI (cloud) |
| **Runtime** | Node.js 18+, TypeScript |
| **HTTP** | Hono (agents), Express-compatible |
| **Mobile** | React Native, Expo |
| **Extension** | Chrome Manifest V3 |

---

## Community

- 🐛 [Report Issues](https://github.com/proofi/agents/issues)
- 💡 [Feature Requests](https://github.com/proofi/agents/issues/new?template=feature_request.md)
- 📖 [Contributing Guide](../CONTRIBUTING.md)
- 💬 [Discord](https://discord.gg/proofi)

---

## License

MIT — see [LICENSE](../LICENSE)

---

Built with 🔐 by the Proofi team
