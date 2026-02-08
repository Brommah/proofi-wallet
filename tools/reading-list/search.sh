#!/bin/bash
# Search reading list items
# Usage: search.sh <query>

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_FILE="$SCRIPT_DIR/reading-list.json"

QUERY="$1"

if [ -z "$QUERY" ]; then
    echo "Usage: search.sh <query>"
    exit 1
fi

# Search in title, url, summary, tags, notes
QUERY_LOWER=$(echo "$QUERY" | tr '[:upper:]' '[:lower:]')

ITEMS=$(jq --arg q "$QUERY_LOWER" '
    .items | map(select(
        (.title | ascii_downcase | contains($q)) or
        (.url | ascii_downcase | contains($q)) or
        (.summary // "" | ascii_downcase | contains($q)) or
        (.notes // "" | ascii_downcase | contains($q)) or
        (.tags | map(ascii_downcase) | any(contains($q))) or
        (.categories | map(ascii_downcase) | any(contains($q)))
    ))
' "$DATA_FILE")

COUNT=$(echo "$ITEMS" | jq 'length')

if [ "$COUNT" -eq 0 ]; then
    echo "No items matching '$QUERY'"
    exit 0
fi

echo "🔍 Search results for '$QUERY' ($COUNT found)"
echo "=============================================="
echo ""

echo "$ITEMS" | jq -r '.[] | 
    "\(.priority) [\(.status | .[0:1] | ascii_upcase)] \(.id) - \(.title[:50])\n   \(.url)\n"'
