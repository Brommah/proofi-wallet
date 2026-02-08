# Meeting Notes to Action Items Automation

## Overview

Een systeem dat meeting notes automatisch verwerkt naar gestructureerde action items met owners, deadlines en follow-ups.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Input Sources  │────▶│  Processing      │────▶│  Output/Storage │
│                 │     │                  │     │                 │
│ • Raw notes     │     │ • Claude prompt  │     │ • Markdown file │
│ • Granola       │     │ • Extraction     │     │ • Calendar      │
│ • Transcripts   │     │ • Validation     │     │ • Notifications │
│ • Calendar      │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Input Formats

### 1. Raw Meeting Notes
Ongestructureerde tekst van hand-getypte notities:
```
Standup 15 jan
- Jan werkt aan API refactor, klaar vrijdag
- Marie moet designs reviewen voor Sarah
- Bug in checkout moet voor release gefixt (Piet)
```

### 2. Granola Exports
Gestructureerde exports van Granola app (JSON of Markdown):
```json
{
  "title": "Weekly Sync",
  "date": "2024-01-15",
  "participants": ["Jan", "Marie", "Piet"],
  "transcript": "...",
  "summary": "..."
}
```

### 3. Voice Transcripts
Output van whisper/transcriptie services:
```
Speaker 1: Okay, dus Jan pakt de API refactor op...
Speaker 2: Ja, en ik review de designs voor vrijdag.
```

### 4. Calendar Event + Notes
Combinatie van calendar metadata met meeting notes:
```
Event: Project Review
Date: 2024-01-15 10:00
Attendees: jan@company.com, marie@company.com
Notes: [attached notes]
```

## Output Format

### Markdown Action Items (Primary)
```markdown
# Action Items: [Meeting Title]
Date: 2024-01-15
Participants: Jan, Marie, Piet

## Action Items

- [ ] **API refactor voltooien** @Jan 📅 2024-01-19
  - Context: Besproken in standup
  - Priority: High

- [ ] **Designs reviewen** @Marie 📅 2024-01-17
  - For: Sarah's feature
  - Priority: Medium

## Decisions

- ✅ Release datum blijft 1 februari
- ✅ Design system wordt Angular-based

## Follow-ups

- [ ] Check-in over API progress @Jan 📅 2024-01-17
```

### JSON Format (For Integrations)
```json
{
  "meeting": {
    "title": "Weekly Sync",
    "date": "2024-01-15",
    "participants": ["Jan", "Marie", "Piet"]
  },
  "actions": [
    {
      "task": "API refactor voltooien",
      "owner": "Jan",
      "due": "2024-01-19",
      "priority": "high",
      "context": "Besproken in standup"
    }
  ],
  "decisions": [
    "Release datum blijft 1 februari"
  ],
  "followups": [
    {
      "task": "Check-in over API progress",
      "owner": "Jan", 
      "due": "2024-01-17"
    }
  ]
}
```

## Implementation

### Directory Structure
```
tools/meeting-actions/
├── extract-actions.sh      # Main wrapper script
├── prompts/
│   ├── extract-actions.md  # Claude prompt template
│   └── granola-parser.md   # Granola-specific prompt
├── examples/
│   ├── raw-notes.txt       # Example input
│   └── output.md           # Example output
└── README.md               # Usage documentation
```

### Usage

```bash
# Basic usage
./extract-actions.sh meeting-notes.txt

# With output file
./extract-actions.sh meeting-notes.txt -o actions/2024-01-15-standup.md

# From Granola export
./extract-actions.sh --granola export.json

# From clipboard
pbpaste | ./extract-actions.sh -

# With calendar context
./extract-actions.sh notes.txt --event "Weekly Sync 2024-01-15"
```

## Storage & Tracking

### Recommended Structure
```
workspace/
└── actions/
    ├── 2024/
    │   ├── 01/
    │   │   ├── 2024-01-15-standup.md
    │   │   ├── 2024-01-15-project-review.md
    │   │   └── index.md  # Monthly overview
    │   └── ...
    ├── active.md         # Current open actions
    └── archive/          # Completed items
```

### Tracking Completion

1. **Manual checkbox toggle** in markdown files
2. **Weekly review** via cron job that collates open items
3. **Integration** met task managers (optional):
   - Todoist API
   - Linear API
   - GitHub Issues

### Review Cadence

| Review Type | Frequency | Content |
|-------------|-----------|---------|
| Daily scan | Morning | Open items for today |
| Weekly review | Friday | All open items, overdue check |
| Monthly archive | 1st | Move completed to archive |

## Automation Options

### 1. Clawdbot Cron (Recommended)
```bash
# Weekly action review - Fridays at 17:00
clawdbot cron add "0 17 * * 5" \
  --label "action-review" \
  --prompt "Review all open action items in actions/, summarize status, flag overdue"
```

### 2. Heartbeat Integration
Add to `HEARTBEAT.md`:
```markdown
## Weekly (Friday afternoon)
- [ ] Review action items in actions/active.md
- [ ] Flag any overdue items
- [ ] Send summary if requested
```

### 3. Watch Folder
Monitor a folder for new meeting notes and auto-process:
```bash
fswatch -o ~/meetings/incoming | xargs -I{} ./extract-actions.sh ~/meetings/incoming/*.txt
```

## Notification Options

### Telegram (via Clawdbot)
```bash
# In extract-actions.sh
clawdbot message send "📋 Nieuwe action items uit $MEETING_TITLE: ..."
```

### Slack Webhook
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"New action items from meeting"}' \
  $SLACK_WEBHOOK_URL
```

### Email (via sendmail/mailx)
```bash
mail -s "Action Items: $MEETING_TITLE" user@company.com < actions.md
```

## Calendar Integration

### Create Follow-up Events
Extract dates from action items and create calendar events:
```bash
# Using gcalcli
gcalcli add --title "Follow-up: API Review" \
  --when "2024-01-17 10:00" \
  --duration 30 \
  --reminder 1d
```

### Link to Original Meeting
Include meeting reference in action items:
```markdown
- [ ] **Task** @Owner 📅 Due
  - Meeting: [Weekly Sync](calendar://event/abc123)
```

## Best Practices

### For Accurate Extraction

1. **Use names consistently** - "Jan" niet "J." of "Jan de Vries"
2. **Explicit deadlines** - "vrijdag" → "vrijdag 19 januari"
3. **Clear ownership** - "Jan pakt X op" niet "iemand moet X doen"
4. **Action verbs** - "review", "fix", "create", "send"

### For Reliable Processing

1. **Review output** - AI kan context missen
2. **Add missing details** - Dates, priorities handmatig toevoegen
3. **Regular cleanup** - Archive completed items
4. **Version control** - Git voor action files

## Future Enhancements

- [ ] Slack bot integration voor inline action capture
- [ ] Auto-assignment based on expertise mapping
- [ ] Priority inference from language ("ASAP", "blocker")
- [ ] Recurring meeting templates
- [ ] Burndown tracking per sprint/week
