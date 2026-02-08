# Proofi Demo Agent

Demo agent showing the Proofi wallet ↔ agent connection flow.

## Fred Demo Setup

### 1. Install Extension

```bash
# Load extension in Chrome
# chrome://extensions → Developer mode → Load unpacked
cd proofi-wallet/extension
```

### 2. Create Wallet

1. Click Proofi extension icon
2. Enter email → verify OTP
3. Create PIN (derives your keys)
4. ✅ Wallet ready

### 3. Run Demo Agent

```bash
cd agents/demo-agent
npm install
npm start
```

### 4. Watch the Flow

The demo shows:

1. **Agent Connect** → Extension popup asks for approval
2. **User Approves** → Session created with scopes
3. **Age Proof Request** → Selective disclosure
4. **Proof Returned** → "18+ = true" without revealing birthdate

## Key Points for Fred

| What | Why it matters |
|------|----------------|
| **User approval required** | Agent can't access anything without explicit consent |
| **Scoped permissions** | Agent only sees what's approved (age, calendar, etc.) |
| **Selective disclosure** | Prove facts ("18+") without revealing data (birthdate) |
| **Self-custody** | Keys never leave user's device |
| **Cere DDC** | Data on decentralized storage, not AWS/Google |

## Real Implementation

For production, replace the simulated flow with actual extension messaging:

```javascript
// From web page to extension
chrome.runtime.sendMessage(EXTENSION_ID, {
  type: 'AGENT_CONNECT',
  payload: { agentId, name, scopes }
}, response => {
  if (response.ok) {
    // User approved, session created
  }
});
```
