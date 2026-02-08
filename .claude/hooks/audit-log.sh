#!/bin/bash
# PostToolUse audit logger: logs every tool call as JSONL for diffable audits

INPUT=$(cat)
LOG_DIR="$HOME/clawd/.claude/audit-logs"
mkdir -p "$LOG_DIR"

# Daily log file
DATE=$(date +%Y-%m-%d)
LOG_FILE="$LOG_DIR/$DATE.jsonl"

# Extract fields
TOOL=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')
SESSION=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
TOOL_INPUT=$(echo "$INPUT" | jq -c '.tool_input // {}')
TOOL_USE_ID=$(echo "$INPUT" | jq -r '.tool_use_id // "unknown"')

# Build audit entry
ENTRY=$(jq -n \
  --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg tool "$TOOL" \
  --arg session "$SESSION" \
  --arg tool_use_id "$TOOL_USE_ID" \
  --argjson input "$TOOL_INPUT" \
  '{
    timestamp: $ts,
    tool: $tool,
    session: $session,
    tool_use_id: $tool_use_id,
    input: $input
  }')

# Append to log
echo "$ENTRY" >> "$LOG_FILE"

exit 0
