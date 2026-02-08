# Meeting Actions Extractor

Automatically extract action items, decisions, and follow-ups from meeting notes.

## Quick Start

```bash
# Process meeting notes
./extract-actions.sh notes.txt

# From clipboard
pbpaste | ./extract-actions.sh -

# Save to file
./extract-actions.sh notes.txt -o ~/actions/2024-01-15-standup.md

# With JSON output
./extract-actions.sh notes.txt --json
```

## Installation

1. Copy this folder to your workspace
2. Make script executable: `chmod +x extract-actions.sh`
3. Ensure `clawdbot` is available in PATH

## Usage

```
Usage: extract-actions.sh [OPTIONS] <input>

Arguments:
  <input>           Input file path, or '-' for stdin

Options:
  -o, --output      Output file path (default: stdout)
  --json            Output JSON instead of markdown
  --granola         Parse as Granola export format
  --event <name>    Add calendar event context
  --date <date>     Meeting date (default: today)
  --notify          Send notification with summary
  -h, --help        Show this help
```

## Examples

### Raw Meeting Notes
```bash
cat <<EOF | ./extract-actions.sh -
Standup 15 jan
- Jan werkt aan API refactor, klaar vrijdag
- Marie moet designs reviewen voor Sarah
- Bug in checkout moet voor release gefixt (Piet)
EOF
```

### Granola Export
```bash
./extract-actions.sh --granola ~/Downloads/meeting-export.json
```

### With Notification
```bash
./extract-actions.sh meeting.txt --notify
# Sends summary to Telegram
```

## Output

### Markdown (default)
```markdown
# Action Items: Standup
Date: 2024-01-15

## Action Items

- [ ] **API refactor voltooien** @Jan 📅 2024-01-19
- [ ] **Designs reviewen** @Marie 📅 2024-01-17
- [ ] **Checkout bug fixen** @Piet 📅 Before release

## Decisions

(none extracted)

## Follow-ups

(none extracted)
```

### JSON
```json
{
  "meeting": {"title": "Standup", "date": "2024-01-15"},
  "actions": [...],
  "decisions": [],
  "followups": []
}
```

## Integration

### Clawdbot Cron
```bash
# Weekly review every Friday at 17:00
clawdbot cron add "0 17 * * 5" \
  --label "action-review" \
  --prompt "Review action items in ~/actions/, summarize open items"
```

### Watch Folder
```bash
# Auto-process new notes (requires fswatch)
fswatch -o ~/meetings/inbox | while read; do
  for f in ~/meetings/inbox/*.txt; do
    ./extract-actions.sh "$f" -o ~/actions/$(date +%Y-%m-%d)-$(basename "$f" .txt).md
    mv "$f" ~/meetings/processed/
  done
done
```

## Customization

Edit `prompts/extract-actions.md` to customize:
- Output format
- Language (NL/EN)
- Additional fields
- Priority inference rules

## Files

```
meeting-actions/
├── extract-actions.sh      # Main script
├── prompts/
│   ├── extract-actions.md  # Prompt template
│   └── granola-parser.md   # Granola-specific prompt
├── examples/
│   ├── raw-notes.txt       # Example input
│   └── output.md           # Example output
└── README.md               # This file
```
