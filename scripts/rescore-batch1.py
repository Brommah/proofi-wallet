#!/usr/bin/env python3
"""Re-score 50 candidates via HR pipeline API, sequentially."""

import json
import re
import time
import urllib.request
import sys
import os

API = "https://hr-funnel-monitor-production.up.railway.app/api/reevaluate"
RESULTS_FILE = "/Users/martijnbroersma/clawd/reports/gemini3-rescore-batch1.jsonl"
REPORT_FILE = "/Users/martijnbroersma/clawd/reports/gemini3-rescore-batch1.md"

os.makedirs(os.path.dirname(RESULTS_FILE), exist_ok=True)

candidates = [
    ("2f3d8000-83d6-81ff-b59f-f6ce2515e2c5", "Konstantin Zhivotov", "AI Innovator"),
    ("2f3d8000-83d6-812d-8e0a-e28f6002e0c0", "Preeti Parihar", "AI Innovator"),
    ("2f4d8000-83d6-81f1-8fc4-f0d1e809fb50", "Akarsh Reddy Tatimakula", "AI Engineer"),
    ("2f4d8000-83d6-815e-ac79-fe21b18f4b42", "Nash Ashworth", "AI Innovator"),
    ("2f4d8000-83d6-8133-8160-e08628b00637", "Ajith Vemuri", "Principal Fullstack Engineer"),
    ("2f4d8000-83d6-81f7-b326-e6e137247efa", "Pavan Thota", "AI Innovator"),
    ("2f4d8000-83d6-81ff-be45-c6f8a16121aa", "Chandrakant Bagewadi", "Principal Fullstack Engineer"),
    ("2f6d8000-83d6-8167-8e52-d6c390f032d9", "Cedric Ogire", "Blockchain Engineer"),
    ("2f6d8000-83d6-8175-864b-ff2f6bfdb4a1", "Manuel", "AI Engineer"),
    ("2f6d8000-83d6-815a-9d8e-dcfc71240fcd", "Rajkumar", "AI Engineer"),
    ("2f6d8000-83d6-8116-8370-f931f2ffeb9f", "Dhieddine Barhoumi", "AI Engineer"),
    ("2f6d8000-83d6-81d0-9fb7-e983b282b22f", "Hany Almnaem", "AI Engineer"),
    ("2f6d8000-83d6-8177-b9ca-fb68448d8394", "Leticia Azevedo", "AI Engineer"),
    ("2f6d8000-83d6-8114-90dd-f9992f1f38cb", "Sravanthi Reddy", "AI Engineer"),
    ("2f3d8000-83d6-8125-b3f8-e12454a0bc94", "Haochen Li", "AI Innovator"),
    ("2f4d8000-83d6-8148-8fb5-d1d532c6c41d", "Kirandevraj R", "AI Innovator"),
    ("2f6d8000-83d6-8179-8645-ddf87d5e2a76", "Abhineet Pandey", "AI Engineer"),
    ("2f6d8000-83d6-8132-bda1-d5fa78b48579", "S Kabir", "AI Engineer"),
    ("2f6d8000-83d6-8179-af5e-f54a0ec7db23", "Tilek Maksatbekov", "Founder's Associate (Business Ops)"),
    ("2f6d8000-83d6-8177-8a9f-cef750f8129e", "Marcel Hadwiger", "Founder's Associate (Business Ops)"),
    ("2edd8000-83d6-81d0-bff1-e513dd67f2ba", "Lukas Walliser", "Founder's Associate (Business Ops)"),
    ("2e7d8000-83d6-807d-bc27-c0b59dbe8d9e", "Haichuan Wei (Arthur)", "AI Innovator"),
    ("2f1d8000-83d6-808b-ae95-e716bd9702fb", "Melvin Tercan", "AI Innovator"),
    ("2ecd8000-83d6-81ce-ae78-f7bd5ce1d539", "Zakaria Saif", "Blockchain Engineer"),
    ("2b5d8000-83d6-81aa-b4ee-c58eb1133327", "Ayush Bajpai", "AI Innovator"),
    ("2b2d8000-83d6-81e0-a384-c3a877b424f6", "Kiran Devihosur", "AI Innovator"),
    ("2abd8000-83d6-806d-886d-f2bf4c7fc4dc", "Naman Patel", "Principal Fullstack Engineer"),
    ("2a9d8000-83d6-81c9-b7ca-ee5d32b186a5", "Matthew Work", "AI Innovator"),
    ("2a0d8000-83d6-8128-8218-cb4394750476", "Joep Gommers", "AI Innovator"),
    ("29dd8000-83d6-8190-b205-d2000769b3f7", "Yi Mao", "Principal Fullstack Engineer"),
    ("27dd8000-83d6-812f-9d3e-dd87edc84412", "Deepti Ahlawat", "AI Engineer"),
    ("277d8000-83d6-81c6-ba30-f2c99d20ea89", "Venkatesh Ramavath", "AI Engineer"),
    ("24ed8000-83d6-8000-b7c0-df2f30afb5b7", "Farah Fatima", ""),
    ("24cd8000-83d6-80fe-9958-d83771738ee0", "Khachatur Gharibyan", "Principal Fullstack Engineer"),
    ("249d8000-83d6-80fb-ba22-d262e777bc11", "Jacob Rafati", "AI Innovator"),
    ("246d8000-83d6-81a6-a7ce-eb69a85da936", "Maksym Ivashchenko", "Principal Fullstack Engineer"),
    ("242d8000-83d6-81b2-a4c6-fe7d2bec6001", "Avimukta Malakar", ""),
    ("241d8000-83d6-8187-8777-c4a66d2eef78", "Julianna Kulesova", ""),
    ("241d8000-83d6-808c-84c7-f060ead28a1a", "Lisa Lomadze", ""),
    ("23cd8000-83d6-81b7-89d9-d311a2a91762", "Dunja Maria Darmer", ""),
    ("1dfd8000-83d6-8041-9a70-d961220900fc", "Juan Paulino Garcia", "AI Innovator"),
    ("1ddd8000-83d6-811d-820f-f6be1e5a49e5", "Sash Saseetharran", "AI Innovator"),
    ("1d6d8000-83d6-8000-b648-eb7f0354c184", "Jonathon Ong", "AI Innovator"),
    ("1c9d8000-83d6-80c9-bbf3-cc1cef25cf56", "Arnav Wadhwa", "AI Innovator"),
    ("270d8000-83d6-8172-b469-f974b6f71490", "Ken Wu", "Founder's Associate"),
    ("270d8000-83d6-8162-b600-edc1000e4d4a", "Lamiaa Maguerra", "Founder's Associate"),
    ("270d8000-83d6-815e-8b31-f9265785c7ff", "Ken Wu", "Founder's Associate"),
    ("270d8000-83d6-815c-b9b0-cd7f9642bd0e", "Jayati Chandra", "Founder's Associate"),
    ("270d8000-83d6-8121-bb2b-fc3f9ac6cf17", "Jayati Chandra", "Founder's Associate"),
    ("26fd8000-83d6-81f3-9909-ffe915d67643", "Moheeb Ahmed", "Founder's Associate"),
]

results = []

# Check if we have partial results from a previous run
start_idx = 0
if os.path.exists(RESULTS_FILE):
    with open(RESULTS_FILE) as f:
        existing = [json.loads(line) for line in f if line.strip()]
        if existing:
            start_idx = len(existing)
            results = existing
            print(f"Resuming from candidate {start_idx + 1} (found {start_idx} existing results)")

total = len(candidates)
print(f"Processing {total - start_idx} candidates (total: {total})...")
print(f"Started at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
sys.stdout.flush()

jsonl_f = open(RESULTS_FILE, 'a')

for i in range(start_idx, total):
    page_id, name, role = candidates[i]
    num = i + 1
    print(f"[{num}/{total}] {name} ({role}) - {page_id}")
    sys.stdout.flush()

    try:
        req = urllib.request.Request(
            f"{API}/{page_id}",
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            body = json.loads(resp.read().decode())
            http_code = resp.status
    except urllib.error.HTTPError as e:
        body = {"error": str(e), "body": e.read().decode()[:500]}
        http_code = e.code
    except Exception as e:
        body = {"error": str(e)}
        http_code = 0

    # Extract old score from logs
    old_score = "N/A"
    new_score = body.get("newScore", "N/A")
    logs = body.get("logs", [])
    for log in logs:
        m = re.search(r"Current AI Score:\s*(\S+)", log)
        if m:
            old_score = m.group(1)
            break

    result = {
        "idx": num,
        "id": page_id,
        "name": name,
        "role": role,
        "http": http_code,
        "old_score": old_score,
        "new_score": new_score,
        "ok": body.get("ok", False),
    }
    results.append(result)
    jsonl_f.write(json.dumps(result) + "\n")
    jsonl_f.flush()

    status = "✅" if body.get("ok") else "❌"
    print(f"  {status} Old: {old_score} → New: {new_score} (HTTP {http_code})")
    sys.stdout.flush()

jsonl_f.close()

# Generate markdown report
print(f"\nGenerating report...")

lines = [
    "# Gemini 3 Flash Preview — Re-score Batch 1",
    "",
    f"**Date:** {time.strftime('%Y-%m-%d %H:%M')}",
    f"**Model:** Gemini 3 Flash Preview (via HR pipeline)",
    f"**Candidates processed:** {len(results)}",
    "",
    "## Results",
    "",
    "| # | Candidate | Role | Old Score | New Score | Δ | Status |",
    "|---|-----------|------|-----------|-----------|---|--------|",
]

changed = 0
errors = 0
for r in results:
    old = r["old_score"]
    new = r["new_score"]
    try:
        delta = int(new) - int(old)
        delta_str = f"+{delta}" if delta > 0 else str(delta)
        if delta != 0:
            changed += 1
    except (ValueError, TypeError):
        delta_str = "—"
    
    status = "✅" if r.get("ok") or r["http"] == 200 else "❌"
    if status == "❌":
        errors += 1
    
    lines.append(f"| {r['idx']} | {r['name']} | {r['role']} | {old} | {new} | {delta_str} | {status} |")

lines.extend([
    "",
    "## Summary",
    "",
    f"- **Total processed:** {len(results)}",
    f"- **Score changed:** {changed}",
    f"- **Errors:** {errors}",
    f"- **Unchanged:** {len(results) - changed - errors}",
])

with open(REPORT_FILE, 'w') as f:
    f.write("\n".join(lines) + "\n")

print(f"Report saved to: {REPORT_FILE}")
print(f"Completed at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
