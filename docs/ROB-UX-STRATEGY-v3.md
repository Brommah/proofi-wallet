# ROB UX Strategy v3.0 — From Broken to Best-in-Class

**Author:** Claudemart  
**Date:** 2026-02-02  
**Status:** In Progress (based on live hands-on audit)  
**Previous:** [ROB-UI-PRD-v2.md](./ROB-UI-PRD-v2.md) (theoretical), this is based on **actually using it**

---

## 🔥 Executive Summary

ROB has all the infrastructure for a world-class AI agent developer platform. The backend works. The models run. The storage is decentralized. The verification chain is live. But the developer experience is **broken at every touchpoint**.

Tonight we:
- Logged into ROB prod and devnet
- Tried to create an agent → 400 error (frontend bug: missing `metadata: {}` on task objects)  
- Fixed the bug manually → 500 error (MySQL prod DB is read-only)
- Discovered devnet has a completely different UI ("Agent Services" vs "Data Services")
- Found the Model Registry shows 7 models but only 5 are available for LLM agents
- Found the "Bullish" Data Service exists with 4 Rafts and 1 Data Source

**The gap between "works internally" and "usable by developers" is exactly what needs fixing.**

---

## 🏗️ What ROB Actually Is (After Using It)

### Prod (rob.cere.io)
```
ROB Prod
├── Home (3 cards: Data Services, Agent Registry, Model Registry)
├── Data Services
│   └── "Bullish" (the only service)
│       ├── Dashboard (4 Rafts, 1 Data Source, Active)
│       ├── Ontology
│       ├── Applications
│       ├── Engagements
│       ├── Data Sources
│       ├── Rafts
│       ├── Streams
│       └── Agents (empty, can "Attach Agent" from registry)
├── Agent Registry (3 agents: Simple Test, Sum agent, Test)
│   └── Create Agent Wizard (5 steps: Type → Details → Tools → Tasks → Review)
└── Model Registry (7 models, 2.5M invocations)
    ├── Llama 3.2 11B Vision Instruct
    ├── MobileNetV2 Image Classification
    ├── OWL-ViT Base Patch32
    ├── SAM2 Hiera Large
    ├── Stable Diffusion XL Base 1.0
    ├── SDXL Inpainting 1.0 + IP-Adapter
    └── Whisper Large v3
```

### Devnet (rob.dev.cere.io)
```
ROB Devnet
├── Agent Services (empty, "No agent services available")
│   ├── Create Service button (fails silently)
│   └── Run Wizards button
└── (No Agent Registry or Model Registry visible separately)
```

### API
- Base: `https://api.rob.cere.io/rms-node-backend/`
- Auth: JWT via Cere Wallet (ed25519 signed)
- Agent Registry: `POST /agent-registry`
- Known issues: MySQL is read-only on prod

---

## 🐛 Critical Bugs Found

### Bug 1: Agent Creation — Frontend Validation (P0)
- **Endpoint:** `POST /agent-registry`  
- **Error:** `tasks.0.metadata must be an object`
- **Root Cause:** Frontend sends tasks without `metadata: {}` field
- **Fix:** Add `metadata: {}` to each task object in the create agent payload
- **Impact:** No one can create agents via the UI
- **Location:** Frontend `cere-io/dynamic-indexer-client`

### Bug 2: Prod Database Read-Only (P0)  
- **Error:** `The MySQL server is running with the --read-only option`
- **Impact:** No write operations work on prod — can't create agents, services, or anything
- **Fix:** DBA/infra needs to change MySQL to read-write, or there's a replica config issue
- **Who:** Infrastructure team

### Bug 3: Devnet Service Creation Fails Silently (P1)
- **Behavior:** Click "Create Service" → dialog appears → fill name → click Create → nothing happens
- **Impact:** Devnet is completely unusable for new users

### Bug 4: Model Mismatch (P2)
- **Model Registry** shows 7 models (including vision, classification, segmentation)
- **Agent Create dropdown** shows 5 models (only text/LLM models)
- **No indication** in Model Registry which models work for which agent types
- **Fix:** Add "Compatible with: LLM Agents" / "Compatible with: Programmable Agents" badges

### Bug 5: Missing System Prompt Validation (P2)
- System prompt field has no character limit shown
- No error until you try to submit
- Placeholder says "You are a helpful assistant..." but doesn't auto-fill

---

## 📋 Page-by-Page UX Issues

### Home Page
| Issue | Severity | Proposal |
|-------|----------|----------|
| No system status indicator | High | Add health bar: API ✅ Runtime ✅ DB ✅ |
| No quick-start path | High | "Deploy your first agent in 5 minutes" CTA |
| No recent activity | Medium | Show last 10 agent invocations/deployments |
| Three cards feel empty | Low | Add stats: "3 agents deployed, 2.5M invocations" |

### Agent Registry
| Issue | Severity | Proposal |
|-------|----------|----------|
| Can't create agents (400 + 500) | Critical | Fix bugs above |
| No agent detail view visible | High | Click agent → show config, invocation stats, logs |
| No "Deploy" or "Test" button | High | One-click test invocation |
| No versioning | Medium | v1, v2, v3 with diff view |
| "PROGRAMMABLE" badge unclear | Low | Explain or make it filterable |
| Search does nothing useful with 3 agents | Low | Will matter at scale |

### Agent Create Wizard
| Issue | Severity | Proposal |
|-------|----------|----------|
| 5-step wizard for a simple agent is too many steps | High | Collapse to 2-3 steps max |
| Model dropdown shows IDs not human names | Medium | Show "Qwen 2.5 (1.5B) — Fast, tool calling" |
| No code editor for Programmable agents | High | Monaco editor with syntax highlighting |
| No preview/test before creating | High | "Test this config" button at Review step |
| No template selection | Medium | "Start from: Chatbot / Data Processor / Classifier" |

### Model Registry
| Issue | Severity | Proposal |
|-------|----------|----------|
| Beautiful cards but no action buttons | Medium | "Use in Agent" one-click |
| Invocation stats but no latency graphs | Medium | Add sparkline charts |
| "Create Model" exists but who uses it? | Low | Hide behind advanced mode |
| No pricing/cost indicator | Medium | Show cost per 1K invocations |

### Data Services ("Bullish")
| Issue | Severity | Proposal |
|-------|----------|----------|
| Side nav has 8 items — too many | High | Group: Data (Sources, Streams) / Logic (Rafts, Engagements) / Deploy (Agents, Apps) |
| "Ontology" — WTF is this? | High | Rename to "Schema" or "Data Model" |
| "Engagements" — unclear | High | Rename to "Workflows" or "Pipelines" |
| Dashboard shows counts but not trends | Medium | Add 7-day activity charts |
| Agents page is empty | Medium | Show suggested agents based on data sources |

---

## 🎯 The Vision: What ROB Should Feel Like

### For a developer arriving for the first time:

```
1. Land on rob.cere.io → "Welcome! Deploy your first AI agent on decentralized compute"
2. Click "Quick Start" → Choose template: "Chatbot" / "Image Classifier" / "Data Pipeline"
3. Template pre-fills:
   - Agent type (LLM)
   - Model (Qwen 2.5 — recommended for quick start)
   - System prompt (editable)
   - Task (chat)
4. Click "Deploy" → Agent is live in 30 seconds
5. "Test it now" → Built-in chat interface to talk to your agent
6. "View on DDC" → See where your data is stored, Merkle proof link
7. "Monitor" → Real-time invocation logs, cost tracker
```

**That's it. From landing to deployed agent in 5 clicks, 2 minutes.**

### For a power user:

```
1. Dashboard shows all services, agents, health at a glance
2. Click into any agent → Full config, logs, metrics, cost
3. Visual workflow builder for multi-agent pipelines
4. CLI for everything (rob deploy, rob logs, rob invoke)
5. API docs with interactive playground
6. Webhook/event source configuration
7. Access control & team management
```

---

## 🏛️ Proposed Architecture Redesign

### Current:
```
Home → Data Services → [Service] → {Ontology, Apps, Engagements, Sources, Rafts, Streams, Agents}
       Agent Registry → Create Agent (5 steps)
       Model Registry → View Models
```

### Proposed:
```
Home (Dashboard)
├── Quick Start → Template-based onboarding
├── My Agents → All agents across all services
│   ├── [Agent] → Config, Metrics, Logs, Test
│   └── Create Agent (2-step: Config → Deploy)
├── My Services → Workspaces that group agents + data
│   └── [Service] → Agents, Data, Workflows, Settings
├── Models → Browse & compare models
│   └── Playground → Test any model directly
├── Monitoring → Invocations, costs, errors
└── Settings → API keys, webhooks, team
```

### Key Changes:
1. **Agents are first-class citizens**, not buried under Services
2. **Quick Start** is the entry point, not an empty dashboard
3. **Monitoring** is global, not per-service
4. **Model Playground** for testing before deploying
5. **2-step agent creation**: Config (name + model + prompt) → Deploy (confirm + go)

---

## 🎨 UI Component Improvements

### 1. Agent Card (Current vs Proposed)

**Current:**
```
┌─────────────────────────┐
│ Simple Test              │
│ PROGRAMMABLE             │
│ 0 tools  1 task         │
│ Oct 27, 2025            │
└─────────────────────────┘
```

**Proposed:**
```
┌─────────────────────────────────────────┐
│ 🤖 Simple Test                    [▶ Test] │
│ Programmable Agent · Qwen 2.5           │
│ ━━━━━━━━━━━ 1.2K invocations          │
│ ⚡ 45ms avg · 📊 99.2% success         │
│ Last invoked: 2 hours ago               │
│ ┌─────┐ ┌─────┐                        │
│ │ Logs│ │ Edit│                        │
│ └─────┘ └─────┘                        │
└─────────────────────────────────────────┘
```

### 2. Agent Creation (Current 5-step → Proposed 2-step)

**Step 1: Configure**
```
┌─────────────────────────────────────────────┐
│ Create Agent                                │
│                                             │
│ Name: [___________________]                 │
│                                             │
│ Type:  [🤖 LLM Agent] [⚡ Custom Code]    │
│                                             │
│ Model: [Qwen 2.5 (1.5B) — Fast ▼]         │
│   Recommended for: chatbots, tool calling   │
│                                             │
│ System Prompt:                              │
│ ┌─────────────────────────────────────────┐ │
│ │ You are a helpful assistant...          │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Advanced: Tools, Tasks, Metadata ▼]        │
│                                             │
│           [Cancel]  [Create & Deploy →]     │
└─────────────────────────────────────────────┘
```

**Step 2: Test & Deploy**
```
┌─────────────────────────────────────────────┐
│ ✅ Agent Created!                           │
│                                             │
│ Test your agent:                            │
│ ┌─────────────────────────────────────────┐ │
│ │ You: Hello, what can you do?            │ │
│ │ Agent: I can help with...               │ │
│ │ [________________________] [Send]       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Endpoint: POST /agent/{id}/invoke           │
│ curl -X POST ... [Copy]                    │
│                                             │
│           [Edit Agent]  [Go to Dashboard]   │
└─────────────────────────────────────────────┘
```

### 3. Model Selector (Rich)
```
┌─────────────────────────────────────────────┐
│ Select Model                                │
│ ┌─────────────────────────────────────────┐ │
│ │ ⭐ Qwen 2.5 (1.5B)          RECOMMENDED│ │
│ │ Fast · Tool calling · MCP support       │ │
│ │ Latency: ~120ms · Cost: $0.01/1K       │ │
│ ├─────────────────────────────────────────┤ │
│ │ 🧠 Llama 3.1 (8B)                      │ │
│ │ Balanced · General purpose              │ │
│ │ Latency: ~350ms · Cost: $0.03/1K       │ │
│ ├─────────────────────────────────────────┤ │
│ │ 🔬 Hermes 2 Pro (8B)                   │ │
│ │ Best tool calling · Function calling    │ │
│ │ Latency: ~380ms · Cost: $0.03/1K       │ │
│ ├─────────────────────────────────────────┤ │
│ │ 💨 Phi-3 Mini (3.8B)                   │ │
│ │ Great for demos · Lightweight           │ │
│ │ Latency: ~200ms · Cost: $0.015/1K      │ │
│ ├─────────────────────────────────────────┤ │
│ │ 🎯 Mistral 7B v0.3                     │ │
│ │ Native function calling                 │ │
│ │ Latency: ~300ms · Cost: $0.025/1K      │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 🔧 Technical Fixes Required

### Immediate (this week)
1. **Fix task metadata bug** — Add `metadata: {}` to task objects in frontend create agent flow
2. **Fix MySQL read-only** — Either misconfigured replica or intentional but blocking all writes
3. **Fix devnet service creation** — Silent failure needs error handling

### Short-term (2 weeks)
4. **Add error details to UI** — Show actual API error messages, not just "Request failed with status code 400"
5. **Add model compatibility badges** — Which models work with which agent types
6. **Collapse wizard to 2 steps** — Config → Deploy instead of 5 steps
7. **Add system health indicator** — DB status, runtime status, API status

### Medium-term (4 weeks)
8. **Agent test playground** — Chat with your agent from the UI
9. **Invocation logs** — See every call to your agent with input/output
10. **Rename Ontology → Schema, Engagement → Workflow**
11. **Add Quick Start templates** — Chatbot, Classifier, Pipeline

### Long-term (8 weeks)  
12. **Visual workflow builder** — Connect agents, data sources, outputs
13. **CLI companion** — `rob deploy`, `rob invoke`, `rob logs`
14. **Team management** — Share agents, services, access control
15. **Cost dashboard** — Track spending per agent, model, service

---

## 📊 Competitive Comparison

| Feature | ROB Now | Vercel | Railway | Replicate | HuggingFace |
|---------|---------|--------|---------|-----------|-------------|
| Deploy from UI | ❌ (broken) | ✅ | ✅ | ✅ | ✅ |
| Agent testing | ❌ | N/A | N/A | ✅ | ✅ |
| Model playground | ❌ | N/A | N/A | ✅ | ✅ |
| Invocation logs | ❌ | ✅ | ✅ | ✅ | ❌ |
| Quick start templates | ❌ | ✅ | ✅ | ✅ | ✅ |
| Visual workflow builder | ❌ | ❌ | ❌ | ❌ | ❌ |
| Decentralized storage | ✅ | ❌ | ❌ | ❌ | ❌ |
| Verifiable compute | ✅ | ❌ | ❌ | ❌ | ❌ |
| Merkle proof audit | ✅ | ❌ | ❌ | ❌ | ❌ |

**ROB's unfair advantages (DDC, DAC, verification) are invisible to users because the basic UX is broken.** Fix the basics and the unique value proposition becomes the selling point.

---

## 🎯 Success Metrics

| Metric | Current | 30-day Target | 90-day Target |
|--------|---------|---------------|---------------|
| Time to deploy first agent | ∞ (blocked by bugs) | < 5 minutes | < 2 minutes |
| Agent creation success rate | 0% (400/500 errors) | 95% | 99% |
| Pages with empty states | 5+ | 0 | 0 |
| User-reported confusion points | Every page | 2-3 | 0 |
| Daily active developers | ~0 | 5 | 20 |

---

## 💡 The Pitch: Why This Matters

ROB is sitting on something no other platform has: **verifiable, decentralized AI agent compute**. Every inference is metered. Every action has a Merkle proof. Every byte is stored on DDC with encryption.

But right now, a developer arrives at rob.cere.io and:
1. Sees a login page → enters email → waits for OTP
2. Sees three cards → clicks Agent Registry
3. Sees 3 agents → clicks "Create Agent"
4. Goes through 5-step wizard → **gets a 400 error**
5. Leaves.

That developer will never come back.

**The fix isn't hard. The bugs are surface-level. The infrastructure is solid. We just need to make the frontend match the backend's quality.**

---

*This strategy is based on hands-on testing of rob.cere.io and rob.dev.cere.io on 2026-02-02, not theoretical analysis. Every bug listed was personally encountered and verified.*
