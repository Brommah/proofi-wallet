# Reading List Manager met AI Summaries

A system for managing reading lists with AI-powered summaries, categorization, and search.

## Features

### Core Functionality
- **Save articles/papers/books** - Store URLs with metadata
- **Categorize by topic** - AI-suggested tags + manual categories
- **Priority/urgency** - P1-P3 priority levels
- **Progress tracking** - Unread → Reading → Completed → Archived
- **AI-generated summaries** - One-paragraph overview
- **Key takeaways extraction** - Bullet point insights
- **Search across saved items** - Full-text + tag search

### Categories
- `ai` - AI/ML papers and articles
- `crypto` - Crypto/Web3 content
- `business` - Strategy and business
- `tech` - General technology
- `research` - Academic papers
- `tools` - Developer tools and utilities

### Priority Levels
| Priority | Meaning | Review Frequency |
|----------|---------|------------------|
| P1 | Must read ASAP | Daily |
| P2 | Important, this week | Weekly |
| P3 | Interesting, when time allows | Monthly |

## Implementation

### File Structure
```
tools/reading-list/
├── reading-list.json      # Main data store
├── rl.sh                  # CLI wrapper
├── add.sh                 # Add new item
├── summarize.sh           # Generate AI summary
├── list.sh                # List/filter items
├── search.sh              # Search items
└── bookmarklet.js         # Browser bookmarklet
```

### Data Model
```json
{
  "id": "uuid",
  "url": "https://...",
  "title": "Article Title",
  "source": "arxiv.org",
  "added": "2025-01-15T10:30:00Z",
  "status": "unread|reading|completed|archived",
  "priority": "P1|P2|P3",
  "categories": ["ai", "research"],
  "tags": ["transformers", "attention"],
  "summary": "One paragraph AI-generated summary...",
  "keyTakeaways": [
    "Point 1",
    "Point 2"
  ],
  "relatedReading": ["id1", "id2"],
  "notes": "Personal notes...",
  "estimatedReadTime": 15,
  "completedAt": null
}
```

## Workflow

### Adding Items

1. **Via CLI:**
   ```bash
   ./rl.sh add "https://arxiv.org/abs/..." --priority P1 --category ai
   ```

2. **Via Bookmarklet:**
   Click bookmarklet → copies URL to clipboard with prompt

3. **Via RSS (future):**
   Auto-import from configured feeds

### AI Summary Workflow

```
URL → Fetch Content → Generate Summary → Extract Key Points → Suggest Tags
```

1. **Fetch content** - Use `web_fetch` to get readable text
2. **Generate summary** - Claude generates 1-paragraph summary
3. **Extract key points** - 3-5 bullet points
4. **Tag extraction** - Suggest relevant tags
5. **Related reading** - Match against existing items

### Daily Review

1. Check P1 items (must read today)
2. Review completed items from yesterday
3. Archive old completed items
4. Add new items from inbox

## Usage Examples

```bash
# Add new article
./rl.sh add "https://example.com/article" -p P2 -c ai

# List unread P1 items
./rl.sh list --status unread --priority P1

# Search by keyword
./rl.sh search "transformer attention"

# Mark as completed
./rl.sh complete <id>

# Generate summary for item
./rl.sh summarize <id>

# Show stats
./rl.sh stats
```

## Integration with Clawdbot

The reading list can be accessed via natural language:

- "Add this article to my reading list"
- "What's on my reading list for today?"
- "Summarize the top article"
- "Show me AI papers I haven't read"

## Bookmarklet

Install in browser bookmarks bar:
```javascript
javascript:(function(){prompt('Reading List - Copy URL:',location.href)})();
```

Or the advanced version that generates an add command.

## Future Enhancements

- [ ] RSS feed integration
- [ ] Notion sync
- [ ] Weekly digest email
- [ ] Reading time tracking
- [ ] Spaced repetition for key concepts
- [ ] Export to Obsidian/Roam
