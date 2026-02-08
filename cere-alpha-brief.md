# Cere/CEF Alpha Brief — Engineering Priorities, Gaps & Hackathon Scope
**Date:** 2026-02-01  
**Author:** Mart Broersma  
**Status:** Internal — For Engineering & DevRel Teams

---

## 1. Executive Summary

The Cere/CEF Alpha is ready to ship for **unencrypted (transparent) data flows**. The core stack — DDC Storage, Activity SDK, Agent Runtime (V8), and DAC logging — is production-grade and documented.

However, **encrypted agent-to-agent data exchange** (the "trustless" promise) is blocked by three unshipped components. This brief defines what's ready, what's not, and what engineering must prioritize.

---

## 2. What Works Today (Green Zone ✅)

| Component | Status | Evidence |
|---|---|---|
| DDC SDK (JS) | ✅ Production | NPM published, working examples, wiki |
| Activity SDK | ✅ Production | NPM published, DAC logging functional |
| Agent Runtime (V8) | ✅ Production | Deployed, 50K ops/sec on Dragon One |
| Deployment (Ansible) | ✅ Production | K8s/K3s automation, enterprise-grade |
| Marketing Narratives | ✅ Ready | Amit Deck, CEF Positioning docs |

**These components support the full "From Zero to Proof" developer journey (Steps 1-5).**

---

## 3. Critical Blockers (Red Zone 🔴)

### 3.1 Client-Side Encryption (EDEK)
- **Status:** ADR "Proposed" — not implemented
- **What's missing:** DEK generation, EncryptionGrant primitives, AuthToken flow
- **Impact:** No privacy for stored data. Node operators can read everything.
- **Priority:** P0 for post-alpha encrypted milestone

### 3.2 Key Escrow Service (KES)
- **Status:** Not deployed, spec only
- **What's missing:** Entire service — key storage, grant issuance, revocation
- **Impact:** No revocable delegated access. Can't do agent-to-agent encrypted data sharing.
- **Priority:** P0 — blocks the core "trustless delegation" value prop

### 3.3 DAC Verification Path (Proto Definitions)
- **Status:** Code exists, undocumented
- **What's missing:** Public .proto files for TCA/PHD/EHD, Merkle proof reconstruction guide
- **Impact:** Developers hit a wall at Step 4 of Happy Flow. They see hashes but can't independently verify. Forced to "trust Cere" — negates the entire pitch.
- **Priority:** P0 — this is the platform's differentiator and it's currently opaque

---

## 4. Documentation Gaps (Yellow Zone ⚠️)

| Gap | Impact | Fix |
|---|---|---|
| DDC SDK method names outdated | Devs get errors following docs | Audit + update wiki |
| No "Hello World" for Verification | Key differentiator has no tutorial | Write verification quickstart |
| Identity model (wallet → DDC perms) | Internal wiki only, no public guide | Publish unified identity docs |
| DAC inspection flow | High-level concepts clear, details missing | Publish .proto files + examples |

---

## 5. Hackathon Scope Definition

### ✅ IN SCOPE (works today, safe to demo)

1. **Store data on DDC** — upload via SDK, get CID back
2. **Deploy agent to V8 runtime** — serverless, edge execution
3. **Agent reads/writes DDC** — CID-based, content-addressed
4. **Activity capture via DAC** — automatic logging, signed receipts
5. **On-chain receipt verification** — trace activity → Merkle root → block hash
6. **Multi-agent orchestration** — chain agents, pass CIDs between them
7. **Unencrypted data sharing** — agents share CIDs, read each other's data (transparent)

### ❌ OUT OF SCOPE (not ready, do NOT demo)

1. **Encrypted data delegation** — EDEK/EncryptionGrant not shipped
2. **Revocable access grants** — KES not deployed
3. **Cross-agent encrypted reads** — requires both EDEK + KES
4. **Independent Merkle proof reconstruction** — .proto files not published
5. **"Trustless" claims for encrypted flows** — misleading without crypto layer

### ⚠️ MESSAGING GUIDANCE

**Say:** "Build agents with verifiable activity capture and decentralized storage today."  
**Don't say:** "Trustless encrypted agent-to-agent data exchange" (not yet real)  
**Say:** "Encryption and delegated access are on our roadmap."  
**Don't say:** "Your data is encrypted on our network" (it's not, for alpha)

---

## 6. Engineering Roadmap — Priority Order

### Phase 1: Alpha Launch (NOW)
- [ ] Publish .proto files for TCA/PHD/EHD
- [ ] Create verification quickstart tutorial
- [ ] Audit + fix DDC SDK wiki method names
- [ ] Build "Verify" button in Developer Console
- [ ] Publish identity model docs (wallet → DDC permissions)

### Phase 2: Encrypted Alpha (Target: TBD)
- [ ] Implement EDEK client-side encryption in DDC SDK
- [ ] Build + deploy Key Escrow Service (KES) — basic version
- [ ] Implement EncryptionGrant primitives
- [ ] Build delegated access flow (grant → decrypt → revoke)
- [ ] Add Step 6 to Happy Flow: "Grant Access to Another Agent"

### Phase 3: Production Trustless (Target: TBD)
- [ ] Hardened KES with key rotation
- [ ] Revocation propagation across DDC nodes
- [ ] WASM verification tool for independent proof checking
- [ ] Full "Zero to Trustless Proof" developer journey (Steps 1-6)
- [ ] External security audit of encryption stack

---

## 7. The "Bren + Mart" Test

**The litmus test for Phase 2 completion:**  
Can Mart's agent and Bren's agent exchange encrypted data on DDC where:
- Each agent can only read data they're granted access to
- Grants are revocable by the data owner
- All access is logged and independently verifiable
- Neither agent needs to trust the other or Cere

**Today's answer:** No. They can exchange unencrypted data via CIDs.  
**Phase 2 answer:** Yes, with basic encryption + delegation.

---

## 8. Action Items

| Who | What | When |
|---|---|---|
| Engineering | Publish .proto files (TCA/PHD/EHD) | This week |
| Engineering | Fix DDC SDK wiki method names | This week |
| DevRel | Write verification quickstart tutorial | Before hackathon |
| DevRel | Build "Verify" button in Dev Console | Before hackathon |
| Engineering | Scope EDEK implementation sprint | Next planning |
| Engineering | Design KES MVP architecture | Next planning |
| Leadership | Decide Phase 2 timeline | This sprint |
| Marketing | Align messaging with scope (no encryption claims) | Immediately |

---

## References

- [ADR: Encrypted Data Access](https://www.notion.so/cere/ADR-Encrypted-Data-Access-and-Key-Delegation-2f0d800083d6804ba77fe09e9d0beb2f)
- [DAC Inspection & Execution](https://www.notion.so/cere/DAC-Inspection-Execution-113d800083d68005818cebd60a61fbb1)
- [Project Source of Truth](https://www.notion.so/cere/Project-Source-of-Truth-2f1d800083d6807f8b83f0db3615179e)
- [Agent Developer Guide](https://www.notion.so/cere/Agent-Developer-Guide-2a3d800083d680cc901ae2c1c8e36509)
- [Hackathon Encryption Wiki](https://www.notion.so/cere/WIP-Hackathon-May-2025-Built-in-encryption-in-DDC-SDK-for-Secure-Data-Storage-Wiki-1d5d800083d680328e0fd93fa71bb9ca)
