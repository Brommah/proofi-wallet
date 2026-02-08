# Proofi

**Privacy-preserving AI agents powered by Cere DDC**

Proofi is a protocol for building AI agents that respect user privacy. Users control their data, grant time-limited access to agents, and get verifiable proofs of what happened.

---

## 🚀 Get Started

### New to Proofi? Start here:

| Guide | Description |
|-------|-------------|
| **[🎯 Zero to Deploy](./docs/ZERO-TO-DEPLOY.md)** | Complete beginner guide — deploy Proofi from scratch |
| [Quick Start](./docs/QUICKSTART.md) | Build your first agent in 5 minutes |
| [Deployment](./docs/DEPLOYMENT.md) | Detailed deployment options |

### Already familiar?

| Resource | Description |
|----------|-------------|
| [Architecture](./docs/ARCHITECTURE.md) | How everything connects |
| [API Reference](./docs/API-REFERENCE.md) | Complete SDK & API docs |
| [Security](./docs/SECURITY.md) | Security model & requirements |
| [Troubleshooting](./docs/TROUBLESHOOTING.md) | Common issues & solutions |

---

## ✨ Features

- 🔐 **User-controlled data access** — Capability tokens with expiration & revocation
- 🔒 **End-to-end encryption** — Agents only see what users explicitly grant
- 📜 **On-chain attestation** — Verifiable proof of what happened
- 🏠 **Local AI** — Run models on-device for maximum privacy

---

## 📁 Project Structure

```
proofi/
├── api/                # Vercel serverless functions
├── agent-sdk/          # @proofi/agent-sdk npm package
├── agents/             # Example agents (health-analyzer)
├── cli/                # @proofi/cli command-line tool
├── chrome-ext/         # Browser extension
├── docs/               # Documentation
├── scripts/            # Setup & utility scripts
└── shared/             # Shared utilities
```

---

## 🛠️ Local Development

```bash
# Clone the repo
git clone https://github.com/your-username/proofi.git
cd proofi

# Install dependencies
npm install

# Set up environment (see docs/ZERO-TO-DEPLOY.md for details)
cp .env.example .env.local
# Edit .env.local with your values

# Run locally
vercel dev
```

---

## 🌐 Deploy

Deploy to Vercel in one command:

```bash
vercel --prod
```

For detailed instructions, see **[Zero to Deploy](./docs/ZERO-TO-DEPLOY.md)**.

---

## 📚 Documentation

All documentation lives in [`/docs`](./docs/):

- [ZERO-TO-DEPLOY.md](./docs/ZERO-TO-DEPLOY.md) — Complete beginner guide
- [QUICKSTART.md](./docs/QUICKSTART.md) — Quick agent development
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) — All deployment options
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) — System design
- [API-REFERENCE.md](./docs/API-REFERENCE.md) — SDK & API
- [SECURITY.md](./docs/SECURITY.md) — Security model
- [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) — Common issues

---

## 🔧 Environment Variables

See [`.env.example`](./.env.example) for all available configuration options.

Required for deployment:
- `DDC_WALLET_JSON` — Cere wallet JSON (single-line)
- `DDC_WALLET_PASSWORD` — Wallet password
- `DDC_BUCKET_ID` — DDC bucket ID

---

## 📄 License

MIT

---

Built with 🔐 by the Proofi team
