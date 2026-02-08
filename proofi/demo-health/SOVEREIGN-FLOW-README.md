# Sovereign Health Data Flow

## Architecture Overview

This implementation puts the **wallet at the center** of everything:

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S WALLET                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Health Data │  │ Encryption  │  │ Permission Management   │  │
│  │   Import    │  │   (DEK)     │  │  (Agent Approval)       │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                 │
│         └────────┬───────┴─────────────────────┘                 │
│                  │                                               │
└──────────────────┼───────────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
    ┌─────────┐        ┌──────────────┐
    │   DDC   │        │  Agent (UI)  │
    │Encrypted│◄───────│   Requests   │
    │ Storage │        │   Access     │
    └─────────┘        └──────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │   Ollama     │
                       │ (localhost)  │
                       │   Analysis   │
                       └──────────────┘
```

## Files Modified/Created

### Extension Source (`proofi-chrome-extension/src/`)

1. **popup.html** - Added Health Data tab and Agents screen
2. **popup.js** - Added health data handlers and agent approval flow
3. **background.js** - Added message handlers:
   - `HEALTH_DATA_TO_DDC` - Upload encrypted health data
   - `AGENT_CONNECT` - Handle agent connection requests
   - `GET_HEALTH_DATA_ACCESS` - Provide access to approved agents
4. **health-data.js** - Health data parsing and management
5. **lib/health-crypto.js** - Encryption utilities
6. **styles.css** - Added styles for new components
7. **manifest.json** - Added `externally_connectable` for demo pages

### Demo (`proofi/demo-health/`)

1. **sovereign-demo.html** - New wallet-centric demo that:
   - Connects to wallet extension
   - Requests data access through wallet
   - Receives capability token
   - Fetches encrypted data from DDC
   - Decrypts and analyzes locally with Ollama

## How It Works

### 1. User Imports Health Data (in Wallet)
```
User → Wallet Extension → [Parse XML] → chrome.storage.local
                       → [Generate DEK] → Store DEK locally
```

### 2. User Syncs to DDC (in Wallet)
```
Wallet → [Encrypt with DEK] → [Upload to DDC API] → CID stored locally
```

### 3. Agent Requests Access (from Demo)
```
Demo → chrome.runtime.sendMessageExternal → Extension
     → [Shows approval modal in wallet]
     → User approves → Agent session stored
     → Capability token returned to demo
```

### 4. Agent Accesses Data
```
Demo → [Uses token to fetch from DDC CDN] → Encrypted blob
     → [Decrypt with DEK from token] → Raw health data
     → [Send to localhost Ollama] → Analysis results
```

## Testing the Flow

### Prerequisites
1. Install the Proofi Wallet extension from `extension/` directory
2. Have Ollama running: `ollama serve`
3. Serve the demo pages: `cd proofi && python -m http.server 8080`

### Step-by-Step Test

1. **Open Wallet Extension**
   - Click extension icon
   - Log in or create account

2. **Import Health Data**
   - Go to "Health Data" tab
   - Click "Load Sample Data" or import your Apple Health export
   - Click "Encrypt & Sync to DDC"

3. **Open Demo Page**
   - Navigate to `http://localhost:8080/demo-health/sovereign-demo.html`
   - Click "Connect Wallet"
   - Select data types to analyze
   - Click "Request Access from Wallet"

4. **Approve in Wallet**
   - Wallet popup appears with approval request
   - Review data types and expiry
   - Click "Grant Access"

5. **Run Analysis**
   - Demo receives capability token
   - Click "Run Analysis with Ollama"
   - Watch the trust chain in action:
     - Fetch encrypted data from DDC
     - Decrypt locally
     - Analyze with Ollama
     - Display results

## Key Principles

1. **Wallet is the center** - All data operations go through the wallet
2. **Demo never sees raw data** - Only gets capability token
3. **Local compute** - Ollama runs on localhost, data never leaves machine
4. **User controls everything** - Approval in wallet, revocable at any time
5. **Encrypted at rest** - DDC stores only encrypted blobs

## Extension ID

After installing the extension, get its ID from `chrome://extensions` and update:
- `sovereign-demo.html` line: `const EXTENSION_ID = 'YOUR_EXTENSION_ID_HERE';`

## API Reference

### Extension Messages (Internal)

| Type | Payload | Response |
|------|---------|----------|
| `GET_WALLET_STATE` | - | `{ connected, address, email, token }` |
| `HEALTH_DATA_TO_DDC` | `{ encryptedData, cid }` | `{ ok, cid, bucket, cdnUrl }` |
| `AGENT_CONNECT` | `{ agentId, name, scopes, origin }` | `{ ok, pending }` |
| `GET_AGENTS` | - | `{ agents: [...] }` |
| `GET_HEALTH_DATA_ACCESS` | `{ agentId }` | `{ ok, cid, bucket, scopes, cdnUrl }` |

### Extension Messages (External - from web pages)

Same as above, but sent via `chrome.runtime.sendMessage(EXTENSION_ID, message, callback)`.

Only allowed from origins in `externally_connectable.matches`.
