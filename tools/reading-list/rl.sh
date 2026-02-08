#!/bin/bash
# Reading List Manager CLI
# Usage: ./rl.sh <command> [options]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_FILE="$SCRIPT_DIR/reading-list.json"

# Ensure data file exists
if [ ! -f "$DATA_FILE" ]; then
    echo '{"items":[],"categories":["ai","crypto","business","tech","research","tools"],"lastUpdated":null}' > "$DATA_FILE"
fi

case "$1" in
    add)
        shift
        "$SCRIPT_DIR/add.sh" "$@"
        ;;
    list|ls)
        shift
        "$SCRIPT_DIR/list.sh" "$@"
        ;;
    search|s)
        shift
        "$SCRIPT_DIR/search.sh" "$@"
        ;;
    summarize|sum)
        shift
        "$SCRIPT_DIR/summarize.sh" "$@"
        ;;
    complete|done)
        shift
        ID="$1"
        if [ -z "$ID" ]; then
            echo "Usage: rl.sh complete <id>"
            exit 1
        fi
        jq --arg id "$ID" --arg now "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            '.items = [.items[] | if .id == $id then .status = "completed" | .completedAt = $now else . end]' \
            "$DATA_FILE" > "${DATA_FILE}.tmp" && mv "${DATA_FILE}.tmp" "$DATA_FILE"
        echo "✓ Marked $ID as completed"
        ;;
    reading)
        shift
        ID="$1"
        jq --arg id "$ID" '.items = [.items[] | if .id == $id then .status = "reading" else . end]' \
            "$DATA_FILE" > "${DATA_FILE}.tmp" && mv "${DATA_FILE}.tmp" "$DATA_FILE"
        echo "📖 Marked $ID as reading"
        ;;
    archive)
        shift
        ID="$1"
        jq --arg id "$ID" '.items = [.items[] | if .id == $id then .status = "archived" else . end]' \
            "$DATA_FILE" > "${DATA_FILE}.tmp" && mv "${DATA_FILE}.tmp" "$DATA_FILE"
        echo "📦 Archived $ID"
        ;;
    delete|rm)
        shift
        ID="$1"
        jq --arg id "$ID" '.items = [.items[] | select(.id != $id)]' \
            "$DATA_FILE" > "${DATA_FILE}.tmp" && mv "${DATA_FILE}.tmp" "$DATA_FILE"
        echo "🗑️ Deleted $ID"
        ;;
    stats)
        echo "📊 Reading List Stats"
        echo "===================="
        TOTAL=$(jq '.items | length' "$DATA_FILE")
        UNREAD=$(jq '[.items[] | select(.status == "unread")] | length' "$DATA_FILE")
        READING=$(jq '[.items[] | select(.status == "reading")] | length' "$DATA_FILE")
        COMPLETED=$(jq '[.items[] | select(.status == "completed")] | length' "$DATA_FILE")
        ARCHIVED=$(jq '[.items[] | select(.status == "archived")] | length' "$DATA_FILE")
        P1=$(jq '[.items[] | select(.priority == "P1" and .status == "unread")] | length' "$DATA_FILE")
        P2=$(jq '[.items[] | select(.priority == "P2" and .status == "unread")] | length' "$DATA_FILE")
        echo "Total: $TOTAL"
        echo "Unread: $UNREAD (P1: $P1, P2: $P2)"
        echo "Reading: $READING"
        echo "Completed: $COMPLETED"
        echo "Archived: $ARCHIVED"
        echo ""
        echo "By Category:"
        jq -r '.items | group_by(.categories[0]) | .[] | "\(.[0].categories[0] // "uncategorized"): \(length)"' "$DATA_FILE" 2>/dev/null || echo "  (none yet)"
        ;;
    show)
        shift
        ID="$1"
        jq --arg id "$ID" '.items[] | select(.id == $id)' "$DATA_FILE"
        ;;
    help|--help|-h|"")
        echo "Reading List Manager"
        echo ""
        echo "Usage: rl.sh <command> [options]"
        echo ""
        echo "Commands:"
        echo "  add <url> [-p P1|P2|P3] [-c category] [-t tags]  Add new item"
        echo "  list [--status X] [--priority X] [--category X]   List items"
        echo "  search <query>                                    Search items"
        echo "  summarize <id>                                    Generate AI summary"
        echo "  show <id>                                         Show item details"
        echo "  complete <id>                                     Mark as completed"
        echo "  reading <id>                                      Mark as reading"
        echo "  archive <id>                                      Archive item"
        echo "  delete <id>                                       Delete item"
        echo "  stats                                             Show statistics"
        echo ""
        echo "Examples:"
        echo "  rl.sh add 'https://arxiv.org/abs/2301.00001' -p P1 -c ai"
        echo "  rl.sh list --status unread --priority P1"
        echo "  rl.sh search 'transformer'"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Run 'rl.sh help' for usage"
        exit 1
        ;;
esac
