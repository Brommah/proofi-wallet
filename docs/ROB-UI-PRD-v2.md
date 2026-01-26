# ROB UI PRD v2.0 — Making Orchestration Accessible

**Author:** Claudemart (via Mart)  
**Date:** 2026-01-26  
**Status:** Draft  

---

## 🎯 Problem Statement

ROB (Real-time Orchestration Backend) is powerful but **unusable by anyone who hasn't worked with it for years**. The current experience requires:
- Deep knowledge of internal terminology (Rafts, Engagements, Data Sources, Streams)
- Understanding of the deployment model
- CLI fluency
- Tribal knowledge passed down from original developers

**Goal:** Make ROB usable by a developer in < 30 minutes, without reading documentation.

---

## 👤 Target Users

| Persona | Goal | Current Pain |
|---------|------|--------------|
| **New Developer** | Deploy first AI agent | No idea where to start, what a "Raft" is, or how pieces connect |
| **Integration Engineer** | Connect data sources to workflows | Can't visualize data flow, unclear which config goes where |
| **Ops/DevOps** | Monitor & debug running agents | No dashboard, logs scattered, unclear health status |
| **Product Manager** | Understand what's deployed | Can't see system state without asking engineers |

---

## 🧠 Core UX Principles

### 1. **Progressive Disclosure**
Don't show everything at once. Start simple, reveal complexity as needed.

### 2. **Visual > Text**
Show the orchestration graph, not YAML configs. Let users SEE the data flow.

### 3. **Familiar Metaphors**
- "Raft" → **Project** or **Workspace**
- "Engagement" → **Workflow** or **Pipeline**  
- "Data Source" → **Input** or **Connection**
- "Stream" → **Data Feed**

### 4. **Guardrails, Not Docs**
Guide users with inline hints, validation, and smart defaults—not external documentation.

---

## 🏗️ Proposed Information Architecture

```
ROB Console
├── 🏠 Home (Dashboard)
│   ├── Quick Actions: "Create Workflow", "Connect Data", "Deploy Agent"
│   ├── Recent Activity
│   └── System Health (green/yellow/red)
│
├── 📂 Projects (formerly "Rafts")
│   ├── List of all projects
│   ├── Create New Project wizard
│   └── Project Detail
│       ├── Overview (visual graph of workflows)
│       ├── Workflows (engagements)
│       ├── Data Connections (sources)
│       ├── Agents
│       ├── Deployments
│       └── Settings
│
├── 🔗 Data Connections (Global)
│   ├── Browse available connectors
│   ├── My Connections
│   └── Create Connection wizard
│
├── 🤖 Agent Registry
│   ├── Browse agents (marketplace-style)
│   ├── My Agents
│   └── Create/Upload Agent
│
├── 📊 Monitoring
│   ├── Live Streams
│   ├── Job History
│   ├── Logs
│   └── Alerts
│
└── ⚙️ Settings
    ├── Organization
    ├── API Keys
    ├── Integrations
    └── Billing/Usage
```

---

## 🚀 Key User Flows

### Flow 1: First-Time User Onboarding

**Current:** User lands on empty dashboard, no guidance, has to read docs.

**Proposed:**
1. **Welcome modal** with 3 options:
   - "Start from Template" → Pre-built workflows (e.g., "Slack Bot", "Data Pipeline", "Multi-Agent Chat")
   - "Connect Data First" → Guided data source setup
   - "Explore Demo Project" → Read-only sandbox with sample data
2. **Interactive checklist** in sidebar:
   - [ ] Create your first project
   - [ ] Connect a data source
   - [ ] Add an agent
   - [ ] Deploy your workflow
   - [ ] View your first job
3. **Contextual tooltips** on first visit to each section

### Flow 2: Create a Workflow (Engagement)

**Current:** 
- Open CLI
- Write YAML config from memory/docs
- Run `rob deploy --config workflow.yaml`
- Hope it works

**Proposed:**
1. Click "New Workflow" in project
2. **Visual Canvas** (like Figma/Miro):
   - Drag "Data Source" node onto canvas
   - Drag "Agent" node → connect with arrow
   - Drag "Output" node (Slack, webhook, database)
3. **Live Validation** as you build:
   - Missing connections highlighted red
   - Type mismatches shown inline
   - "This agent requires X input, but Y is connected"
4. **Test Mode** before deploy:
   - "Run with sample data" button
   - See output in split-pane preview
5. **One-click Deploy** when ready

```
┌─────────────────────────────────────────────────────────────┐
│  My Workflow                                    [Test] [Deploy] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────┐      ┌──────────┐      ┌──────────┐        │
│   │ Webhook  │ ───▶ │ GPT-4    │ ───▶ │ Slack    │        │
│   │ Input    │      │ Agent    │      │ Output   │        │
│   └──────────┘      └──────────┘      └──────────┘        │
│        │                                                    │
│        └──────────────────────────────────────────────────▶ │
│                    ┌──────────┐                             │
│                    │ Database │                             │
│                    │ Logger   │                             │
│                    └──────────┘                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Properties: GPT-4 Agent                                     │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Model: gpt-4-turbo            [▼]                       ││
│ │ System Prompt: You are a helpful assistant...           ││
│ │ Temperature: 0.7              [━━━━━●━━━]               ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Flow 3: Debug a Failed Job

**Current:**
- SSH into server
- Grep logs
- Correlate timestamps manually
- Ask original developer what went wrong

**Proposed:**
1. **Job Dashboard** shows all runs with status (✅ ❌ ⏳)
2. Click failed job → **Timeline View**:
   - Visual trace through workflow nodes
   - Each node shows: input received, processing time, output/error
3. **One-click re-run** with same or modified inputs
4. **Compare to successful run** side-by-side

---

## 📱 Key UI Components

### 1. Visual Workflow Builder
- Node-based editor (like n8n, Retool Workflows, Zapier)
- Real-time validation
- Type-safe connections
- Undo/redo
- Zoom/pan canvas
- Mini-map for large workflows

### 2. Smart Data Source Picker
- Categorized: Databases, APIs, Files, Streams
- Search with fuzzy match
- "Recently used" section
- Connection health indicators
- Test connection button

### 3. Agent Marketplace
- Browse by category: NLP, Vision, Custom
- Version badges
- Usage stats
- "Add to Project" one-click
- Inline documentation

### 4. Monitoring Dashboard
- Real-time stream visualization
- Job queue depth graph
- Error rate trend
- Latency percentiles
- Cost per workflow

---

## 🔤 Terminology Mapping

| Old Term | New Term | Why |
|----------|----------|-----|
| Raft | **Project** | Universal, no explanation needed |
| Engagement | **Workflow** | Industry standard (Zapier, n8n, etc.) |
| Data Source | **Connection** or **Input** | Clearer intent |
| Stream | **Data Feed** or just **Stream** | Keep, it's understandable |
| Deploy | **Publish** or **Go Live** | Less technical |

---

## 🎨 Visual Design Guidelines

### Colors
- **Primary:** Cere brand purple (#6B4EE6)
- **Success:** Green (#22C55E)
- **Warning:** Amber (#F59E0B)
- **Error:** Red (#EF4444)
- **Neutral:** Gray scale for backgrounds

### Typography
- Headers: Inter Bold
- Body: Inter Regular
- Code: JetBrains Mono

### Density
- Default: Comfortable (16px base, generous whitespace)
- Option: Compact mode for power users

---

## 📊 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Time to first successful deployment | Unknown (hours?) | < 30 minutes |
| Support tickets for "how to X" | High | -50% |
| Users completing onboarding | Unknown | > 80% |
| Workflows created per user/month | Low | 3x increase |
| NPS from new users | Unknown | > 40 |

---

## 🗓️ Phased Rollout

### Phase 1: Foundation (4 weeks)
- [ ] Rename Raft → Project in UI
- [ ] Add Dashboard with quick actions
- [ ] Implement onboarding checklist
- [ ] Basic monitoring view

### Phase 2: Visual Builder (6 weeks)
- [ ] Node-based workflow canvas
- [ ] Drag-and-drop components
- [ ] Real-time validation
- [ ] Test mode

### Phase 3: Polish & Power Features (4 weeks)
- [ ] Agent marketplace
- [ ] Advanced monitoring
- [ ] Compare/diff deployments
- [ ] Keyboard shortcuts
- [ ] Dark mode

---

## 🔗 References

- [n8n Workflow Editor](https://n8n.io) — Best-in-class visual builder
- [Retool Workflows](https://retool.com/workflows) — Clean enterprise UX
- [Railway Dashboard](https://railway.app) — Excellent deployment UX
- [Vercel](https://vercel.com) — Simple but powerful

---

## 💬 Open Questions

1. Should we support YAML import/export for power users?
2. Is there a frontend repo, or is this console built from scratch?
3. What's the current auth model? (Org-based? User-based?)
4. Are there existing design system components to leverage?
5. What's the mobile story? (View-only? Full editing?)

---

*This PRD is a starting point. The key insight is: **users don't need to understand Cere's internal model—they need to accomplish tasks.** Hide the complexity, expose the capability.*
