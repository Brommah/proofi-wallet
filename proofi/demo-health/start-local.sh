#!/bin/bash
# Proofi Health Demo - Local Mode with Ollama
# 
# This starts everything you need for fully local health analysis:
# 1. Ollama (if not running)
# 2. Local web server
# 3. ngrok tunnel for mobile access

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🏥 Proofi Health Demo - Local Mode${NC}"
echo ""

# Check Ollama
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not installed. Install from https://ollama.ai"
    exit 1
fi

# Start Ollama if not running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "Starting Ollama..."
    ollama serve &
    sleep 2
fi

echo -e "${GREEN}✓ Ollama running at localhost:11434${NC}"

# Check for models
MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | head -3 || echo "")
if [ -z "$MODELS" ]; then
    echo "⚠️  No models found. Pulling llama3.2..."
    ollama pull llama3.2
fi

echo "  Available models: $MODELS"
echo ""

# Start local server
echo "Starting web server on port 3000..."
cd "$(dirname "$0")/.."

# Try different server options
if command -v npx &> /dev/null; then
    npx serve . -p 3000 &
elif command -v python3 &> /dev/null; then
    python3 -m http.server 3000 &
else
    echo "❌ Need Node.js (npx) or Python3 for local server"
    exit 1
fi

SERVER_PID=$!
sleep 2

echo -e "${GREEN}✓ Web server running at http://localhost:3000${NC}"
echo ""

# Open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:3000/demo-health/real-demo.html"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000/demo-health/real-demo.html"
fi

# Optional: Start ngrok tunnel
if command -v ngrok &> /dev/null; then
    echo "Starting ngrok tunnel for mobile access..."
    ngrok http 3000 --log=stdout > /tmp/ngrok.log 2>&1 &
    sleep 3
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)
    if [ -n "$NGROK_URL" ]; then
        echo -e "${GREEN}✓ Mobile URL: ${CYAN}${NGROK_URL}/demo-health/real-demo.html${NC}"
        echo ""
        echo "📱 Open this URL on your phone to use the demo!"
    fi
else
    echo "💡 Install ngrok for mobile access: brew install ngrok"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Ready! Your health data stays on YOUR machine.${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $SERVER_PID 2>/dev/null; pkill -f 'ngrok http' 2>/dev/null; echo 'Stopped.'" EXIT
wait
