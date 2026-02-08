# 🏥 Health Analyzer — User Journey

## Starting Point
**Fresh Mac Mini with:**
- Health data export (JSON from Apple Health / Garmin / Oura)
- Nothing else installed

---

## User Flow

### Phase 1: Setup Proofi Wallet (One-time, ~2 min)

```
User opens: proofi.app

┌─────────────────────────────────────────────────────────────────┐
│                         PROOFI WALLET                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📧 Enter your email                                            │
│  ┌─────────────────────────────────────────┐                   │
│  │ user@email.com                          │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                 │
│  [Continue →]                                                   │
│                                                                 │
│  Your wallet lives on YOUR device.                              │
│  We never see your keys.                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**What happens behind the scenes:**
1. Email + device entropy → deterministic seed
2. sr25519 keypair generated locally
3. Wallet address created (e.g., `5DSxCBjQ...`)
4. NO keys sent anywhere

**User sees:**
```
✓ Wallet created: 5DSxCBjQ...
✓ Your keys are stored locally
```

---

### Phase 2: Upload Health Data (~30 sec)

```
┌─────────────────────────────────────────────────────────────────┐
│                      UPLOAD HEALTH DATA                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📁 Drop your health export here                                │
│  ┌─────────────────────────────────────────┐                   │
│  │                                         │                   │
│  │         health_export.json              │                   │
│  │              1.2 MB                     │                   │
│  │                                         │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                 │
│  [Encrypt & Store →]                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**What happens behind the scenes:**
1. Generate random DEK (Data Encryption Key)
2. Encrypt health data with AES-256-GCM
3. Store encrypted blob to DDC (Cere's decentralized storage)
4. DEK stored locally in wallet

**User sees:**
```
✓ Data encrypted
✓ Stored to decentralized storage
  CID: baebb4icrfih4detjyt3...
  
Your raw data NEVER left your device unencrypted.
```

---

### Phase 3: Authorize Health Analyzer Agent (~10 sec)

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHORIZE AI AGENT                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🤖 Health Analyzer Agent                                       │
│     by: verified-health-agent.proofi.app                        │
│                                                                 │
│  Requesting access to:                                          │
│  ☑️ Read your health data                                       │
│  ☑️ Store analysis results                                      │
│                                                                 │
│  Token expires: 1 hour                                          │
│                                                                 │
│  [Authorize ✓]          [Deny ✗]                               │
│                                                                 │
│  ⚠️ Agent runs on YOUR Mac Mini — not in the cloud             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**What happens behind the scenes:**
1. Wrap DEK with agent's X25519 public key
2. Create capability token with scopes
3. Sign token with user's sr25519 key
4. Send token to agent (local or via secure channel)

**User sees:**
```
✓ Access token created
✓ Signed with your wallet
✓ Agent can access your data for 1 hour
```

---

### Phase 4: Agent Runs Analysis (Automatic, ~30 sec)

**User sees progress:**
```
┌─────────────────────────────────────────────────────────────────┐
│                      ANALYSIS IN PROGRESS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⏳ Running on your Mac Mini...                                 │
│                                                                 │
│  ✓ Token verified                                               │
│  ✓ Not revoked                                                  │
│  ✓ Fetching encrypted data from DDC                             │
│  ✓ Decrypting locally                                           │
│  ⏳ AI analysis (llama3.2, running locally)...                  │
│  ✓ Analysis complete                                            │
│  ✓ Encrypting results                                           │
│  ✓ Storing to DDC                                               │
│  ✓ On-chain attestation submitted                               │
│                                                                 │
│  [View Results →]                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**What happened behind the scenes:**
1. Verify token signature (sr25519)
2. Check revocation status
3. Fetch encrypted data from DDC
4. Unwrap DEK with agent's private key
5. Decrypt health data locally
6. Run llama3.2:3b inference (Ollama, local)
7. Encrypt output with same DEK
8. Store encrypted output to DDC
9. Submit attestation hash to Cere blockchain

---

### Phase 5: View Results

```
┌─────────────────────────────────────────────────────────────────┐
│                       ANALYSIS RESULTS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 Your Health Trends (Feb 1-7, 2026)                          │
│                                                                 │
│  Steps:  ↗️ Improving (+15% vs last week)                       │
│  Sleep:  → Stable (avg 6.8h)                                    │
│  Mood:   ↗️ Improving (avg 6.4/10)                              │
│                                                                 │
│  💡 Recommendations:                                            │
│  • Your sleep dipped on Feb 6 (5.2h) — try consistent bedtime   │
│  • Great job on Feb 3 (12k steps!) — keep it up                 │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🔐 Verification                                                │
│  • Data hash: a4dfb32ae0f210ef...                               │
│  • Model: llama3.2:3b (sha256:dde5aa3f...)                      │
│  • On-chain: Block #24282779                                    │
│                                                                 │
│  [View on Blockchain ↗]  [Download Audit Log]                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## What's Installed on the Mac Mini

### Required (one-time setup):
```bash
# 1. Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Ollama (local AI)
brew install ollama
ollama pull llama3.2:3b

# 3. Health Analyzer Agent
npm install -g @proofi/health-analyzer-agent
```

### Running:
```
~/.ollama/           # Local AI model weights (2GB)
~/proofi-wallet/     # User's encrypted wallet data
~/health-analyzer/   # Agent code + audit logs
```

---

## Token Economics

### Who Pays for DDC Storage?

**Option A: User pays (current demo)**
- User's wallet has CERE tokens
- User pays for input storage
- Agent uses user's wallet to store output

**Option B: Agent pays (production)**
- Agent has own wallet with CERE tokens
- User delegates write permission to bucket
- Agent pays for output storage
- Better separation of concerns

**Option C: Sponsored (enterprise)**
- Enterprise sponsors bucket costs
- Users get free storage up to limit
- Agent is pre-authorized

### Costs
- DDC storage: ~$0.001 per MB/month
- On-chain attestation: ~$0.01 per tx
- Total for one analysis: < $0.02

---

## Security Properties

| Question | Answer |
|----------|--------|
| Who sees my raw health data? | Only YOU and the AI running on YOUR device |
| Where is my data stored? | Encrypted on DDC (decentralized) — you hold the key |
| Can the agent steal my data? | No — it only sees encrypted data, gets time-limited DEK |
| Can I verify the analysis? | Yes — attestation hash is on Cere blockchain |
| Can I revoke access? | Yes — revoke token (agent can't use it anymore) |
| What if agent is malicious? | It can only read data you authorized, output is encrypted |

---

## FAQ

**Q: Do I need CERE tokens?**
A: For the demo, the agent wallet pays. For production, you'd either:
- Have small amount of CERE (< $1 for months of use)
- Use a sponsored/enterprise plan

**Q: What if I'm offline?**
A: The AI runs locally. You only need internet to fetch encrypted data from DDC.

**Q: Can I use my own AI model?**
A: Yes — swap Ollama model in config. The attestation will record which model was used.

**Q: Is my email stored anywhere?**
A: No — it's only used to derive your wallet seed locally. We never see it.

---

## Quick Start Commands

```bash
# Start Ollama (if not running)
ollama serve

# Run analysis on your health data
proofi-health-analyzer \
  --input ~/health_export.json \
  --wallet ~/proofi-wallet \
  --attest

# Check your attestation on-chain
proofi-verify --block 24282779
```

---

*This is what trustless, user-sovereign AI looks like.*
