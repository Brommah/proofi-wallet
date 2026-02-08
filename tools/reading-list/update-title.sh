#!/bin/bash
# Update item title (after fetching)
# Usage: update-title.sh <id> <title>

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_FILE="$SCRIPT_DIR/reading-list.json"

ID="$1"
TITLE="$2"

if [ -z "$ID" ] || [ -z "$TITLE" ]; then
    echo "Usage: update-title.sh <id> <title>"
    exit 1
fi

jq --arg id "$ID" --arg title "$TITLE" \
   '.items = [.items[] | if .id == $id then .title = $title else . end]' \
   "$DATA_FILE" > "${DATA_FILE}.tmp" && mv "${DATA_FILE}.tmp" "$DATA_FILE"

echo "✅ Updated title for $ID"
