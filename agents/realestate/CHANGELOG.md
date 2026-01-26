# Changelog - Real Estate Search Agent

## [2.0.0] - 2025-01-27

### Major Rewrite - Family-Focused Search

Complete overhaul of the real estate agent with enhanced features for family home search.

### Added

#### 🌐 New Data Sources
- **DirectWonen.nl** - Added parser and integration
- **VBO Makelaars** - Added parser for vbo.nl listings
- Both parsers extract: address, price, rooms, area, garden/balcony info

#### 🔍 Better Filtering
- Price range: €1500-2500/month (was: €1500+ open-ended)
- Bedrooms: 2-4 preferred, ideal = 3 (was: 2+ minimum)
- **Garden detection**: Scans listings for tuin/garden keywords
- **Balcony detection**: Detects balkon, terras, dakterras
- **Garden size extraction**: Tries to parse garden area in m²

#### 🔄 Cross-Source Deduplication
- New `normalize_for_dedup()` function creates canonical keys
- Combines: normalized address + city + price bucket (±€100)
- Tracks `seen_on_sources` to show where each property appears
- Saves duplicate mapping to `data/duplicates.json`
- Prevents alerts for same property on multiple sites

#### ⭐ Scoring System
- **100-point scale** based on family preferences
- Weights:
  - Bedrooms: 25 pts (3br=25, 2br=15, 4+br=20)
  - Garden: 25 pts (garden=25, balcony=10, none=0)
  - Price: 20 pts (lower in range = higher)
  - Area: 15 pts (120m²+=15, 100m²+=12, 80m²+=8)
  - Location: 15 pts (Zwolle=15, region=8, other=3)
- Properties sorted by score in output
- Star rating visualization (⭐⭐⭐⭐⭐)
- Score breakdown stored per property

#### 📝 Improved Logging
- Dual logging: file (debug) + console (info)
- Daily log files: `data/logs/search_YYYYMMDD.log`
- Timestamped entries with severity levels
- Detailed fetch/parse debugging
- Source-level statistics

#### 🛡️ Better Error Handling
- `FetchError` custom exception class
- Timeout handling (30s default)
- Bot/captcha detection in responses
- Short response warnings
- Per-source error tracking in results
- Graceful degradation (continues if one source fails)

#### 📱 Alert Formatting
- Rich Telegram formatting with `format_telegram_alert()`
- Garden/balcony icons (🌳/🌿)
- Score and star display
- Multi-source indicator
- Status emoji (🟢/🟡/🔴)
- Top 5 available properties summary

### Changed

#### Data Structure
- New fields: `has_garden`, `has_balcony`, `garden_size_m2`
- New fields: `description_snippet`, `energy_label`, `interior`, `available_from`
- New fields: `normalized_address`, `duplicate_of`, `seen_on_sources`
- New fields: `score`, `score_breakdown`
- Results saved to `results_v2.json` (separate from v1)
- Seen saved to `seen_v2.json` (separate from v1)

#### CLI Interface
- `--sources`: Search specific sources only
- `--json`: Output raw JSON results
- `--telegram`: Output formatted for Telegram
- `--debug`: Enable debug logging

#### Search Criteria
```python
# v1.0
MIN_BEDROOMS = 2
MIN_PRICE = 1500
# Open-ended max

# v2.0
MIN_BEDROOMS = 2
MAX_BEDROOMS = 4
IDEAL_BEDROOMS = 3
MIN_PRICE = 1500
MAX_PRICE = 2500
REGION = ["Zwolle", "Hattem", "Wezep", ...]
```

### Technical Details

#### Files Added/Modified
- `search_v2.py` - Complete rewrite (~800 lines)
- `data/results_v2.json` - New results store
- `data/seen_v2.json` - New seen tracking
- `data/duplicates.json` - Duplicate mapping
- `data/logs/` - Log directory

#### Dependencies
- No new dependencies! Still pure Python 3.8+
- Uses only: json, re, hashlib, subprocess, logging, dataclasses

### Migration Notes

- v2 uses separate data files (`*_v2.json`) to avoid breaking v1
- Can run v1 and v2 in parallel during transition
- To migrate: copy relevant entries from `seen.json` to `seen_v2.json`

### Known Limitations

1. **Funda**: Still blocked by bot protection - manual check required
2. **DirectWonen/VBO**: May have limited listings for Zwolle area
3. **Garden detection**: Keyword-based, may miss some or have false positives
4. **curl-based**: Some JS-rendered content may be missed (works better via Clawdbot)

### Example Output

```
🏠 Zwolle Real Estate Search Agent v2.0
   2025-01-27 14:30

Criteria: 2-4 slaapkamers, €1500-2500/maand, bij voorkeur met tuin

🔍 Searching Pararius...
   URL: https://www.pararius.nl/huurwoningen/zwolle/1500-2500
   ✓ Found: 15 total, 12 matching criteria

🔍 Searching Huurwoningen.nl...
   ✓ Found: 8 total, 6 matching criteria

🔍 Searching DirectWonen...
   ✓ Found: 3 total, 2 matching criteria

🔍 Searching VBO Makelaars...
   ✓ Found: 2 total, 1 matching criteria

Deduplication: 21 -> 18 unique (3 duplicates)

📊 RESULTATEN
Gevonden deze run:  21
Uniek (na dedup):   18
Nieuw (niet gezien): 5
Totaal in database: 42

🆕 NIEUWE WONINGEN:
----------------------------------------------------------
🟢 **Parkweg 42** 🌳
   💰 €1.850/maand | 🛏️ 3 slaapkamers | 📐 110m²
   📍 8011 AB Zwolle
   ⭐ Score: 85/100 ⭐⭐⭐⭐
   📡 Ook op: pararius, huurwoningen.nl
   🔗 https://www.pararius.nl/...
```

---

## [1.0.0] - 2025-01-26

### Initial Release

- Pararius scraper
- Huurwoningen.nl scraper  
- Basic price/bedroom filtering
- Seen tracking with `seen.json`
- Results storage in `results.json`
- Cron job instructions
