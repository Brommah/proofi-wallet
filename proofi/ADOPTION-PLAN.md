# Proofi vs CEF — Adoption Plan for the Skeptic

> Written for the person who wants this to fail — and why they're wrong.

---

## Side-by-Side: What Actually Matters

| Dimension | CEF.AI (Status Quo) | Proofi (What We Built) |
|-----------|---------------------|------------------------|
| **Who controls keys?** | CEF Vault (platform) | User's browser (you) |
| **Where does code run?** | CEF's servers (V8 isolate) | Anywhere (browser, local, edge) |
| **Can you see what agents did?** | Platform logs (if they expose) | On-chain hash + your local log |
| **Can you revoke access?** | Ask CEF nicely | Token expires (⚠️ no early revoke yet) |
| **Data onboarding** | Upload to platform bucket | Encrypt locally → DDC directly |
| **Agent onboarding** | Deploy to CEF registry (gated) | Publish manifest + register on-chain (open) |
| **Model onboarding** | Use CEF's inference endpoints | BYO: WebLLM, Ollama, OpenAI, any |
| **Audit trail** | CEF's internal logs | DDC hash + HMAC-signed proofs |
| **Time to first value** | Weeks (sales + integration) | Minutes (browser extension) |
| **Lock-in** | High (infra + data + agents) | Low (DDC is commodity, agents portable) |

---

## The Skeptic's Questions (And Our Answers)

### 1. "How do users onboard their data?"

**CEF Way:**
```
Enterprise signs contract
→ Integration project (weeks)
→ Data piped to CEF buckets
→ CEF encrypts with their keys
→ Users never touch it
```

**Proofi Way:**
```
User installs extension
→ Clicks "Add Health Data"
→ Selects file (or connects API)
→ Encrypted in browser with user's key
→ Uploaded to DDC (user keeps DEK)
→ Done in 2 minutes
```

**Current Status:**
- ✅ File upload works (demo-health)
- ✅ Encryption with TweetNaCl + AES-256-GCM
- ⚠️ API connectors (Google Fit, Apple Health) = not built
- ⚠️ DDC upload currently 404 (API route missing)

**What the skeptic will say:** "File upload isn't real onboarding. Nobody will manually upload CSVs."

**Our answer:** True. V1 is file upload for demo. V2 needs OAuth connectors. But the point is: **encryption happens client-side**. That's the architectural win. Connectors are just plumbing.

---

### 2. "How do developers onboard agents?"

**CEF Way:**
```
Apply to CEF partner program
→ Get approved (gated)
→ Use CEF Agent SDK
→ Deploy to CEF runtime
→ CEF controls distribution
```

**Proofi Way:**
```
Write agent code (any language)
→ Create manifest.json with:
  - capabilities requested
  - data scopes needed
  - verification method
→ Publish to IPFS/DDC
→ Register on-chain (pallet_identity)
→ Anyone can discover & run
```

**Current Status:**
- ✅ Agent SDK exists (`proofi/agent-sdk`)
- ✅ Manifest schema defined
- ✅ Discovery script (`discover-agents.ts`)
- ✅ Registration script (`register-agent.ts`)
- ⚠️ On-chain registry = spec only (not deployed)
- ⚠️ No agent marketplace UI yet

**What the skeptic will say:** "No marketplace = no discoverability = no adoption."

**Our answer:** Correct. Marketplace is needed. But the key insight: **agents are portable**. Write once, run anywhere. CEF agents are locked to CEF. Proofi agents are open.

---

### 3. "How do people run models?"

**CEF Way:**
```
Use CEF's managed inference (A8)
→ Models run on CEF's GPUs
→ Your data sent to their servers
→ Results returned
```

**Proofi Way:**
```
Option A: WebLLM (runs in your browser)
  → Llama 3.2 1B/3B
  → Zero network calls
  → Your data never leaves

Option B: Local (Ollama, LM Studio)
  → Connect to localhost
  → Larger models possible

Option C: Cloud (OpenAI, Anthropic)
  → For complex tasks
  → Data leaves (user's choice)

Option D: Agent's model (they provide)
  → Agent bundles their own
  → Trust the agent's choice
```

**Current Status:**
- ✅ WebLLM integration works (demo-health)
- ✅ Llama 3.2 3B runs in browser (slow first load)
- ⚠️ Ollama integration = not built
- ⚠️ Model selection UI = not built

**What the skeptic will say:** "WebLLM is a toy. Real analysis needs real models."

**Our answer:** Depends on the task. Health trend analysis? 3B is fine. Complex multi-modal reasoning? Yes, need bigger models. The point: **user chooses the tradeoff**. Privacy vs capability is their decision, not ours.

---

### 4. "Where can people see output/audit trails?"

**CEF Way:**
```
Platform dashboard (if exposed)
→ Logs stored on CEF servers
→ Format: whatever they decide
→ Retention: their policy
→ Export: probably not
```

**Proofi Way:**
```
Local:
→ Browser logs every agent action
→ Capability tokens stored in IndexedDB
→ Results saved to DDC (user's bucket)

On-Chain:
→ Every DDC write = hash on Cere blockchain
→ Merkle proof via DAC (g-collector)
→ Publicly verifiable at /verify?hash=xxx

Audit format:
{
  timestamp: "2026-02-08T01:50:00Z",
  agent: "did:cere:5Gx...",
  action: "analyze_health_trends",
  dataScope: "healthRecords:read",
  resultHash: "0xabc...",
  nonce: "unique-per-request",
  hmac: "signed-proof"
}
```

**Current Status:**
- ✅ HMAC-signed proofs (commit b281bc4b)
- ✅ Nonces for replay protection
- ✅ Local audit logging in agent-sdk
- ⚠️ DDC upload not working (404)
- ⚠️ Merkle proofs via DAC = spec only
- ⚠️ Public verifier page = not built

**What the skeptic will say:** "On-chain doesn't mean anything if nobody checks."

**Our answer:** True. Verification needs to be easy. That's why we need:
1. Public verifier page (paste hash, see proof)
2. Browser extension shows proof status
3. "Verified by Proofi" badge for agents

---

## The Hard Truth: What's Missing

### Critical (Must Have for Launch)

| Gap | Risk | Fix |
|-----|------|-----|
| **DDC upload 404** | Demo doesn't work | Add `/ddc/store` route to Railway API |
| **Revocation** | Can't take back access | On-chain revocation list OR shorter token expiry |
| **Key recovery** | Seed lost = data lost forever | Shamir secret sharing OR social recovery |
| **Agent marketplace** | No discoverability | Build simple registry UI |

### High (Need Within 90 Days)

| Gap | Risk | Fix |
|-----|------|-----|
| **Data connectors** | File upload = friction | OAuth: Google Fit, Apple Health, etc |
| **On-chain registry** | Agents not verifiable | Deploy pallet_identity integration |
| **Public verifier** | No external audit | Build /verify page |
| **Mobile app** | Browser-only = limited | React Native or PWA |

### Medium (Nice to Have)

| Gap | Risk | Fix |
|-----|------|-----|
| **ZK selective disclosure** | Can't prove without revealing | Research + implement |
| **Agent staking/slashing** | No consequences for bad actors | Economic mechanism design |
| **Delegation** | Can't share access properly | Multi-sig or guardian model |

---

## Adoption Funnel

### Phase 1: Developer Love (Now - 30 days)

**Goal:** Get 10 agents in the ecosystem

**How:**
1. Fix DDC upload → working demo
2. Publish agent-sdk to npm
3. Write "Build Your First Proofi Agent" tutorial
4. Post on dev communities (r/selfhosted, HN, lobste.rs)
5. Hackathon bounties ($500/agent)

**Metrics:**
- npm downloads
- GitHub stars
- Agents registered

### Phase 2: Early Adopters (30-90 days)

**Goal:** 1,000 wallets with real data

**How:**
1. Launch chrome extension to Chrome Web Store
2. Partner with health/fitness influencers
3. "Export your Strava/Garmin to own it forever"
4. Data portability angle (GDPR, etc)

**Metrics:**
- Extension installs
- Data uploads (DDC writes)
- Agent invocations

### Phase 3: Mainstream Push (90-180 days)

**Goal:** 50,000 users, 100 agents

**How:**
1. Mobile app launch
2. Viral mechanic (share verified badge?)
3. B2B2C partnerships (gym chains, insurance)
4. CEF integration (complementary, not competing)

**Metrics:**
- MAU
- DDC storage used
- $CERE burned in fees

---

## The Pitch to the Skeptic

**"Why would anyone use this over just keeping data on their computer?"**

Because:
1. **Backup** — DDC is decentralized storage. Your laptop dies, data survives.
2. **Selective sharing** — Capability tokens let you share specific data with specific agents for specific time.
3. **Verification** — On-chain proofs mean you can prove what you shared, when, with whom.
4. **Portability** — Switch agents, switch apps, your data follows.

**"Why would developers build agents for this?"**

Because:
1. **No gatekeepers** — Unlike CEF, no approval process.
2. **Portable users** — Write once, users everywhere.
3. **Usage-based revenue** — Get paid per invocation (later).
4. **Data is already there** — Users bring their data, you bring the logic.

**"Why would CEF not just copy this?"**

They could. But:
1. **Conflict of interest** — Their business model is platform lock-in. Self-custody undermines that.
2. **Different customer** — Enterprises want managed. Consumers want sovereign.
3. **Brand** — CEF is "enterprise infrastructure." Hard to pivot to "your personal data layer."

---

## Bottom Line

| What We Proved | What We Need |
|----------------|--------------|
| Real encryption works ✅ | DDC upload working |
| Capability tokens work ✅ | Revocation mechanism |
| WebLLM in browser works ✅ | Model selection UI |
| Agent SDK works ✅ | Agent marketplace |
| Security model is sound ✅ | Key recovery |
| Consumer UX beats enterprise ✅ | Data connectors |

**The skeptic's final question:** "Is this real or vaporware?"

**Our answer:** The core is real. The demo works (minus the 404). The architecture is sound. What's left is product polish and ecosystem building. That's execution, not invention.

---

## Next 7 Days

1. **Day 1-2:** Fix DDC `/ddc/store` route
2. **Day 3:** Working end-to-end demo video
3. **Day 4-5:** Publish agent-sdk to npm
4. **Day 6:** "Build Your First Agent" blog post
5. **Day 7:** Share with 3 developer communities

Ship. Get feedback. Iterate. Let metrics talk.

---

*"Consumer first was almost always the right choice."* — Mart, 2026
