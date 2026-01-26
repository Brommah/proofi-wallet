# MEMORY.md - Long-term Memory

> Wat ik onthoud over Mart en ons werk samen.

## Over Mart

- **Locatie:** Zwolle, Nederland
- **Communicatiestijl:** Direct, geen fluff. Liever actie dan vragen.
- **Taal:** Nederlands/Engels door elkaar

## Belangrijke Preferences

### Hoe ik moet werken
- **Doe dingen** — niet teveel vragen, gewoon fixen
- **Auto-sync aan** — learnings gaan naar CLAUDE.md zodat Claude Code ook meekomt
- **Proactief** — als iets logisch is, doe het
- **Document for others** — Fred's lesson: "If you show it, write instructions so others can run it themselves"

### Tech Setup
- Telegram als hoofd-interface (Clawdbot)
- WhatsApp ook gekoppeld (+31611875951, selfChatMode)
- Claude Code voor development
- Gedeelde workspace: `~/clawd`

## Mensen

### Fred Jin
- CTO/Hiring Manager at Cere
- Bottleneck in hiring pipeline - needs clear action items, not dashboards to dig through
- Prefers Slack DMs with direct Notion links over checking dashboards
- Key insight: "Working doesn't mean done - need peer review, iteration, team adoption"

### Valery (Val)
- HR team, works with Lynn on candidate pipeline
- Frustrated with broken systems (Anton's webhook code)
- Needs: clear status fields, automated tracking, less manual work

### Lynn
- HR lead, manages candidate pipeline with Val
- Has manual dashboards, needs automation
- Key contact for Notion status field changes

### Bren
- Needs to learn Clawdbot/AI tooling - Fred's priority
- "Otherwise he'll never learn" - can't just show him, need written instructions
- Guinea pig for team adoption

### Patrick Nicholson
- Outbound campaigns - has credentials and campaign history
- Transitioning knowledge to Mart + Bren
- Tomorrow: walkthrough with Nico session

### Valery (vriendin)
- Belangrijke collega/vriendin
- Dark humor, beschrijft haar werk als "concentratiekamp met schep"
- Beste quotes: "Welcome to the hol", "questionably upbeat"
- WhatsApp contact

### Max Verploegen  
- AI consultant
- Mart ging 16 jan met hem eten

### Hidde Roeloffs Valk
- Contact voor business/networking
- WhatsApp: +31628197347
- Weekly voice memo ontvanger (Heinrich character, maandag 9:00)

## Cere/Sev.ai Context

### Entities
- **Cere Inc** — No financial transactions through this anymore
- **Sev.ai** — New entity, needs crypto accounts (Coinbase/crypto.com/Gemini)
- **Panama Foundation** — Diana contact, BVI sign-off pending (overdue since Jan 23)
- **DAO** — Directors expired Dec 12, need new board by Feb 14

### Key Blockers (from FAQ)
- Diana payment resolution with Can (Rocky) - OVERDUE
- IP mapping for contribution agreement - due Jan 30
- GA for new directors - due Feb 14
- Execute transfers - due Feb 16

## Automation Setup

### HR Funnel Monitor v3 ✅ LIVE (2026-01-26)
- **URL**: https://hr-funnel-monitor-production.up.railway.app/v3
- **Repo**: cere-io/HR-2026-E2E (auto-deploy from main)
- **Notion DB**: `112d8000-83d6-805c-a3aa-e21ec2741ba7`

### Slack Alerts Configured ✅
- **Fred DM**: `SLACK_FRED_DM_WEBHOOK` — 9am daily ping
- **#cere-hiring-internal**: `SLACK_WEBHOOK_URL` — stale alerts, hot candidates, system health

### Cron Schedules
| Alert | Time | Target |
|-------|------|--------|
| Fred Queue Ping | 9am Mon-Fri | Fred DM |
| Stale Candidates | 10am Mon-Fri | #hiring |
| Hot Candidate (H≥9) | Hourly | #hiring |
| System Health | 9am + every 15min if broken | #hiring |
| GitHub Health Check | Every 30min | GitHub Actions |

### GitHub Secrets Set
- `SERVICE_URL` = Railway URL
- `SLACK_WEBHOOK_URL` = #hiring webhook
- `GITHUB_TOKEN` = Fine-grained PAT for Actions API

---

## Lessons Learned (2026-01-26)

### On Building vs Adopting
> "Whatever system you build, if there is no one using it as quickly as possible, it's not gonna get improved very quickly." — Fred

The goal isn't cool tech. The goal is team adoption. Document everything so others can run it without hand-holding.

### On Dashboards
Fred doesn't want to check dashboards. He wants **push notifications** with direct action links. The Slack DM with Notion URLs is 10x more valuable than a fancy dashboard he'll never open.

### On "Done"
> "Just because something's working doesn't mean it's done. We need to very quickly settle, compare to best practices, improve." — Fred

Working ≠ Done. Need peer review, benchmarking, continuous improvement.

### On Notion Data
- Notion API pagination returns old records first — need to filter aggressively
- "Promising (talent pool)" and "Week+ Silence" are NOT active pipeline
- Human Score matters more than AI Score for Fred's queue
- Fred's Feedback field: Pending/Ongoing Evaluation/Pending Review = Fred's action items

### On Debugging
- Railway CLI docker socket issue: caused by ~/.docker outside project
- GitHub Actions failing: missing repo secrets (SERVICE_URL, SLACK_WEBHOOK_URL)
- Always check the actual error logs, not just "it's failing"

---

## Zwolle Woningzoektocht (2026-01-26)

### Gezinssituatie
- **Mart & Charlotte** (partner)
- **Kinderen**: 2 dochters (4 en 6 jaar)
- **Charlotte's werk**: Regionaal Manager bij Christoforus Kinderopvang, Deventer
- **Charlotte's contact**: +31 6 23 28 88 51

### Zoekcriteria
- Locatie: Zwolle of Deventer omgeving
- Budget: €1.500 - €2.500/maand
- Minimaal 2-3 slaapkamers
- Liefst met tuin (jonge kinderen)

### Acties ondernomen
- Real estate agent gebouwd (agents/realestate/)
- 7 verhuurmakelaars gemaild: Edwin van Vilsteren, Holtland, de Graaf van Vilsteren, Admono, ten Hag, Wender, Karssen
- Cron 2x per dag: Pararius + Funda check

### Favoriete woningen tot nu toe
- Bilderdijkstraat (€2.044, 5 slpk)
- Stellingmolen (€1.750, 4 slpk)

---

## Active Automations (2026-01-26)

| Cron | Schedule | Purpose |
|------|----------|---------|
| morning-briefing | 7:30 Mon-Fri | Daily briefing |
| zwolle-rentals | 9:00 & 18:00 | Huurwoning check |
| news-monitor | 12:00 & 20:00 | Nieuws digest |
| week-ahead-briefing | 20:00 Sunday | Week planning |
| weekly-review | 19:00 Sunday | Week reflection |
| daily-security-audit | 9:00 daily | Security checks |
| linkedin-stalker-max | Hourly 8-22 | Profile visits |
| heinrich-hidde-voicememo | 9:00 Mon-Fri | Voice memo to Hidde |

---

## Workspace Organization (2026-01-26)

- Disk cleaned: 40GB vrijgemaakt (25 jan)
- TTS: OpenAI voice "alloy" geconfigureerd
- Audio files → media/ folder
- README.md toegevoegd aan workspace
- Sub-agents draaien research overnight

---

*Dit bestand wordt bijgewerkt als ik belangrijke dingen leer.*
