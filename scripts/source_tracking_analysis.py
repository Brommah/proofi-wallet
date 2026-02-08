#!/usr/bin/env python3
"""Analyze source tracking from Notion HR Pipeline."""

import json
import os
from collections import defaultdict
from pathlib import Path
import urllib.request
import urllib.error

# Load API key
api_key_path = Path.home() / ".config/notion/api_key"
API_KEY = api_key_path.read_text().strip()

DATABASE_ID = "112d8000-83d6-805c-a3aa-e21ec2741ba7"
DATA_SOURCE_ID = "bc66a818-be72-4ce3-b205-01f35df214c8"

def notion_request(endpoint, method="GET", data=None):
    """Make a request to Notion API."""
    url = f"https://api.notion.com/v1/{endpoint}"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Notion-Version": "2025-09-03",
        "Content-Type": "application/json"
    }
    
    req = urllib.request.Request(url, headers=headers, method=method)
    if data:
        req.data = json.dumps(data).encode('utf-8')
    
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))

def get_all_candidates():
    """Fetch all candidates from the database."""
    all_results = []
    cursor = None
    
    while True:
        data = {"page_size": 100}
        if cursor:
            data["start_cursor"] = cursor
            
        response = notion_request(f"data_sources/{DATA_SOURCE_ID}/query", "POST", data)
        all_results.extend(response.get("results", []))
        
        if not response.get("has_more"):
            break
        cursor = response.get("next_cursor")
        
    return all_results

def extract_property(props, name, prop_type):
    """Extract a property value from Notion properties."""
    prop = props.get(name, {})
    if prop_type == "select":
        sel = prop.get("select")
        return sel.get("name") if sel else None
    elif prop_type == "status":
        stat = prop.get("status")
        return stat.get("name") if stat else None
    elif prop_type == "number":
        return prop.get("number")
    elif prop_type == "title":
        title = prop.get("title", [])
        return title[0].get("plain_text", "") if title else ""
    return None

def main():
    print("Fetching all candidates from Notion...")
    candidates = get_all_candidates()
    print(f"Total candidates: {len(candidates)}\n")
    
    # Extract relevant data
    data = []
    for c in candidates:
        props = c.get("properties", {})
        data.append({
            "source": extract_property(props, "Source", "select"),
            "role": extract_property(props, "Role", "select"),
            "status": extract_property(props, "Status", "status"),
            "ai_score": extract_property(props, "AI Score", "number"),
            "human_score": extract_property(props, "Human Score", "number"),
        })
    
    # Source distribution
    source_counts = defaultdict(int)
    for d in data:
        source = d["source"] or "No Source"
        source_counts[source] += 1
    
    print("=" * 60)
    print("SOURCE DISTRIBUTION (All Candidates)")
    print("=" * 60)
    sorted_sources = sorted(source_counts.items(), key=lambda x: -x[1])
    total = len(data)
    for source, count in sorted_sources:
        pct = (count / total) * 100
        bar = "█" * int(pct / 2)
        print(f"{source:40} {count:4} ({pct:5.1f}%) {bar}")
    
    # Source by Role
    print("\n" + "=" * 60)
    print("SOURCE × ROLE BREAKDOWN")
    print("=" * 60)
    source_role = defaultdict(lambda: defaultdict(int))
    for d in data:
        source = d["source"] or "No Source"
        role = d["role"] or "No Role"
        source_role[source][role] += 1
    
    for source, roles in sorted(source_role.items(), key=lambda x: -sum(x[1].values())):
        if sum(roles.values()) < 5:  # Skip tiny sources
            continue
        print(f"\n{source}:")
        for role, count in sorted(roles.items(), key=lambda x: -x[1]):
            print(f"  {role:35} {count}")
    
    # Source quality (by AI score)
    print("\n" + "=" * 60)
    print("SOURCE QUALITY (Average AI Score)")
    print("=" * 60)
    source_scores = defaultdict(list)
    for d in data:
        if d["ai_score"] is not None:
            source = d["source"] or "No Source"
            source_scores[source].append(d["ai_score"])
    
    quality_data = []
    for source, scores in source_scores.items():
        avg = sum(scores) / len(scores)
        high_quality = sum(1 for s in scores if s >= 7)
        quality_data.append({
            "source": source,
            "count": len(scores),
            "avg_score": avg,
            "high_quality": high_quality,
            "high_quality_pct": (high_quality / len(scores)) * 100 if scores else 0
        })
    
    quality_data.sort(key=lambda x: -x["avg_score"])
    print(f"{'Source':40} {'N':>5} {'Avg':>6} {'≥7':>5} {'%≥7':>6}")
    print("-" * 65)
    for q in quality_data:
        if q["count"] >= 3:  # Min sample size
            print(f"{q['source']:40} {q['count']:5} {q['avg_score']:6.2f} {q['high_quality']:5} {q['high_quality_pct']:5.1f}%")
    
    # Funnel analysis by source
    print("\n" + "=" * 60)
    print("SOURCE FUNNEL ANALYSIS")
    print("=" * 60)
    
    # Define funnel stages
    active_statuses = {"Sourced", "CV Review", "1st Interview", "2nd Interview", "3rd Interview", "Offer", "Hired"}
    advanced_statuses = {"2nd Interview", "3rd Interview", "Offer", "Hired"}
    
    source_funnel = defaultdict(lambda: {"total": 0, "active": 0, "advanced": 0})
    for d in data:
        source = d["source"] or "No Source"
        status = d["status"] or ""
        source_funnel[source]["total"] += 1
        if status in active_statuses:
            source_funnel[source]["active"] += 1
        if status in advanced_statuses:
            source_funnel[source]["advanced"] += 1
    
    print(f"{'Source':40} {'Total':>6} {'Active':>7} {'Adv.':>6} {'Conv%':>6}")
    print("-" * 70)
    for source, stats in sorted(source_funnel.items(), key=lambda x: -x[1]["total"]):
        if stats["total"] >= 5:
            conv = (stats["advanced"] / stats["total"]) * 100 if stats["total"] else 0
            print(f"{source:40} {stats['total']:6} {stats['active']:7} {stats['advanced']:6} {conv:5.1f}%")
    
    # Save JSON for visualization
    output = {
        "total_candidates": len(data),
        "source_distribution": dict(source_counts),
        "source_quality": quality_data,
        "source_funnel": dict(source_funnel),
    }
    
    output_path = Path("/Users/martijnbroersma/clawd/reports/source_tracking_data.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2, default=str))
    print(f"\n\nData saved to: {output_path}")

if __name__ == "__main__":
    main()
