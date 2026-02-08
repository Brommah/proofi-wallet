#!/usr/bin/env python3
"""Proper source tracking analysis with all sources and both score types."""

import json
import urllib.request
from pathlib import Path
from collections import defaultdict

API_KEY = Path.home().joinpath(".config/notion/api_key").read_text().strip()
DATA_SOURCE_ID = "bc66a818-be72-4ce3-b205-01f35df214c8"

SOURCES = [
    "Inbound: Join",
    "Inbound: Wellfound", 
    "Inbound: Linkedin",
    "Outbound: Linkedin",
    "Inbound: Company Website [unknown]",
    "Referral",
    "Inbound: Recooty",
    "Inbound: Remocate",
    "Outbound: Github",
    "Wellfound: Autopilot",
    "Outbound: Lemlist",
]

def notion_query(filter_obj, cursor=None):
    url = f"https://api.notion.com/v1/data_sources/{DATA_SOURCE_ID}/query"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Notion-Version": "2025-09-03",
        "Content-Type": "application/json"
    }
    data = {"page_size": 100, "filter": filter_obj}
    if cursor:
        data["start_cursor"] = cursor
    
    req = urllib.request.Request(url, json.dumps(data).encode(), headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"  Error: {e}")
        return {"results": [], "has_more": False}

def count_source(source_name):
    """Count candidates for a source with score breakdowns."""
    filter_obj = {
        "and": [
            {"property": "Date Added", "date": {"on_or_after": "2025-01-01"}},
            {"property": "Source", "select": {"equals": source_name}}
        ]
    }
    
    total = 0
    ai_scores = []
    human_scores = []
    roles = defaultdict(int)
    cursor = None
    
    while True:
        resp = notion_query(filter_obj, cursor)
        results = resp.get("results", [])
        total += len(results)
        
        for r in results:
            props = r.get("properties", {})
            
            # AI Score
            ai = props.get("AI Score", {}).get("number")
            if ai is not None:
                ai_scores.append(ai)
            
            # Human Score
            human = props.get("Human Score", {}).get("number")
            if human is not None:
                human_scores.append(human)
            
            # Role
            role_sel = props.get("Role", {}).get("select")
            role = role_sel.get("name") if role_sel else "No Role"
            roles[role] += 1
        
        if not resp.get("has_more"):
            break
        cursor = resp.get("next_cursor")
        print(f"  ...{total} so far")
    
    return {
        "total": total,
        "ai_scored": len(ai_scores),
        "ai_avg": sum(ai_scores)/len(ai_scores) if ai_scores else None,
        "ai_hq": sum(1 for s in ai_scores if s >= 7),
        "human_scored": len(human_scores),
        "human_avg": sum(human_scores)/len(human_scores) if human_scores else None,
        "human_hq": sum(1 for s in human_scores if s >= 7),
        "roles": dict(roles)
    }

def main():
    print("=" * 70)
    print("SOURCE TRACKING ANALYSIS - 2025+ with Source tagged")
    print("=" * 70)
    
    results = {}
    grand_total = 0
    
    for source in SOURCES:
        print(f"\n{source}...")
        stats = count_source(source)
        if stats["total"] > 0:
            results[source] = stats
            grand_total += stats["total"]
            print(f"  Total: {stats['total']}")
            print(f"  AI Scored: {stats['ai_scored']} | Human Scored: {stats['human_scored']}")
    
    print("\n" + "=" * 70)
    print(f"GRAND TOTAL: {grand_total} candidates")
    print("=" * 70)
    
    # Summary table
    print(f"\n{'Source':<35} {'Vol':>6} {'AI#':>5} {'AI Avg':>7} {'Hum#':>5} {'Hum Avg':>8}")
    print("-" * 70)
    
    for source in sorted(results.keys(), key=lambda x: -results[x]["total"]):
        s = results[source]
        ai_avg = f"{s['ai_avg']:.2f}" if s['ai_avg'] else "—"
        hum_avg = f"{s['human_avg']:.2f}" if s['human_avg'] else "—"
        print(f"{source:<35} {s['total']:>6} {s['ai_scored']:>5} {ai_avg:>7} {s['human_scored']:>5} {hum_avg:>8}")
    
    # Save JSON
    output = {"grand_total": grand_total, "sources": results}
    Path("/tmp/source_analysis_v2.json").write_text(json.dumps(output, indent=2))
    print("\nSaved to /tmp/source_analysis_v2.json")

if __name__ == "__main__":
    main()
