---
# MEMORY.md - Structured Long-term Memory
# Format: YAML frontmatter + Markdown sections
# This file is designed to be parsed by local AI agents

version: 2
updated: 2026-02-08
owner: mart
---

# 👤 OWNER

```yaml
name: Martijn Broersma
alias: Mart
location: Zwolle, Nederland
timezone: Europe/Amsterdam
languages: [nl, en]
communication_style: direct, no fluff, action over questions
```

# 👨‍👩‍👧‍👦 FAMILY

```yaml
partner:
  name: Charlotte
  phone: "+31623288851"
  work: Regionaal Manager, Christoforus Kinderopvang, Deventer

children:
  - age: 4
  - age: 6

housing:
  status: searching
  location_preference: [Zwolle, Deventer]
  budget: 1500-2500 EUR/month
  requirements: [2-3 bedrooms, garden preferred]
```

# 💼 WORK

```yaml
company: Cere Network / Sev.ai
role: Operations / Automation Lead
focus_areas:
  - HR automation (hiring pipeline)
  - Agent development (Proofi)
  - Team tooling adoption

key_projects:
  - name: HR Funnel Monitor v3
    status: live
    url: https://hr-funnel-monitor-production.up.railway.app/v3
    
  - name: Proofi Agents
    status: in_development
    description: Privacy-preserving AI agents with capability tokens
```

# 👥 PEOPLE

## Fred Jin
```yaml
role: CTO at Cere
relationship: manager/stakeholder
preferences:
  - Push notifications over dashboards
  - Slack DMs with direct action links
  - Clear action items, not reports
key_quote: "If there's no one using it quickly, it won't improve"
```

## Valery (HR)
```yaml
role: HR team
works_with: Lynn
needs: automated tracking, less manual work
```

## Hidde Roeloffs Valk
```yaml
role: Business contact
phone: "+31628197347"
weekly_ritual: Heinrich voice memo (Mon 9:00)
```

## Valery (vriendin)
```yaml
relationship: close friend/colleague
vibe: dark humor
quotes:
  - "Welcome to the hol"
  - "questionably upbeat"
  - "concentratiekamp met schep"
```

# 🧠 LESSONS LEARNED

## Building vs Adopting
> Whatever system you build, if there is no one using it as quickly as possible, it's not gonna get improved very quickly.

**Takeaway:** Document everything so others can run it without hand-holding.

## Push > Pull
> Fred doesn't want to check dashboards. He wants push notifications with direct action links.

**Takeaway:** Build alerts that come to people, not dashboards they must visit.

## Working ≠ Done
> Just because something's working doesn't mean it's done. Compare to best practices, improve.

**Takeaway:** First version is just the start. Peer review, iterate, ship again.

# 🔄 ACTIVE AUTOMATIONS

| Name | Schedule | Purpose |
|------|----------|---------|
| morning-briefing | 7:30 Mon-Fri | Daily briefing |
| zwolle-rentals | 9:00 & 18:00 | Huurwoning check |
| heinrich-voice | 9:00 Mon-Fri | Voice memo to Hidde |
| hr-alerts | 9:00 Mon-Fri | Fred queue + stale candidates |

# 🎯 CURRENT PRIORITIES

```yaml
this_week:
  - Proofi agent SDK completion
  - HR funnel adoption by team
  - Housing search automation

blockers:
  - Diana payment resolution (overdue)
  - DAO directors (due Feb 14)
```

# ⚙️ PREFERENCES

```yaml
tools:
  primary_interface: Telegram (Clawdbot)
  secondary: WhatsApp
  development: Claude Code
  workspace: ~/clawd

behavior:
  - Do things, don't ask permission for obvious actions
  - Auto-sync learnings to shared docs
  - Be proactive
  - Document for others
```

---
*This file is structured for machine parsing. Daily notes are in memory/*.md*
