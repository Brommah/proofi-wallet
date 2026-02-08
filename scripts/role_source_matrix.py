#!/usr/bin/env python3
"""Role × Source quality matrix - find best matches."""

import json
from pathlib import Path
from collections import defaultdict

# Load the quality analysis data
data = json.loads(Path("/tmp/quality_analysis.json").read_text())

# Build role × source matrix
matrix = defaultdict(lambda: defaultdict(lambda: {"n": 0, "ai_scores": [], "human_scores": []}))

for candidate in data.get("raw_candidates", []):
    src = candidate.get("source") or "Unknown"
    role = candidate.get("role") or "No Role"
    
    matrix[role][src]["n"] += 1
    if candidate.get("ai_score") is not None:
        matrix[role][src]["ai_scores"].append(candidate["ai_score"])
    if candidate.get("human_score") is not None:
        matrix[role][src]["human_scores"].append(candidate["human_score"])

# We need more data - the raw_candidates only has 100 samples
# Let's use the aggregated data instead
print("=" * 90)
print("ROLE × SOURCE QUALITY MATRIX")
print("Best platform for each role")
print("=" * 90)

# Restructure by_source data for role analysis
role_source_quality = defaultdict(dict)

for src_data in data.get("by_source", []):
    src = src_data["source"]
    ai_avg = src_data["ai"]["avg"]
    ai_hq = src_data["ai"]["hq_pct"]
    roles = src_data.get("roles", {})
    
    for role, count in roles.items():
        if count >= 5:  # Minimum sample
            role_source_quality[role][src] = {
                "n": count,
                "ai_avg": ai_avg,  # Source-level avg (approximation)
                "ai_hq": ai_hq
            }

print(f"\n{'Role':<30} {'Best Source':<25} {'N':>6} {'AI Avg':>8} {'HQ%':>6}")
print("-" * 90)

for role in sorted(role_source_quality.keys()):
    sources = role_source_quality[role]
    if sources:
        # Find best source by HQ rate
        best = max(sources.items(), key=lambda x: x[1].get("ai_hq", 0) if x[1]["n"] >= 10 else 0)
        src_name, stats = best
        print(f"{role:<30} {src_name:<25} {stats['n']:>6} {stats['ai_avg'] or 0:>8.2f} {stats['ai_hq'] or 0:>5.1f}%")

# Full matrix
print("\n" + "=" * 90)
print("FULL MATRIX: Count by Role × Source")
print("=" * 90)

# Get all sources and roles
all_sources = set()
all_roles = set()
for src_data in data.get("by_source", []):
    all_sources.add(src_data["source"])
    for role in src_data.get("roles", {}).keys():
        all_roles.add(role)

# Print header
sources_list = sorted(all_sources, key=lambda x: -sum(s.get("roles", {}).get(x, 0) for s in data.get("by_source", [])))[:6]
print(f"\n{'Role':<25}", end="")
for src in sources_list:
    short_src = src.replace("Inbound: ", "").replace("Outbound: ", "Out:")[:12]
    print(f"{short_src:>14}", end="")
print()
print("-" * (25 + 14 * len(sources_list)))

for role in sorted(all_roles):
    print(f"{role[:24]:<25}", end="")
    for src in sources_list:
        # Find count for this role/source combo
        count = 0
        for src_data in data.get("by_source", []):
            if src_data["source"] == src:
                count = src_data.get("roles", {}).get(role, 0)
                break
        print(f"{count:>14}", end="")
    print()

print("\n" + "=" * 90)
print("RECOMMENDATIONS BY ROLE")
print("=" * 90)

recommendations = {
    "AI Engineer": "Join has volume (679) but low quality. Test scaling Outbound LinkedIn for this role.",
    "AI Innovator": "Join (368) dominates but quality is poor (3.82 avg). Outbound LI (23) shows promise - scale it.",
    "Principal Fullstack Engineer": "Wellfound (126) and Join (132) similar volume. Test which has better conversion.",
}

for role, rec in recommendations.items():
    print(f"\n{role}:")
    print(f"  → {rec}")
