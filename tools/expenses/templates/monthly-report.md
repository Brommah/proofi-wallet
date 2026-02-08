# Expense Report: {{MONTH}} {{YEAR}}

*Gegenereerd: {{GENERATED_DATE}}*

---

## 📊 Samenvatting

| Metric | Waarde |
|--------|--------|
| **Totaal uitgaven** | €{{TOTAL}} |
| **Totaal BTW** | €{{TOTAL_BTW}} |
| **Aantal transacties** | {{COUNT}} |
| **Gem. per transactie** | €{{AVERAGE}} |

### Vergelijking vorige maand
- Verschil: €{{DIFF}} ({{DIFF_PERCENT}}%)

---

## 📈 Per Categorie

| Categorie | Bedrag | BTW | % van totaal |
|-----------|--------|-----|--------------|
{{CATEGORY_ROWS}}

---

## 🏪 Top Vendors

| Vendor | Bedrag | # Trans |
|--------|--------|---------|
{{VENDOR_ROWS}}

---

## ⚠️ Aandachtspunten

{{WARNINGS}}

---

## 📝 Alle Transacties

| Datum | Vendor | Categorie | Bedrag | Bon |
|-------|--------|-----------|--------|-----|
{{TRANSACTION_ROWS}}

---

*Dit rapport is automatisch gegenereerd. Controleer op fouten.*
