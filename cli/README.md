# Proofi CLI

Connect agents (like Clawdbot) to your Proofi wallet.

## Install

```bash
cd cli
npm install
npm link  # Makes 'proofi' available globally
```

## Usage

### Connect to Wallet

```bash
proofi connect
# → Opens browser
# → Approve in Proofi extension
# → Session saved to ~/.proofi/session.json
```

Options:
```bash
proofi connect --name "My Agent" --scopes "age,calendar,identity"
```

### Check Status

```bash
proofi status
# Shows: connection status, scopes, expiry
```

### Request Proof

```bash
# Age proof (selective disclosure)
proofi proof age --predicate ">=18"
# → Returns: verified=true, disclosed=[]

# Identity proof
proofi proof identity
# → Returns: verified=true, disclosed=[name, email, ...]
```

### Disconnect

```bash
proofi disconnect
# → Removes session, revokes access
```

## Fred Demo

```bash
# 1. Install
cd proofi-wallet/cli && npm install && npm link

# 2. Connect (opens browser)
proofi connect --name "Clawdbot Demo"

# 3. Approve in extension popup

# 4. Request proof
proofi proof age --predicate ">=18"

# 5. Show result
# ✅ "18+ verified WITHOUT revealing birthdate"
```

## How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  proofi CLI │────►│   Browser   │────►│  Extension  │
│             │◄────│  (callback) │◄────│  (approve)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
 ~/.proofi/session.json
```

1. CLI starts local callback server
2. Opens browser to agent-connect page
3. User approves in Proofi extension
4. Extension calls callback with session token
5. CLI saves session, ready for proof requests
