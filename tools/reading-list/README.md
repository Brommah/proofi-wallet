# Reading List Manager

A CLI tool for managing reading lists with AI-powered summaries.

## Quick Start

```bash
# Add an article
./rl.sh add "https://example.com/article" -p P1 -c ai -T "Article Title"

# List unread items
./rl.sh list

# List P1 items only
./rl.sh list --priority P1

# Search
./rl.sh search "transformer"

# Mark as reading
./rl.sh reading <id>

# Mark complete
./rl.sh complete <id>

# Show stats
./rl.sh stats
```

## Clawdbot Integration

Ask Claude to:
- "Add this article to my reading list: <url>"
- "What's on my reading list?"
- "Summarize the top article in my reading list"
- "Show me unread AI papers"
- "Mark <id> as complete"

## File Structure

- `rl.sh` - Main CLI entry point
- `reading-list.json` - Data store
- `add.sh` - Add new items
- `list.sh` - List/filter items
- `search.sh` - Search items
- `summarize.sh` - Generate AI summaries (via Clawdbot)
- `update-summary.sh` - Update item with summary
- `bookmarklet.js` - Browser bookmarklet code

## Categories

- `ai` - AI/ML papers and articles
- `crypto` - Crypto/Web3 content
- `business` - Strategy and business
- `tech` - General technology
- `research` - Academic papers
- `tools` - Developer tools

## Priority Levels

- `P1` - Must read ASAP (daily review)
- `P2` - Important (weekly review)
- `P3` - When time allows (monthly)
