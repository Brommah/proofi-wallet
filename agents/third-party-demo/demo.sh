#!/bin/bash
# Third Party Agent Demo
# Shows how an external agent requests and receives permissioned access to memory

set -e

AGENT_NAME="fred-assistant"
MEMORY_FILE="${1:-$HOME/clawd/MEMORY.md}"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           THIRD PARTY AGENT ACCESS DEMO                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if proofi is available
if ! command -v proofi &> /dev/null; then
    echo "❌ proofi CLI not found. Install with:"
    echo "   cd proofi-wallet/cli && npm install && npm link"
    exit 1
fi

# Check wallet
echo "═══ STEP 1: Check wallet status ═══"
echo ""
proofi status || {
    echo "❌ No wallet found. Run: proofi init"
    exit 1
}

# Check if memory file exists
if [ ! -f "$MEMORY_FILE" ]; then
    echo "❌ Memory file not found: $MEMORY_FILE"
    exit 1
fi

echo ""
echo "═══ STEP 2: Third party agent requests access ═══"
echo ""
echo "Agent '$AGENT_NAME' is requesting access to your memory."
echo "File: $MEMORY_FILE"
echo ""

# Register memory (if not already)
echo "Registering memory file..."
proofi memory register "$MEMORY_FILE" 2>/dev/null || true

echo ""
echo "Available sections in your memory:"
proofi memory register "$MEMORY_FILE" 2>&1 | grep "•" || true

echo ""
echo "═══ STEP 3: Wallet owner grants access ═══"
echo ""
echo "You (the wallet owner) decide what to share."
echo ""
read -p "Grant access to which sections? (comma-separated, or 'all'): " SECTIONS

if [ -z "$SECTIONS" ]; then
    SECTIONS="all"
fi

# First authorize the agent
proofi agent add "$AGENT_NAME" --scopes "memory" 2>/dev/null || true

# Then grant memory access
proofi memory grant "$AGENT_NAME" "$MEMORY_FILE" --sections "$SECTIONS"

echo ""
echo "═══ STEP 4: Agent reads memory (with audit) ═══"
echo ""

# Agent reads
proofi memory read "$MEMORY_FILE" --agent "$AGENT_NAME"

echo ""
echo "═══ STEP 5: View audit log ═══"
echo ""
proofi audit --lines 5

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    DEMO COMPLETE                             ║"
echo "║                                                              ║"
echo "║  Key points:                                                 ║"
echo "║  • Agent only saw sections YOU permitted                     ║"
echo "║  • Every access logged in audit trail                        ║"
echo "║  • Access expires automatically (24h default)                ║"
echo "║  • Revoke anytime: proofi memory revoke $AGENT_NAME ...      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
