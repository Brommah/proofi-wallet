# Proofi CLI Wallet

Complete Proofi wallet in terminal. No browser or extension needed.

## Setup (One Time)

```bash
# Create wallet
proofi init
# → Enter email → OTP → PIN
# → Keys derived, stored in ~/.proofi/

# Add identity credential
proofi cred add identity
# → Enter name, birthdate
# → Credential stored

# Authorize Clawdbot
proofi agent add clawdbot --scopes "age,calendar,identity"
```

## Quick Reference

```bash
# Wallet
proofi status                    # Show wallet info

# Agents
proofi agent add <name> -s "age,calendar"
proofi agent list
proofi agent remove <name>

# Credentials  
proofi cred add identity         # Interactive
proofi cred list

# Proofs
proofi proof age                 # Disclose age
proofi proof age -p ">=18"       # ZKP: prove 18+ without revealing age
proofi proof identity -a clawdbot
```

## Clawdbot Integration

When user asks for age verification or identity proof:

```bash
# Check if authorized
proofi agent list

# Generate proof (requires PIN)
proofi proof age --predicate ">=18" --agent clawdbot
```

## Key Concepts

| Term | Meaning |
|------|---------|
| **Credential** | Stored data (identity, age, etc.) signed by wallet |
| **Agent** | Authorized app (Clawdbot) with scoped access |
| **Proof** | Cryptographic proof of a claim |
| **Selective disclosure** | Prove "18+" without revealing birthdate |

## Storage

```
~/.proofi/
├── wallet.json        # Encrypted keys
├── agents.json        # Authorized agents
└── credentials/       # Stored VCs
```

## Security Notes

- PIN required for all signing operations
- Private keys encrypted with PIN-derived key
- Keys never transmitted
- User can revoke agents anytime
