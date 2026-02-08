# Proofi Wallet Integration

Self-sovereign identity wallet for Clawdbot. All keys local, all access controlled.

## Prerequisites

```bash
# Install proofi CLI
cd ~/Projects/proofi-wallet/cli
npm install && npm link

# Initialize wallet (one time)
proofi init

# Add identity credential
proofi cred add identity

# Authorize Clawdbot
proofi agent add clawdbot --scopes "age,calendar,identity,memory"
```

## Commands

### Check Status
```bash
proofi status
```

### Generate Proofs
```bash
# Age verification (selective disclosure)
proofi proof age --predicate ">=18" --agent clawdbot

# Identity proof
proofi proof identity --agent clawdbot
```

### Manage Access
```bash
# List authorized agents
proofi agent list

# Revoke access
proofi agent remove <agent-name>

# Add new agent with scopes
proofi agent add <name> --scopes "age,calendar" --expires 24
```

## Integration Points

### When User Asks for Verification
If user asks you to prove something about them (age, identity, etc.):

```bash
proofi proof <type> --predicate "<condition>" --agent clawdbot
```

### When External Service Requests Proof
1. Check if scope is authorized: `proofi agent list`
2. If authorized, generate proof with user's PIN
3. Return signed proof to requester

### Memory Encryption (Future)
```bash
# Encrypt memory file with wallet key
proofi encrypt ~/clawd/MEMORY.md

# Decrypt for reading
proofi decrypt ~/.proofi/memory.enc
```

## Security Model

```
┌─────────────────────────────────────────────┐
│              USER (PIN holder)              │
│                     │                       │
│                     ▼                       │
│  ┌─────────────────────────────────────┐   │
│  │         PROOFI WALLET               │   │
│  │  • Private keys (encrypted)         │   │
│  │  • Credentials (signed VCs)         │   │
│  │  • Agent sessions (scoped, timed)   │   │
│  └─────────────────────────────────────┘   │
│                     │                       │
│     ┌───────────────┼───────────────┐      │
│     ▼               ▼               ▼      │
│  [clawdbot]    [external-app]    [???]     │
│  full access    age only       DENIED      │
└─────────────────────────────────────────────┘
```

## Audit Log

Every proof request is logged:
```
~/.proofi/audit.log

2026-02-08T11:55:00Z | clawdbot | proof:age | >=18 | SUCCESS
2026-02-08T11:56:00Z | unknown  | proof:identity | - | DENIED (not authorized)
```

## Airgapped Mode

For maximum security, run completely offline:

```yaml
# clawdbot gateway config
model: ollama/llama3.2       # Local LLM
proofi:
  wallet: ~/.proofi/
  requirePin: true
  auditLog: true
```

No external API calls. All processing local.
