# Proofi Testing Runbook

A comprehensive guide to testing the Proofi privacy-preserving AI agent stack.

---

## Prerequisites

### System Requirements

```bash
# Node.js 18+
node --version  # Should be >= 18.0.0

# Ollama installed and running
curl http://localhost:11434/api/version
# Expected: {"version":"0.15.x"}

# Model pulled
ollama list | grep llama3.2:3b
# If missing: ollama pull llama3.2:3b
```

### Environment Setup

```bash
# Clone repositories
git clone https://github.com/proofi/proofi-agents /private/tmp/proofi-agents-check

# Install dependencies
cd /private/tmp/proofi-agents-check/health-analyzer
npm install

cd /private/tmp/proofi-agents-check/cli
npm install

cd /private/tmp/proofi-agents-check/agent-sdk
npm install
```

---

## Quick Test Commands

### 1. Run Unit Tests

```bash
cd /private/tmp/proofi-agents-check/health-analyzer
npm run test
# Expected: 26 tests passing
```

### 2. Run Demo Mode

```bash
cd /private/tmp/proofi-agents-check/health-analyzer
npx tsx src/local.ts --bucket demo --output /tmp/proofi-test
# Expected: Analysis completes with audit log
```

### 3. Test CLI

```bash
cd /private/tmp/proofi-agents-check/cli

# Help
npx tsx src/index.ts --help

# Wallet info
npx tsx src/index.ts wallet info

# Analyze (with test data)
echo '{"steps":[{"date":"2026-01-01","count":10000}]}' > /tmp/test.json
npx tsx src/index.ts analyze --input /tmp/test.json --output /tmp/cli-out
```

---

## Full E2E Test Scenarios

### Scenario 1: Complete User Flow

**Goal:** Verify the entire flow from consent to analysis to attestation.

```bash
# 1. Create test data
cat > /tmp/health-data.json << 'EOF'
{
  "steps": [
    { "date": "2026-02-01", "count": 8500, "distance": 6000 },
    { "date": "2026-02-02", "count": 10200, "distance": 7500 }
  ],
  "sleep": [
    { "date": "2026-02-01", "duration": 7.5, "quality": "good" },
    { "date": "2026-02-02", "duration": 6.0, "quality": "fair" }
  ],
  "mood": [
    { "date": "2026-02-01", "score": 7 },
    { "date": "2026-02-02", "score": 6 }
  ]
}
EOF

# 2. Run analysis
cd /private/tmp/proofi-agents-check/cli
npx tsx src/index.ts analyze --input /tmp/health-data.json --output /tmp/e2e-test --verbose

# 3. Verify audit log created
cat /tmp/e2e-test/analysis-*.json | jq '.sessionId, .dataHash, .resultHash'

# 4. Check outputs
ls -la /tmp/e2e-test/
```

**Expected:**
- Analysis summary with trends
- Audit log with session ID, hashes
- No errors in output

---

### Scenario 2: Different Health Data Scopes

**Goal:** Test that different data types are handled correctly.

#### Steps Only

```bash
cat > /tmp/steps-only.json << 'EOF'
{
  "steps": [
    { "date": "2026-02-01", "count": 5000 },
    { "date": "2026-02-02", "count": 12000 }
  ]
}
EOF

npx tsx src/index.ts analyze --input /tmp/steps-only.json --output /tmp/steps-test
# Expected: Analysis mentions activity level, no sleep/mood insights
```

#### Sleep Only

```bash
cat > /tmp/sleep-only.json << 'EOF'
{
  "sleep": [
    { "date": "2026-02-01", "duration": 4.5, "quality": "poor" },
    { "date": "2026-02-02", "duration": 5.0, "quality": "poor" }
  ]
}
EOF

npx tsx src/index.ts analyze --input /tmp/sleep-only.json --output /tmp/sleep-test
# Expected: Alerts about low sleep duration
```

#### Mood Only

```bash
cat > /tmp/mood-only.json << 'EOF'
{
  "mood": [
    { "date": "2026-02-01", "score": 3, "notes": "Feeling down" },
    { "date": "2026-02-02", "score": 2, "notes": "Stressed" }
  ]
}
EOF

npx tsx src/index.ts analyze --input /tmp/mood-only.json --output /tmp/mood-test
# Expected: Recommendations about mental health
```

---

### Scenario 3: Token Expiry

**Goal:** Verify expired tokens are rejected.

```javascript
// Create file: /tmp/test-expiry.js
import nacl from 'tweetnacl';

const token = {
  v: 1,
  id: 'test_expired',
  iss: 'user123',
  sub: 'user123',
  iat: Math.floor(Date.now() / 1000) - 3600,  // 1 hour ago
  exp: Math.floor(Date.now() / 1000) - 1800,  // 30 min ago (EXPIRED)
  scopes: [{ path: '/health/*', permissions: ['read'] }],
  bucketId: 'test',
  resources: ['data.enc'],
  cdnUrl: 'https://test.local',
  wrappedDEK: {
    ciphertext: 'base64...',
    ephemeralPublicKey: 'base64...',
    nonce: 'base64...'
  },
  sig: '',
  sigAlg: 'sr25519'
};

// Check expiry
const now = Math.floor(Date.now() / 1000);
console.log('Token expired:', token.exp < now);  // Should be true
```

---

### Scenario 4: Large Dataset Performance

**Goal:** Test performance with 1 year of data.

```bash
# Generate large dataset
node -e "
const data = {
  steps: Array.from({length: 365}, (_, i) => ({
    date: new Date(Date.now() - (364-i) * 86400000).toISOString().split('T')[0],
    count: 5000 + Math.floor(Math.random() * 10000)
  })),
  sleep: Array.from({length: 365}, (_, i) => ({
    date: new Date(Date.now() - (364-i) * 86400000).toISOString().split('T')[0],
    duration: 5 + Math.random() * 4,
    quality: ['poor','fair','good','excellent'][Math.floor(Math.random()*4)]
  }))
};
console.log(JSON.stringify(data));
" > /tmp/large-data.json

# Time the analysis
time npx tsx src/index.ts analyze --input /tmp/large-data.json --output /tmp/large-test

# Expected: Completes in < 60 seconds
```

---

### Scenario 5: Security Tests

**Goal:** Verify security measures work.

#### Test 1: Invalid JSON

```bash
echo "not json" > /tmp/invalid.json
npx tsx src/index.ts analyze --input /tmp/invalid.json --output /tmp/invalid-test
# Expected: Error about invalid JSON
```

#### Test 2: Missing File

```bash
npx tsx src/index.ts analyze --input /tmp/nonexistent.json --output /tmp/missing-test
# Expected: Error about file not found
```

#### Test 3: Malicious Data (XSS-like)

```bash
cat > /tmp/xss-test.json << 'EOF'
{
  "mood": [
    { "date": "2026-02-01", "score": 7, "notes": "<script>alert('xss')</script>" }
  ]
}
EOF

npx tsx src/index.ts analyze --input /tmp/xss-test.json --output /tmp/xss-out
# Expected: Analysis treats it as plain text, no execution
```

---

## Troubleshooting

### Ollama Connection Refused

```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# Start Ollama if needed
ollama serve &

# Or on macOS, check the app
open -a Ollama
```

### Model Not Found

```bash
# Pull the required model
ollama pull llama3.2:3b

# Verify
ollama list
```

### @polkadot/util Warnings

```bash
# These are harmless but annoying
# To reduce them:
npm dedupe

# Or ignore them (they don't affect functionality)
```

### Test Timeout

```bash
# Increase timeout in vitest.config.ts or test file
vi.setConfig({ testTimeout: 120000 });  // 2 minutes

# Or run specific test with more time
npm run test -- --testTimeout=120000
```

### Out of Memory

```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run test
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Proofi Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      ollama:
        image: ollama/ollama
        ports:
          - 11434:11434
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Pull Ollama Model
        run: |
          curl -X POST http://localhost:11434/api/pull -d '{"name":"llama3.2:3b"}'
      
      - name: Install Dependencies
        run: |
          cd health-analyzer && npm install
          cd ../cli && npm install
      
      - name: Run Tests
        run: |
          cd health-analyzer && npm run test
        timeout-minutes: 10
```

---

## Monitoring Checklist

### Pre-Release

- [ ] All unit tests pass
- [ ] E2E flow works in demo mode
- [ ] CLI commands work
- [ ] Ollama integration stable
- [ ] No security warnings
- [ ] Audit logs generated correctly

### Post-Deployment

- [ ] Monitor Ollama latency
- [ ] Check DDC connectivity
- [ ] Verify blockchain attestations
- [ ] Review error rates
- [ ] Check audit log completeness

---

## Contact

For issues or questions:
- GitHub Issues: https://github.com/proofi/proofi-agents/issues
- Documentation: See `/docs` folder
