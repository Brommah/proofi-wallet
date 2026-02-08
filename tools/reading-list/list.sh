#!/bin/bash
# List reading list items with filters
# Usage: list.sh [--status X] [--priority X] [--category X] [--limit N]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_FILE="$SCRIPT_DIR/reading-list.json"

STATUS=""
PRIORITY=""
CATEGORY=""
LIMIT=20

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --status|-s)
            STATUS="$2"
            shift 2
            ;;
        --priority|-p)
            PRIORITY="$2"
            shift 2
            ;;
        --category|-c)
            CATEGORY="$2"
            shift 2
            ;;
        --limit|-n)
            LIMIT="$2"
            shift 2
            ;;
        --all|-a)
            LIMIT=1000
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Build jq filter
FILTER=".items"

if [ -n "$STATUS" ]; then
    FILTER="$FILTER | map(select(.status == \"$STATUS\"))"
fi

if [ -n "$PRIORITY" ]; then
    FILTER="$FILTER | map(select(.priority == \"$PRIORITY\"))"
fi

if [ -n "$CATEGORY" ]; then
    FILTER="$FILTER | map(select(.categories | index(\"$CATEGORY\")))"
fi

# Sort by priority then date
FILTER="$FILTER | sort_by(.priority, .added)"
FILTER="$FILTER | .[:$LIMIT]"

# Output
ITEMS=$(jq "$FILTER" "$DATA_FILE")
COUNT=$(echo "$ITEMS" | jq 'length')

if [ "$COUNT" -eq 0 ]; then
    echo "No items found"
    exit 0
fi

echo "📚 Reading List ($COUNT items)"
echo "=============================="
echo ""

echo "$ITEMS" | jq -r '.[] | 
    "\(.priority) [\(.status | .[0:1] | ascii_upcase)] \(.id) - \(.title[:50])\n   \(.url)\n   📁 \(.categories | join(", ") | if . == "" then "uncategorized" else . end) | 🏷️ \(.tags | join(", ") | if . == "" then "-" else . end)\n"'
