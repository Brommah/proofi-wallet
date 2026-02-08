# Runbook

Deployment, testing, and troubleshooting guide for Proofi agents.

---

## Table of Contents

1. [Deployment](#deployment)
2. [Environment Setup](#environment-setup)
3. [Testing](#testing)
4. [Monitoring](#monitoring)
5. [Troubleshooting](#troubleshooting)
6. [Security Checklist](#security-checklist)
7. [Common Operations](#common-operations)

---

## Deployment

### Local Development

```bash
# Clone & install
git clone https://github.com/proofi/agents.git
cd agents/health-analyzer
npm install

# Configure
cp .env.example .env
# Edit .env with your settings

# Run in dev mode (hot reload)
npm run dev
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build

# Run
ENV NODE_ENV=production
EXPOSE 3100
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t proofi-agent .
docker run -d \
  -p 3100:3100 \
  -e OPENAI_API_KEY=sk-... \
  -e WALLET_PASSPHRASE=secret \
  -v $(pwd)/keys:/app/keys:ro \
  -v $(pwd)/wallet.json:/app/wallet.json:ro \
  --name health-analyzer \
  proofi-agent
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  health-analyzer:
    build: ./health-analyzer
    ports:
      - "3100:3100"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - WALLET_PASSPHRASE=${WALLET_PASSPHRASE}
    volumes:
      - ./keys:/app/keys:ro
      - ./wallet.json:/app/wallet.json:ro
      - ./audit-logs:/app/audit-logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3100/status"]
      interval: 30s
      timeout: 10s
      retries: 3

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-models:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]

volumes:
  ollama-models:
```

### Railway/Render/Fly.io

Example `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "healthcheckPath": "/status",
    "healthcheckTimeout": 30
  }
}
```

Set environment variables in the platform's dashboard.

### Kubernetes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: health-analyzer
spec:
  replicas: 2
  selector:
    matchLabels:
      app: health-analyzer
  template:
    metadata:
      labels:
        app: health-analyzer
    spec:
      containers:
        - name: agent
          image: proofi/health-analyzer:latest
          ports:
            - containerPort: 3100
          env:
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: proofi-secrets
                  key: openai-api-key
            - name: WALLET_PASSPHRASE
              valueFrom:
                secretKeyRef:
                  name: proofi-secrets
                  key: wallet-passphrase
          volumeMounts:
            - name: keys
              mountPath: /app/keys
              readOnly: true
            - name: wallet
              mountPath: /app/wallet.json
              subPath: wallet.json
              readOnly: true
          livenessProbe:
            httpGet:
              path: /status
              port: 3100
            initialDelaySeconds: 10
            periodSeconds: 30
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
      volumes:
        - name: keys
          secret:
            secretName: agent-keypair
        - name: wallet
          secret:
            secretName: agent-wallet
---
apiVersion: v1
kind: Service
metadata:
  name: health-analyzer
spec:
  ports:
    - port: 80
      targetPort: 3100
  selector:
    app: health-analyzer
```

---

## Environment Setup

### Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | ❌ | HTTP port (default: `3100`) |
| `NODE_ENV` | ❌ | `development` or `production` |
| `LOG_LEVEL` | ❌ | `debug`, `info`, `warn`, `error` |

### AI Configuration

Choose one:

**Option A: Ollama (Local)**
```env
OLLAMA_URL=http://localhost:11434
# No API key needed
```

**Option B: OpenAI (Cloud)**
```env
OPENAI_API_KEY=sk-...
```

### Blockchain (for attestation)

```env
WALLET_PATH=./wallet.json
WALLET_PASSPHRASE=your-secret-passphrase

# Optional: custom RPC endpoint
CERE_RPC=wss://archive.mainnet.cere.network/ws
```

### DDC (for storage)

```env
DDC_BUCKET_ID=1229
DDC_ENDPOINT=https://cdn.ddc-dragon.com
```

### Full Example `.env`

```env
# Server
PORT=3100
NODE_ENV=production
LOG_LEVEL=info

# AI
OLLAMA_URL=http://ollama:11434
# OPENAI_API_KEY=sk-...  # Alternative

# Blockchain
WALLET_PATH=./wallet.json
WALLET_PASSPHRASE=${WALLET_PASSPHRASE}

# Storage
DDC_BUCKET_ID=1229
```

---

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Integration Tests

```bash
# Start dependencies
docker-compose up -d ollama

# Run integration tests
npm run test:integration
```

### End-to-End Test

```bash
# Terminal 1: Start agent
npm run dev

# Terminal 2: Send test request
node scripts/test-e2e.js
```

Example `test-e2e.js`:

```javascript
const fetch = require('node-fetch');

async function test() {
  // 1. Check status
  const status = await fetch('http://localhost:3100/status').then(r => r.json());
  console.log('Status:', status);
  
  // 2. Get agent info
  const info = await fetch('http://localhost:3100/agent-info').then(r => r.json());
  console.log('Agent:', info.name);
  console.log('Public Key:', info.publicKey);
  
  // 3. Create test token
  const token = createTestToken(info.publicKey);
  
  // 4. Analyze
  const result = await fetch('http://localhost:3100/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: btoa(JSON.stringify(token)) })
  }).then(r => r.json());
  
  console.log('Result:', result);
}

test().catch(console.error);
```

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run scripts/load-test.js
```

Example `load-test.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:3100/status');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 100ms': (r) => r.timings.duration < 100,
  });
  sleep(1);
}
```

---

## Monitoring

### Health Check

```bash
# Simple check
curl http://localhost:3100/status

# Expected response
{
  "status": "healthy",
  "service": "health-analyzer-agent",
  "version": "1.0.0",
  "uptime": 12345.67
}
```

### Prometheus Metrics

Add to your agent:

```typescript
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client';

const register = new Registry();
collectDefaultMetrics({ register });

const analysisCounter = new Counter({
  name: 'proofi_analyses_total',
  help: 'Total number of analyses',
  labelNames: ['status'],
  registers: [register],
});

const analysisDuration = new Histogram({
  name: 'proofi_analysis_duration_seconds',
  help: 'Analysis duration in seconds',
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Expose /metrics endpoint
app.get('/metrics', async (c) => {
  return c.text(await register.metrics());
});
```

### Grafana Dashboard

Key metrics to track:
- Request rate (`rate(proofi_analyses_total[5m])`)
- Error rate (`rate(proofi_analyses_total{status="error"}[5m])`)
- Latency p99 (`histogram_quantile(0.99, rate(proofi_analysis_duration_seconds_bucket[5m]))`)
- Active connections
- Memory usage

### Logging

Structured logging with pino:

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' } 
    : undefined,
});

// Usage
logger.info({ tokenId: token.id }, 'Token received');
logger.error({ err, tokenId }, 'Analysis failed');
```

---

## Troubleshooting

### Common Issues

#### Agent won't start

```
Error: EADDRINUSE: address already in use :::3100
```

**Solution:**
```bash
# Find what's using the port
lsof -i :3100

# Kill it or use a different port
PORT=3101 npm run dev
```

#### Ollama connection failed

```
Error: connect ECONNREFUSED 127.0.0.1:11434
```

**Solution:**
```bash
# Check if Ollama is running
ollama list

# Start Ollama
ollama serve

# Or use Docker
docker run -d -p 11434:11434 ollama/ollama
```

#### DEK unwrapping failed

```
Error: DEK unwrapping failed - invalid key or corrupted data
```

**Causes:**
1. Token was encrypted for a different agent
2. Agent keypair was regenerated
3. Token data is corrupted

**Solution:**
- Verify the user used your agent's current public key
- Check `/agent-info` matches what the user has

#### Token expired

```
Error: Token has expired
```

**Solution:**
- User needs to create a new token with a later `exp` timestamp
- Consider longer token validity (e.g., 24 hours instead of 1 hour)

#### Attestation failed

```
Error: Insufficient balance for transaction
```

**Solution:**
```bash
# Check wallet balance
proofi wallet info

# Fund the wallet (costs ~0.01 CERE per attestation)
proofi wallet fund
```

#### DDC fetch failed

```
Error: DDC fetch failed: 404 Not Found
```

**Causes:**
1. CID doesn't exist in the bucket
2. Wrong bucket ID in token
3. Data was deleted

**Solution:**
- Verify the CID exists: `curl https://cdn.ddc-dragon.com/{bucketId}/{cid}`
- Check token's `bucketId` and `resources` fields

### Debug Mode

Enable verbose logging:

```bash
LOG_LEVEL=debug npm run dev
```

Or in code:

```typescript
const agent = new ProofiAgent({
  model: 'llama3.2:3b',
  attestation: true,
  debug: true  // Future: add debug option
});
```

### Checking Audit Logs

```bash
# List recent audits
ls -la audit-logs/

# View an audit
cat audit-logs/analysis-session_1707345600_abc123.json | jq
```

---

## Security Checklist

### Before Going Live

- [ ] **Private key protected** - `chmod 600 keys/agent-keypair.json`
- [ ] **Wallet secured** - Never commit wallet.json
- [ ] **Secrets in env** - Use environment variables, not hardcoded
- [ ] **HTTPS enabled** - Use a reverse proxy (nginx, Caddy)
- [ ] **Rate limiting** - Prevent abuse
- [ ] **Input validation** - Validate all token fields
- [ ] **Audit logging** - Log all operations
- [ ] **Error handling** - Don't leak internal errors

### File Permissions

```bash
# Keys should be read-only by owner
chmod 600 keys/agent-keypair.json
chmod 600 wallet.json

# Audit logs can be group-readable
chmod 640 audit-logs/*.json
```

### Secrets Management

**Bad:**
```typescript
const agent = new ProofiAgent({
  walletPassphrase: 'my-secret-123'  // ❌ Never hardcode!
});
```

**Good:**
```typescript
const agent = new ProofiAgent({
  walletPassphrase: process.env.WALLET_PASSPHRASE  // ✅
});
```

**Better (use a secrets manager):**
```typescript
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();
const [version] = await client.accessSecretVersion({
  name: 'projects/my-project/secrets/wallet-passphrase/versions/latest',
});
const passphrase = version.payload.data.toString();
```

---

## Common Operations

### Rotate Agent Keypair

```bash
# 1. Backup old keypair
cp keys/agent-keypair.json keys/agent-keypair.json.backup

# 2. Delete old keypair (new one will be generated on startup)
rm keys/agent-keypair.json

# 3. Restart agent
npm run dev

# 4. Notify users of new public key
curl http://localhost:3100/agent-info | jq .publicKey
```

⚠️ **Warning:** After rotation, existing tokens won't work. Users need to create new tokens.

### Update Agent Wallet

```bash
# 1. Create new wallet
proofi wallet create --output new-wallet.json

# 2. Fund new wallet
proofi wallet fund

# 3. Wait for funds to arrive
proofi wallet info

# 4. Update .env
WALLET_PATH=./new-wallet.json

# 5. Restart agent
```

### View On-Chain Attestations

```bash
# Using CLI
proofi verify --block 24282779

# Using Polkadot.js Apps
# https://polkadot.js.org/apps/?rpc=wss://archive.mainnet.cere.network/ws#/explorer
# Navigate to the block and look for system.remark extrinsics
```

### Export Audit Logs

```bash
# Combine all audits into one file
cat audit-logs/*.json | jq -s '.' > all-audits.json

# Filter by date
ls audit-logs/*.json | xargs -I {} basename {} | grep "2024-02" | \
  xargs -I {} cat audit-logs/{} | jq -s '.'

# Extract just the hashes
cat audit-logs/*.json | jq '{session: .sessionId, input: .dataHash, output: .resultHash}'
```

### Scale Horizontally

Agents are stateless (except for keypair). You can run multiple instances:

```yaml
# docker-compose.yml
services:
  agent:
    image: proofi/health-analyzer:latest
    deploy:
      replicas: 3
    volumes:
      - ./keys:/app/keys:ro  # Same keypair across instances
```

Use a load balancer (nginx, HAProxy, cloud LB) in front.

---

## Emergency Procedures

### Compromised Private Key

1. **Immediately:** Take agent offline
2. **Revoke:** Add all active tokens to revocation list
3. **Notify:** Alert users to not grant new tokens
4. **Rotate:** Generate new keypair
5. **Deploy:** Restart with new keypair
6. **Communicate:** Share new public key with users

### Data Breach

1. **Investigate:** Check audit logs for unauthorized access
2. **Contain:** Take affected systems offline
3. **Document:** Record timeline and affected tokens
4. **Notify:** Follow breach notification requirements
5. **Remediate:** Patch vulnerability
6. **Review:** Update security practices

### Service Degradation

```bash
# Check system resources
top
df -h
free -m

# Check logs for errors
tail -f logs/agent.log | grep -i error

# Restart if needed
docker-compose restart health-analyzer

# Scale if overloaded
docker-compose up -d --scale health-analyzer=3
```

---

## Next Steps

- [Quickstart](./QUICKSTART.md) - Getting started
- [API Reference](./API-REFERENCE.md) - Complete API docs
- [Architecture](./ARCHITECTURE.md) - System design
- [Design Practices](./DESIGN-PRACTICES.md) - UX guidelines
