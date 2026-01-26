# Zwolle Real Estate Search Task v2

Run this search periodically via cron (9:00 + 18:00) or manually.

## Search Criteria (Family)
- Location: Zwolle + region (Hattem, Wezep, etc.)
- Bedrooms: 2-4 (ideally 3 for growing family)
- Budget: €1500-2500/month
- Preference: Tuin (garden) for the kids
- BONUS: Long-listed sale properties (>1 year)

## How to Run

### Option 1: Python Script (Recommended)
```bash
python3 agents/realestate/search_v2.py
```

### Option 2: Ask Clawdbot
"Zoek naar nieuwe huurwoningen in Zwolle"
"Run de woningzoeker"

### Option 3: Clawdbot Cron
Already configured: 9:00 + 18:00 daily

## URLs Searched Automatically

| Source | URL |
|--------|-----|
| Pararius | https://www.pararius.nl/huurwoningen/zwolle/1500-2500 |
| Huurwoningen.nl | https://www.huurwoningen.nl/in/zwolle/ |
| DirectWonen | https://www.directwonen.nl/huurwoningen/zwolle/ |
| VBO Makelaars | https://www.vbo.nl/huurwoning/zwolle |

## Manual Check (Funda blocked)

Funda blocks bots. Check manually:
- **Huur**: https://www.funda.nl/huur/zwolle/1500-2500/2-kamers/
- **Koop (oud)**: https://www.funda.nl/koop/zwolle/sorteer-datum-af/

💡 Properties >1 year on market might accept rental offers!

## What the Script Does

1. Fetches all 4 sources
2. Parses listings (address, price, rooms, area, garden)
3. Filters by criteria (2-4br, €1500-2500)
4. Deduplicates across sources
5. Calculates score (0-100) per property
6. Compares against `data/seen_v2.json`
7. Reports NEW listings with scores
8. Updates database

## Output Format

```
🟢 **Parkweg 42** 🌳
   💰 €1.850/maand | 🛏️ 3 slaapkamers | 📐 110m²
   📍 8011 AB Zwolle
   ⭐ Score: 85/100 ⭐⭐⭐⭐
   📡 Ook op: pararius, huurwoningen.nl
   🔗 https://www.pararius.nl/...
```

## Scoring Guide

| Score | Rating | Action |
|-------|--------|--------|
| 80+ | ⭐⭐⭐⭐⭐ | 🔥 React FAST! |
| 65-79 | ⭐⭐⭐⭐ | Worth viewing |
| 50-64 | ⭐⭐⭐ | Consider if slim pickings |
| <50 | ⭐⭐ | Probably skip |

## Data Files

- `data/results_v2.json` - All found properties
- `data/seen_v2.json` - Tracking + favorites/rejects
- `data/duplicates.json` - Cross-source duplicates
- `data/logs/search_YYYYMMDD.log` - Detailed logs

## Marking Favorites/Rejects

Edit `data/seen_v2.json`:
```json
{
  "par_abc123": {
    "first_seen": "2025-01-27T09:00:00",
    "address": "Parkweg 42",
    "favorite": true
  },
  "par_def456": {
    "first_seen": "2025-01-27T09:00:00", 
    "address": "Kleine Studio",
    "rejected": true,
    "reject_reason": "too small"
  }
}
```
