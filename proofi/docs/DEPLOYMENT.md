# Proofi Deployment Guide

> How to deploy and run all Proofi components.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Frontend (Vercel)](#frontend-vercel)
4. [API Endpoints (Vercel Serverless)](#api-endpoints-vercel-serverless)
5. [Agent SDK (NPM)](#agent-sdk-npm)
6. [Health Analyzer Agent](#health-analyzer-agent)
7. [Chrome Extension](#chrome-extension)
8. [Mac Mini Health Scripts](#mac-mini-health-scripts)
9. [Environment Variables](#environment-variables)
10. [DNS & Domains](#dns--domains)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PROOFI ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
│  │   Frontend   │    │  API Routes  │    │    Cere DDC Storage      │  │
│  │   (Vercel)   │◀──▶│   (Vercel)   │◀──▶│  (Decentralized Cloud)   │  │
│  │              │    │              │    │                          │  │
│  │ • landing    │    │ • /api/ddc   │    │ • Encrypted blobs        │  │
│  │ • /app       │    │ • /api/drop  │    │ • User buckets           │  │
│  │ • /portal    │    │ • /api/photos│    │ • Agent data access      │  │
│  │ • demos      │    │              │    │                          │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘  │
│         │                   │                                          │
│         │                   │                                          │
│         ▼                   ▼                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
│  │   Chrome     │    │   Agent SDK  │    │   Health Analyzer        │  │
│  │  Extension   │    │   (@proofi/  │    │       Agent              │  │
│  │              │    │  agent-sdk)  │    │                          │  │
│  │ • Wallet UI  │    │              │    │ • Local or hosted        │  │
│  │ • Token mgmt │    │ • Token      │    │ • Ollama or OpenAI       │  │
│  │ • Signing    │    │   parsing    │    │ • Audit logging          │  │
│  └──────────────┘    │ • Crypto     │    └──────────────────────────┘  │
│                      │ • DDC access │                                  │
│                      └──────────────┘                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required
- **Node.js** v18+ (v22 recommended)
- **npm** v9+
- **Vercel CLI** (`npm i -g vercel`)
- **Git**

### For Health Scripts
- **macOS** (Apple Silicon preferred)
- **Ollama** (for local AI)
- **tsx** (`npm i -g tsx`)

### Accounts
- [Vercel](https://vercel.com) account (linked to GitHub)
- [Cere DDC](https://cere.network) testnet/mainnet access
- (Optional) [Upstash](https://upstash.com) for Redis/KV

---

## Frontend (Vercel)

### Initial Setup

```bash
cd ~/clawd/proofi

# Login to Vercel
vercel login

# Link to existing project (or create new)
vercel link

# Pull environment variables
vercel env pull .env.local
```

### Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or push to main branch for auto-deploy
git push origin main
```

### Deploy Preview

```bash
# Create preview deployment
vercel

# Or push to any non-main branch
git push origin feature/my-feature
```

### Manual Build (Local)

```bash
# Install dependencies
npm install

# Vercel dev server (includes serverless functions)
vercel dev

# Access at http://localhost:3000
```

### URL Rewrites

Routes are configured in `vercel.json`:

| Path | Destination |
|------|-------------|
| `/` | `/landing.html` |
| `/app` | `/app/index.html` |
| `/portal` | `/portal.html` |
| `/ecosystem` | `/ecosystem.html` |
| `/verify` | `/verify.html` |
| `/health` | `/health.html` |
| `/game` | `/game.html` |
| `/api/*` | Serverless functions |

---

## API Endpoints (Vercel Serverless)

### Structure

```
api/
├── ddc/
│   └── revoke.js      # Token revocation
├── drop/
│   ├── [dropId].js    # Get drop by ID
│   ├── inbox/         # Inbox management
│   └── upload.js      # Upload drops
└── photos/
    ├── chunk.js       # Chunked upload
    ├── stream-upload.js
    └── upload.js      # Photo upload
```

### Deploy API Only

API functions deploy automatically with the frontend. No separate deployment needed.

### Testing Locally

```bash
vercel dev

# Test endpoints
curl http://localhost:3000/api/ddc/revoke?tokenId=test
curl -X POST http://localhost:3000/api/drop/upload
```

### CORS Configuration

CORS headers are set in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://proofi.ai, https://proofi-virid.vercel.app" }
      ]
    }
  ]
}
```

Update allowed origins when adding new domains.

---

## Agent SDK (NPM)

### Build & Publish

```bash
cd ~/clawd/proofi/agent-sdk

# Install dependencies
npm install

# Build (creates dist/)
npm run build

# Run tests
npm test

# Publish to NPM (requires npm login)
npm publish --access public
```

### Package Details

- **Name:** `@proofi/agent-sdk`
- **Main exports:** `ProofiAgent`, token utils, crypto utils
- **Formats:** CJS, ESM, TypeScript declarations

### Development

```bash
# Watch mode for development
npm run dev

# Run tests in watch mode
npm run test:watch
```

---

## Health Analyzer Agent

### Local Development

```bash
cd ~/clawd/proofi/agents/health-analyzer

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your settings

# Run in development
npm run dev

# Or run in pure local mode
npm run local
```

### Production Deployment

#### Option 1: Docker

```bash
# Build image
docker build -t proofi/health-analyzer .

# Run container
docker run -d \
  --name health-analyzer \
  -p 3001:3001 \
  -e OPENAI_API_KEY=sk-... \
  -e DDC_RPC_URL=wss://... \
  proofi/health-analyzer
```

#### Option 2: Node.js Direct

```bash
npm run build
npm start
```

#### Option 3: Railway/Render/Fly.io

Push to connected repo → auto-deploy.

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/status` | GET | Health check |
| `/agent-info` | GET | Public key & capabilities |
| `/analyze` | POST | Analyze health data with token |

---

## Chrome Extension

### Build Extension

```bash
cd ~/clawd/proofi/chrome-ext

# No build step needed - pure JS
# Files are ready to load
```

### Load in Chrome (Development)

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `~/clawd/proofi/chrome-ext` folder

### Package for Distribution

```bash
# Create zip for Chrome Web Store
cd ~/clawd/proofi
zip -r proofi-extension.zip chrome-ext/ \
  -x "*.git*" \
  -x "*node_modules*"
```

### Update Extension

1. Bump version in `chrome-ext/manifest.json`
2. Reload extension in `chrome://extensions/`
3. For Web Store: upload new zip

---

## Mac Mini Health Scripts

### Initial Setup

```bash
cd ~/clawd/proofi/scripts

# Run setup script (installs everything)
chmod +x setup-mac-mini.sh
./setup-mac-mini.sh

# This installs:
# - Homebrew (if needed)
# - Node.js & tsx
# - Ollama with llama3.2:3b model
# - Directory structure at ~/.proofi/
```

### Directory Structure Created

```
~/.proofi/
├── health/
│   ├── raw/          # Place export.xml here
│   └── parsed/       # Parsed JSON
├── encrypted/        # Encrypted scope data
├── config/
│   ├── proofi.json
│   ├── scopes.json
│   └── user-preferences.json
└── logs/
```

### Import Health Data

```bash
cd ~/clawd/proofi/scripts
npm install

# Import from Apple Health export
npm run import -- --file ~/.proofi/health/raw/export.xml

# Import specific scopes only
npm run import -- --file export.xml --scopes steps,heartRate,sleep

# Preview without storing
npm run import -- --file export.xml --preview
```

### Manage Scope Sharing

```bash
# Interactive scope management
npm run scopes

# CLI options
npm run scopes -- --list
npm run scopes -- --enable steps,heartRate
npm run scopes -- --disable bodyMass
npm run scopes -- --status
```

---

## Environment Variables

### Required Variables

| Variable | Description | Where Used |
|----------|-------------|------------|
| `DDC_RPC_URL` | Cere DDC websocket URL | API, Agents |
| `DDC_BUCKET_ID` | Default bucket ID | API |
| `UPSTASH_REDIS_REST_URL` | Redis URL | API (caching) |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth token | API |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | For AI analysis | (use Ollama instead) |
| `VERCEL_ENV` | Environment name | `development` |
| `LOG_LEVEL` | Logging verbosity | `info` |

### Setting Variables

```bash
# Local development
cp .env.example .env.local
# Edit .env.local

# Vercel
vercel env add DDC_RPC_URL production
# Or use Vercel dashboard: Project Settings → Environment Variables

# Mac Mini scripts
export OPENAI_API_KEY=sk-...
# Or add to ~/.zshrc
```

---

## DNS & Domains

### Current Domains

| Domain | Points To |
|--------|-----------|
| `proofi.ai` | Vercel (production) |
| `proofi-virid.vercel.app` | Vercel (auto) |

### Adding Custom Domain

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add domain
3. Configure DNS:
   - **A record:** `76.76.21.21`
   - **CNAME:** `cname.vercel-dns.com` (for subdomains)
4. Wait for SSL certificate (automatic)

### Subdomain Setup

```
app.proofi.ai   → CNAME → cname.vercel-dns.com
api.proofi.ai   → CNAME → cname.vercel-dns.com
docs.proofi.ai  → (future documentation site)
```

---

## Deployment Checklist

### Before Production Deploy

- [ ] All tests passing (`npm test`)
- [ ] Environment variables set in Vercel
- [ ] CORS origins updated if adding domains
- [ ] Version bumped in package.json
- [ ] No secrets in code or logs
- [ ] Changelog updated

### After Production Deploy

- [ ] Verify landing page loads
- [ ] Test wallet connection flow
- [ ] Test API endpoints
- [ ] Check browser console for errors
- [ ] Monitor logs in Vercel dashboard
- [ ] Test on mobile

---

## Rollback

### Vercel Rollback

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

Or in Vercel Dashboard: Deployments → Click deployment → ⋮ → Promote to Production

### Git Rollback

```bash
git revert HEAD
git push origin main
```

---

## Quick Commands Reference

```bash
# Deploy to Vercel production
vercel --prod

# Local development with API
vercel dev

# Build agent SDK
cd agent-sdk && npm run build

# Run health analyzer locally
cd agents/health-analyzer && npm run local

# Import health data
cd scripts && npm run import -- --file export.xml

# Package Chrome extension
zip -r proofi-extension.zip chrome-ext/
```

---

*Last updated: 2025-02-08*
