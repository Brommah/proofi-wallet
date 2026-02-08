# 🔐 Proofi Wallet

**Your Data. Your Keys. Your Proof.**

Proofi is a decentralized identity wallet that puts you in control of your digital identity and personal data. Built for the Web3 era, Proofi enables secure, privacy-preserving credential management and data monetization.

[![CI](https://github.com/Brommah/proofi-wallet/actions/workflows/ci.yml/badge.svg)](https://github.com/Brommah/proofi-wallet/actions/workflows/ci.yml)
[![Deploy](https://github.com/Brommah/proofi-wallet/actions/workflows/deploy.yml/badge.svg)](https://github.com/Brommah/proofi-wallet/actions/workflows/deploy.yml)
[![Extension Build](https://github.com/Brommah/proofi-wallet/actions/workflows/extension.yml/badge.svg)](https://github.com/Brommah/proofi-wallet/actions/workflows/extension.yml)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## ✨ Features

- **🔑 Self-Sovereign Identity** - Own and control your credentials without intermediaries
- **🛡️ Zero-Knowledge Proofs** - Verify attributes without revealing underlying data
- **💰 Data Monetization** - Earn from your data on your terms
- **🔌 Universal SDK** - Easy integration for any web application
- **🌐 Cross-Platform** - PWA + Browser Extension for maximum accessibility
- **🔒 End-to-End Encryption** - Your keys never leave your device

## 🚀 Quick Start

### Run the Wallet PWA

```bash
# Clone the repository
git clone https://github.com/Brommah/proofi-wallet.git
cd proofi-wallet

# Install dependencies
npm install

# Start local server
npm run serve

# Open http://localhost:3000
```

### Install Browser Extension

1. Navigate to `chrome://extensions` (Chrome) or `about:addons` (Firefox)
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extension/` folder
4. Pin the Proofi extension for easy access

## 📱 Apps & Demos

| App | Description |
|-----|-------------|
| [Wallet](https://proofi.vercel.app/) | Main identity wallet PWA |
| [Earn](https://proofi.vercel.app/earn.html) | Data monetization dashboard |
| [Landing](https://proofi.vercel.app/landing.html) | Product landing page |
| [Ecosystem](https://proofi.vercel.app/ecosystem.html) | Partner ecosystem |
| [Verify](https://proofi.vercel.app/verify.html) | Credential verification |
| [Portal](https://proofi.vercel.app/portal.html) | Developer portal |

### Demo Apps

- **TokenGate** - Token-gated content access
- **ChainChat** - Verified messaging
- **ChainPoll** - Anonymous verified voting
- **TrustRate** - Reputation system
- **ProofStamp** - Document timestamping
- **SkillBadge** - Verifiable credentials
- **NFTicket** - Event ticketing

## 🏗️ Project Structure

```
proofi-wallet/
├── proofi/              # Main PWA application
│   ├── index.html       # Wallet interface
│   ├── app/             # App manifest & icons
│   └── *.html           # Feature pages
├── extension/           # Browser extension
│   ├── manifest.json    # Extension config
│   ├── popup.html       # Extension UI
│   └── content.js       # Page integration
├── packages/            # Shared libraries
│   ├── core/            # Core wallet logic
│   ├── sdk/             # Developer SDK
│   ├── api/             # API client
│   └── ui/              # UI components
└── docs/                # Documentation
```

## 🔧 Development

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format

# Build extension zip
npm run build:extension
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔒 Security

Found a vulnerability? Please report it responsibly. See [SECURITY.md](SECURITY.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with ❤️ for the decentralized future</strong>
</p>
