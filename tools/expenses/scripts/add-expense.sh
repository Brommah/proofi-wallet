#!/bin/bash
#
# add-expense.sh - Snel een expense toevoegen
# Usage: ./add-expense.sh [amount] [vendor] [category]
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
YEAR=$(date +%Y)
MONTH=$(date +%Y-%m)
DATA_DIR="$BASE_DIR/data/$YEAR"
EXPENSE_FILE="$DATA_DIR/expenses-$YEAR.csv"
RECEIPT_DIR="$DATA_DIR/receipts/$MONTH"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ensure directories exist
mkdir -p "$DATA_DIR" "$RECEIPT_DIR"

# Create expense file if it doesn't exist
if [ ! -f "$EXPENSE_FILE" ]; then
    cp "$BASE_DIR/templates/expense-template.csv" "$EXPENSE_FILE"
    echo -e "${GREEN}Created new expense file for $YEAR${NC}"
fi

# Categories
declare -A CATEGORIES
CATEGORIES=(
    ["SW"]="Software/Subscriptions"
    ["HW"]="Hardware"
    ["TR"]="Travel"
    ["ML"]="Meals/Entertainment"
    ["PS"]="Professional Services"
    ["OF"]="Office Supplies"
    ["ED"]="Education"
    ["MK"]="Marketing"
    ["CM"]="Communication"
    ["IN"]="Insurance"
    ["OT"]="Other"
)

# BTW rates per category
declare -A BTW_RATES
BTW_RATES=(
    ["SW"]=21 ["HW"]=21 ["TR"]=21 ["ML"]=9 ["PS"]=21
    ["OF"]=21 ["ED"]=0 ["MK"]=21 ["CM"]=21 ["IN"]=0 ["OT"]=21
)

echo -e "${GREEN}=== Add New Expense ===${NC}"
echo ""

# Date
read -p "Date [$(date +%Y-%m-%d)]: " DATE
DATE=${DATE:-$(date +%Y-%m-%d)}

# Amount
if [ -n "$1" ]; then
    AMOUNT="$1"
else
    read -p "Amount (incl. BTW): €" AMOUNT
fi

# Vendor
if [ -n "$2" ]; then
    VENDOR="$2"
else
    read -p "Vendor: " VENDOR
fi

# Description
read -p "Description: " DESCRIPTION

# Category
echo ""
echo "Categories:"
for code in "${!CATEGORIES[@]}"; do
    echo "  $code - ${CATEGORIES[$code]}"
done | sort
echo ""

if [ -n "$3" ]; then
    CATEGORY="${3^^}"
else
    read -p "Category code: " CATEGORY
    CATEGORY="${CATEGORY^^}"
fi

# Validate category
if [ -z "${CATEGORIES[$CATEGORY]}" ]; then
    echo -e "${RED}Invalid category: $CATEGORY${NC}"
    exit 1
fi

# Subcategory (optional)
read -p "Subcategory (optional): " SUBCATEGORY

# BTW
DEFAULT_BTW=${BTW_RATES[$CATEGORY]}
read -p "BTW rate [$DEFAULT_BTW%]: " BTW_RATE
BTW_RATE=${BTW_RATE:-$DEFAULT_BTW}

# Calculate BTW amount
BTW_AMOUNT=$(echo "scale=2; $AMOUNT - ($AMOUNT / (1 + $BTW_RATE / 100))" | bc)

# Payment method
echo ""
echo "Payment methods: bank, pin, cash, creditcard, paypal, ideal"
read -p "Payment method [pin]: " PAYMENT_METHOD
PAYMENT_METHOD=${PAYMENT_METHOD:-pin}

# Receipt
read -p "Receipt filename (optional, press Enter to skip): " RECEIPT_FILE
if [ -n "$RECEIPT_FILE" ]; then
    RECEIPT_PATH="receipts/$MONTH/$RECEIPT_FILE"
else
    RECEIPT_PATH=""
fi

# Notes
read -p "Notes (optional): " NOTES

# Escape commas in text fields
VENDOR="${VENDOR//,/;}"
DESCRIPTION="${DESCRIPTION//,/;}"
NOTES="${NOTES//,/;}"

# Add to CSV
LINE="$DATE,$AMOUNT,EUR,$CATEGORY,$SUBCATEGORY,$VENDOR,$DESCRIPTION,$RECEIPT_PATH,$BTW_RATE,$BTW_AMOUNT,$PAYMENT_METHOD,$NOTES"
echo "$LINE" >> "$EXPENSE_FILE"

echo ""
echo -e "${GREEN}✓ Expense added!${NC}"
echo "  Date: $DATE"
echo "  Amount: €$AMOUNT (BTW: €$BTW_AMOUNT)"
echo "  Category: ${CATEGORIES[$CATEGORY]}"
echo "  Vendor: $VENDOR"
echo "  File: $EXPENSE_FILE"

if [ -n "$RECEIPT_FILE" ]; then
    echo ""
    echo -e "${YELLOW}Remember to save receipt to: $RECEIPT_DIR/$RECEIPT_FILE${NC}"
fi
