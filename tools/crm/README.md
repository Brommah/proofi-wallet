# Personal CRM

A lightweight, local-first contact relationship manager.

## Quick Start

```bash
# Make executable (one time)
chmod +x tools/crm/crm

# Add to PATH (optional, add to ~/.zshrc)
export PATH="$PATH:$HOME/clawd/tools/crm"

# Or use directly
./tools/crm/crm help
```

## Usage

### View Contacts
```bash
crm list                    # All contacts
crm list --tag friend       # Filter by tag
crm list --stale 30         # Not contacted in 30+ days
crm show "Fred Jin"         # Full details
```

### Add & Edit
```bash
crm add "Jane Doe" --company "Startup X" --role "CEO" --tags "founder,investor"
crm edit "Jane" --email "jane@startup.com" --linkedin "https://linkedin.com/in/jane"
crm delete "Jane"
```

### Track Interactions
```bash
crm log "Fred Jin" "Caught up over coffee, discussed AI projects"
crm followup "Fred Jin" 2025-02-15
```

### Discovery
```bash
crm search "startup"        # Search all fields
crm stale 14                # Who haven't I talked to recently?
crm upcoming                # What follow-ups are due?
crm birthdays 30            # Any birthdays coming up?
```

### Maintenance
```bash
crm backup                  # Create timestamped backup
crm export csv > contacts.csv
crm tags                    # List all tags with counts
```

## Data Location

- **Database:** `tools/crm/contacts.json`
- **Backups:** `tools/crm/backup/`

## Integration with Clawdbot

Just ask questions like:
- "When did I last talk to Fred?"
- "Who should I follow up with?"
- "Show me my investor contacts"

Clawdbot can run `crm` commands or read the JSON directly.

## Automation Ideas

### Daily Follow-up Check (cron)
```bash
clawdbot cron add "crm-followups" "0 9 * * *" "crm upcoming"
```

### Weekly Stale Contact Report
```bash
clawdbot cron add "crm-stale" "0 10 * * 1" "crm stale 14"
```

### Birthday Reminders
```bash
clawdbot cron add "crm-birthdays" "0 9 * * *" "crm birthdays 7"
```
