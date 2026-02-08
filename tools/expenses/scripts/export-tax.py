#!/usr/bin/env python3
"""
export-tax.py - Export expenses for tax purposes

Usage:
    python export-tax.py [YYYY]
    python export-tax.py  # defaults to current year
"""

import csv
import json
import sys
from datetime import datetime
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
        print(f"No expense file found for {year}")
        return []
    
    expenses = []
    with open(expense_file, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["date"]:
                row["amount"] = float(row["amount"]) if row["amount"] else 0
                row["btw_amount"] = float(row["btw_amount"]) if row["btw_amount"] else 0
                row["btw_rate"] = int(row["btw_rate"]) if row["btw_rate"] else 0
                expenses.append(row)
    return expenses


def export_for_tax(year: int):
    """Generate tax-ready exports."""
    categories = load_categories()
    expenses = load_expenses(year)
    
    if not expenses:
        return
    
    # Filter out private expenses
    business_expenses = [e for e in expenses if e["category"] not in ["PR", "MX"]]
    
    output_dir = BASE_DIR / "data" / str(year) / "tax-export"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Summary by category (for belastingaangifte)
    by_category = defaultdict(lambda: {"amount": 0, "btw": 0, "excl_btw": 0, "count": 0})
    for e in business_expenses:
        cat = e["category"]
        by_category[cat]["amount"] += e["amount"]
        by_category[cat]["btw"] += e["btw_amount"]
        by_category[cat]["excl_btw"] += e["amount"] - e["btw_amount"]
        by_category[cat]["count"] += 1
    
    with open(output_dir / "summary-by-category.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Category", "Category Name", "Amount (incl BTW)", "BTW", "Amount (excl BTW)", "Count"])
        for cat in sorted(by_category.keys()):
            data = by_category[cat]
            cat_name = categories.get(cat, {}).get("name", cat)
            writer.writerow([
                cat, cat_name,
                f"{data['amount']:.2f}",
                f"{data['btw']:.2f}",
                f"{data['excl_btw']:.2f}",
                data["count"]
            ])
        # Totals
        total_amount = sum(d["amount"] for d in by_category.values())
        total_btw = sum(d["btw"] for d in by_category.values())
        total_excl = sum(d["excl_btw"] for d in by_category.values())
        total_count = sum(d["count"] for d in by_category.values())
        writer.writerow([])
        writer.writerow(["TOTAL", "", f"{total_amount:.2f}", f"{total_btw:.2f}", f"{total_excl:.2f}", total_count])
    
    print(f"✓ Created: {output_dir / 'summary-by-category.csv'}")
    
    # 2. BTW summary (for BTW aangifte)
    by_btw_rate = defaultdict(lambda: {"amount": 0, "btw": 0})
    for e in business_expenses:
        rate = e["btw_rate"]
        by_btw_rate[rate]["amount"] += e["amount"]
        by_btw_rate[rate]["btw"] += e["btw_amount"]
    
    with open(output_dir / "btw-summary.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["BTW Rate", "Amount (incl BTW)", "BTW Amount", "Amount (excl BTW)"])
        for rate in sorted(by_btw_rate.keys()):
            data = by_btw_rate[rate]
            excl = data["amount"] - data["btw"]
            writer.writerow([f"{rate}%", f"{data['amount']:.2f}", f"{data['btw']:.2f}", f"{excl:.2f}"])
        # Total
        writer.writerow([])
        writer.writerow(["TOTAL", f"{total_amount:.2f}", f"{total_btw:.2f}", f"{total_excl:.2f}"])
    
    print(f"✓ Created: {output_dir / 'btw-summary.csv'}")
    
    # 3. Quarterly summary
    by_quarter = defaultdict(lambda: {"amount": 0, "btw": 0})
    for e in business_expenses:
        month = int(e["date"].split("-")[1])
        quarter = (month - 1) // 3 + 1
        by_quarter[quarter]["amount"] += e["amount"]
        by_quarter[quarter]["btw"] += e["btw_amount"]
    
    with open(output_dir / "quarterly-summary.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Quarter", "Amount (incl BTW)", "BTW Amount"])
        for q in range(1, 5):
            data = by_quarter[q]
            writer.writerow([f"Q{q}", f"{data['amount']:.2f}", f"{data['btw']:.2f}"])
        writer.writerow([])
        writer.writerow(["TOTAL", f"{total_amount:.2f}", f"{total_btw:.2f}"])
    
    print(f"✓ Created: {output_dir / 'quarterly-summary.csv'}")
    
    # 4. Full detail export (for accountant)
    with open(output_dir / "full-expenses.csv", "w", newline="") as f:
        fieldnames = ["date", "amount", "amount_excl_btw", "btw_rate", "btw_amount", 
                      "category", "category_name", "vendor", "description", "receipt", "payment_method", "notes"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for e in sorted(business_expenses, key=lambda x: x["date"]):
            writer.writerow({
                "date": e["date"],
                "amount": f"{e['amount']:.2f}",
                "amount_excl_btw": f"{e['amount'] - e['btw_amount']:.2f}",
                "btw_rate": f"{e['btw_rate']}%",
                "btw_amount": f"{e['btw_amount']:.2f}",
                "category": e["category"],
                "category_name": categories.get(e["category"], {}).get("name", e["category"]),
                "vendor": e["vendor"],
                "description": e["description"],
                "receipt": e.get("receipt", ""),
                "payment_method": e["payment_method"],
                "notes": e.get("notes", "")
            })
    
    print(f"✓ Created: {output_dir / 'full-expenses.csv'}")
    
    # 5. Print summary
    print()
    print(f"=== Tax Export Summary for {year} ===")
    print()
    print(f"Total business expenses: €{total_amount:.2f}")
    print(f"Total BTW (aftrekbaar):  €{total_btw:.2f}")
    print(f"Total excl. BTW:         €{total_excl:.2f}")
    print(f"Number of transactions:  {total_count}")
    print()
    print("By category:")
    for cat in sorted(by_category.keys(), key=lambda c: -by_category[c]["amount"]):
        data = by_category[cat]
        cat_name = categories.get(cat, {}).get("name", cat)
        print(f"  {cat_name:30} €{data['amount']:>10.2f}")
    print()
    print(f"Files exported to: {output_dir}")


def main():
    if len(sys.argv) > 1:
        try:
            year = int(sys.argv[1])
        except ValueError:
            print(f"Usage: {sys.argv[0]} [YYYY]")
            sys.exit(1)
    else:
        year = datetime.now().year
    
    export_for_tax(year)


if __name__ == "__main__":
    main()
