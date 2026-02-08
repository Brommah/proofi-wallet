#!/bin/bash
# Update item with AI-generated summary
# Usage: update-summary.sh <id> <summary> [key_takeaways...]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_FILE="$SCRIPT_DIR/reading-list.json"

ID="$1"
SUMMARY="$2"
shift 2

if [ -z "$ID" ] || [ -z "$SUMMARY" ]; then
    echo "Usage: update-summary.sh <id> <summary> [takeaway1] [takeaway2] ..."
    exit 1
fi

# Build takeaways array
TAKEAWAYS_JSON="[]"
if [ $# -gt 0 ]; then
    TAKEAWAYS_JSON=$(printf '%s\n' "$@" | jq -R . | jq -s .)
fi

# Update item
jq --arg id "$ID" \
   --arg summary "$SUMMARY" \
   --argjson takeaways "$TAKEAWAYS_JSON" \
   '.items = [.items[] | if .id == $id then .summary = $summary | .keyTakeaways = $takeaways else . end]' \
   "$DATA_FILE" > "${DATA_FILE}.tmp" && mv "${DATA_FILE}.tmp" "$DATA_FILE"

echo "✅ Updated summary for $ID"
