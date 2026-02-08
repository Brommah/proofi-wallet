#!/usr/bin/env python3
"""
monthly-report.py - Generate monthly expense report

Usage:
    python monthly-report.py [YYYY-MM]
    python monthly-report.py  # defaults to current month
"""

import csv
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict

SCRIPT_DIR = Path(__file__).parent
BASE_DIR = SCRIPT_DIR.parent
TEMPLATES_DIR = BASE_DIR / "templates"


def load_categories():
    """Load category definitions."""
    with open(TEMPLATES_DIR / "categories.json") as f:
        return json.load(f)["categories"]


def load_expenses(year: int):
    """Load expenses for a given year."""
    expense_file = BASE_DIR / "data" / str(year) / f"expenses-{year}.csv"
    if not expense_file.exists():
        return []
    
    expenses = []
    with open(expense_file, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["date"]:  # Skip empty rows
                row["amount"] = float(row["amount"]) if row["amount"] else 0
                row["btw_amount"] = float(row["btw_amount"]) if row["btw_amount"] else 0
                row["btw_rate"] = int(row["btw_rate"]) if row["btw_rate"] else 0
                expenses.append(row)
    return expenses


def filter_by_month(expenses, year: int, month: int):
    """Filter expenses for a specific month."""
    return [
        e for e in expenses
        if e["date"].startswith(f"{year}-{month:02d}")
    ]


def generate_report(year: int, month: int):
    """Generate a monthly expense report."""
    categories = load_categories()
    expenses = load_expenses(year)
    monthly = filter_by_month(expenses, year, month)
    
    # Previous month for comparison
    if month == 1:
        prev_year, prev_month = year - 1, 12
    else:
        prev_year, prev_month = year, month - 1
    
    prev_expenses = load_expenses(prev_year)
    prev_monthly = filter_by_month(prev_expenses, prev_year, prev_month)
    
    # Calculate totals
    total = sum(e["amount"] for e in monthly)
    total_btw = sum(e["btw_amount"] for e in monthly)
    count = len(monthly)
    average = total / count if count else 0
    
    prev_total = sum(e["amount"] for e in prev_monthly)
    diff = total - prev_total
    diff_percent = (diff / prev_total * 100) if prev_total else 0
    
    # Category breakdown
    by_category = defaultdict(lambda: {"amount": 0, "btw": 0, "count": 0})
    for e in monthly:
        cat = e["category"]
        by_category[cat]["amount"] += e["amount"]
        by_category[cat]["btw"] += e["btw_amount"]
        by_category[cat]["count"] += 1
    
    # Vendor breakdown
    by_vendor = defaultdict(lambda: {"amount": 0, "count": 0})
    for e in monthly:
        vendor = e["vendor"]
        by_vendor[vendor]["amount"] += e["amount"]
        by_vendor[vendor]["count"] += 1
    
    # Warnings
    warnings = []
    for e in monthly:
        if not e.get("receipt"):
            warnings.append(f"- Missing receipt: {e['date']} - {e['vendor']} (€{e['amount']})")
        if e["amount"] > 500:
            warnings.append(f"- Large expense: {e['date']} - {e['vendor']} (€{e['amount']})")
    
    # Load template
    with open(TEMPLATES_DIR / "monthly-report.md") as f:
        template = f.read()
    
    # Generate category rows
    category_rows = []
    for cat, data in sorted(by_category.items(), key=lambda x: -x[1]["amount"]):
        cat_name = categories.get(cat, {}).get("name", cat)
        percent = (data["amount"] / total * 100) if total else 0
        category_rows.append(
            f"| {cat_name} | €{data['amount']:.2f} | €{data['btw']:.2f} | {percent:.1f}% |"
        )
    
    # Generate vendor rows (top 10)
    vendor_rows = []
    for vendor, data in sorted(by_vendor.items(), key=lambda x: -x[1]["amount"])[:10]:
        vendor_rows.append(
            f"| {vendor} | €{data['amount']:.2f} | {data['count']} |"
        )
    
    # Generate transaction rows
    transaction_rows = []
    for e in sorted(monthly, key=lambda x: x["date"]):
        receipt_status = "✓" if e.get("receipt") else "❌"
        transaction_rows.append(
            f"| {e['date']} | {e['vendor']} | {e['category']} | €{e['amount']:.2f} | {receipt_status} |"
        )
    
    # Format warnings
    if not warnings:
        warnings = ["- None! All good. 🎉"]
    
    # Fill template
    month_name = datetime(year, month, 1).strftime("%B")
    report = template.replace("{{MONTH}}", month_name)
    report = report.replace("{{YEAR}}", str(year))
    report = report.replace("{{GENERATED_DATE}}", datetime.now().strftime("%Y-%m-%d %H:%M"))
    report = report.replace("{{TOTAL}}", f"{total:.2f}")
    report = report.replace("{{TOTAL_BTW}}", f"{total_btw:.2f}")
    report = report.replace("{{COUNT}}", str(count))
    report = report.replace("{{AVERAGE}}", f"{average:.2f}")
    report = report.replace("{{DIFF}}", f"{diff:+.2f}")
    report = report.replace("{{DIFF_PERCENT}}", f"{diff_percent:+.1f}")
    report = report.replace("{{CATEGORY_ROWS}}", "\n".join(category_rows) or "| - | - | - | - |")
    report = report.replace("{{VENDOR_ROWS}}", "\n".join(vendor_rows) or "| - | - | - |")
    report = report.replace("{{TRANSACTION_ROWS}}", "\n".join(transaction_rows) or "| - | - | - | - | - |")
    report = report.replace("{{WARNINGS}}", "\n".join(warnings))
    
    return report


def main():
    # Parse arguments
    if len(sys.argv) > 1:
        try:
            year, month = map(int, sys.argv[1].split("-"))
        except ValueError:
            print(f"Usage: {sys.argv[0]} [YYYY-MM]")
            sys.exit(1)
    else:
        now = datetime.now()
        year, month = now.year, now.month
    
    # Generate report
    report = generate_report(year, month)
    
    # Output
    output_file = BASE_DIR / "data" / str(year) / f"report-{year}-{month:02d}.md"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, "w") as f:
        f.write(report)
    
    print(f"Report generated: {output_file}")
    print()
    print(report)


if __name__ == "__main__":
    main()
