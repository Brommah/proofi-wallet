# Proofi CLI Health Analyzer

Decrypt and analyze Proofi health data locally using Ollama.

## Requirements

- Node.js 18+
- Ollama running locally (`ollama serve`)
- A Proofi capability token (from the mobile demo)

## Setup

```bash
cd proofi/cli
npm install
```

## Usage

### From the Proofi Mobile Demo

1. Open the health demo on your phone
2. Create wallet and upload health data
3. Select **"External Device"** as the agent
4. Grant permissions
5. Copy or scan the QR code

### Running Analysis

```bash
# From copied token (macOS)
pbpaste | node analyze.js

# From copied token (direct)
node analyze.js --token '{"id":"...", "cdnUrl":"...", ...}'

# From file
node analyze.js --file token.json
node analyze.js token.json
```

### Environment Variables

```bash
# Custom Ollama URL (default: http://localhost:11434)
OLLAMA_URL=http://192.168.1.100:11434 node analyze.js

# Custom model (default: llama3.2)
OLLAMA_MODEL=mistral node analyze.js

# Debug mode
DEBUG=1 node analyze.js
```

## Output

The CLI outputs JSON results to stdout:

```json
{
  "analysis": {
    "avgSleep": 7.2,
    "avgQuality": 78,
    "avgDeep": 1.4,
    "avgRem": 1.6,
    "avgHR": 72,
    "avgRestingHR": 65,
    "avgHRV": 42,
    "maxHR": 168,
    "minHR": 52,
    "sleepScore": 76,
    "heartScore": 84
  },
  "recommendations": [
    "Your sleep duration is good at 7.2 hours average",
    "Consider more deep sleep - try avoiding screens before bed",
    "HRV indicates moderate stress levels - try relaxation techniques"
  ],
  "summary": "Overall health metrics look good...",
  "model": "llama3.2",
  "recordsAnalyzed": 130,
  "analyzedAt": "2024-01-15T10:30:00.000Z"
}
```

## How It Works

1. **Token Parsing**: Reads the capability token containing encrypted DEK and data location
2. **DDC Fetch**: Downloads encrypted health data from Cere DDC network
3. **Decryption**: 
   - Unwraps DEK using X25519 + XSalsa20-Poly1305
   - Decrypts data using AES-256-GCM
4. **Analysis**: Sends decrypted data to local Ollama for analysis
5. **Results**: Outputs structured JSON with health insights

## Security

- **Your data never leaves your device** - all decryption and analysis happens locally
- The capability token contains a wrapped DEK that only works with the agent's private key
- Token expiry is enforced before processing
- No data is sent to external servers (except the callback URL if provided)

## Importing Results to Demo

Copy the JSON output and paste it into the "Import Results" textarea in the mobile demo to see visualized results.

## Troubleshooting

### "Ollama not running"
```bash
ollama serve
# In another terminal:
ollama pull llama3.2
```

### "Failed to unwrap DEK"
The token's agent key doesn't match. Make sure you're using the token from the "External Device" flow.

### "Token has expired"
Request a new token from the mobile demo.
