# Zwolle Real Estate Search Agent 🏠

Searches Dutch rental websites for family-friendly properties in Zwolle.

## Version 2.0 - Major Update

See [CHANGELOG.md](CHANGELOG.md) for full details.

### Key Features

- **4 data sources**: Pararius, Huurwoningen.nl, DirectWonen, VBO Makelaars
- **Smart filtering**: 2-3 bedrooms, €1500-2500, garden preference
- **Cross-source deduplication**: Same property on multiple sites? You see it once
- **Scoring system**: Properties ranked 0-100 based on family preferences
- **Better error handling**: Detailed logging, graceful failures
- **Rich alerts**: Telegram-ready formatting with scores and icons

## Family Criteria

| Preference | Value | Score Weight |
|------------|-------|--------------|
| Bedrooms | 2-4 (ideal: 3) | 25 pts |
| Garden | Yes preferred | 25 pts |
| Price | €1500-2500/month | 20 pts |
| Area | Bigger = better | 15 pts |
| Location | Zwolle + region | 15 pts |

## Quick Start

### Option 1: Ask Clawdbot (Recommended)
```
"Zoek naar nieuwe huurwoningen in Zwolle"
"Check de woningzoeker"
"Zijn er nieuwe woningen?"
```

### Option 2: Command Line
```bash
# Full search
python3 agents/realestate/search_v2.py

# Specific sources only
python3 agents/realestate/search_v2.py --sources pararius huurwoningen.nl

# JSON output
python3 agents/realestate/search_v2.py --json

# Telegram format
python3 agents/realestate/search_v2.py --telegram

# Debug mode
python3 agents/realestate/search_v2.py --debug
```

## Data Sources

| Source | Status | URL Format |
|--------|--------|------------|
| Pararius | ✅ Works | `pararius.nl/huurwoningen/zwolle/1500-2500` |
| Huurwoningen.nl | ✅ Works | `huurwoningen.nl/in/zwolle/` |
| DirectWonen | ✅ Works | `directwonen.nl/huurwoningen/zwolle/` |
| VBO Makelaars | ✅ Works | `vbo.nl/huurwoning/zwolle` |
| Funda | ⚠️ Manual | Blocked - check manually |

## Output Files

```
data/
├── results_v2.json    # All found properties (cumulative)
├── seen_v2.json       # Tracking which we've alerted on
├── duplicates.json    # Cross-source duplicate mapping
├── logs/
│   └── search_YYYYMMDD.log  # Daily detailed logs
```

## Scoring System

Properties get a 0-100 score based on how well they match family needs:

| Factor | Scoring |
|--------|---------|
| **Bedrooms** | 3br=25, 4+br=20, 2br=15 |
| **Garden** | Tuin=25, Balkon=10, None=0 |
| **Price** | Lower in range = higher (max 20) |
| **Area** | 120m²+=15, 100m²+=12, 80m²+=8 |
| **Location** | Zwolle=15, Region=8, Other=3 |

Example: A 3-bedroom house with garden at €1750 in Zwolle (100m²) would score:
- Bedrooms: 25 + Garden: 25 + Price: ~15 + Area: 12 + Location: 15 = **92/100** ⭐⭐⭐⭐⭐

## Deduplication

The agent automatically detects when the same property appears on multiple sites:

1. Normalizes address (removes punctuation, common words)
2. Groups by normalized address + city + price bucket (±€100)
3. Keeps canonical listing, links duplicates
4. Shows "Ook op: pararius, huurwoningen.nl" in alerts

## Cron Setup

```bash
# Edit crontab
crontab -e

# Run at 9:00 and 18:00 daily
0 9,18 * * * cd /path/to/clawd && python3 agents/realestate/search_v2.py >> agents/realestate/data/logs/cron.log 2>&1
```

Or use Clawdbot's cron system:
```
clawdbot cron add "realestate-search" "0 9,18 * * *" "python3 agents/realestate/search_v2.py --telegram"
```

## Sample Alert (Telegram)

```
🏠 **3 nieuwe woning(en) gevonden!**
Criteria: 2-3 slaapkamers, €1500-2500, bij voorkeur met tuin

**Parkweg 42** 🌳
💰 €1.850/maand | 🛏️ 3 | 📐 110m²
⭐ Score: 85/100 ⭐⭐⭐⭐
🔗 https://www.pararius.nl/...

**Bilderdijkstraat 15** 🌿
💰 €1.650/maand | 🛏️ 2 | 📐 85m²
⭐ Score: 62/100 ⭐⭐⭐
🔗 https://www.huurwoningen.nl/...
```

## Manual Funda Check

Funda blocks automated access. Check manually:
- Rent: https://www.funda.nl/huur/zwolle/1500-2500/2-kamers/
- Sale (long-listed): https://www.funda.nl/koop/zwolle/sorteer-datum-af/

💡 Tip: Properties for sale >1 year might accept rental offers!

## Dependencies

- Python 3.8+
- curl (system)
- No pip packages! 🎉

## v1 → v2 Migration

v2 uses separate data files to avoid breaking existing setups:
- `results.json` → `results_v2.json`
- `seen.json` → `seen_v2.json`

To migrate favorites/rejects from v1:
```python
# Manual: copy relevant entries
import json
seen_v1 = json.load(open('data/seen.json'))
seen_v2 = json.load(open('data/seen_v2.json'))
# Copy entries with 'favorite': true, etc.
```

## Files

```
agents/realestate/
├── README.md           # This file
├── CHANGELOG.md        # Version history
├── SEARCH_TASK.md      # Clawdbot task instructions
├── search.py           # v1.0 (legacy)
├── search_v2.py        # v2.0 (current)
├── email_template.txt  # Makelaar email templates
├── email_template_v2.txt
└── data/
    ├── results.json      # v1 results
    ├── results_v2.json   # v2 results
    ├── seen.json         # v1 tracking
    ├── seen_v2.json      # v2 tracking
    ├── duplicates.json   # Duplicate mapping
    ├── makelaars.json    # Local realtor contacts
    └── logs/             # Daily logs
```
