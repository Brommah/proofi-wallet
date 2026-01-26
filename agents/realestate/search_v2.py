#!/usr/bin/env python3
"""
Zwolle Real Estate Search Agent v2.0

Enhanced multi-source property search with:
- Multiple data sources (Pararius, Huurwoningen.nl, DirectWonen, VBO Makelaars)
- Cross-source deduplication
- Scoring system based on preferences
- Better filtering (bedrooms, garden, price range)
- Improved error handling and logging
- Better alert formatting

Family criteria:
- 2-3 bedrooms (ideally 3)
- Garden/outdoor space preferred
- Budget: €1500-2500/month
- Location: Zwolle area
"""

import json
import re
import hashlib
import subprocess
import sys
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass, asdict, field
from enum import Enum

# ============================================================================
# CONFIGURATION
# ============================================================================

# Data directory
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
LOG_DIR = DATA_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Files
RESULTS_FILE = DATA_DIR / "results_v2.json"
SEEN_FILE = DATA_DIR / "seen_v2.json"
DUPLICATES_FILE = DATA_DIR / "duplicates.json"
LOG_FILE = LOG_DIR / f"search_{datetime.now().strftime('%Y%m%d')}.log"

# Search criteria - Family specific
class SearchCriteria:
    MIN_BEDROOMS = 2
    MAX_BEDROOMS = 4  # Open to larger
    IDEAL_BEDROOMS = 3
    MIN_PRICE = 1500
    MAX_PRICE = 2500
    CITY = "Zwolle"
    REGION = ["Zwolle", "Hattem", "Wezep", "Oldebroek", "Elburg", "Wijhe", "Heino"]

# Scoring weights (total = 100)
class ScoringWeights:
    BEDROOMS = 25      # 3 br = 25, 2 br = 15, 4+ br = 20
    GARDEN = 25        # Has garden = 25, balkon = 10, none = 0
    PRICE = 20         # Lower in range = higher score
    AREA = 15          # Bigger = better (capped)
    LOCATION = 15      # Zwolle centrum = 15, outskirts = 10, region = 5


# ============================================================================
# LOGGING SETUP
# ============================================================================

def setup_logging():
    """Configure logging to both file and console"""
    logger = logging.getLogger("realestate")
    logger.setLevel(logging.DEBUG)
    
    # File handler - detailed
    fh = logging.FileHandler(LOG_FILE)
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(logging.Formatter(
        '%(asctime)s | %(levelname)-7s | %(message)s',
        datefmt='%H:%M:%S'
    ))
    
    # Console handler - info only
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(logging.Formatter('%(message)s'))
    
    logger.addHandler(fh)
    logger.addHandler(ch)
    
    return logger

log = setup_logging()


# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class Property:
    """Enhanced property dataclass with scoring"""
    id: str
    source: str
    address: str
    city: str
    postal_code: str
    price: int
    price_str: str
    bedrooms: int
    area_m2: Optional[int]
    url: str
    status: str  # available, under_option, rented
    first_seen: str
    
    # Enhanced fields
    has_garden: bool = False
    has_balcony: bool = False
    garden_size_m2: Optional[int] = None
    description_snippet: str = ""
    energy_label: Optional[str] = None
    interior: Optional[str] = None  # furnished, unfurnished, upholstered
    available_from: Optional[str] = None
    
    # Deduplication
    normalized_address: str = ""
    duplicate_of: Optional[str] = None  # ID of canonical listing
    seen_on_sources: List[str] = field(default_factory=list)
    
    # Scoring
    score: int = 0
    score_breakdown: Dict[str, int] = field(default_factory=dict)
    
    def __post_init__(self):
        if not self.normalized_address:
            self.normalized_address = self._normalize_address()
        if not self.seen_on_sources:
            self.seen_on_sources = [self.source]
    
    def _normalize_address(self) -> str:
        """Normalize address for deduplication"""
        addr = self.address.lower()
        # Remove common variations
        addr = re.sub(r'[^\w\s]', '', addr)
        addr = re.sub(r'\s+', ' ', addr).strip()
        # Remove common suffixes
        for suffix in ['te huur', 'huur', 'zwolle']:
            addr = addr.replace(suffix, '')
        return addr.strip()
    
    def calculate_score(self) -> int:
        """Calculate preference score (0-100)"""
        breakdown = {}
        total = 0
        
        # Bedrooms score
        if self.bedrooms == SearchCriteria.IDEAL_BEDROOMS:
            breakdown['bedrooms'] = ScoringWeights.BEDROOMS
        elif self.bedrooms == 2:
            breakdown['bedrooms'] = 15
        elif self.bedrooms >= 4:
            breakdown['bedrooms'] = 20
        else:
            breakdown['bedrooms'] = 0
        
        # Garden score
        if self.has_garden:
            breakdown['garden'] = ScoringWeights.GARDEN
        elif self.has_balcony:
            breakdown['garden'] = 10
        else:
            breakdown['garden'] = 0
        
        # Price score (lower = better)
        price_range = SearchCriteria.MAX_PRICE - SearchCriteria.MIN_PRICE
        if self.price <= SearchCriteria.MIN_PRICE:
            breakdown['price'] = ScoringWeights.PRICE
        elif self.price >= SearchCriteria.MAX_PRICE:
            breakdown['price'] = 5
        else:
            # Linear scale
            ratio = 1 - (self.price - SearchCriteria.MIN_PRICE) / price_range
            breakdown['price'] = int(ScoringWeights.PRICE * ratio)
        
        # Area score
        if self.area_m2:
            if self.area_m2 >= 120:
                breakdown['area'] = ScoringWeights.AREA
            elif self.area_m2 >= 100:
                breakdown['area'] = 12
            elif self.area_m2 >= 80:
                breakdown['area'] = 8
            else:
                breakdown['area'] = 5
        else:
            breakdown['area'] = 5  # Unknown, assume average
        
        # Location score
        if self.city.lower() == "zwolle":
            breakdown['location'] = ScoringWeights.LOCATION
        elif self.city.lower() in [c.lower() for c in SearchCriteria.REGION]:
            breakdown['location'] = 8
        else:
            breakdown['location'] = 3
        
        total = sum(breakdown.values())
        self.score_breakdown = breakdown
        self.score = total
        return total
    
    def matches_criteria(self) -> bool:
        """Check if property matches basic search criteria"""
        if self.bedrooms < SearchCriteria.MIN_BEDROOMS:
            return False
        if self.price < SearchCriteria.MIN_PRICE or self.price > SearchCriteria.MAX_PRICE:
            return False
        return True
    
    def to_alert_string(self) -> str:
        """Format as alert message with score"""
        emoji = self._status_emoji()
        stars = self._score_stars()
        garden_icon = "🌳" if self.has_garden else ("🌿" if self.has_balcony else "")
        
        lines = [
            f"{emoji} **{self.address}** {garden_icon}",
            f"   💰 {self.price_str} | 🛏️ {self.bedrooms} slaapkamers | 📐 {self.area_m2 or '?'}m²",
            f"   📍 {self.postal_code} {self.city}",
            f"   ⭐ Score: {self.score}/100 {stars}",
            f"   🔗 {self.url}",
        ]
        
        if len(self.seen_on_sources) > 1:
            lines.insert(-1, f"   📡 Ook op: {', '.join(self.seen_on_sources)}")
        
        return "\n".join(lines)
    
    def _status_emoji(self) -> str:
        if self.status == "available":
            return "🟢"
        elif self.status == "under_option":
            return "🟡"
        return "🔴"
    
    def _score_stars(self) -> str:
        if self.score >= 80:
            return "⭐⭐⭐⭐⭐"
        elif self.score >= 65:
            return "⭐⭐⭐⭐"
        elif self.score >= 50:
            return "⭐⭐⭐"
        elif self.score >= 35:
            return "⭐⭐"
        return "⭐"


# ============================================================================
# HTTP FETCHING
# ============================================================================

class FetchError(Exception):
    """Custom exception for fetch errors"""
    pass


def fetch_url(url: str, timeout: int = 30) -> Tuple[Optional[str], Optional[str]]:
    """
    Fetch URL with error handling.
    Returns: (content, error_message)
    """
    log.debug(f"Fetching: {url}")
    
    try:
        result = subprocess.run(
            [
                "curl", "-sL", 
                "--max-time", str(timeout),
                "-H", "Accept: text/html,application/xhtml+xml",
                "-H", "Accept-Language: nl,en;q=0.9",
                "-H", "Cache-Control: no-cache",
                "-A", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                url
            ],
            capture_output=True,
            text=True,
            timeout=timeout + 5
        )
        
        if result.returncode != 0:
            error = f"curl returned {result.returncode}: {result.stderr[:100]}"
            log.warning(error)
            return None, error
        
        content = result.stdout
        
        # Check for common block patterns
        if "captcha" in content.lower() or "blocked" in content.lower():
            log.warning(f"Possible block detected on {url}")
            return content, "possible_block"
        
        # Check for empty response
        if len(content) < 500:
            log.warning(f"Suspiciously short response ({len(content)} chars) from {url}")
            return content, "short_response"
        
        return content, None
        
    except subprocess.TimeoutExpired:
        error = f"Timeout after {timeout}s"
        log.error(f"{url}: {error}")
        return None, error
    except Exception as e:
        error = f"Exception: {str(e)}"
        log.error(f"{url}: {error}")
        return None, error


# ============================================================================
# PARSERS
# ============================================================================

def generate_id(source: str, identifier: str) -> str:
    """Generate unique ID"""
    return f"{source[:3]}_{hashlib.md5(identifier.encode()).hexdigest()[:8]}"


def detect_garden(text: str) -> Tuple[bool, bool, Optional[int]]:
    """
    Detect garden/balcony from text.
    Returns: (has_garden, has_balcony, garden_size_m2)
    """
    text_lower = text.lower()
    
    has_garden = any(word in text_lower for word in [
        'tuin', 'garden', 'achtertuin', 'voortuin', 'zijtuin',
        'tuinkamer', 'tuin op het zuiden', 'tuin op het westen'
    ])
    
    has_balcony = any(word in text_lower for word in [
        'balkon', 'balcony', 'terras', 'dakterras', 'loggia'
    ])
    
    # Try to find garden size
    garden_size = None
    if has_garden:
        size_match = re.search(r'tuin[^\d]*(\d+)\s*m[²2]', text_lower)
        if size_match:
            garden_size = int(size_match.group(1))
    
    return has_garden, has_balcony, garden_size


def parse_pararius(html: str) -> List[Property]:
    """Parse Pararius rental listings"""
    properties = []
    base_url = "https://www.pararius.nl"
    
    # Find all listing URLs
    url_pattern = r'href="(/(?:huis|appartement|studio|woning|kamer)-te-huur/[^"]+)"'
    urls_found = list(set(re.findall(url_pattern, html)))
    
    log.debug(f"Pararius: found {len(urls_found)} URL patterns")
    
    for url_path in urls_found:
        # Skip pagination, city pages
        if url_path.count('/') < 4:
            continue
        
        full_url = base_url + url_path
        
        # Get context around URL
        url_pos = html.find(url_path)
        if url_pos == -1:
            continue
        
        start = max(0, url_pos - 300)
        end = min(len(html), url_pos + 2000)
        context = html[start:end]
        
        # Extract address from URL
        parts = url_path.split('/')
        street = parts[-1] if len(parts) > 3 else ""
        address = street.replace('-', ' ').title()
        
        # Price
        price_match = re.search(r'€\s*([\d.,]+)', context)
        price = 0
        if price_match:
            price_str = price_match.group(1).replace('.', '').replace(',', '')
            try:
                price = int(price_str)
            except ValueError:
                continue
        
        if price == 0:
            continue
        
        # Rooms/bedrooms
        rooms_match = re.search(r'(\d+)\s*(?:kamers?|rooms?|slaapkamers?)', context, re.I)
        rooms = int(rooms_match.group(1)) if rooms_match else 0
        
        # Area
        area_match = re.search(r'(\d+)\s*m[²2]', context)
        area = int(area_match.group(1)) if area_match else None
        
        # Postal code
        postal_match = re.search(r'(\d{4}\s*[A-Z]{2})\s*(?:Zwolle|in)', context, re.I)
        postal = postal_match.group(1) if postal_match else ""
        
        # Status
        status = "available"
        context_lower = context.lower()
        if "onder optie" in context_lower or "under option" in context_lower:
            status = "under_option"
        elif "verhuurd" in context_lower:
            status = "rented"
        
        # Garden detection
        has_garden, has_balcony, garden_size = detect_garden(context)
        
        prop = Property(
            id=generate_id("pararius", full_url),
            source="pararius",
            address=address,
            city="Zwolle",
            postal_code=postal,
            price=price,
            price_str=f"€{price:,}/maand".replace(',', '.'),
            bedrooms=rooms,
            area_m2=area,
            url=full_url,
            status=status,
            first_seen=datetime.now().isoformat(),
            has_garden=has_garden,
            has_balcony=has_balcony,
            garden_size_m2=garden_size,
            description_snippet=context[:200].replace('\n', ' ')
        )
        prop.calculate_score()
        properties.append(prop)
    
    return properties


def parse_huurwoningen(html: str) -> List[Property]:
    """Parse Huurwoningen.nl listings"""
    properties = []
    base_url = "https://www.huurwoningen.nl"
    
    # URL pattern
    url_pattern = r'href="(/huren/[a-z-]+/[a-f0-9]+/[^/"]+/)"'
    urls_found = list(set(re.findall(url_pattern, html)))
    
    log.debug(f"Huurwoningen.nl: found {len(urls_found)} URL patterns")
    
    for url_path in urls_found:
        full_url = base_url + url_path
        
        url_pos = html.find(url_path)
        if url_pos == -1:
            continue
        
        start = max(0, url_pos - 300)
        end = min(len(html), url_pos + 2000)
        context = html[start:end]
        
        # Extract city from URL
        parts = url_path.rstrip('/').split('/')
        city = parts[2].title() if len(parts) > 2 else "Zwolle"
        street = parts[-1] if len(parts) > 3 else ""
        address = street.replace('-', ' ').title()
        
        # Price
        price_match = re.search(r'€\s*([\d.,]+)', context)
        price = 0
        if price_match:
            price_str = price_match.group(1).replace('.', '').replace(',', '')
            try:
                price = int(price_str)
            except ValueError:
                continue
        
        if price == 0:
            continue
        
        # Rooms
        rooms_match = re.search(r'(\d+)\s*kamers?', context, re.I)
        rooms = int(rooms_match.group(1)) if rooms_match else 0
        
        # Area
        area_match = re.search(r'(\d+)\s*m[²2]', context)
        area = int(area_match.group(1)) if area_match else None
        
        # Postal
        postal_match = re.search(r'(\d{4}\s*[A-Z]{2})', context)
        postal = postal_match.group(1) if postal_match else ""
        
        # Garden
        has_garden, has_balcony, garden_size = detect_garden(context)
        
        prop = Property(
            id=generate_id("huurwoningen", full_url),
            source="huurwoningen.nl",
            address=address,
            city=city,
            postal_code=postal,
            price=price,
            price_str=f"€{price:,}/maand".replace(',', '.'),
            bedrooms=rooms,
            area_m2=area,
            url=full_url,
            status="available",
            first_seen=datetime.now().isoformat(),
            has_garden=has_garden,
            has_balcony=has_balcony,
            garden_size_m2=garden_size
        )
        prop.calculate_score()
        properties.append(prop)
    
    return properties


def parse_directwonen(html: str) -> List[Property]:
    """Parse DirectWonen.nl listings"""
    properties = []
    base_url = "https://www.directwonen.nl"
    
    # DirectWonen URL pattern
    url_pattern = r'href="(/huurwoning/[^"]+)"'
    urls_found = list(set(re.findall(url_pattern, html)))
    
    log.debug(f"DirectWonen: found {len(urls_found)} URL patterns")
    
    for url_path in urls_found:
        full_url = base_url + url_path
        
        url_pos = html.find(url_path)
        if url_pos == -1:
            continue
        
        start = max(0, url_pos - 300)
        end = min(len(html), url_pos + 2000)
        context = html[start:end]
        
        # Extract address from URL
        parts = url_path.split('/')
        if len(parts) >= 3:
            address = parts[-1].replace('-', ' ').title()
        else:
            continue
        
        # Price
        price_match = re.search(r'€\s*([\d.,]+)', context)
        price = 0
        if price_match:
            price_str = price_match.group(1).replace('.', '').replace(',', '')
            try:
                price = int(price_str)
            except ValueError:
                continue
        
        if price == 0:
            continue
        
        # Rooms
        rooms_match = re.search(r'(\d+)\s*(?:kamers?|slaapkamers?)', context, re.I)
        rooms = int(rooms_match.group(1)) if rooms_match else 0
        
        # Area
        area_match = re.search(r'(\d+)\s*m[²2]', context)
        area = int(area_match.group(1)) if area_match else None
        
        # Garden
        has_garden, has_balcony, garden_size = detect_garden(context)
        
        prop = Property(
            id=generate_id("directwonen", full_url),
            source="directwonen.nl",
            address=address,
            city="Zwolle",
            postal_code="",
            price=price,
            price_str=f"€{price:,}/maand".replace(',', '.'),
            bedrooms=rooms,
            area_m2=area,
            url=full_url,
            status="available",
            first_seen=datetime.now().isoformat(),
            has_garden=has_garden,
            has_balcony=has_balcony,
            garden_size_m2=garden_size
        )
        prop.calculate_score()
        properties.append(prop)
    
    return properties


def parse_vbo(html: str) -> List[Property]:
    """Parse VBO Makelaars listings"""
    properties = []
    base_url = "https://www.vbo.nl"
    
    # VBO URL pattern for rentals
    url_pattern = r'href="(/huurwoning/[^"]+)"'
    urls_found = list(set(re.findall(url_pattern, html)))
    
    log.debug(f"VBO Makelaars: found {len(urls_found)} URL patterns")
    
    for url_path in urls_found:
        full_url = base_url + url_path
        
        url_pos = html.find(url_path)
        if url_pos == -1:
            continue
        
        start = max(0, url_pos - 300)
        end = min(len(html), url_pos + 2000)
        context = html[start:end]
        
        # Extract address from URL
        parts = url_path.rstrip('/').split('/')
        address = parts[-1].replace('-', ' ').title() if len(parts) > 2 else ""
        
        if not address:
            continue
        
        # Price
        price_match = re.search(r'€\s*([\d.,]+)', context)
        price = 0
        if price_match:
            price_str = price_match.group(1).replace('.', '').replace(',', '')
            try:
                price = int(price_str)
            except ValueError:
                continue
        
        if price == 0:
            continue
        
        # Rooms
        rooms_match = re.search(r'(\d+)\s*(?:kamers?|slaapkamers?)', context, re.I)
        rooms = int(rooms_match.group(1)) if rooms_match else 0
        
        # Area
        area_match = re.search(r'(\d+)\s*m[²2]', context)
        area = int(area_match.group(1)) if area_match else None
        
        # Garden
        has_garden, has_balcony, garden_size = detect_garden(context)
        
        prop = Property(
            id=generate_id("vbo", full_url),
            source="vbo-makelaars",
            address=address,
            city="Zwolle",
            postal_code="",
            price=price,
            price_str=f"€{price:,}/maand".replace(',', '.'),
            bedrooms=rooms,
            area_m2=area,
            url=full_url,
            status="available",
            first_seen=datetime.now().isoformat(),
            has_garden=has_garden,
            has_balcony=has_balcony,
            garden_size_m2=garden_size
        )
        prop.calculate_score()
        properties.append(prop)
    
    return properties


# ============================================================================
# DEDUPLICATION
# ============================================================================

def normalize_for_dedup(address: str, city: str, price: int) -> str:
    """Create normalized key for deduplication"""
    # Normalize address
    addr = address.lower()
    addr = re.sub(r'[^\w\s]', '', addr)
    addr = re.sub(r'\s+', ' ', addr).strip()
    
    # Remove common words
    for word in ['te huur', 'huur', 'zwolle', 'woning', 'appartement', 'huis']:
        addr = addr.replace(word, '')
    
    addr = addr.strip()
    
    # Price bucket (within €100)
    price_bucket = (price // 100) * 100
    
    return f"{addr}|{city.lower()}|{price_bucket}"


def deduplicate_properties(properties: List[Property]) -> Tuple[List[Property], Dict[str, List[str]]]:
    """
    Deduplicate properties across sources.
    Returns: (unique_properties, duplicate_map)
    """
    seen_keys: Dict[str, Property] = {}
    duplicate_map: Dict[str, List[str]] = {}  # canonical_id -> [duplicate_ids]
    
    for prop in properties:
        key = normalize_for_dedup(prop.address, prop.city, prop.price)
        
        if key in seen_keys:
            # This is a duplicate
            canonical = seen_keys[key]
            
            # Update canonical with source info
            if prop.source not in canonical.seen_on_sources:
                canonical.seen_on_sources.append(prop.source)
            
            # Track duplicate
            if canonical.id not in duplicate_map:
                duplicate_map[canonical.id] = []
            duplicate_map[canonical.id].append(prop.id)
            
            prop.duplicate_of = canonical.id
            
            log.debug(f"Duplicate: {prop.address} ({prop.source}) = {canonical.address} ({canonical.source})")
        else:
            seen_keys[key] = prop
    
    unique = [p for p in properties if p.duplicate_of is None]
    
    log.info(f"Deduplication: {len(properties)} -> {len(unique)} unique ({len(properties) - len(unique)} duplicates)")
    
    return unique, duplicate_map


# ============================================================================
# DATA PERSISTENCE
# ============================================================================

def load_json(path: Path, default: Any = None) -> Any:
    """Load JSON file with error handling"""
    if not path.exists():
        return default if default is not None else {}
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError as e:
        log.error(f"JSON parse error in {path}: {e}")
        return default if default is not None else {}


def save_json(path: Path, data: Any):
    """Save JSON file"""
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False, default=str))


# ============================================================================
# MAIN SEARCH
# ============================================================================

class SearchSources:
    """Available search sources"""
    
    @staticmethod
    def pararius():
        return {
            "name": "Pararius",
            "url": f"https://www.pararius.nl/huurwoningen/zwolle/{SearchCriteria.MIN_PRICE}-{SearchCriteria.MAX_PRICE}",
            "parser": parse_pararius
        }
    
    @staticmethod
    def huurwoningen():
        return {
            "name": "Huurwoningen.nl",
            "url": "https://www.huurwoningen.nl/in/zwolle/",
            "parser": parse_huurwoningen
        }
    
    @staticmethod
    def directwonen():
        return {
            "name": "DirectWonen",
            "url": "https://www.directwonen.nl/huurwoningen/zwolle/",
            "parser": parse_directwonen
        }
    
    @staticmethod
    def vbo():
        return {
            "name": "VBO Makelaars", 
            "url": "https://www.vbo.nl/huurwoning/zwolle",
            "parser": parse_vbo
        }


def run_search(sources: List[str] = None) -> Dict[str, Any]:
    """
    Run the property search.
    
    Args:
        sources: List of sources to check. Default: all
    
    Returns:
        Dict with results, stats, errors
    """
    log.info("=" * 60)
    log.info("🏠 Zwolle Real Estate Search Agent v2.0")
    log.info(f"   {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    log.info("=" * 60)
    
    criteria_str = (
        f"{SearchCriteria.MIN_BEDROOMS}-{SearchCriteria.MAX_BEDROOMS} slaapkamers, "
        f"€{SearchCriteria.MIN_PRICE}-{SearchCriteria.MAX_PRICE}/maand, "
        f"bij voorkeur met tuin"
    )
    log.info(f"Criteria: {criteria_str}")
    log.info("")
    
    # Define sources to search
    all_sources = [
        SearchSources.pararius(),
        SearchSources.huurwoningen(),
        SearchSources.directwonen(),
        SearchSources.vbo(),
    ]
    
    if sources:
        all_sources = [s for s in all_sources if s["name"].lower() in [x.lower() for x in sources]]
    
    # Load existing data
    seen = load_json(SEEN_FILE, {})
    all_results = load_json(RESULTS_FILE, [])
    
    # Search each source
    all_properties: List[Property] = []
    errors: List[Dict[str, str]] = []
    source_stats: Dict[str, Dict[str, int]] = {}
    
    for source in all_sources:
        log.info(f"🔍 Searching {source['name']}...")
        log.info(f"   URL: {source['url']}")
        
        html, error = fetch_url(source['url'])
        
        if error and not html:
            log.error(f"   ❌ Failed: {error}")
            errors.append({"source": source["name"], "error": error})
            source_stats[source["name"]] = {"found": 0, "error": error}
            continue
        
        if error:
            log.warning(f"   ⚠️ Warning: {error}")
        
        try:
            properties = source["parser"](html)
            
            # Filter by criteria
            matching = [p for p in properties if p.matches_criteria()]
            
            log.info(f"   ✓ Found: {len(properties)} total, {len(matching)} matching criteria")
            source_stats[source["name"]] = {
                "found": len(properties),
                "matching": len(matching)
            }
            
            all_properties.extend(matching)
            
        except Exception as e:
            log.error(f"   ❌ Parse error: {e}")
            errors.append({"source": source["name"], "error": str(e)})
            source_stats[source["name"]] = {"found": 0, "error": str(e)}
    
    # Funda manual check reminder
    log.info("")
    log.info("ℹ️  Funda (handmatig checken):")
    log.info(f"   https://www.funda.nl/huur/zwolle/{SearchCriteria.MIN_PRICE}-{SearchCriteria.MAX_PRICE}/")
    
    # Deduplicate across sources
    log.info("")
    unique_properties, duplicate_map = deduplicate_properties(all_properties)
    
    # Find new listings
    new_properties: List[Property] = []
    for prop in unique_properties:
        if prop.id in seen:
            continue
        
        seen[prop.id] = {
            "first_seen": prop.first_seen,
            "address": prop.address,
            "url": prop.url,
            "score": prop.score
        }
        new_properties.append(prop)
        all_results.append(asdict(prop))
    
    # Save data
    save_json(SEEN_FILE, seen)
    save_json(RESULTS_FILE, all_results)
    save_json(DUPLICATES_FILE, duplicate_map)
    
    # Sort by score
    new_properties.sort(key=lambda p: p.score, reverse=True)
    
    # Results summary
    log.info("")
    log.info("=" * 60)
    log.info("📊 RESULTATEN")
    log.info("=" * 60)
    log.info(f"Gevonden deze run:  {len(all_properties)}")
    log.info(f"Uniek (na dedup):   {len(unique_properties)}")
    log.info(f"Nieuw (niet gezien): {len(new_properties)}")
    log.info(f"Totaal in database: {len(all_results)}")
    
    if new_properties:
        log.info("")
        log.info("🆕 NIEUWE WONINGEN:")
        log.info("-" * 60)
        for prop in new_properties:
            log.info(prop.to_alert_string())
            log.info("")
    else:
        log.info("")
        log.info("Geen nieuwe woningen gevonden die aan de criteria voldoen.")
    
    # Top opportunities from database
    if all_results:
        log.info("")
        log.info("🏆 TOP 5 BESCHIKBAAR (hoogste score):")
        log.info("-" * 60)
        
        # Filter available, recalculate scores
        available = []
        for r in all_results:
            if r.get('status') == 'available' and r.get('price', 0) >= SearchCriteria.MIN_PRICE:
                try:
                    prop = Property(**{k: v for k, v in r.items() if k in Property.__dataclass_fields__})
                    prop.calculate_score()
                    available.append(prop)
                except Exception:
                    pass
        
        available.sort(key=lambda p: p.score, reverse=True)
        for prop in available[:5]:
            garden_icon = "🌳" if prop.has_garden else ("🌿" if prop.has_balcony else "")
            log.info(f"   ⭐{prop.score} | €{prop.price:,} | {prop.bedrooms}br | {prop.address} {garden_icon}")
    
    log.info("")
    log.info(f"📁 Data: {DATA_DIR}")
    log.info(f"📝 Log:  {LOG_FILE}")
    
    return {
        "new_properties": [asdict(p) for p in new_properties],
        "total_found": len(all_properties),
        "unique_found": len(unique_properties),
        "new_count": len(new_properties),
        "errors": errors,
        "source_stats": source_stats,
        "timestamp": datetime.now().isoformat()
    }


def format_telegram_alert(properties: List[Dict]) -> str:
    """Format properties for Telegram message"""
    if not properties:
        return "🏠 Geen nieuwe woningen gevonden."
    
    lines = [
        f"🏠 **{len(properties)} nieuwe woning(en) gevonden!**",
        f"Criteria: 2-3 slaapkamers, €1500-2500, bij voorkeur met tuin",
        ""
    ]
    
    for p in properties[:10]:  # Max 10 in one message
        garden_icon = "🌳" if p.get('has_garden') else ("🌿" if p.get('has_balcony') else "")
        stars = "⭐" * min(5, p.get('score', 0) // 20)
        
        lines.extend([
            f"**{p['address']}** {garden_icon}",
            f"💰 {p['price_str']} | 🛏️ {p['bedrooms']} | 📐 {p.get('area_m2', '?')}m²",
            f"⭐ Score: {p.get('score', 0)}/100 {stars}",
            f"🔗 {p['url']}",
            ""
        ])
    
    if len(properties) > 10:
        lines.append(f"... en {len(properties) - 10} meer")
    
    return "\n".join(lines)


# ============================================================================
# CLI
# ============================================================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Zwolle Real Estate Search")
    parser.add_argument("--sources", nargs="+", help="Specific sources to search")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--telegram", action="store_true", help="Format for Telegram")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    
    args = parser.parse_args()
    
    if args.debug:
        logging.getLogger("realestate").setLevel(logging.DEBUG)
    
    result = run_search(args.sources)
    
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    elif args.telegram:
        print(format_telegram_alert(result["new_properties"]))
    
    sys.exit(0 if result["new_count"] >= 0 else 1)
