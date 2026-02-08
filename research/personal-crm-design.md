# Personal CRM Design Document

## Overview

A lightweight, local-first CRM for tracking personal and professional contacts. Built as a JSON database with a Bash CLI tool for easy management.

## Why JSON + CLI?

After evaluating the options:

| Option | Pros | Cons |
|--------|------|------|
| **Notion** | Beautiful UI, flexible | Cloud dependency, API complexity, subscription |
| **Airtable** | Powerful, relational | Cloud, free tier limits, overkill |
| **Google Sheets** | Accessible, collaborative | Cloud, no proper CLI, limited structure |
| **JSON + CLI** | Local, private, scriptable, portable | No fancy UI |

**Winner: JSON + CLI** because:
- 🔒 **Private** - Data stays on your machine
- ⚡ **Fast** - No API calls, instant access
- 🔧 **Hackable** - Easy to extend, integrate with Clawdbot
- 📦 **Portable** - One file, version controllable
- 🤖 **Automatable** - Works with cron, scripts, and Clawdbot heartbeats

## Data Schema

```json
{
  "contacts": [
    {
      "id": "uuid",
      "name": "Full Name",
      "company": "Company Name",
      "role": "Job Title",
      "how_we_met": "Context of first meeting",
      "email": "email@example.com",
      "phone": "+31...",
      "linkedin": "https://linkedin.com/in/...",
      "twitter": "https://twitter.com/...",
      "tags": ["friend", "investor", "tech"],
      "birthday": "1990-05-15",
      "last_interaction": "2025-01-15",
      "next_followup": "2025-02-01",
      "notes": [
        {
          "date": "2025-01-15",
          "content": "Had coffee, discussed startup ideas"
        }
      ],
      "created_at": "2025-01-01",
      "updated_at": "2025-01-15"
    }
  ],
  "tags": ["friend", "investor", "tech", "mentor", "client"],
  "metadata": {
    "version": "1.0",
    "last_backup": "2025-01-15"
  }
}
```

## CLI Commands

```bash
# Core operations
crm add "Name" --company "X" --role "Y" --tags "a,b"
crm list [--tag TAG] [--stale DAYS]
crm show <name-or-id>
crm edit <name-or-id> --field value
crm delete <name-or-id>

# Interaction tracking
crm log <name> "Note about interaction"
crm followup <name> <date>

# Discovery
crm search <query>
crm stale [--days 30]          # Contacts without recent interaction
crm upcoming                    # Follow-ups due soon
crm birthdays [--days 30]       # Upcoming birthdays

# Maintenance
crm export --format csv|json
crm backup
crm tags                        # List all tags
```

## Automation Ideas

### 1. Stale Contact Reminders
Add to `HEARTBEAT.md`:
```
- Check for contacts not reached in 30+ days
```

### 2. Birthday Reminders (Cron)
```bash
# Daily at 9 AM: check for birthdays this week
clawdbot cron add "birthday-check" "0 9 * * *" \
  "crm birthdays --days 7"
```

### 3. Follow-up Reminders (Cron)
```bash
# Daily: check for due follow-ups
clawdbot cron add "followup-check" "0 10 * * *" \
  "crm upcoming --due"
```

### 4. Future: Email Integration
Could parse sent emails and auto-log interactions (requires email skill integration).

### 5. Future: Calendar Sync
Detect meetings with contacts and auto-update `last_interaction`.

## File Locations

```
tools/crm/
├── crm              # Main CLI script
├── contacts.json    # The database
├── README.md        # Usage documentation
└── backup/          # Automatic backups
```

## Usage Examples

```bash
# Add a new contact
crm add "Fred Jin" --company "Unknown" --tags "friend,startup" \
  --how-met "Met through startup scene"

# Log an interaction
crm log "Fred Jin" "Caught up over coffee, discussed AI trends"

# Set a follow-up
crm followup "Fred Jin" "2025-02-15"

# Find stale contacts
crm stale --days 30

# Search
crm search "startup"
```

## Integration with Clawdbot

The CRM can be queried directly by Clawdbot:
- "When did I last talk to Fred Jin?"
- "Who should I follow up with?"
- "Any birthdays coming up?"

Just run the CLI commands or parse the JSON directly.
