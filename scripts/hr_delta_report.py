#!/usr/bin/env python3
"""HR AI Scoring Delta Report Generator"""
import json
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

NOTION_KEY = Path("~/.config/notion/api_key").expanduser().read_text().strip()
DB_ID = "112d800083d6805ca3aae21ec2741ba7"
STATE_FILE = Path(__file__).parent.parent / "memory" / "hr-ai-delta-state.json"

# Previous state
prev_state = json.loads(STATE_FILE.read_text()) if STATE_FILE.exists() else {}
prev_mae = prev_state.get("maeByRole", {})

def query_notion():
    """Query candidates with both AI and Human scores."""
    result = subprocess.run([
        "curl", "-s", "-X", "POST",
        f"https://api.notion.com/v1/databases/{DB_ID}/query",
        "-H", f"Authorization: Bearer {NOTION_KEY}",
        "-H", "Notion-Version: 2022-06-28",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({
            "filter": {
                "and": [
                    {"property": "AI Score", "number": {"is_not_empty": True}},
                    {"property": "Human Score", "number": {"is_not_empty": True}}
                ]
            },
            "sorts": [{"timestamp": "created_time", "direction": "descending"}],
            "page_size": 100
        })
    ], capture_output=True, text=True)
    return json.loads(result.stdout)

def normalize_role(role):
    """Map full role names to short names."""
    role_lower = role.lower()
    if "principal" in role_lower:
        return "Principal"
    elif "ai innovator" in role_lower or "ai" in role_lower and "innov" in role_lower:
        return "AI Innovator"
    elif "blockchain" in role_lower:
        return "Blockchain"
    elif "founder" in role_lower or "fa" in role_lower or "business ops" in role_lower:
        return "FA"
    return role

def extract_candidate(r):
    """Extract candidate data from Notion result."""
    props = r.get("properties", {})
    title_parts = props.get("Name", {}).get("title", [])
    name = title_parts[0]["plain_text"] if title_parts else "Unknown"
    
    ai = props.get("AI Score", {}).get("number", 0)
    human = props.get("Human Score", {}).get("number", 0)
    
    # Get role from select property
    role_raw = "Unknown"
    role_prop = props.get("Role", {})
    if role_prop.get("type") == "select" and role_prop.get("select"):
        role_raw = role_prop["select"]["name"]
    
    created = r.get("created_time", "")
    
    return {
        "name": name,
        "ai": ai,
        "human": human,
        "delta": abs(ai - human),
        "role_raw": role_raw,
        "role": normalize_role(role_raw),
        "created": created
    }

def main():
    data = query_notion()
    results = data.get("results", [])
    
    candidates = [extract_candidate(r) for r in results]
    
    # Group by normalized role
    by_role = defaultdict(list)
    for c in candidates:
        by_role[c["role"]].append(c)
    
    # Calculate MAE for last 10 per role
    role_order = ["Principal", "AI Innovator", "Blockchain", "FA"]
    role_stats = {}
    
    for role in role_order:
        cands = by_role.get(role, [])[:10]
        n = len(cands)
        mae = sum(c["delta"] for c in cands) / n if n > 0 else 0
        
        prev = prev_mae.get(role, None)
        if prev is not None:
            diff = mae - prev
            if abs(diff) < 0.05:
                arrow = "→0"
            elif diff < 0:
                arrow = f"↓{abs(diff):.1f}"
            else:
                arrow = f"↑{diff:.1f}"
        else:
            arrow = "— baseline"
        
        if mae > 3:
            status = "🔴"
        elif mae > 2:
            status = "⚠️"
        else:
            status = "✅"
        
        role_stats[role] = {"n": n, "mae": round(mae, 2), "arrow": arrow, "status": status}
    
    # Overall
    total_n = sum(s["n"] for s in role_stats.values())
    total_mae = sum(s["mae"] * s["n"] for s in role_stats.values()) / total_n if total_n > 0 else 0
    
    # Output
    output = {
        "role_stats": role_stats,
        "total_n": total_n,
        "overall_mae": round(total_mae, 2),
        "last_10": [{
            "name": c["name"],
            "ai": c["ai"],
            "human": c["human"],
            "delta": c["delta"],
            "role": c["role"]
        } for c in candidates[:10]],
        "new_state": {
            "maeByRole": {role: s["mae"] for role, s in role_stats.items()},
            "totalCandidates": total_n
        }
    }
    
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
