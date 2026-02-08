#!/bin/bash
# Generate AI summary for a reading list item
# Usage: summarize.sh <id>
# Note: This script outputs the item info; actual AI summarization 
# should be done via Clawdbot integration

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_FILE="$SCRIPT_DIR/reading-list.json"

ID="$1"

if [ -z "$ID" ]; then
    echo "Usage: summarize.sh <id>"
    exit 1
fi

# Get item
ITEM=$(jq --arg id "$ID" '.items[] | select(.id == $id)' "$DATA_FILE")

if [ -z "$ITEM" ] || [ "$ITEM" = "null" ]; then
    echo "Item not found: $ID"
    exit 1
fi

URL=$(echo "$ITEM" | jq -r '.url')
TITLE=$(echo "$ITEM" | jq -r '.title')

echo "📄 Summarizing: $TITLE"
echo "🔗 URL: $URL"
echo ""
echo "To generate AI summary, use Clawdbot:"
echo ""
echo "  Hey Claude, summarize this article and update my reading list:"
echo "  ID: $ID"
echo "  URL: $URL"
echo ""
echo "Or fetch content manually and pipe to Claude:"
echo "  curl -s '$URL' | claude 'Summarize this article in one paragraph, then list 3-5 key takeaways as bullet points'"
