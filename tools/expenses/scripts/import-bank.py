#!/usr/bin/env python3
"""
import-bank.py - Import bank statements into expense tracker

Supports:
- ING CSV export
- Rabobank CSV export
- ABN AMRO TXT/CSV export
- Generic CSV (with mapping)

Usage:
    python import-bank.py <bank_file.csv> [--bank=ing|rabo|abn|generic]
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


# Bank-specific column mappings
BANK_MAPPINGS = {
    "ing": {
        "date": "Datum",
        "amount": "Bedrag (EUR)",
        "description": "Naam / Omschrijving",
        "date_format": "%Y%m%d",
        "debit_indicator": "Af"  # "Af Bij" column
    },
    "rabo": {
        "date": "Datum",
        "amount": "Bedrag",
        "description": "Naam tegenpartij",
        "date_format": "%Y-%m-%d",
        "negative_is_expense": True
    },
    "abn": {
        "date": "Transactiedatum",
        "amount": "Transactiebedrag",
        "description": "Naam/Omschrijving",
        "date_format": "%Y%m%d",
        "negative_is_expense": True
    },
    "generic": {
        "date": "date",
        "amount": "amount",
        "description": "description",
        "date_format": "%Y-%m-%d",
        "negative_is_expense": True
    }
}


def load_categories():
    """Load category definitions."""
    with open(TEMPLATES_DIR / "categories.json") as f:
        return json.load(f)["categories"]


def suggest_category(description: str, categories: dict) -> str:
    """Suggest category based on description."""
    text = description.lower()
    for cat_code, cat_data in categories.items():
        for keyword in cat_data.get("keywords", []):
            if keyword.lower() in text:
                return cat_code
    return "OT"  # Default to Other


def parse_amount(amount_str: str) -> float:
    """Parse amount string handling various formats."""
    # Remove currency symbols and whitespace
    amount_str = re.sub(r"[€$\s]", "", amount_str)
    # Handle European format (comma as decimal)
    if "," in amount_str and "." in amount_str:
        amount_str = amount_str.replace(".", "").replace(",", ".")
    elif "," in amount_str:
        amount_str = amount_str.replace(",", ".")
    return float(amount_str)


def import_bank_file(bank_file: Path, bank: str = "generic"):
    """Import bank statement file."""
    if bank not in BANK_MAPPINGS:
        print(f"Unknown bank: {bank}")
        print(f"Supported: {', '.join(BANK_MAPPINGS.keys())}")
        return
    
    mapping = BANK_MAPPINGS[bank]
    categories = load_categories()
    
    # Read bank file
    transactions = []
    with open(bank_file, newline="", encoding="utf-8-sig") as f:
        # Try to detect delimiter
        sample = f.read(1024)
        f.seek(0)
        delimiter = ";" if ";" in sample else ","
        
        reader = csv.DictReader(f, delimiter=delimiter)
        for row in reader:
            # Get date
            date_str = row.get(mapping["date"], "")
            if not date_str:
                continue
            try:
                date = datetime.strptime(date_str.strip(), mapping["date_format"])
            except ValueError:
                print(f"Warning: Could not parse date: {date_str}")
                continue
            
            # Get amount
            amount_str = row.get(mapping["amount"], "0")
            try:
                amount = parse_amount(amount_str)
            except ValueError:
                print(f"Warning: Could not parse amount: {amount_str}")
                continue
            
            # Check if expense (negative amount or debit indicator)
            is_expense = False
            if mapping.get("negative_is_expense"):
                is_expense = amount < 0
                amount = abs(amount)
            elif mapping.get("debit_indicator"):
                debit_col = mapping["debit_indicator"]
                is_expense = row.get("Af Bij", "").strip().lower() == "af"
            
            if not is_expense:
                continue  # Skip income
            
            # Get description
            description = row.get(mapping["description"], "Unknown")
            
            # Suggest category
            category = suggest_category(description, categories)
            
            transactions.append({
                "date": date.strftime("%Y-%m-%d"),
                "amount": amount,
                "description": description,
                "category": category,
                "raw": row
            })
    
    if not transactions:
        print("No expense transactions found in file.")
        return
    
    # Show preview
    print(f"Found {len(transactions)} expense transactions:")
    print()
    
    for t in transactions[:20]:
        cat_name = categories.get(t["category"], {}).get("name", t["category"])
        print(f"  {t['date']} | €{t['amount']:>8.2f} | {t['description'][:40]:40} | {t['category']} ({cat_name})")
    
    if len(transactions) > 20:
        print(f"  ... and {len(transactions) - 20} more")
    
    print()
    response = input("Import these transactions? [y/N]: ")
    if response.lower() != "y":
        print("Aborted.")
        return
    
    # Determine year from first transaction
    year = int(transactions[0]["date"][:4])
    expense_file = BASE_DIR / "data" / str(year) / f"expenses-{year}.csv"
    expense_file.parent.mkdir(parents=True, exist_ok=True)
    
    # Load existing expenses to check for duplicates
    existing = set()
    if expense_file.exists():
        with open(expense_file, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                key = f"{row['date']}|{row['amount']}|{row['vendor']}"
                existing.add(key)
    else:
        # Create new file with headers
        with open(expense_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["date", "amount", "currency", "category", "subcategory", 
                            "vendor", "description", "receipt", "btw_rate", "btw_amount",
                            "payment_method", "notes"])
    
    # Append new transactions
    added = 0
    skipped = 0
    with open(expense_file, "a", newline="") as f:
        writer = csv.writer(f)
        for t in transactions:
            key = f"{t['date']}|{t['amount']}|{t['description'][:50]}"
            if key in existing:
                skipped += 1
                continue
            
            # Calculate BTW (assume 21% for most, 9% for meals)
            btw_rate = 9 if t["category"] == "ML" else 21
            btw_amount = round(t["amount"] - (t["amount"] / (1 + btw_rate / 100)), 2)
            
            writer.writerow([
                t["date"],
                f"{t['amount']:.2f}",
                "EUR",
                t["category"],
                "",  # subcategory
                t["description"][:50],  # vendor (use description)
                t["description"],  # full description
                "",  # receipt
                btw_rate,
                f"{btw_amount:.2f}",
                "bank",
                "auto-imported"
            ])
            added += 1
    
    print(f"✓ Added {added} transactions to {expense_file}")
    if skipped:
        print(f"  (Skipped {skipped} duplicates)")
    print()
    print("Tip: Run 'categorize.py' to improve categorization")
    print("Tip: Review imported transactions and add missing receipts")


def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <bank_file.csv> [--bank=ing|rabo|abn|generic]")
        sys.exit(1)
    
    bank_file = Path(sys.argv[1])
    if not bank_file.exists():
        print(f"File not found: {bank_file}")
        sys.exit(1)
    
    # Parse bank option
    bank = "generic"
    for arg in sys.argv[2:]:
        if arg.startswith("--bank="):
            bank = arg.split("=")[1]
    
    import_bank_file(bank_file, bank)


if __name__ == "__main__":
    main()
