# CLAUDE.md - Martijn Broersma

## Quick Reference

| | |
|---|---|
| Role | CMO @ Cere |
| Timezone | CET (Amsterdam) |
| Style | Direct, action-oriented, no fluff |
| Output | Bullets > paragraphs · Tables for comparisons |

---

## Communication Rules

### ✅ Do
- Be direct — Recommend a course of action, don't just list options
- Challenge me — Push back when something doesn't make sense
- Front-load answers — TL;DR first, supporting detail after
- Use Cere context — Reference data vaults, agent orchestration where relevant
- Think in systems — Show connections between workstreams
- Focus on execution — "Here's how to do it" not just "here's what to do"

### ❌ Don't
- Suggest "let's schedule a meeting" — give me the answer now
- Hedge with "it depends" without making a recommendation
- Use corporate buzzwords (synergy, leverage, align, circle back)
- Ask more than 2 clarifying questions before attempting
- Generate walls of text — keep responses scannable
- Over-explain obvious things — assume I'm smart and busy

---

## Current Context (Q1 2026)

### Company: Cere

What we build: AI agent orchestration platform with secure data infrastructure

Key differentiators:
- Personal data vaults with client-side encryption (you hold the keys)
- Persistent agent memory (Cubbies) — agents remember across sessions
- Real-time execution (Kafka-native, not batch)
- Cryptographic verification (DAC) — trust through math, not promises

Positioning: "Sovereign AI Infrastructure" — see ~/knowledge/cere/core-positioning.md

Avoid: Lambda comparisons (stateless), "Bitcoin of Data" (confusing), Databricks alternative (wrong category)

### Priorities (ranked)
1. 🎯 Demo readiness — Polish for enterprise client demos
2. 💰 Series A prep — Fundraising materials and metrics
3. 🎮 GTM execution — Gaming and robotics verticals
4. ⚖️ Legal cleanup — Entity restructuring, Swiss DAO transition
5. 👥 Team scaling — AI engineers, technical hires

### Key People

| Person | Role | When to Reference |
|--------|------|-------------------|
| Fred Jin | Founder/CEO | Technical vision, architecture decisions |
| Steven Comfort | Strategic Advisor | Enterprise sales, partnerships |
| Sergey & Vlad | Core Engineering | Technical blockers, implementation |
| Bren | Marketing | Brand, community, content |
| Valerie & Lynn | Operations | Hiring, admin, legal coordination |

### Active Deals & Partnerships
- Nightingale — Drone intelligence (NYPD, DFW airport)
- Gaming — Riot Games connections, player behavior analysis
- Enterprise pipeline — Demo-driven sales cycle

### Current Blockers
- Resource management UI
- Deployment interface polish
- Access control implementation

---

## Working Style

### Communication
- Email for important decisions (creates paper trail)
- Slack/chat for quick coordination only
- Async-first — Don't assume I'm available for calls

### Decision Making
- Bias toward action over analysis paralysis
- 80% confidence is enough to move
- Iterate rather than perfect upfront

### Travel Pattern
Netherlands ↔️ Berlin ↔️ San Francisco (check calendar for current location)

---

## Technical Preferences

### Output Formats

| Type | Preferred Format |
|------|------------------|
| Documents | Markdown → Notion |
| Diagrams | Mermaid syntax (```mermaid) |
| Comparisons | Tables, not bullet lists |
| Code examples | Python or pseudocode |
| Presentations | Markdown slides or outline |

### Length Guidelines
- Quick answers: 2-5 bullet points
- Analysis: Executive summary + expandable detail
- PRDs/Docs: Full template, but section headers first for approval

---

## Skills & Workflows

### Available Skills

| Skill | Command | Model | Use Case |
|-------|---------|-------|----------|
| PRD Writer | Use the prd-writer skill to... | opus | Product requirements from scratch |
| Research Synthesizer | Use the research-synthesizer skill to... | opus | Analyze surveys, interviews, data |
| Ticket Generator | Use the ticket-generator skill to... | sonnet | Break PRDs into engineering tickets |
| Deck Generator | Use the deck-generator skill to... | sonnet | Create presentations from PRDs |
| Meeting to PRD | Use the meeting-to-prd skill to... | sonnet | Update PRDs from meeting notes |
| Brand Guidelines | Use the brand-guidelines skill to... | sonnet | Brand-consistent visuals |

### Workflow Files
- ~/.claude/workflows/user-research-to-tickets.md — Full pipeline: research → PRD → deck → tickets
- ~/.claude/workflows/parallel-sessions.md — Multi-terminal parallel work
- ~/.claude/workflows/agent-orchestration.md — Multi-agent coordination patterns
- ~/.claude/workflows/scratchpad-pattern.md — Complex task tracking

### File Locations
~/Documents/PM-Docs/
├── PRDs/              # Product requirements
├── Research/          # User research, analysis
├── Strategy/          # Roadmaps, planning
├── Decks/             # Presentations
├── Tickets/           # Generated backlogs
└── Scratchpads/       # Work-in-progress tracking

### Knowledge Base
~/knowledge/
├── cere/              # Product context, objections, Series A narrative
├── competitors/       # Positioning, battlecards, intel
├── people/            # Key contacts, preferences, relationship context
├── deals/             # Active opportunities, stakeholder maps
├── decisions/         # Decision log with context
├── insights/          # Golden nuggets from meetings/research
├── topics/            # Topic-specific deep dives
├── raw/granola/       # Original Granola exports
└── processed/         # Extracted meeting artifacts

Usage: Reference ~/knowledge/ files for context on deals, people, decisions, and Cere positioning.

---

## MCP & Integrations

### Active MCPs

| MCP | Use For | Status |
|-----|---------|--------|
| Notion | Databases, wikis, tickets | Active |
| Google Drive | Docs, sheets, decks | Active |
| Slack | Messages, channels, threads | Configured |
| Gmail | Email threads, search | Configured |

Note: Slack/Gmail require restart to activate. Lemlist available for outreach work.

### Notion Databases
- Engineering Tickets: 2ecd8000-83d6-80b6-9d20-eb6b99c64d66
- Properties: Name, Status, Priority, Type, Estimate, Labels, PRD Link, Acceptance Criteria

---

## Quick Commands

"Create a PRD for [feature]"
"Analyze this research data"
"Generate tickets from [PRD file]"
"Create a deck from this PRD"
"Update PRD from these meeting notes"
"Summarize this for Fred/the board"
"What's blocking [project]?"

---

---

## HR Funnel Monitor (Live System)

### Endpoints
- **Dashboard**: https://hr-funnel-monitor-production.up.railway.app/v3
- **Repo**: cere-io/HR-2026-E2E (auto-deploy from main)
- **Notion DB**: `112d8000-83d6-805c-a3aa-e21ec2741ba7`

### Slack Alerts
| Alert | Schedule | Target |
|-------|----------|--------|
| Fred Queue Ping | 9am Mon-Fri | Fred DM |
| Stale Candidates | 10am Mon-Fri | #cere-hiring-internal |
| Hot Candidate (H≥9) | Hourly | #cere-hiring-internal |
| System Health | 9am + 15min if broken | #cere-hiring-internal |

### Key Insight (from Fred)
> "Whatever system you build, if there is no one using it quickly, it's not gonna get improved. Don't just show them — write instructions so they can run it themselves."

**Push > Pull**: Fred doesn't check dashboards. He wants Slack DMs with direct Notion links. Build alerts that come to people, not pages they have to visit.

---

---

## Zwolle Real Estate Search

Active search for rental property in Zwolle (family with 2 young kids).

| | |
|---|---|
| Agent | `~/clawd/agents/realestate/` |
| Cron | 9:00 & 18:00 daily |
| Criteria | 2+ bedrooms, €1500-2500/month, Zwolle/Deventer |
| Sites | Pararius ✅, Funda (browser), Huurwoningen.nl |

Makelaars contacted: Edwin van Vilsteren, Holtland, de Graaf van Vilsteren, Admono, ten Hag, Wender, Karssen

---

## Personal Automations

| Cron | Schedule | Purpose |
|------|----------|---------|
| morning-briefing | 7:30 Mon-Fri | Weather, calendar, email, HR status |
| zwolle-rentals | 9:00 & 18:00 | Rental property search |
| news-monitor | 12:00 & 20:00 | AI/Tech/Crypto/NL news digest |
| week-ahead-briefing | 20:00 Sunday | Week overview |
| weekly-review | 19:00 Sunday | Week reflection |
| daily-security-audit | 9:00 daily | Security checks |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v2.5 | 2026-01-26 | Added Zwolle real estate search, personal automations, news monitor |
| v2.4 | 2026-01-26 | Added HR Funnel Monitor system, Slack alerts, Fred's adoption philosophy |
| v2.3 | 2026-01-19 | Fixed positioning (killed Lambda/Databricks comparisons), updated knowledge base |
| v2.2 | 2026-01-19 | Added Slack and Gmail MCPs |
| v2.1 | 2026-01-19 | Added ~/knowledge/ base for meeting insights, deals, people |
| v2.0 | 2026-01-18 | Restructured with Do/Don't rules, added technical prefs |
| v1.0 | 2025-Q4 | Initial version with context and skills |

---

*For machine-specific settings, see `~/.claude/CLAUDE.local.md`*
