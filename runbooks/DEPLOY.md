# Proofi Deployment Runbook

> Step-by-step guide for deploying Proofi to production.

---

## 📋 Prerequisites

### Required Access
- [ ] Vercel account with team access
- [ ] GitHub repo access (push to main)
- [ ] Railway dashboard access (for API)
- [ ] Cere Network wallet with DDC credentials
- [ ] DNS management access (proofi.ai)

### Local Setup
- [ ] Node.js v18+ installed
- [ ] pnpm installed (`npm i -g pnpm`)
- [ ] Vercel CLI (`npm i -g vercel`)
- [ ] Git configured with SSH keys

### Verify Environment
```bash
node --version    # v18.0.0+
pnpm --version    # v8.0.0+
vercel --version  # v33.0.0+
```

---

## 🌐 Environment Variables

### Vercel (Frontend)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API endpoint | ✅ |
| `NEXT_PUBLIC_CERE_NETWORK` | `mainnet` or `testnet` | ✅ |
| `NEXT_PUBLIC_DDC_BUCKET` | Cere DDC bucket ID | ✅ |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID | ❌ |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking | ❌ |

### Railway (API)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `CERE_SEED_PHRASE` | Platform wallet mnemonic | ✅ |
| `JWT_SECRET` | Auth token signing key | ✅ |
| `ENCRYPTION_KEY` | Data encryption key (32 bytes) | ✅ |
| `DDC_CLUSTER_ID` | Cere DDC cluster | ✅ |
| `REDIS_URL` | Cache/queue connection | ❌ |

---

## 🚀 Deployment Steps

### 1. Pre-Deployment Checks

```bash
# Pull latest changes
git pull origin main

# Check for uncommitted changes
git status

# Run tests
pnpm test

# Run linting
pnpm lint

# Build locally to verify
pnpm build
```

### 2. Deploy to Vercel (Frontend)

#### Option A: Automatic (Recommended)
Push to `main` branch triggers automatic deployment:
```bash
git push origin main
```

#### Option B: Manual CLI Deploy
```bash
cd proofi/
vercel --prod
```

#### Option C: Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select "proofi" project
3. Click "Deployments" → "Redeploy"

### 3. Deploy API (Railway)

Railway auto-deploys on push to `main`. For manual:
1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Select "proofi-api" service
3. Click "Deploy" → "Deploy Now"

### 4. Post-Deployment Verification

```bash
# Check frontend
curl -I https://proofi.ai
# Should return 200 OK

# Check API health
curl https://proofi-api-production.up.railway.app/health
# Should return {"status": "ok"}

# Test wallet connection
# Open https://proofi.ai and verify extension connectivity
```

---

## 🔄 Rollback Procedures

### Instant Rollback (Vercel)

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

**CLI Rollback:**
```bash
vercel rollback [deployment-url]
```

### Database Rollback (Railway)

⚠️ **CAUTION: Database rollbacks may cause data loss**

1. Connect to Railway PostgreSQL
2. Restore from automated backup:
   - Railway Dashboard → Database → Backups
   - Select point-in-time → Restore

### Emergency Rollback Checklist

- [ ] Identify the broken deployment
- [ ] Rollback frontend (Vercel)
- [ ] Rollback API (Railway) if needed
- [ ] Verify services are restored
- [ ] Notify team in #proofi-alerts
- [ ] Create incident report

---

## 🌍 DNS & Domain Setup

### Primary Domain: proofi.ai

| Record | Type | Value | TTL |
|--------|------|-------|-----|
| @ | A | 76.76.21.21 | 300 |
| www | CNAME | cname.vercel-dns.com | 300 |
| api | CNAME | proofi-api-production.up.railway.app | 300 |

### Vercel Domain Configuration

1. Vercel Dashboard → Settings → Domains
2. Add `proofi.ai` and `www.proofi.ai`
3. Enable "Redirect www to apex"

### SSL Certificates
- Vercel handles SSL automatically
- Railway provides SSL for API subdomain
- Verify: `curl -I https://proofi.ai` shows valid cert

---

## 📦 Chrome Extension Deployment

See [EXTENSION.md](./EXTENSION.md) for Chrome Web Store submission.

For internal testing builds:
```bash
cd extension/
pnpm build
# Creates extension.zip for manual install
```

---

## 🆘 Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

### Vercel Deployment Stuck

1. Cancel current deployment in dashboard
2. Check build logs for errors
3. Verify environment variables are set
4. Re-trigger deployment

### API 502/503 Errors

1. Check Railway logs for crashes
2. Verify DATABASE_URL is correct
3. Check if rate limits are hit
4. Restart service: Railway Dashboard → Restart

### DDC Connection Issues

1. Verify CERE_SEED_PHRASE is correct
2. Check DDC cluster status: [status.cere.network](https://status.cere.network)
3. Try different DDC cluster if needed

---

## 📞 Escalation Contacts

| Role | Contact | When to Escalate |
|------|---------|------------------|
| DevOps Lead | @martijn | Deployment failures |
| Backend Lead | @team | API/database issues |
| Cere Support | support@cere.network | DDC infrastructure |
| Vercel Support | vercel.com/support | Platform issues |

---

*Last Updated: February 2025*
