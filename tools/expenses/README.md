# 💰 Expense Tracking System

Simpel, privacy-vriendelijk expense tracking systeem voor ZZP/freelance.

## Quick Start

```bash
# 1. Setup voor dit jaar
mkdir -p data/2025/receipts
cp templates/expense-template.csv data/2025/expenses-2025.csv

# 2. Voeg expense toe
./scripts/add-expense.sh

# 3. Genereer maandrapport
python scripts/monthly-report.py 2025-06

# 4. Export voor belasting
python scripts/export-tax.py 2025
```

## Directory Structure

```
expenses/
├── data/
│   └── 2025/
│       ├── expenses-2025.csv    # Alle expenses
│       ├── receipts/            # Bonnetjes
│       │   └── 2025-06/
│       └── tax-export/          # Belasting exports
├── templates/
│   ├── expense-template.csv     # Lege template
│   ├── categories.json          # Categorie definities
│   └── monthly-report.md        # Report template
└── scripts/
    ├── add-expense.sh           # CLI om expense toe te voegen
    ├── monthly-report.py        # Genereer maandrapport
    ├── export-tax.py            # Export voor belasting
    ├── categorize.py            # Auto-categorisatie
    └── import-bank.py           # Bank statement import
```

## Scripts

### add-expense.sh
Interactieve CLI om snel een expense toe te voegen.

```bash
./scripts/add-expense.sh
# Of met argumenten:
./scripts/add-expense.sh 29.00 "TransIP" SW
```

### monthly-report.py
Genereer maandelijkse rapportage met totalen, categorieën, en warnings.

```bash
python scripts/monthly-report.py           # Huidige maand
python scripts/monthly-report.py 2025-06   # Specifieke maand
```

### export-tax.py
Export alle data in belasting-klaar formaat.

```bash
python scripts/export-tax.py         # Huidig jaar
python scripts/export-tax.py 2024    # Vorig jaar
```

Genereert:
- `summary-by-category.csv` - Overzicht per categorie
- `btw-summary.csv` - BTW overzicht
- `quarterly-summary.csv` - Per kwartaal
- `full-expenses.csv` - Alle transacties

### categorize.py
Auto-categoriseer expenses op basis van keywords.

```bash
python scripts/categorize.py --dry-run  # Preview
python scripts/categorize.py            # Voer uit
```

### import-bank.py
Importeer bankafschriften (ING, Rabobank, ABN AMRO).

```bash
python scripts/import-bank.py bankafschrift.csv --bank=ing
```

## Categorieën

| Code | Naam | BTW |
|------|------|-----|
| SW | Software/Subscriptions | 21% |
| HW | Hardware | 21% |
| TR | Travel | 21% |
| ML | Meals/Entertainment | 9% |
| PS | Professional Services | 21% |
| OF | Office Supplies | 21% |
| ED | Education | 0% |
| MK | Marketing | 21% |
| CM | Communication | 21% |
| IN | Insurance | 0% |
| OT | Other | 21% |

## CSV Format

```csv
date,amount,currency,category,subcategory,vendor,description,receipt,btw_rate,btw_amount,payment_method,notes
2025-06-15,29.00,EUR,SW,hosting,TransIP,VPS hosting juni,receipts/2025-06/transip-001.pdf,21,5.04,bank,maandelijks
```

## Tips

- **Bonnetjes**: Scan/foto direct na aankoop
- **Naamgeving**: `vendor-datum-bedrag.pdf`
- **Backup**: Git commit wekelijks
- **Review**: Check maandelijks of alles klopt

## Workflow

1. **Dagelijks** (2 min): Expense toevoegen, bon opslaan
2. **Wekelijks** (10 min): Vergelijk met bankafschrift
3. **Maandelijks** (30 min): Genereer rapport, backup
4. **Jaarlijks** (2 uur): Tax export, archiveer

---

Zie `research/expense-tracking-system.md` voor uitgebreide documentatie.
