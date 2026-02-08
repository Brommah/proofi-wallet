# Proofi Deployment Guide

This guide covers deploying Proofi agents for production use, including self-hosting DDC and Cere nodes for true 100% trustless operation.

---

## 📋 Table of Contents

1. [Deployment Options](#deployment-options)
2. [Quick Start (Using Public Infrastructure)](#quick-start-using-public-infrastructure)
3. [Self-Hosted Agent](#self-hosted-agent)
4. [Self-Hosted DDC Node](#self-hosted-ddc-node)
5. [Self-Hosted Cere Node](#self-hosted-cere-node)
6. [100% Trustless Setup](#100-trustless-setup)
7. [Monitoring & Operations](#monitoring--operations)
8. [Backup & Recovery](#backup--recovery)

---

## Deployment Options

| Level | What You Host | Trust Required | Complexity |
|-------|---------------|----------------|------------|
| **Level 1** | Agent only | DDC + Cere mainnet | Low |
| **Level 2** | Agent + DDC node | Cere mainnet only | Medium |
| **Level 3** | Everything | None (100% trustless) | High |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT LEVELS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Level 1: Agent Only (Quick Start)                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  YOUR INFRASTRUCTURE          PUBLIC INFRASTRUCTURE                │   │
│  │  ┌──────────────────┐        ┌─────────────┐   ┌─────────────┐    │   │
│  │  │                  │        │             │   │             │    │   │
│  │  │  Health Analyzer │───────▶│  DDC CDN    │   │ Cere Chain  │    │   │
│  │  │  Agent           │        │  (public)   │   │ (mainnet)   │    │   │
│  │  │                  │        │             │   │             │    │   │
│  │  └──────────────────┘        └─────────────┘   └─────────────┘    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Level 2: Agent + DDC Node                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  YOUR INFRASTRUCTURE                          PUBLIC                │   │
│  │  ┌──────────────────┐    ┌──────────────────┐ ┌─────────────┐      │   │
│  │  │                  │    │                  │ │             │      │   │
│  │  │  Health Analyzer │───▶│  DDC Node        │ │ Cere Chain  │      │   │
│  │  │  Agent           │    │  (self-hosted)   │ │ (mainnet)   │      │   │
│  │  │                  │    │                  │ │             │      │   │
│  │  └──────────────────┘    └──────────────────┘ └─────────────┘      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Level 3: 100% Trustless                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  YOUR INFRASTRUCTURE (Everything self-hosted)                       │   │
│  │  ┌──────────────────┐    ┌──────────────────┐  ┌──────────────────┐│   │
│  │  │                  │    │                  │  │                  ││   │
│  │  │  Health Analyzer │───▶│  DDC Node        │  │  Cere Node       ││   │
│  │  │  Agent           │    │                  │  │  (validator/     ││   │
│  │  │                  │    │                  │  │   archive)       ││   │
│  │  └──────────────────┘    └──────────────────┘  └──────────────────┘│   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start (Using Public Infrastructure)

The fastest way to get started. Uses public DDC CDN and Cere mainnet.

### Prerequisites

- Linux server (Ubuntu 22.04+ recommended)
- Node.js 18+
- 4GB RAM minimum
- Docker (optional)

### Option A: Direct Installation

```bash
# 1. Clone and install
git clone https://github.com/proofi/agents.git
cd agents/health-analyzer
npm install
npm run build

# 2. Install Ollama (for local AI)
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2:3b

# 3. Create Cere wallet
# Visit https://portal.cere.network to create a wallet
# Fund it with CERE tokens for transaction fees

# 4. Configure environment
cat > .env << 'EOF'
WALLET_PATH=./cere-wallet.json
WALLET_PASSPHRASE=your-secure-passphrase
DDC_BUCKET_ID=1229
PORT=3100
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
EOF

# 5. Start the agent
npm start
```

### Option B: Docker

```dockerfile
# Dockerfile
FROM node:20-slim

WORKDIR /app

# Install Ollama (for local AI)
RUN curl -fsSL https://ollama.ai/install.sh | sh

# Copy application
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

# Don't run as root
USER node

EXPOSE 3100

CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3

  health-analyzer:
    build: .
    ports:
      - "3100:3100"
    environment:
      - WALLET_PATH=/run/secrets/cere_wallet
      - WALLET_PASSPHRASE_FILE=/run/secrets/wallet_passphrase
      - DDC_BUCKET_ID=1229
      - OLLAMA_URL=http://ollama:11434
      - OLLAMA_MODEL=llama3.2:3b
    secrets:
      - cere_wallet
      - wallet_passphrase
    depends_on:
      ollama:
        condition: service_healthy

secrets:
  cere_wallet:
    file: ./secrets/cere-wallet.json
  wallet_passphrase:
    file: ./secrets/wallet-passphrase.txt

volumes:
  ollama_data:
```

```bash
# Deploy with Docker Compose
docker-compose up -d

# Pull Ollama model (first time only)
docker-compose exec ollama ollama pull llama3.2:3b

# Check logs
docker-compose logs -f health-analyzer
```

---

## Self-Hosted Agent

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores (for local AI) |
| RAM | 4GB | 16GB (for 7B+ models) |
| Disk | 20GB | 100GB SSD |
| Network | 10 Mbps | 100 Mbps |

### Production Configuration

```bash
# /etc/systemd/system/proofi-health-analyzer.service
[Unit]
Description=Proofi Health Analyzer Agent
After=network.target ollama.service

[Service]
Type=simple
User=proofi
Group=proofi
WorkingDirectory=/opt/proofi/health-analyzer
EnvironmentFile=/opt/proofi/health-analyzer/.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/opt/proofi/health-analyzer/audit-logs
ReadWritePaths=/opt/proofi/health-analyzer/keys

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable proofi-health-analyzer
sudo systemctl start proofi-health-analyzer
sudo systemctl status proofi-health-analyzer
```

### Reverse Proxy (nginx)

```nginx
# /etc/nginx/sites-available/proofi-agent
server {
    listen 443 ssl http2;
    server_name agent.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/agent.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/agent.yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000" always;

    # Rate limiting
    limit_req zone=api burst=20 nodelay;
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Self-Hosted DDC Node

Running your own DDC node ensures your data never touches third-party infrastructure.

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8+ cores |
| RAM | 16GB | 32GB |
| Disk | 500GB SSD | 2TB NVMe |
| Network | 100 Mbps | 1 Gbps |

### Installation

```bash
# 1. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 2. Clone DDC node
git clone https://github.com/Cerebellum-Network/ddc-node.git
cd ddc-node

# 3. Build
cargo build --release

# 4. Configure
cat > config.toml << 'EOF'
[node]
role = "storage"
p2p_port = 9944
rpc_port = 9933
data_dir = "/var/lib/ddc-node"

[storage]
max_size = "500GB"
replication_factor = 3

[network]
bootstrap_nodes = [
    "/ip4/34.93.91.XXX/tcp/9944/p2p/12D3KooWXXX...",
]

[blockchain]
endpoint = "wss://archive.mainnet.cere.network/ws"
EOF

# 5. Start node
./target/release/ddc-node --config config.toml
```

### Systemd Service

```bash
# /etc/systemd/system/ddc-node.service
[Unit]
Description=Cere DDC Storage Node
After=network.target

[Service]
Type=simple
User=ddc
Group=ddc
WorkingDirectory=/opt/ddc-node
ExecStart=/opt/ddc-node/target/release/ddc-node --config /etc/ddc-node/config.toml
Restart=always
RestartSec=10

LimitNOFILE=65535
LimitNPROC=65535

[Install]
WantedBy=multi-user.target
```

### Connecting Agent to Self-Hosted DDC

```bash
# Update agent environment
cat >> .env << 'EOF'
DDC_CLUSTER_URL=http://localhost:9933
DDC_BOOTSTRAP_NODES=/ip4/127.0.0.1/tcp/9944/p2p/YOUR_PEER_ID
EOF
```

---

## Self-Hosted Cere Node

For true trustless operation, run your own Cere blockchain node.

### Node Types

| Type | Purpose | Resources |
|------|---------|-----------|
| **Light** | Query only, no validation | 2GB RAM, 50GB disk |
| **Full** | Full state, no validation | 8GB RAM, 200GB disk |
| **Archive** | Full history, all data | 32GB RAM, 2TB+ disk |
| **Validator** | Block production | 16GB RAM, 500GB disk |

### Archive Node Setup (Recommended for Agents)

```bash
# 1. Clone Cere node
git clone https://github.com/Cerebellum-Network/cere-node.git
cd cere-node

# 2. Build
cargo build --release

# 3. Download chain spec
curl -O https://cere.network/specs/mainnet.json

# 4. Start archive node
./target/release/cere-node \
  --chain mainnet.json \
  --name "my-proofi-node" \
  --pruning archive \
  --rpc-external \
  --rpc-cors all \
  --rpc-methods Unsafe \
  --base-path /var/lib/cere-node
```

### Docker Deployment

```yaml
# docker-compose.cere-node.yml
version: '3.8'

services:
  cere-node:
    image: cerebellumnetwork/cere-node:latest
    command:
      - --chain=mainnet
      - --name=proofi-archive
      - --pruning=archive
      - --rpc-external
      - --rpc-cors=all
      - --rpc-port=9933
      - --ws-port=9944
      - --ws-external
    volumes:
      - cere_data:/data
    ports:
      - "9933:9933"  # RPC
      - "9944:9944"  # WebSocket
      - "30333:30333"  # P2P
    restart: unless-stopped

volumes:
  cere_data:
```

### Connecting Agent to Self-Hosted Cere Node

```typescript
// src/attestation.ts
const CERE_RPC = process.env.CERE_RPC || 'ws://localhost:9944';

// Update .env
// CERE_RPC=ws://localhost:9944
```

---

## 100% Trustless Setup

Complete self-hosted infrastructure with zero external dependencies.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        100% TRUSTLESS INFRASTRUCTURE                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                          YOUR PRIVATE NETWORK                                 │ │
│  │                                                                               │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │ │
│  │  │             │    │             │    │             │    │             │    │ │
│  │  │   Ollama    │    │   Health    │    │    DDC      │    │   Cere      │    │ │
│  │  │   Server    │◀───│   Analyzer  │───▶│   Node      │    │   Node      │    │ │
│  │  │             │    │   Agent     │    │             │    │  (archive)  │    │ │
│  │  │             │    │             │───▶│             │◀───│             │    │ │
│  │  └─────────────┘    └─────────────┘    └──────┬──────┘    └──────┬──────┘    │ │
│  │     :11434            :3100               :9933            :9944            │ │
│  │                                               │                  │            │ │
│  │                                               └──────────────────┘            │ │
│  │                                                  P2P Network                  │ │
│  │                                                                               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
│  External connections (optional, for network participation):                        │
│  • DDC node peers with mainnet DDC network                                          │
│  • Cere node syncs with mainnet validators                                          │
│                                                                                     │
│  Data flow:                                                                         │
│  1. User uploads encrypted data → Your DDC node                                     │
│  2. Agent fetches from your DDC → Decrypts locally                                  │
│  3. Ollama runs inference → 100% local                                              │
│  4. Agent stores encrypted output → Your DDC                                        │
│  5. Attestation → Your Cere node → Propagates to network                            │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Docker Compose (Full Stack)

```yaml
# docker-compose.full.yml
version: '3.8'

services:
  # Local AI
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]  # If you have NVIDIA GPU
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3

  # DDC Storage Node
  ddc-node:
    image: cerebellumnetwork/ddc-node:latest
    volumes:
      - ddc_data:/data
    ports:
      - "9933:9933"   # RPC
      - "9944:9944"   # P2P
    environment:
      - RUST_LOG=info
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9933/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Cere Blockchain Node (Archive)
  cere-node:
    image: cerebellumnetwork/cere-node:latest
    command:
      - --chain=mainnet
      - --pruning=archive
      - --rpc-external
      - --rpc-cors=all
      - --ws-external
    volumes:
      - cere_data:/data
    ports:
      - "9945:9944"   # WebSocket
      - "9934:9933"   # RPC
      - "30333:30333" # P2P
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9933/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Health Analyzer Agent
  health-analyzer:
    build: ./health-analyzer
    ports:
      - "3100:3100"
    environment:
      - WALLET_PATH=/run/secrets/cere_wallet
      - WALLET_PASSPHRASE_FILE=/run/secrets/wallet_passphrase
      - DDC_CLUSTER_URL=http://ddc-node:9933
      - CERE_RPC=ws://cere-node:9944
      - OLLAMA_URL=http://ollama:11434
      - OLLAMA_MODEL=llama3.2:3b
    secrets:
      - cere_wallet
      - wallet_passphrase
    depends_on:
      ollama:
        condition: service_healthy
      ddc-node:
        condition: service_healthy
      cere-node:
        condition: service_healthy

secrets:
  cere_wallet:
    file: ./secrets/cere-wallet.json
  wallet_passphrase:
    file: ./secrets/wallet-passphrase.txt

volumes:
  ollama_data:
  ddc_data:
  cere_data:
```

### Startup Script

```bash
#!/bin/bash
# start-trustless.sh

set -e

echo "Starting 100% Trustless Proofi Stack..."

# 1. Start infrastructure
docker-compose -f docker-compose.full.yml up -d cere-node ddc-node ollama

# 2. Wait for services
echo "Waiting for services to be healthy..."
sleep 30

# 3. Pull Ollama model (if not exists)
docker-compose exec ollama ollama pull llama3.2:3b

# 4. Check Cere node sync status
echo "Checking Cere node sync status..."
curl -s http://localhost:9934 -H "Content-Type: application/json" \
  -d '{"id":1, "jsonrpc":"2.0", "method":"system_syncState"}' | jq

# 5. Start agent
docker-compose -f docker-compose.full.yml up -d health-analyzer

# 6. Verify
echo "Verifying setup..."
curl http://localhost:3100/status | jq

echo "✅ Trustless stack is running!"
echo "   Agent:      http://localhost:3100"
echo "   DDC RPC:    http://localhost:9933"
echo "   Cere WS:    ws://localhost:9945"
```

---

## Monitoring & Operations

### Prometheus Metrics

Add to agent:

```typescript
// src/metrics.ts
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client';

export const registry = new Registry();
collectDefaultMetrics({ register: registry });

export const analysisCounter = new Counter({
  name: 'proofi_analyses_total',
  help: 'Total number of health analyses',
  labelNames: ['status'],
  registers: [registry],
});

export const analysisDuration = new Histogram({
  name: 'proofi_analysis_duration_seconds',
  help: 'Duration of health analysis',
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [registry],
});

// In server.ts
app.get('/metrics', async (c) => {
  return c.text(await registry.metrics());
});
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Proofi Health Analyzer",
    "panels": [
      {
        "title": "Analyses per Hour",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(proofi_analyses_total[1h])",
            "legendFormat": "{{status}}"
          }
        ]
      },
      {
        "title": "Analysis Duration",
        "type": "heatmap",
        "targets": [
          {
            "expr": "rate(proofi_analysis_duration_seconds_bucket[5m])"
          }
        ]
      }
    ]
  }
}
```

### Health Checks

```bash
# Check all services
curl http://localhost:3100/status          # Agent
curl http://localhost:9933/health           # DDC node
curl http://localhost:9934/health           # Cere node
curl http://localhost:11434/api/tags        # Ollama
```

### Log Aggregation

```yaml
# docker-compose.logging.yml
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - loki_data:/loki

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - ./promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml

volumes:
  loki_data:
```

---

## Backup & Recovery

### What to Back Up

| Data | Location | Frequency | Retention |
|------|----------|-----------|-----------|
| Agent keypair | `./keys/agent-keypair.json` | On change | Forever |
| Wallet | `./cere-wallet.json` | On change | Forever |
| Audit logs | `./audit-logs/` | Daily | 90 days |
| DDC data | `/var/lib/ddc-node/` | Daily | As needed |
| Cere chain | `/var/lib/cere-node/` | Weekly | As needed |

### Backup Script

```bash
#!/bin/bash
# backup-proofi.sh

BACKUP_DIR="/backup/proofi/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# 1. Agent keys (encrypted backup)
gpg --symmetric --cipher-algo AES256 \
    -o "$BACKUP_DIR/agent-keypair.json.gpg" \
    ./keys/agent-keypair.json

# 2. Wallet (encrypted backup)
gpg --symmetric --cipher-algo AES256 \
    -o "$BACKUP_DIR/cere-wallet.json.gpg" \
    ./cere-wallet.json

# 3. Audit logs
tar -czf "$BACKUP_DIR/audit-logs.tar.gz" ./audit-logs/

# 4. DDC data (if self-hosted)
docker-compose exec ddc-node tar -czf - /data > "$BACKUP_DIR/ddc-data.tar.gz"

# 5. Verify backup
echo "Backup complete. Verify integrity:"
ls -la "$BACKUP_DIR"
sha256sum "$BACKUP_DIR"/*

# 6. Upload to off-site storage (optional)
# aws s3 sync "$BACKUP_DIR" s3://your-bucket/proofi-backups/
```

### Recovery Procedure

```bash
#!/bin/bash
# recover-proofi.sh

BACKUP_DIR="/backup/proofi/2024-02-08"

# 1. Stop services
docker-compose down

# 2. Restore agent keypair
gpg --decrypt "$BACKUP_DIR/agent-keypair.json.gpg" > ./keys/agent-keypair.json
chmod 600 ./keys/agent-keypair.json

# 3. Restore wallet
gpg --decrypt "$BACKUP_DIR/cere-wallet.json.gpg" > ./cere-wallet.json
chmod 600 ./cere-wallet.json

# 4. Restore audit logs
tar -xzf "$BACKUP_DIR/audit-logs.tar.gz" -C ./

# 5. Restart services
docker-compose up -d

# 6. Verify
curl http://localhost:3100/agent-info | jq '.publicKey'
```

---

## Security Hardening

### Firewall Rules

```bash
# Allow only necessary ports
ufw default deny incoming
ufw default allow outgoing

# SSH (restrict to specific IPs)
ufw allow from 192.168.1.0/24 to any port 22

# Agent API (if exposing publicly)
ufw allow 443/tcp

# Internal services (localhost only)
# DDC, Cere, Ollama should not be exposed

ufw enable
```

### SELinux Policy

```bash
# /etc/selinux/proofi.te
policy_module(proofi, 1.0)

require {
    type httpd_t;
    type httpd_sys_content_t;
    class file { read write create };
}

allow httpd_t httpd_sys_content_t:file { read write create };
```

### Secrets Management

For production, use a secrets manager instead of files:

```bash
# HashiCorp Vault
vault kv put secret/proofi/wallet @cere-wallet.json
vault kv put secret/proofi/passphrase value="your-passphrase"

# In Docker
environment:
  - VAULT_ADDR=https://vault.yourdomain.com
  - VAULT_TOKEN_FILE=/run/secrets/vault_token
```

---

## Next Steps

- [SECURITY.md](./SECURITY.md) — Security best practices
- [CLI.md](./CLI.md) — Command reference
- [EXAMPLES.md](./EXAMPLES.md) — Usage examples
