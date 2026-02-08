#!/bin/bash
#
# extract-actions.sh - Extract action items from meeting notes using Claude
#
# Usage: ./extract-actions.sh [OPTIONS] <input>
#
# Examples:
#   ./extract-actions.sh meeting-notes.txt
#   pbpaste | ./extract-actions.sh -
#   ./extract-actions.sh notes.txt -o ~/actions/today.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_FILE="$SCRIPT_DIR/prompts/extract-actions.md"
GRANOLA_PROMPT="$SCRIPT_DIR/prompts/granola-parser.md"

# Defaults
OUTPUT=""
FORMAT="markdown"
IS_GRANOLA=false
EVENT=""
MEETING_DATE=$(date +%Y-%m-%d)
NOTIFY=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS] <input>

Extract action items from meeting notes using Claude.

Arguments:
  <input>           Input file path, or '-' for stdin

Options:
  -o, --output      Output file path (default: stdout)
  --json            Output JSON instead of markdown
  --granola         Parse as Granola export format
  --event <name>    Add calendar event context
  --date <date>     Meeting date (default: today, $MEETING_DATE)
  --notify          Send notification with summary
  -h, --help        Show this help

Examples:
  $(basename "$0") meeting-notes.txt
  pbpaste | $(basename "$0") -
  $(basename "$0") notes.txt -o ~/actions/standup.md
  $(basename "$0") --granola export.json --notify

EOF
}

log() {
    echo -e "${GREEN}[extract-actions]${NC} $*" >&2
}

warn() {
    echo -e "${YELLOW}[extract-actions]${NC} $*" >&2
}

error() {
    echo -e "${RED}[extract-actions]${NC} $*" >&2
    exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -o|--output)
            OUTPUT="$2"
            shift 2
            ;;
        --json)
            FORMAT="json"
            shift
            ;;
        --granola)
            IS_GRANOLA=true
            shift
            ;;
        --event)
            EVENT="$2"
            shift 2
            ;;
        --date)
            MEETING_DATE="$2"
            shift 2
            ;;
        --notify)
            NOTIFY=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        -*)
            error "Unknown option: $1"
            ;;
        *)
            INPUT="$1"
            shift
            ;;
    esac
done

# Check input
if [[ -z "${INPUT:-}" ]]; then
    error "No input specified. Use '-' for stdin or provide a file path."
fi

# Read input
if [[ "$INPUT" == "-" ]]; then
    log "Reading from stdin..."
    NOTES=$(cat)
else
    if [[ ! -f "$INPUT" ]]; then
        error "Input file not found: $INPUT"
    fi
    log "Reading from $INPUT..."
    NOTES=$(cat "$INPUT")
fi

if [[ -z "$NOTES" ]]; then
    error "Empty input. Nothing to process."
fi

# Select prompt template
if $IS_GRANOLA; then
    TEMPLATE="$GRANOLA_PROMPT"
    log "Using Granola parser..."
else
    TEMPLATE="$PROMPT_FILE"
fi

if [[ ! -f "$TEMPLATE" ]]; then
    error "Prompt template not found: $TEMPLATE"
fi

# Build the prompt with variable substitution
PROMPT=$(cat "$TEMPLATE")

# Simple template substitution (bash-native)
PROMPT="${PROMPT//\{\{notes\}\}/$NOTES}"
PROMPT="${PROMPT//\{\{date\}\}/$MEETING_DATE}"

if [[ -n "$EVENT" ]]; then
    PROMPT="${PROMPT//\{\{event\}\}/$EVENT}"
    PROMPT="${PROMPT//\{\{#if event\}\}/}"
    PROMPT="${PROMPT//\{\{\/if\}\}/}"
else
    # Remove event block if not provided
    PROMPT=$(echo "$PROMPT" | sed '/{{#if event}}/,/{{\/if}}/d')
fi

# Add JSON instruction if needed
if [[ "$FORMAT" == "json" ]]; then
    PROMPT="$PROMPT

IMPORTANT: Output in JSON format instead of markdown:
{
  \"meeting\": {\"title\": \"...\", \"date\": \"...\", \"participants\": [...]},
  \"actions\": [{\"task\": \"...\", \"owner\": \"...\", \"due\": \"...\", \"priority\": \"...\", \"context\": \"...\"}],
  \"decisions\": [\"...\"],
  \"followups\": [{\"task\": \"...\", \"owner\": \"...\", \"due\": \"...\"}]
}"
fi

log "Extracting action items..."

# Call Claude via clawdbot (or claude cli if available)
if command -v clawdbot &> /dev/null; then
    RESULT=$(echo "$PROMPT" | clawdbot ask --no-stream 2>/dev/null || echo "")
elif command -v claude &> /dev/null; then
    RESULT=$(echo "$PROMPT" | claude --print 2>/dev/null || echo "")
else
    # Fallback: write prompt to temp file for manual processing
    TEMP_FILE=$(mktemp)
    echo "$PROMPT" > "$TEMP_FILE"
    warn "Neither clawdbot nor claude CLI found."
    warn "Prompt saved to: $TEMP_FILE"
    warn "Run manually: cat $TEMP_FILE | claude"
    exit 1
fi

if [[ -z "$RESULT" ]]; then
    error "Failed to get response from Claude."
fi

# Output result
if [[ -n "$OUTPUT" ]]; then
    # Create output directory if needed
    mkdir -p "$(dirname "$OUTPUT")"
    echo "$RESULT" > "$OUTPUT"
    log "Output written to: $OUTPUT"
else
    echo "$RESULT"
fi

# Send notification if requested
if $NOTIFY; then
    if command -v clawdbot &> /dev/null; then
        # Extract summary for notification
        ACTION_COUNT=$(echo "$RESULT" | grep -c "^\- \[ \]" || echo "0")
        DECISION_COUNT=$(echo "$RESULT" | grep -c "^- ✅" || echo "0")
        
        NOTIFY_MSG="📋 Meeting processed: $ACTION_COUNT action items, $DECISION_COUNT decisions"
        if [[ -n "$OUTPUT" ]]; then
            NOTIFY_MSG="$NOTIFY_MSG\nSaved to: $OUTPUT"
        fi
        
        # Note: This would need proper clawdbot message integration
        log "Notification: $NOTIFY_MSG"
        # clawdbot message send "$NOTIFY_MSG"  # Uncomment when message tool available
    else
        warn "Notification requested but clawdbot not available."
    fi
fi

log "Done!"
