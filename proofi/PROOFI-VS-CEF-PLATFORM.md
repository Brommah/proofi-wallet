# Proofi vs CEF.AI — Platform Comparison

> **One-liner:** CEF.AI is the B2B enterprise agent platform. Proofi is the B2C personal data layer. Both run on DDC. Both grow $CERE.

---

## The Simple Picture

```
                    ┌─────────────────────────────────────┐
                    │            $CERE Value              │
                    │         (DDC Network Usage)         │
                    └──────────────────┬──────────────────┘
                                       │
              ┌────────────────────────┴────────────────────────┐
              │                                                 │
              ▼                                                 ▼
┌─────────────────────────────┐           ┌─────────────────────────────┐
│         CEF.AI              │           │          Proofi             │
│    Enterprise Platform      │           │    Consumer Data Layer      │
├─────────────────────────────┤           ├─────────────────────────────┤
│                             │           │                             │
│  "Ship AI Like Software"    │           │  "Your Data, Your Agents"   │
│                             │           │                             │
│  • B2B sales               │           │  • B2C adoption             │
│  • Managed infrastructure   │           │  • Self-custodial           │
│  • Platform-hosted agents   │           │  • Open agent ecosystem     │
│  • Enterprise compliance    │           │  • User sovereignty         │
│                             │           │                             │
│  Target: Enterprises        │           │  Target: Consumers/Devs     │
│  ACV: $100K+               │           │  Model: Freemium/Usage      │
│                             │           │                             │
└──────────────┬──────────────┘           └──────────────┬──────────────┘
               │                                         │
               │                                         │
               └──────────────────┬──────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────────────┐
                    │           Cere DDC                  │
                    │    Decentralized Data Cloud         │
                    │                                     │
                    │  • Storage layer for both          │
                    │  • Network effects compound        │
                    │  • Token value from usage          │
                    └─────────────────────────────────────┘
```

---

## Executive Summary

| Dimension | CEF.AI | Proofi |
|-----------|--------|--------|
| **Market** | B2B Enterprise | B2C Consumer + B2D Developer |
| **Tagline** | "Ship AI Like Software" | "Your Data, Your Agents, Your Rules" |
| **Value Prop** | Managed AI agent infrastructure | Personal data sovereignty |
| **Key Custody** | Platform vault (server-side) | Browser extension (client-side) |
| **Agent Runtime** | Platform-hosted V8 isolates | Open (any runtime, anywhere) |
| **Data Access** | Platform-mediated Context API | User-granted capability tokens |
| **Trust Model** | "Trust us with your data" | "Trust no one but yourself" |
| **Revenue** | Enterprise licenses | Usage-based + premium features |
| **Moat** | Platform lock-in | Network effects + UX |

---

## Why This Isn't Competition

### Different Customers

| CEF.AI Customer | Proofi Customer |
|-----------------|-----------------|
| CISO buying compliance | User wanting data control |
| Enterprise architect | Indie developer |
| Procurement team | Individual consumer |
| 12-month sales cycle | Self-serve signup |

### Different Value Props

**CEF.AI sells:**
- "We handle the infrastructure so you don't have to"
- "Enterprise-grade security and compliance"
- "Managed agent orchestration at scale"

**Proofi sells:**
- "Your data never leaves your device unencrypted"
- "You decide which agents see what"
- "Works with any app, any agent, anywhere"

### Same Network

Both drive DDC usage → Both grow $CERE value

```
Enterprise stores data on DDC     →  DDC usage ↑
Consumers store data on DDC       →  DDC usage ↑
More DDC usage                    →  $CERE value ↑
```

---

## Architecture Comparison

### CEF.AI: Managed Platform

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CEF.AI Platform                              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     Orchestrator (A7)                         │   │
│  │            Routes requests, manages deployments               │   │
│  └───────────────────────────┬──────────────────────────────────┘   │
│                              │                                       │
│         ┌────────────────────┼────────────────────┐                 │
│         ▼                    ▼                    ▼                 │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐         │
│  │   Agent     │      │  Inference  │      │   Stream    │         │
│  │   Runtime   │      │   Runtime   │      │  Ingestion  │         │
│  │   (A9)      │      │   (A8)      │      │   (SIS)     │         │
│  │             │      │             │      │             │         │
│  │  V8 Isolate │      │  GPU/TPU    │      │  Real-time  │         │
│  │  Context API│      │  Models     │      │  Events     │         │
│  └──────┬──────┘      └──────┬──────┘      └──────┬──────┘         │
│         │                    │                    │                 │
│         └────────────────────┼────────────────────┘                 │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Cubby Service (A9.D)                        │   │
│  │              Persistent Memory (Redis Stack)                  │   │
│  └───────────────────────────┬──────────────────────────────────┘   │
│                              │                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Cere Vault                               │   │
│  │              Master DEKs (Platform-Controlled)                │   │
│  └───────────────────────────┬──────────────────────────────────┘   │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Cere DDC       │
                    │   (Encrypted Blobs) │
                    └─────────────────────┘

✅ Managed infrastructure
✅ Enterprise compliance
✅ Integrated stack
⚠️  Platform holds keys
⚠️  Agents locked to platform
⚠️  User trusts platform
```

### Proofi: User-Sovereign Layer

```
┌─────────────────────────────────────────────────────────────────────┐
│                        User's Device                                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Proofi Extension                            │   │
│  │                                                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │   │
│  │  │ KeyManager  │  │  Encryptor  │  │  Token Engine       │   │   │
│  │  │ (sr25519)   │  │ (AES-256)   │  │  (Capabilities)     │   │   │
│  │  │             │  │             │  │                     │   │   │
│  │  │ Private key │  │ Encrypt     │  │ Grant scoped access │   │   │
│  │  │ never leaves│  │ before      │  │ to agents           │   │   │
│  │  │ device      │  │ upload      │  │                     │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘   │   │
│  │                                                               │   │
│  │  ✅ Keys NEVER leave device                                  │   │
│  │  ✅ User controls all access                                 │   │
│  │  ✅ Works with any app                                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
     │   App A     │    │   App B     │    │   App C     │
     │             │    │             │    │             │
     │  Proofi SDK │    │  Proofi SDK │    │  Proofi SDK │
     └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
            │                  │                  │
            └──────────────────┼──────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Cere DDC       │
                    │  (User's Encrypted  │
                    │       Vault)        │
                    └──────────┬──────────┘
                               │
                               │ (with capability token)
                               ▼
     ┌─────────────────────────────────────────────────────────┐
     │                    Agent Ecosystem                       │
     │                                                          │
     │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
     │  │ Local Agent │  │ Cloud Agent │  │ Open Source │      │
     │  │ (your PC)   │  │ (any host)  │  │ Agent       │      │
     │  └─────────────┘  └─────────────┘  └─────────────┘      │
     │                                                          │
     │  Agents receive: time-bound capability token            │
     │  Agents can: decrypt only what user authorized          │
     │  Agents cannot: access anything without token           │
     │                                                          │
     └─────────────────────────────────────────────────────────┘

✅ True self-custody
✅ User controls everything
✅ Open agent ecosystem
✅ Cross-app by default
⚠️  User responsible for keys
⚠️  No managed compliance
```

---

## Feature Matrix

### Core Capabilities

| Feature | CEF.AI | Proofi | Notes |
|---------|:------:|:------:|-------|
| Wallet/Identity | ✅ | ✅ | CEF: custodial, Proofi: self-custodial |
| DDC Storage | ✅ | ✅ | Same underlying storage |
| Encryption | ✅ | ✅ | CEF: server-managed, Proofi: client-only |
| Agent Runtime | ✅ | 🚧 | CEF: platform, Proofi: open |
| Agent Memory | ✅ | 🚧 | CEF: Cubby, Proofi: DDC-native |
| ML Inference | ✅ | 🔜 | CEF: integrated, Proofi: bring your own |
| Real-time Streams | ✅ | ❌ | CEF strength |
| Cross-app Data | ⚠️ | ✅ | Proofi: native, CEF: same deployment only |

### Security & Trust

| Feature | CEF.AI | Proofi | Notes |
|---------|:------:|:------:|-------|
| Self-custody | ❌ | ✅ | Fundamental difference |
| Zero-knowledge storage | ❌ | ✅ | CEF decrypts, Proofi can't |
| User-granted permissions | ⚠️ | ✅ | CEF: platform decides, Proofi: user decides |
| Instant revocation | ⚠️ | ✅ | Proofi: new key = instant |
| Audit trail (user-owned) | ❌ | ✅ | Proofi: in extension |
| Enterprise compliance | ✅ | ❌ | CEF strength |

### Developer Experience

| Feature | CEF.AI | Proofi | Notes |
|---------|:------:|:------:|-------|
| Open source | Partial | Full | Proofi: 100% open |
| Any language | ❌ | ✅ | CEF: JS only |
| Local development | ⚠️ | ✅ | Proofi: runs anywhere |
| Platform lock-in | ✅ | ❌ | CEF: by design |
| Self-host option | ❌ | ✅ | Proofi: fully self-hostable |

---

## Use Cases: Who Wins Where

### Enterprise Health Platform
**Winner: CEF.AI**
- Needs compliance certifications
- Wants managed infrastructure
- Has dedicated security team
- Accepts platform custody

### Personal Health Tracker
**Winner: Proofi**
- User wants data ownership
- Shares with personal AI coach
- No enterprise compliance needed
- Self-custody is the feature

### Cross-App Preference Sync
**Winner: Proofi**
- Same user, multiple apps
- Preferences in one vault
- Any app can read (with permission)
- No platform coordination needed

### Real-Time IoT Analytics
**Winner: CEF.AI**
- Stream ingestion at scale
- Platform-hosted agents
- Managed GPU inference
- Enterprise SLAs

### Personal AI Assistant
**Winner: Proofi**
- User's data from many apps
- AI processes locally or cloud
- User grants/revokes access
- No corporate middleman

---

## Competitive Positioning

### Not Competitors, Complements

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                        Market Landscape                            │
│                                                                    │
│    ENTERPRISE                                      CONSUMER        │
│    ◄──────────────────────────────────────────────────────────►   │
│                                                                    │
│    ┌─────────────┐                        ┌─────────────┐         │
│    │  CEF.AI     │                        │   Proofi    │         │
│    │             │                        │             │         │
│    │  "Ship AI   │                        │  "Your Data │         │
│    │   Like      │                        │   Your      │         │
│    │   Software" │                        │   Agents"   │         │
│    └─────────────┘                        └─────────────┘         │
│          │                                      │                  │
│          │         No Overlap Zone              │                  │
│          │                                      │                  │
│          │    ┌────────────────────────┐       │                  │
│          └───►│       Cere DDC         │◄──────┘                  │
│               │                        │                           │
│               │  Both use DDC          │                           │
│               │  Both grow $CERE       │                           │
│               │  Different customers   │                           │
│               └────────────────────────┘                           │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### The Tesla/Toyota Analogy

- **CEF.AI = Toyota**: Reliable enterprise solution, works for corporations
- **Proofi = Tesla**: Consumer-first, tech-forward, drives adoption

Both sell cars. Both need roads. DDC is the road.

---

## Current State

### CEF.AI (What's Built)

| Component | Status | Maturity |
|-----------|--------|----------|
| Agent Runtime (A9) | ✅ Live | Production-ish |
| Cubby Service | ✅ Live | Production-ish |
| DDC SDK | ✅ Live | Production |
| Inference Runtime (A8) | 🚧 WIP | Alpha |
| Orchestrator (A7) | 🚧 WIP | Alpha |
| Cere Wallet | ✅ Live | Production |
| Enterprise Sales | 🚧 WIP | Early pipeline |

**Strengths:** Infrastructure depth, enterprise positioning
**Gaps:** Consumer UX, self-custody, open ecosystem

### Proofi (What's Built)

| Component | Status | Maturity |
|-----------|--------|----------|
| Chrome Extension | ✅ Live | Beta |
| Proofi SDK | ✅ Live | Beta |
| DDC Integration | ✅ Live | Beta |
| Client-side Encryption | ✅ Live | Beta |
| Demo Apps (15+) | ✅ Live | Demo |
| Wallet UI | ✅ Live | Beta |
| Capability Tokens | 📋 Designed | Not started |
| Open Agent Runtime | 📋 Designed | Not started |

**Strengths:** Speed of execution, consumer UX, true self-custody
**Gaps:** Agent runtime, production hardening, scale testing

---

## Roadmap to Complete Platform

### Phase 1: Token Engine (Week 1-2)
```
Proofi Extension
     │
     ▼
┌─────────────────────────────────────┐
│        Capability Token Engine       │
│                                      │
│  Token = {                           │
│    scope: ["health/*", "prefs/ui"],  │
│    permissions: ["read"],            │
│    expiry: "2024-02-14T00:00:00Z",   │
│    wrappedDEK: "encrypted..."        │
│  }                                   │
│                                      │
│  User grants token → Agent decrypts  │
└─────────────────────────────────────┘
```

### Phase 2: Agent SDK (Week 3-4)
```typescript
// proofi-agent-sdk

import { ProofiAgent } from '@proofi/agent-sdk';

const agent = new ProofiAgent({
  token: userGrantedToken, // from extension
});

// Fetch and decrypt user's data
const healthData = await agent.read('health/metrics');

// Process with any model
const insights = await openai.chat(healthData);

// Return to user (encrypted)
await agent.write('health/insights', insights);
```

### Phase 3: Open Runtime (Week 5-6)
- Node.js reference implementation
- Python SDK
- WASM for browser-native agents
- Docker template for cloud deployment

### Phase 4: Ecosystem (Week 7-8)
- Agent registry (discover agents)
- Trust scores (community ratings)
- Template agents (health, finance, productivity)
- Mobile extension (iOS/Android)

---

## The Pitch to Fred

### Slide 1: The Gap
> "CEF.AI serves enterprises. Who serves consumers?"

### Slide 2: The Opportunity
> "1B+ people want AI but don't trust Big Tech with their data. Proofi = trust-minimized AI data layer."

### Slide 3: The Solution
> "Same DDC. Different market. Consumer-first UX. True self-custody."

### Slide 4: Not Competition
> "CEF.AI = B2B managed platform. Proofi = B2C self-sovereign layer. Both grow DDC. Both grow $CERE."

### Slide 5: What's Built
> "2 weeks. 15 apps. Chrome extension. Working encryption. DDC integration. Faster than A9 team."

### Slide 6: The Ask
> "Let me build the consumer layer while CEF builds enterprise. Same goal, different markets."

---

## Financial Alignment

### How Proofi Grows $CERE

| Proofi Action | DDC Impact | $CERE Impact |
|---------------|------------|--------------|
| User stores data | DDC storage fees | $CERE demand ↑ |
| Agent reads data | DDC bandwidth fees | $CERE demand ↑ |
| More users | More DDC usage | $CERE demand ↑ |
| More agents | More DDC traffic | $CERE demand ↑ |

### No Token Conflict
- Proofi doesn't need its own token
- Uses $CERE for DDC payments
- Users hold $CERE for storage
- Aligned incentives

---

## Conclusion

| Question | Answer |
|----------|--------|
| Is Proofi a CEF competitor? | **No.** Different markets. |
| Do they cannibalize each other? | **No.** B2B ≠ B2C. |
| Do both grow $CERE? | **Yes.** Both use DDC. |
| Can they coexist? | **Yes.** Complement each other. |
| Why build Proofi? | **CEF has no consumer story. Proofi is that story.** |

---

> *"DDC was always the answer. CEF.AI makes it enterprise-ready. Proofi makes it human-ready."*

---

## Appendix: Technical Specs

### Proofi Token Format
```typescript
interface CapabilityToken {
  // Who issued the token
  issuer: string; // user's wallet address
  
  // Who can use it
  grantee: string; // agent's public key
  
  // What they can access
  scope: string[]; // ["health/*", "prefs/theme"]
  
  // What they can do
  permissions: ("read" | "write" | "append")[];
  
  // When it expires
  expiry: number; // unix timestamp
  
  // Encrypted data encryption key
  wrappedDEK: string; // encrypted with grantee's pubkey
  
  // Proof of authenticity
  signature: string; // signed by issuer
}
```

### Encryption Flow
```
User Data → AES-256-GCM(DEK) → Ciphertext → DDC

DEK = derived from user's master key + resource path
Wrapped DEK = X25519(agent pubkey, DEK)
Token = { scope, permissions, expiry, wrappedDEK, signature }

Agent receives token → unwraps DEK → decrypts data
```

### SDK Integration
```typescript
// App-side: request access
const token = await proofi.requestAccess({
  agent: 'health-analyzer',
  scope: ['health/metrics'],
  permissions: ['read'],
  duration: '1h'
});

// User approves in extension popup

// Agent-side: use access
const agent = new ProofiAgent({ token });
const data = await agent.read('health/metrics');
```

---

*Document version: 2.0*
*Last updated: 2026-02-07*
*Author: Mart + Claude*
