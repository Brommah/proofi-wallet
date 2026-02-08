# Expense Tracking System voor Mart

*Ontworpen: Juni 2025*

## 📋 Overzicht

Dit document beschrijft een praktisch expense tracking systeem dat geschikt is voor freelance/ZZP werk. Focus op eenvoud, automatisering waar mogelijk, en belastingklare exports.

---

## 🎯 Requirements

### Must-Have
- [ ] Track alle zakelijke uitgaven met datum, bedrag, categorie
- [ ] Bonnetjes/receipts koppelen aan uitgaven
- [ ] Categorisatie voor belastingaangifte
- [ ] Maandelijkse en jaarlijkse overzichten
- [ ] Export naar CSV/Excel voor accountant
- [ ] BTW-tracking (21%, 9%, 0%, vrijgesteld)

### Nice-to-Have
- [ ] Automatische import van bankafschriften
- [ ] Email parsing voor digitale bonnen
- [ ] Auto-categorisatie op basis van omschrijving
- [ ] Dashboard met grafieken

---

## 🏗️ Gekozen Implementatie: CSV + Scripts

### Waarom CSV + Scripts?

| Optie | Voordelen | Nadelen |
|-------|-----------|---------|
| **Notion** | Mooi, flexibel | Lastige exports, vendor lock-in |
| **Google Sheets** | Collaboration, formulas | Privacy, geen lokale backup |
| **Expensify** | Feature-rich | Kosten, overkill voor solo |
| **CSV + Scripts** ✅ | Eenvoudig, portable, privacy, gratis | Handmatig werk |

**Conclusie:** CSV met Python/bash scripts is het meest praktisch:
- Data blijft lokaal (privacy)
- Git-versioned (audit trail)
- Makkelijk te backuppen
- Aanpasbaar naar eigen wensen
- Geen maandelijkse kosten

---

## 📁 Bestandsstructuur

```
tools/expenses/
├── data/
│   ├── 2025/
│   │   ├── expenses-2025.csv      # Hoofdbestand
│   │   └── receipts/              # Bonnetjes per maand
│   │       ├── 2025-01/
│   │       ├── 2025-06/
│   │       └── ...
│   └── categories.json            # Categorie definities
├── templates/
│   ├── expense-template.csv       # Lege template
│   └── monthly-report.md          # Report template
├── scripts/
│   ├── add-expense.sh             # Snel expense toevoegen
│   ├── import-bank.py             # Bankafschrift import
│   ├── categorize.py              # Auto-categorisatie
│   ├── monthly-report.py          # Genereer maandrapport
│   └── export-tax.py              # Belasting export
└── README.md                      # Documentatie
```

---

## 📊 Categorieën

### Hoofdcategorieën (BTW-aftrekbaar)

| Code | Categorie | Beschrijving | BTW |
|------|-----------|--------------|-----|
| `SW` | Software/Subscriptions | SaaS, licenties, hosting | 21% |
| `HW` | Hardware | Laptops, monitors, kabels | 21% |
| `TR` | Travel | OV, vluchten, hotels (zakelijk) | 21%/9% |
| `ML` | Meals/Entertainment | Zakelijke lunches, representatie | 21% |
| `PS` | Professional Services | Accountant, juridisch, coaching | 21% |
| `OF` | Office Supplies | Kantoorartikelen, inkt, papier | 21% |
| `ED` | Education | Cursussen, boeken, conferenties | 21%/0% |
| `MK` | Marketing | Ads, promotie, drukwerk | 21% |
| `CM` | Communication | Telefoon, internet | 21% |
| `IN` | Insurance | Zakelijke verzekeringen | 0% |
| `OT` | Other | Overige zakelijke kosten | varies |

### Niet-aftrekbaar (voor tracking)
| Code | Categorie | Beschrijving |
|------|-----------|--------------|
| `PR` | Private | Privé uitgaven (niet zakelijk) |
| `MX` | Mixed | Deels zakelijk, deels privé |

---

## 📝 CSV Format

### expenses-YYYY.csv

```csv
date,amount,currency,category,subcategory,vendor,description,receipt,btw_rate,btw_amount,payment_method,notes
2025-06-15,29.00,EUR,SW,hosting,TransIP,VPS hosting juni,receipts/2025-06/transip-001.pdf,21,5.04,bank,maandelijks
2025-06-14,12.50,EUR,ML,lunch,Brownies&Downies,Zakelijke lunch met klant,receipts/2025-06/lunch-001.jpg,9,1.03,pin,met Jan de Vries
```

### Velden

| Veld | Type | Verplicht | Beschrijving |
|------|------|-----------|--------------|
| `date` | YYYY-MM-DD | ✅ | Datum van uitgave |
| `amount` | decimal | ✅ | Bedrag incl. BTW |
| `currency` | string | ✅ | EUR, USD, etc. |
| `category` | string | ✅ | Hoofdcategorie code |
| `subcategory` | string | ❌ | Subcategorie |
| `vendor` | string | ✅ | Leverancier/winkel |
| `description` | string | ✅ | Korte omschrijving |
| `receipt` | path | ❌ | Relatief pad naar bon |
| `btw_rate` | integer | ✅ | BTW percentage |
| `btw_amount` | decimal | ✅ | BTW bedrag |
| `payment_method` | string | ✅ | bank/pin/cash/cc |
| `notes` | string | ❌ | Extra notities |

---

## 🔄 Workflow

### Dagelijks (2 min)
1. Ontvang bon (email/papier)
2. Foto maken of download PDF
3. Run `add-expense.sh` of voeg toe aan CSV
4. Bon opslaan in `receipts/YYYY-MM/`

### Wekelijks (10 min)
1. Check bankafschrift tegen expenses
2. Vul ontbrekende items aan
3. Controleer categorisatie

### Maandelijks (30 min)
1. Run `monthly-report.py`
2. Review rapport en fix fouten
3. Backup naar externe drive/cloud
4. Git commit: `git add . && git commit -m "expenses: juni 2025"`

### Jaarlijks (2 uur)
1. Run `export-tax.py` voor belastingaangifte
2. Stuur naar accountant
3. Archiveer jaar
4. Start nieuw jaar bestand

---

## 🤖 Automatisering

### 1. Email Receipt Parsing (Future)

```python
# Concept - kan later uitgebreid worden
# Gmail API of IMAP scan voor:
# - Digitale bonnen van bekende vendors
# - PDF attachments met "factuur" of "invoice"
# Auto-extract: bedrag, datum, vendor
```

### 2. Bank Statement Import

Het script `import-bank.py` kan:
- MT940 bestanden importeren (standaard NL bankformat)
- CSV exports van banken verwerken
- Dubbele entries detecteren
- Suggesties geven voor categorisatie

### 3. Auto-Categorisatie

Op basis van keywords in vendor/description:
```json
{
  "patterns": {
    "SW": ["github", "aws", "google cloud", "digitalocean", "transip"],
    "TR": ["ns.nl", "uber", "booking.com", "klm", "schiphol"],
    "ML": ["thuisbezorgd", "uber eats", "restaurant"]
  }
}
```

### 4. Monthly Report Generation

Genereert automatisch:
- Totalen per categorie
- BTW overzicht
- Vergelijking met vorige maand
- Waarschuwingen (missende bonnen, ongebruikelijke bedragen)

---

## 📈 Rapportages

### Maandrapport bevat:
- Totaal uitgaven
- Breakdown per categorie
- Top 5 vendors
- BTW totaal (aftrekbaar)
- Vergelijking vorige maand
- Lijst met missende bonnen

### Jaarrapport bevat:
- Jaaroverzicht per categorie
- Kwartaaloverzichten
- BTW jaaropgave
- Export voor belastingaangifte

---

## 💡 Tips

### Bonnetjes
- **Digitaal > Papier**: Vraag altijd om email bon
- **Scan direct**: Papieren bonnen vervagen snel
- **Naamgeving**: `vendor-datum-bedrag.pdf` (bijv. `coolblue-20250615-299.pdf`)

### Categorisatie
- Bij twijfel: kies de meest conservatieve optie
- Noteer waarom iets zakelijk is
- Mixed costs: schat percentage zakelijk

### BTW
- Bewaar originele facturen 7 jaar
- Check BTW nummer bij grote aankopen
- Let op buitenlandse BTW (reverse charge)

---

## 🔧 Setup

1. Clone/copy `tools/expenses/` naar je systeem
2. Maak eerste jaarmap: `mkdir -p data/2025/receipts`
3. Copy template: `cp templates/expense-template.csv data/2025/expenses-2025.csv`
4. Pas `categories.json` aan naar wens
5. Start met tracken!

---

## 📚 Resources

- [Belastingdienst - Zakelijke kosten](https://www.belastingdienst.nl/wps/wcm/connect/nl/ondernemers/ondernemers)
- [BTW tarieven NL](https://www.belastingdienst.nl/wps/wcm/connect/nl/btw/btw)
- [Bewaartermijnen](https://www.kvk.nl/advies-en-informatie/financiering/je-administratie-op-orde/)

---

*Laatste update: Juni 2025*
