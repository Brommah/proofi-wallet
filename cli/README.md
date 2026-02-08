# Proofi CLI

Complete wallet management from terminal. No browser needed.

## Install

```bash
cd cli
npm install
npm link  # Makes 'proofi' available globally
```

## Quick Start

```bash
# 1. Create wallet
proofi init
# → Enter email
# → Enter OTP code
# → Create PIN
# → Wallet created!

# 2. Add credentials
proofi cred add identity
# → Enter name, birthdate
# → Credential stored

# 3. Authorize Clawdbot
proofi agent add clawdbot --scopes "age,calendar"

# 4. Generate proofs
proofi proof age --predicate ">=18"
```

## Commands

### Wallet

```bash
proofi init      # Create new wallet (email → OTP → PIN)
proofi status    # Show wallet info
```

### Agents

```bash
proofi agent add <name> --scopes "age,calendar"
proofi agent list
proofi agent remove <name>
```

### Credentials

```bash
proofi cred add identity     # Interactive
proofi cred add age --data '{"dateOfBirth":"1990-01-15"}'
proofi cred list
```

### Proofs

```bash
proofi proof age                      # Disclose age
proofi proof age --predicate ">=18"   # Prove 18+ without disclosing
proofi proof identity --agent clawdbot
```

## Fred Demo

```bash
# Setup (one time)
proofi init
proofi cred add identity
proofi agent add clawdbot --scopes "age,calendar"

# Demo flow
proofi proof age --predicate ">=18" --agent clawdbot
# → "✅ Verified: age >= 18"
# → "ℹ️ Actual age NOT disclosed"
```

## Storage

```
~/.proofi/
├── wallet.json        # Encrypted keyring
├── agents.json        # Authorized agents
└── credentials/       # Stored VCs
    ├── cred-xxx.json
    └── ...
```

## Encryption

```bash
# Encrypt any file with wallet key
proofi encrypt ~/clawd/MEMORY.md
# → ~/.proofi/MEMORY.md.enc

# Decrypt
proofi decrypt MEMORY.md.enc -o MEMORY.md
```

## Audit Log

```bash
# View recent activity
proofi audit

# Output:
# 2026-02-08T11:55:00Z | clawdbot | proof:age | >=18 | SUCCESS
# 2026-02-08T11:56:00Z | cli      | encrypt   | MEMORY.md | SUCCESS
```

## Security

- Private key encrypted with PIN-derived key (PBKDF2 + AES-256-GCM)
- Keys never leave your device
- PIN required for signing
- Each proof cryptographically signed
- Full audit trail of all operations
