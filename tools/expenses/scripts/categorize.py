#!/usr/bin/env python3
"""
categorize.py - Auto-categorize expenses based on vendor/description keywords

Usage:
    python categorize.py [YYYY]
    python categorize.py --dry-run [YYYY]
"""

import csv
import json
import sys
from datetime import datetime
from pathlib import Path
import re

SCRIPT_DIR = Path(__file__).parent
BASE_DIR = SCRIPT_DIR.parent
TEMPLATES_DIR = BASE_DIR / "templates"


def load_categories():
    """Load category definitions with keywords."""
    with open(TEMPLATES_DIR / "categories.json") as f:
        return json.load(f)["categories"]


def suggest_category(vendor: str, description: str, categories: dict) -> tuple:
    """Suggest a category based on keywords."""
    text = f"{vendor} {description}".lower()
    
    for cat_code, cat_data in categories.items():
        for keyword in cat_data.get("keywords", []):
            if keyword.lower() in text:
                return cat_code, keyword
    
    return None, None


def categorize_expenses(year: int, dry_run: bool = False):
    """Categorize uncategorized expenses."""
    categories = load_categories()
    expense_file = BASE_DIR / "data" / str(year) / f"expenses-{year}.csv"
    
    if not expense_file.exists():
        print(f"No expense file found for {year}")
        return
    
    # Read expenses
    expenses = []
    with open(expense_file, newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            expenses.append(row)
    
    # Process
    changes = []
    for i, expense in enumerate(expenses):
        current_cat = expense.get("category", "").strip()
        vendor = expense.get("vendor", "")
        description = expense.get("description", "")
        
        # Skip if already categorized (unless it's OT/Other)
        if current_cat and current_cat != "OT":
            continue
        
        suggested, keyword = suggest_category(vendor, description, categories)
        if suggested:
            changes.append({
                "index": i,
                "date": expense["date"],
                "vendor": vendor,
                "amount": expense["amount"],
                "old_cat": current_cat or "(none)",
                "new_cat": suggested,
                "keyword": keyword
            })
            if not dry_run:
                expenses[i]["category"] = suggested
    
    # Print changes
    if changes:
        print(f"{'[DRY RUN] ' if dry_run else ''}Found {len(changes)} expenses to categorize:")
        print()
        for c in changes:
            cat_name = categories[c["new_cat"]]["name"]
            print(f"  {c['date']} | {c['vendor'][:30]:30} | €{float(c['amount']):>8.2f}")
            print(f"           {c['old_cat']:>5} → {c['new_cat']} ({cat_name}) [matched: {c['keyword']}]")
            print()
        
        if not dry_run:
            # Write back
            with open(expense_file, "w", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(expenses)
            print(f"✓ Updated {expense_file}")
    else:
        print("No uncategorized expenses found.")


def main():
    dry_run = "--dry-run" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    
    if args:
        try:
            year = int(args[0])
        except ValueError:
            print(f"Usage: {sys.argv[0]} [--dry-run] [YYYY]")
            sys.exit(1)
    else:
        year = datetime.now().year
    
    categorize_expenses(year, dry_run)


if __name__ == "__main__":
    main()
