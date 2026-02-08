#!/bin/bash
# PreToolUse guardrail: blocks dangerous operations without explicit plan
# Reads JSON from stdin, checks for destructive patterns

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')

# --- Destructive command patterns ---
BLOCKED_COMMANDS=(
  "rm -rf /"
  "rm -rf ~"
  "rm -rf \$HOME"
  "DROP TABLE"
  "DROP DATABASE"
  "DELETE FROM"
  "truncate"
  "> /dev/sda"
  "mkfs"
  "dd if="
  ":(){ :|:& };:"
)

if [ "$TOOL" = "Bash" ] && [ -n "$COMMAND" ]; then
  for pattern in "${BLOCKED_COMMANDS[@]}"; do
    if echo "$COMMAND" | grep -qi "$pattern"; then
      jq -n '{
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: "🛑 BLOCKED: Destructive command detected: '"$pattern"'. Create a plan first."
        }
      }'
      exit 0
    fi
  done
fi

# --- Block writes to sensitive paths ---
SENSITIVE_PATHS=(
  "/etc/"
  "/usr/local/bin/"
  "/System/"
  ".env"
  ".secrets/"
  "id_rsa"
  "id_ed25519"
)

if [ -n "$FILE_PATH" ]; then
  for path in "${SENSITIVE_PATHS[@]}"; do
    if echo "$FILE_PATH" | grep -qi "$path"; then
      jq -n '{
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: "🛑 BLOCKED: Write to sensitive path '"$FILE_PATH"'. Needs explicit approval."
        }
      }'
      exit 0
    fi
  done
fi

# Allow everything else
exit 0
