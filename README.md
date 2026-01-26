# Mart's Clawd Workspace 🤖

Personal AI assistant workspace powered by Clawdbot + Claude.

## Structure

```
~/clawd/
├── AGENTS.md          # How Claudemart operates
├── SOUL.md            # Personality and guidelines
├── USER.md            # About Mart
├── MEMORY.md          # Long-term memory
├── CLAUDE.md          # Claude Code sync file
├── TOOLS.md           # Local tool notes
├── IDENTITY.md        # Who is Claudemart
├── HEARTBEAT.md       # Periodic check config
│
├── agents/            # Automation agents
│   └── realestate/    # Zwolle rental search agent
│
├── automations/       # Cron job scripts
│
├── docs/              # Documentation & PRDs
│   └── *.md           # Various docs
│
├── memory/            # Daily logs
│   └── YYYY-MM-DD.md  # Daily memory files
│
├── research/          # Research output from sub-agents
│
├── media/             # Audio/video files
│
├── skills/            # Custom Clawdbot skills
│   └── aesthetic-image-gen/
│
└── cere-hr-service/   # HR Funnel Monitor (deployed to Railway)
```

## Active Automations (Cron Jobs)

| Name | Schedule | Description |
|------|----------|-------------|
| morning-briefing | 7:30 Mon-Fri | Weather, calendar, email, HR status |
| zwolle-rentals | 9:00 & 18:00 | Huurwoning search in Zwolle |
| news-monitor | 12:00 & 20:00 | AI/Tech/Crypto/Gaming/NL news |
| week-ahead-briefing | 20:00 Sunday | Week overview + calendar + prep |
| weekly-review | 19:00 Sunday | Week reflection |
| daily-security-audit | 9:00 daily | Security checks |
| linkedin-stalker-max | Hourly 8-22 | Profile view (stealth) |
| heinrich-hidde-voicememo | 9:00 Mon-Fri | Daily voice memo to Hidde |

## Key Integrations

- **Telegram** - Primary chat interface
- **WhatsApp** - Secondary + voice memos
- **Google Workspace** - Calendar, Gmail, Drive
- **Notion** - Databases & docs (Cere)
- **Slack** - Cere team communication
- **Railway** - HR service hosting

## Commands

Ask Claudemart naturally. Some examples:
- "Check for new Zwolle rentals"
- "What's on my calendar this week?"
- "Send a message to [person] on WhatsApp"
- "Research [topic]"
- "Summarize my emails"

## Memory System

- **Daily logs**: `memory/YYYY-MM-DD.md` - Raw notes per day
- **Long-term**: `MEMORY.md` - Curated important context
- **Heartbeat state**: `memory/heartbeat-state.json` - Check timestamps

## Ownership

Maintained by Claudemart (AI) for Mart (human).
Last updated: 2026-01-26
