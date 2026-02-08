#!/bin/bash
# Add item to reading list
# Usage: add.sh <url> [-p priority] [-c category] [-t tags] [-T title]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_FILE="$SCRIPT_DIR/reading-list.json"

URL=""
PRIORITY="P2"
CATEGORY=""
TAGS=""
TITLE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--priority)
            PRIORITY="$2"
            shift 2
            ;;
        -c|--category)
            CATEGORY="$2"
            shift 2
            ;;
        -t|--tags)
            TAGS="$2"
            shift 2
            ;;
        -T|--title)
            TITLE="$2"
            shift 2
            ;;
        -*)
            echo "Unknown option: $1"
            exit 1
            ;;
        *)
            URL="$1"
            shift
            ;;
    esac
done

if [ -z "$URL" ]; then
    echo "Usage: add.sh <url> [-p P1|P2|P3] [-c category] [-t tags] [-T title]"
    exit 1
fi

# Generate ID (short uuid-like)
ID=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-z0-9' | head -c 8)

# Extract domain for source
SOURCE=$(echo "$URL" | sed -E 's|https?://([^/]+).*|\1|' | sed 's/www\.//')

# Use provided title or placeholder
if [ -z "$TITLE" ]; then
    TITLE="(fetching title...)"
fi

# Build categories array
if [ -n "$CATEGORY" ]; then
    CATEGORIES="[\"$CATEGORY\"]"
else
    CATEGORIES="[]"
fi

# Build tags array
if [ -n "$TAGS" ]; then
    TAGS_JSON=$(echo "$TAGS" | tr ',' '\n' | jq -R . | jq -s .)
else
    TAGS_JSON="[]"
fi

NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Create new item
NEW_ITEM=$(jq -n \
    --arg id "$ID" \
    --arg url "$URL" \
    --arg title "$TITLE" \
    --arg source "$SOURCE" \
    --arg added "$NOW" \
    --arg priority "$PRIORITY" \
    --argjson categories "$CATEGORIES" \
    --argjson tags "$TAGS_JSON" \
    '{
        id: $id,
        url: $url,
        title: $title,
        source: $source,
        added: $added,
        status: "unread",
        priority: $priority,
        categories: $categories,
        tags: $tags,
        summary: null,
        keyTakeaways: [],
        notes: "",
        estimatedReadTime: null,
        completedAt: null
    }')

# Add to data file
jq --argjson item "$NEW_ITEM" --arg now "$NOW" \
    '.items += [$item] | .lastUpdated = $now' \
    "$DATA_FILE" > "${DATA_FILE}.tmp" && mv "${DATA_FILE}.tmp" "$DATA_FILE"

echo "✅ Added: $URL"
echo "   ID: $ID"
echo "   Priority: $PRIORITY"
if [ -n "$CATEGORY" ]; then
    echo "   Category: $CATEGORY"
fi
echo ""
echo "Run 'rl.sh summarize $ID' to generate AI summary"
