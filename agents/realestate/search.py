#!/usr/bin/env python3
"""
Zwolle Real Estate Search Agent
Searches Dutch rental sites for properties matching criteria.

Sites:
- Pararius (primary - works well)
- Huurwoningen.nl (works well)

Criteria:
- Location: Zwolle
- Min bedrooms: 2
- Min rent: €1500/month

Note: This script works best when run via Clawdbot which handles
JavaScript rendering. For standalone use, it falls back to curl
which may get limited results.
"""

import json
import re
import hashlib
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, asdict

# Data directory for results
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

RESULTS_FILE = DATA_DIR / "results.json"
SEEN_FILE = DATA_DIR / "seen.json"

# Search criteria
MIN_BEDROOMS = 2
MIN_PRICE = 1500

@dataclass
class Property:
    id: str
    source: str
    type: str  # "rent" or "sale"
    address: str
    city: str
    postal_code: str
    price: int
    price_str: str
    bedrooms: int
    area_m2: Optional[int]
    url: str
    status: str  # "available", "under_option", "rented"
    first_seen: str
    listing_age: Optional[str] = None

    def matches_criteria(self) -> bool:
        """Check if property matches search criteria"""
        if self.type == "rent":
            return self.bedrooms >= MIN_BEDROOMS and self.price >= MIN_PRICE
        return True


def fetch_url_curl(url: str) -> Optional[str]:
    """Fetch URL using curl with headers"""
    try:
        result = subprocess.run(
            [
                "curl", "-sL", 
                "-H", "Accept: text/html,application/xhtml+xml",
                "-H", "Accept-Language: nl,en;q=0.9",
                "-A", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                url
            ],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.stdout if result.returncode == 0 else None
    except Exception as e:
        print(f"  Error fetching {url}: {e}")
        return None


def generate_id(source: str, url: str) -> str:
    """Generate unique ID from URL"""
    return hashlib.md5(url.encode()).hexdigest()[:12]


def parse_pararius_listing(html: str, base_url: str = "https://www.pararius.nl") -> list[Property]:
    """Parse Pararius search results HTML"""
    properties = []
    
    # Match listing card patterns
    # Looking for search-list__item sections
    listing_blocks = re.findall(
        r'<li[^>]*class="search-list__item[^"]*"[^>]*>(.*?)</li>',
        html, re.DOTALL
    )
    
    if not listing_blocks:
        # Try alternative: find listing URLs and nearby data
        # Pattern: href="/huis-te-huur/zwolle/abc123/street"
        url_pattern = r'href="(/(?:huis|appartement|studio|woning)-te-huur/zwolle/[^"]+)"'
        urls_found = re.findall(url_pattern, html)
        
        for url_path in set(urls_found):
            full_url = base_url + url_path
            
            # Find context around this URL in the HTML
            url_pos = html.find(url_path)
            if url_pos == -1:
                continue
            
            # Get a chunk around this URL
            start = max(0, url_pos - 200)
            end = min(len(html), url_pos + 1500)
            context = html[start:end]
            
            # Extract street from URL
            parts = url_path.split('/')
            street = parts[-1] if len(parts) > 3 else "Unknown"
            address = street.replace('-', ' ').title()
            
            # Extract price: €1.750 per maand or € 1,750
            price_match = re.search(r'€\s*([\d.,]+)', context)
            price = 0
            if price_match:
                price_str = price_match.group(1).replace('.', '').replace(',', '')
                try:
                    price = int(price_str)
                except:
                    pass
            
            # Extract rooms: 4 kamers or 4 rooms
            rooms_match = re.search(r'(\d+)\s*(?:kamers?|rooms?)', context)
            rooms = int(rooms_match.group(1)) if rooms_match else 0
            
            # Extract area: 126 m²
            area_match = re.search(r'(\d+)\s*m²', context)
            area = int(area_match.group(1)) if area_match else None
            
            # Extract postal code: 8044 VR
            postal_match = re.search(r'(\d{4}\s*[A-Z]{2})\s*Zwolle', context)
            postal = postal_match.group(1) if postal_match else ""
            
            # Check status
            status = "available"
            context_lower = context.lower()
            if "onder optie" in context_lower or "under option" in context_lower:
                status = "under_option"
            elif "verhuurd" in context_lower or "rented" in context_lower:
                status = "rented"
            
            if price > 0:
                prop = Property(
                    id=generate_id("pararius", full_url),
                    source="pararius",
                    type="rent",
                    address=address,
                    city="Zwolle",
                    postal_code=postal,
                    price=price,
                    price_str=f"€{price:,}/month".replace(',', '.'),
                    bedrooms=rooms,
                    area_m2=area,
                    url=full_url,
                    status=status,
                    first_seen=datetime.now().isoformat()
                )
                properties.append(prop)
    
    return properties


def parse_huurwoningen_listing(html: str, base_url: str = "https://www.huurwoningen.nl") -> list[Property]:
    """Parse Huurwoningen.nl search results"""
    properties = []
    
    # Pattern: /huren/zwolle/abc123/streetname/
    url_pattern = r'href="(/huren/zwolle/[a-f0-9]+/[^/"]+/)"'
    urls_found = re.findall(url_pattern, html)
    
    for url_path in set(urls_found):
        full_url = base_url + url_path
        
        url_pos = html.find(url_path)
        if url_pos == -1:
            continue
        
        start = max(0, url_pos - 200)
        end = min(len(html), url_pos + 1500)
        context = html[start:end]
        
        # Extract street
        parts = url_path.rstrip('/').split('/')
        street = parts[-1] if len(parts) > 3 else "Unknown"
        address = street.replace('-', ' ').title()
        
        # Extract price
        price_match = re.search(r'€\s*([\d.,]+)', context)
        price = 0
        if price_match:
            price_str = price_match.group(1).replace('.', '').replace(',', '')
            try:
                price = int(price_str)
            except:
                pass
        
        # Extract rooms
        rooms_match = re.search(r'(\d+)\s*kamers?', context)
        rooms = int(rooms_match.group(1)) if rooms_match else 0
        
        # Extract area
        area_match = re.search(r'(\d+)\s*m²', context)
        area = int(area_match.group(1)) if area_match else None
        
        # Extract postal
        postal_match = re.search(r'(\d{4}\s*[A-Z]{2})\s*Zwolle', context)
        postal = postal_match.group(1) if postal_match else ""
        
        if price > 0:
            prop = Property(
                id=generate_id("huurwoningen", full_url),
                source="huurwoningen.nl",
                type="rent",
                address=address,
                city="Zwolle",
                postal_code=postal,
                price=price,
                price_str=f"€{price:,}/month".replace(',', '.'),
                bedrooms=rooms,
                area_m2=area,
                url=full_url,
                status="available",
                first_seen=datetime.now().isoformat()
            )
            properties.append(prop)
    
    return properties


def load_seen() -> dict:
    """Load previously seen property IDs"""
    if SEEN_FILE.exists():
        try:
            return json.loads(SEEN_FILE.read_text())
        except:
            return {}
    return {}


def save_seen(seen: dict):
    """Save seen property IDs"""
    SEEN_FILE.write_text(json.dumps(seen, indent=2))


def load_results() -> list[dict]:
    """Load previous results"""
    if RESULTS_FILE.exists():
        try:
            return json.loads(RESULTS_FILE.read_text())
        except:
            return []
    return []


def save_results(results: list[dict]):
    """Save results to file"""
    RESULTS_FILE.write_text(json.dumps(results, indent=2, ensure_ascii=False))


def main():
    print("=" * 60)
    print("🏠 Zwolle Real Estate Search Agent")
    print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)
    print()
    print(f"Criteria: {MIN_BEDROOMS}+ bedrooms, €{MIN_PRICE}+/month, Zwolle")
    print()
    
    seen = load_seen()
    all_results = load_results()
    all_properties: list[Property] = []
    
    # Search Pararius
    print("🔍 Searching Pararius...")
    pararius_url = f"https://www.pararius.nl/huurwoningen/zwolle/{MIN_PRICE}-10000"
    print(f"   {pararius_url}")
    html = fetch_url_curl(pararius_url)
    if html:
        props = parse_pararius_listing(html)
        all_properties.extend(props)
        print(f"   Found: {len(props)} listings")
    else:
        print("   Failed to fetch")
    
    # Search Huurwoningen.nl
    print("🔍 Searching Huurwoningen.nl...")
    huurwoningen_url = "https://www.huurwoningen.nl/in/zwolle/"
    print(f"   {huurwoningen_url}")
    html = fetch_url_curl(huurwoningen_url)
    if html:
        props = parse_huurwoningen_listing(html)
        # Filter by price
        props = [p for p in props if p.price >= MIN_PRICE]
        all_properties.extend(props)
        print(f"   Found: {len(props)} listings (≥€{MIN_PRICE})")
    else:
        print("   Failed to fetch")
    
    # Funda note
    print()
    print("ℹ️  Funda blocks automated access. Manual URLs:")
    print(f"   Rent: https://www.funda.nl/huur/zwolle/{MIN_PRICE}+/{MIN_BEDROOMS}-kamers/")
    print("   Sale (oldest first): https://www.funda.nl/koop/zwolle/sorteer-datum-af/")
    
    # Filter and dedupe
    new_properties = []
    for prop in all_properties:
        if not prop.matches_criteria():
            continue
        if prop.id in seen:
            continue
        
        seen[prop.id] = {
            "first_seen": prop.first_seen,
            "address": prop.address,
            "url": prop.url
        }
        new_properties.append(prop)
        all_results.append(asdict(prop))
    
    save_seen(seen)
    save_results(all_results)
    
    # Results
    print()
    print("=" * 60)
    print("📊 RESULTS")
    print("=" * 60)
    print(f"Found this run: {len(all_properties)}")
    print(f"New (not seen): {len(new_properties)}")
    print(f"Total tracked:  {len(all_results)}")
    print()
    
    if new_properties:
        print("🆕 NEW LISTINGS:")
        print("-" * 60)
        for prop in sorted(new_properties, key=lambda p: p.price, reverse=True):
            emoji = "🟢" if prop.status == "available" else "🟡"
            print(f"{emoji} {prop.address}")
            print(f"   {prop.price_str} | {prop.bedrooms} rooms | {prop.area_m2 or '?'}m²")
            print(f"   {prop.postal_code} {prop.city}")
            print(f"   {prop.url}")
            print()
    else:
        print("No new listings matching criteria.")
    
    # Summary of database
    if all_results:
        print()
        print("📋 DATABASE SUMMARY:")
        print("-" * 60)
        available = [p for p in all_results if p.get('status') == 'available' and p.get('price', 0) >= MIN_PRICE]
        print(f"Available properties ≥€{MIN_PRICE}: {len(available)}")
        for p in sorted(available, key=lambda x: x.get('price', 0), reverse=True)[:5]:
            print(f"   €{p['price']:,} | {p['bedrooms']}br | {p['address']} [{p['source']}]")
    
    print()
    print(f"📁 Data: {DATA_DIR}")
    
    return 0 if new_properties is not None else 1


if __name__ == "__main__":
    sys.exit(main())
