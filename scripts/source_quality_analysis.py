#!/usr/bin/env python3
"""Quality metrics analysis - the stuff that actually matters."""

import json
import urllib.request
from pathlib import Path
from collections import defaultdict
import statistics

API_KEY = Path.home().joinpath(".config/notion/api_key").read_text().strip()
DATA_SOURCE_ID = "bc66a818-be72-4ce3-b205-01f35df214c8"

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
        return {"results": [], "has_more": False}

def get_all_candidates_with_scores():
    """Get all 2025+ candidates with source, filter for scores in Python."""
    filter_obj = {
        "and": [
            {"property": "Date Added", "date": {"on_or_after": "2025-01-01"}},
            {"property": "Source", "select": {"is_not_empty": True}}
        ]
    }
    
    all_candidates = []
    cursor = None
    page = 0
    
    while True:
        page += 1
        resp = notion_query(filter_obj, cursor)
        results = resp.get("results", [])
        
        for r in results:
            props = r.get("properties", {})
            
            # Extract all relevant fields
            source_sel = props.get("Source", {}).get("select")
            role_sel = props.get("Role", {}).get("select")
            status_obj = props.get("Status", {}).get("status")
            
            candidate = {
                "source": source_sel.get("name") if source_sel else None,
                "role": role_sel.get("name") if role_sel else None,
                "status": status_obj.get("name") if status_obj else None,
                "ai_score": props.get("AI Score", {}).get("number"),
                "human_score": props.get("Human Score", {}).get("number"),
                "interview_score": props.get("Interview Score", {}).get("number"),
                "interview_score_alt": props.get("Interview Score (1-10)", {}).get("number"),
            }
            # Use alt interview score if main is missing
            if candidate["interview_score"] is None:
                candidate["interview_score"] = candidate["interview_score_alt"]
            
            # Only keep if at least one score exists
            if candidate["ai_score"] is not None or candidate["human_score"] is not None or candidate["interview_score"] is not None:
                all_candidates.append(candidate)
        
        print(f"  Page {page}: {len(results)} fetched, {len(all_candidates)} with scores")
        
        if not resp.get("has_more"):
            break
        cursor = resp.get("next_cursor")
    
    return all_candidates

def analyze_by_source(candidates):
    """Analyze quality metrics by source."""
    by_source = defaultdict(lambda: {
        "total": 0, "ai_scores": [], "human_scores": [], "interview_scores": [],
        "roles": defaultdict(int), "statuses": defaultdict(int)
    })
    
    for c in candidates:
        src = c["source"] or "Unknown"
        by_source[src]["total"] += 1
        
        if c["ai_score"] is not None:
            by_source[src]["ai_scores"].append(c["ai_score"])
        if c["human_score"] is not None:
            by_source[src]["human_scores"].append(c["human_score"])
        if c["interview_score"] is not None:
            by_source[src]["interview_scores"].append(c["interview_score"])
        
        if c["role"]:
            by_source[src]["roles"][c["role"]] += 1
        if c["status"]:
            by_source[src]["statuses"][c["status"]] += 1
    
    return by_source

def analyze_by_role(candidates):
    """Analyze quality metrics by role."""
    by_role = defaultdict(lambda: {
        "total": 0, "ai_scores": [], "human_scores": [], "interview_scores": [],
        "sources": defaultdict(int)
    })
    
    for c in candidates:
        role = c["role"] or "No Role"
        by_role[role]["total"] += 1
        
        if c["ai_score"] is not None:
            by_role[role]["ai_scores"].append(c["ai_score"])
        if c["human_score"] is not None:
            by_role[role]["human_scores"].append(c["human_score"])
        if c["interview_score"] is not None:
            by_role[role]["interview_scores"].append(c["interview_score"])
        
        if c["source"]:
            by_role[role]["sources"][c["source"]] += 1
    
    return by_role

def calc_stats(scores):
    """Calculate statistics for a list of scores."""
    if not scores:
        return {"n": 0, "avg": None, "med": None, "std": None, "hq": 0, "hq_pct": 0}
    
    return {
        "n": len(scores),
        "avg": round(sum(scores) / len(scores), 2),
        "med": round(statistics.median(scores), 2),
        "std": round(statistics.stdev(scores), 2) if len(scores) > 1 else 0,
        "hq": sum(1 for s in scores if s >= 7),
        "hq_pct": round(100 * sum(1 for s in scores if s >= 7) / len(scores), 1)
    }

def score_correlation(candidates):
    """Calculate correlation between AI, Human, and Interview scores."""
    pairs_ai_human = [(c["ai_score"], c["human_score"]) 
                      for c in candidates 
                      if c["ai_score"] is not None and c["human_score"] is not None]
    
    pairs_ai_interview = [(c["ai_score"], c["interview_score"]) 
                          for c in candidates 
                          if c["ai_score"] is not None and c["interview_score"] is not None]
    
    pairs_human_interview = [(c["human_score"], c["interview_score"]) 
                             for c in candidates 
                             if c["human_score"] is not None and c["interview_score"] is not None]
    
    def pearson(pairs):
        if len(pairs) < 3:
            return None
        x = [p[0] for p in pairs]
        y = [p[1] for p in pairs]
        n = len(pairs)
        mean_x, mean_y = sum(x)/n, sum(y)/n
        num = sum((x[i]-mean_x)*(y[i]-mean_y) for i in range(n))
        den = (sum((xi-mean_x)**2 for xi in x) * sum((yi-mean_y)**2 for yi in y)) ** 0.5
        return round(num/den, 3) if den > 0 else 0
    
    return {
        "ai_human": {"n": len(pairs_ai_human), "r": pearson(pairs_ai_human)},
        "ai_interview": {"n": len(pairs_ai_interview), "r": pearson(pairs_ai_interview)},
        "human_interview": {"n": len(pairs_human_interview), "r": pearson(pairs_human_interview)}
    }

def main():
    print("=" * 80)
    print("QUALITY METRICS ANALYSIS - 2025+ Candidates with Scores")
    print("=" * 80)
    
    print("\nFetching candidates...")
    candidates = get_all_candidates_with_scores()
    print(f"\nTotal candidates with at least one score: {len(candidates)}")
    
    # By Source Analysis
    print("\n" + "=" * 80)
    print("QUALITY BY SOURCE - Which channel brings the best candidates?")
    print("=" * 80)
    
    by_source = analyze_by_source(candidates)
    
    print(f"\n{'Source':<35} {'N':>5} {'AI Avg':>7} {'AI HQ%':>7} {'Hum Avg':>8} {'Int Avg':>8}")
    print("-" * 80)
    
    source_data = []
    for src in sorted(by_source.keys(), key=lambda x: -by_source[x]["total"]):
        s = by_source[src]
        ai = calc_stats(s["ai_scores"])
        hum = calc_stats(s["human_scores"])
        intv = calc_stats(s["interview_scores"])
        
        source_data.append({
            "source": src,
            "total": s["total"],
            "ai": ai,
            "human": hum,
            "interview": intv,
            "roles": dict(s["roles"]),
            "statuses": dict(s["statuses"])
        })
        
        ai_avg = f"{ai['avg']:.2f}" if ai['avg'] else "—"
        ai_hq = f"{ai['hq_pct']}%" if ai['n'] > 0 else "—"
        hum_avg = f"{hum['avg']:.2f}" if hum['avg'] else "—"
        intv_avg = f"{intv['avg']:.2f}" if intv['avg'] else "—"
        
        print(f"{src:<35} {s['total']:>5} {ai_avg:>7} {ai_hq:>7} {hum_avg:>8} {intv_avg:>8}")
    
    # By Role Analysis
    print("\n" + "=" * 80)
    print("QUALITY BY ROLE - Which job description works best?")
    print("=" * 80)
    
    by_role = analyze_by_role(candidates)
    
    print(f"\n{'Role':<35} {'N':>5} {'AI Avg':>7} {'AI HQ%':>7} {'Hum Avg':>8} {'Int Avg':>8}")
    print("-" * 80)
    
    role_data = []
    for role in sorted(by_role.keys(), key=lambda x: -by_role[x]["total"]):
        r = by_role[role]
        ai = calc_stats(r["ai_scores"])
        hum = calc_stats(r["human_scores"])
        intv = calc_stats(r["interview_scores"])
        
        role_data.append({
            "role": role,
            "total": r["total"],
            "ai": ai,
            "human": hum,
            "interview": intv,
            "sources": dict(r["sources"])
        })
        
        ai_avg = f"{ai['avg']:.2f}" if ai['avg'] else "—"
        ai_hq = f"{ai['hq_pct']}%" if ai['n'] > 0 else "—"
        hum_avg = f"{hum['avg']:.2f}" if hum['avg'] else "—"
        intv_avg = f"{intv['avg']:.2f}" if intv['avg'] else "—"
        
        print(f"{role:<35} {r['total']:>5} {ai_avg:>7} {ai_hq:>7} {hum_avg:>8} {intv_avg:>8}")
    
    # Score Correlations
    print("\n" + "=" * 80)
    print("SCORE CORRELATIONS - How does interview performance correlate?")
    print("=" * 80)
    
    corr = score_correlation(candidates)
    print(f"\nAI ↔ Human:     r = {corr['ai_human']['r']} (n={corr['ai_human']['n']})")
    print(f"AI ↔ Interview: r = {corr['ai_interview']['r']} (n={corr['ai_interview']['n']})")
    print(f"Human ↔ Interview: r = {corr['human_interview']['r']} (n={corr['human_interview']['n']})")
    
    # Save full data
    output = {
        "total_candidates": len(candidates),
        "by_source": source_data,
        "by_role": role_data,
        "correlations": corr,
        "raw_candidates": candidates[:100]  # Sample for debugging
    }
    
    out_path = Path("/tmp/quality_analysis.json")
    out_path.write_text(json.dumps(output, indent=2, default=str))
    print(f"\n\nFull data saved to: {out_path}")

if __name__ == "__main__":
    main()
