# Proofi Monitoring Guide

> What to watch and how to stay informed.

---

## Table of Contents

1. [Monitoring Overview](#monitoring-overview)
2. [Vercel Monitoring](#vercel-monitoring)
3. [API Monitoring](#api-monitoring)
4. [DDC/Blockchain Monitoring](#ddcblockchain-monitoring)
5. [User Experience Monitoring](#user-experience-monitoring)
6. [Alerting Setup](#alerting-setup)
7. [Dashboards](#dashboards)
8. [Log Analysis](#log-analysis)
9. [Metrics to Track](#metrics-to-track)
10. [Health Check Endpoints](#health-check-endpoints)

---

## Monitoring Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PROOFI MONITORING STACK                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │    Frontend      │  │       API        │  │   External Deps  │      │
│  │   Monitoring     │  │   Monitoring     │  │   Monitoring     │      │
│  │                  │  │                  │  │                  │      │
│  │ • Vercel         │  │ • Vercel Logs    │  │ • Cere DDC       │      │
│  │   Analytics      │  │ • Response times │  │ • Upstash Redis  │      │
│  │ • Web Vitals     │  │ • Error rates    │  │ • OpenAI (if     │      │
│  │ • Error tracking │  │ • Status codes   │  │   used)          │      │
│  │                  │  │                  │  │                  │      │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘      │
│           │                     │                     │                 │
│           └─────────────────────┼─────────────────────┘                 │
│                                 ▼                                       │
│                    ┌────────────────────────┐                          │
│                    │       Alerting         │                          │
│                    │                        │                          │
│                    │ • Slack notifications  │                          │
│                    │ • Email alerts         │                          │
│                    │ • PagerDuty (future)   │                          │
│                    │                        │                          │
│                    └────────────────────────┘                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Monitor what matters** — Focus on user-facing metrics
2. **Alert on actionable issues** — Don't cry wolf
3. **Keep dashboards simple** — One glance should tell the story
4. **Log for debugging** — Not for reading regularly

---

## Vercel Monitoring

### Built-in Analytics

Access at: **Vercel Dashboard → Project → Analytics**

#### Key Metrics

| Metric | What It Tells You | Target |
|--------|-------------------|--------|
| Web Vitals | Real user performance | LCP < 2.5s, CLS < 0.1 |
| Requests | Traffic volume | Baseline varies |
| Bandwidth | Data transfer | Under plan limit |
| Cache Hit Rate | CDN effectiveness | > 90% |

#### Enabling Analytics

```javascript
// In your app (if using Next.js or similar)
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

For static HTML, add this script:

```html
<script defer src="/_vercel/insights/script.js"></script>
```

### Deployment Monitoring

**Location:** Vercel Dashboard → Project → Deployments

**Watch for:**
- ❌ Failed builds (red)
- ⚠️ Build duration increasing over time
- 📊 Function cold start times

### Function Logs

**Location:** Vercel Dashboard → Project → Logs

```bash
# CLI access
vercel logs --follow

# Filter by path
vercel logs --path=/api/ddc

# Last hour
vercel logs --since=1h
```

---

## API Monitoring

### Response Time Tracking

**Manual check script:**

```bash
#!/bin/bash
# monitor-api.sh

ENDPOINTS=(
  "https://proofi-virid.vercel.app/api/ddc/revoke?tokenId=test"
  "https://proofi-virid.vercel.app/api/drop/test"
)

for endpoint in "${ENDPOINTS[@]}"; do
  TIME=$(curl -s -o /dev/null -w "%{time_total}" "$endpoint")
  echo "$endpoint: ${TIME}s"
done
```

### Status Code Distribution

Track these status codes:

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Normal |
| 400 | Bad request | Check client code |
| 401/403 | Auth failed | Check tokens |
| 404 | Not found | Check routes |
| 429 | Rate limited | Back off |
| 500 | Server error | **Investigate immediately** |
| 502/503 | Infrastructure | Check Vercel status |

### Error Rate Calculation

```
Error Rate = (4xx + 5xx responses) / Total responses × 100

Target: < 1%
Warning: > 1%
Critical: > 5%
```

### API Health Check Endpoint

Add this endpoint for monitoring services:

```javascript
// api/health.js
export default function handler(req, res) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    checks: {
      api: 'ok',
      // Add more checks as needed
    }
  };
  
  res.status(200).json(health);
}
```

---

## DDC/Blockchain Monitoring

### Cere Network Status

- **Mainnet:** https://stats.cere.network
- **Testnet:** https://stats.testnet.cere.network

### Key Metrics to Watch

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Block time | Time between blocks | > 12s |
| Finality | Blocks to finality | > 3 blocks |
| Node count | Active validators | Decreasing |
| RPC response | RPC latency | > 5s |

### DDC Connection Health

```javascript
// Check DDC health
async function checkDDC() {
  const start = Date.now();
  
  try {
    const client = await DdcClient.buildAndConnect({
      clusterAddress: process.env.DDC_RPC_URL,
    });
    
    const connected = client.isConnected;
    const latency = Date.now() - start;
    
    await client.disconnect();
    
    return {
      status: connected ? 'ok' : 'error',
      latency,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      latency: Date.now() - start,
    };
  }
}
```

### Bucket Storage Monitoring

Track storage usage per bucket:

```javascript
async function getBucketStats(bucketId) {
  const client = await getDDCClient();
  const bucket = await client.getBucket(bucketId);
  
  return {
    bucketId,
    usedBytes: bucket.usedBytes,
    maxBytes: bucket.maxBytes,
    utilizationPercent: (bucket.usedBytes / bucket.maxBytes) * 100,
  };
}

// Alert if > 80% full
```

---

## User Experience Monitoring

### Web Vitals

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | ≤ 2.5s | 2.5s - 4s | > 4s |
| FID (First Input Delay) | ≤ 100ms | 100ms - 300ms | > 300ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| TTFB (Time to First Byte) | ≤ 800ms | 800ms - 1.8s | > 1.8s |

### Measuring Web Vitals

```javascript
// Add to your pages
import { getCLS, getFID, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric.name, metric.value);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### User Journey Monitoring

Track key flows:

```javascript
// Track wallet connection success rate
const connectionMetrics = {
  attempted: 0,
  succeeded: 0,
  failed: 0,
};

// On connect attempt
connectionMetrics.attempted++;

// On success
connectionMetrics.succeeded++;

// On failure
connectionMetrics.failed++;

// Success rate = succeeded / attempted
```

### Error Tracking

Add error boundary and logging:

```javascript
// Simple error tracking
window.onerror = function(msg, url, line, col, error) {
  // Send to your error tracking service
  console.error('Global error:', {
    message: msg,
    url: url,
    line: line,
    column: col,
    error: error?.stack,
  });
  return false;
};

// Promise rejection tracking
window.onunhandledrejection = function(event) {
  console.error('Unhandled promise rejection:', event.reason);
};
```

---

## Alerting Setup

### Slack Integration

Create incoming webhook and add alerts:

```bash
#!/bin/bash
# alert-to-slack.sh

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

send_alert() {
  local level=$1
  local message=$2
  
  local emoji="ℹ️"
  case $level in
    warning) emoji="⚠️" ;;
    critical) emoji="🚨" ;;
  esac
  
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\": \"$emoji *Proofi Alert*: $message\"}" \
    "$WEBHOOK_URL"
}

# Usage
send_alert "critical" "API error rate > 5%"
```

### Alert Rules

| Condition | Severity | Action |
|-----------|----------|--------|
| Site down > 1 min | 🚨 Critical | Page on-call |
| Error rate > 5% | 🚨 Critical | Page on-call |
| Error rate > 1% | ⚠️ Warning | Slack alert |
| Response time > 5s | ⚠️ Warning | Slack alert |
| Build failed | ℹ️ Info | Slack alert |
| DDC disconnected | 🚨 Critical | Page on-call |

### Uptime Monitoring

Use external uptime service (free options):

1. **UptimeRobot** (free tier: 50 monitors)
   ```
   Monitor: https://proofi.ai
   Interval: 5 minutes
   Alert: Email + Slack webhook
   ```

2. **Better Uptime** (free tier available)

3. **Cronitor** (free tier available)

---

## Dashboards

### Simple Status Dashboard

Create a status page at `/status`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Proofi Status</title>
  <style>
    .status { padding: 10px; margin: 5px; border-radius: 5px; }
    .ok { background: #4ade80; }
    .warning { background: #fbbf24; }
    .error { background: #f87171; }
  </style>
</head>
<body>
  <h1>Proofi System Status</h1>
  <div id="statuses">Loading...</div>
  
  <script>
    async function checkStatus() {
      const checks = [
        { name: 'Website', url: '/' },
        { name: 'API', url: '/api/health' },
        { name: 'Wallet', url: '/app' },
      ];
      
      const results = await Promise.all(
        checks.map(async (check) => {
          try {
            const res = await fetch(check.url, { method: 'HEAD' });
            return { ...check, status: res.ok ? 'ok' : 'error' };
          } catch {
            return { ...check, status: 'error' };
          }
        })
      );
      
      document.getElementById('statuses').innerHTML = results
        .map(r => `<div class="status ${r.status}">${r.name}: ${r.status}</div>`)
        .join('');
    }
    
    checkStatus();
    setInterval(checkStatus, 60000);
  </script>
</body>
</html>
```

### Key Dashboard Metrics

Display these at a glance:

```
┌─────────────────────────────────────────────────────────────────┐
│                     PROOFI DASHBOARD                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   UPTIME    │  │   ERROR %   │  │  RESPONSE   │             │
│  │   99.9%     │  │    0.2%     │  │   245ms     │             │
│  │   ✓ OK      │  │   ✓ OK      │  │   ✓ OK      │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ CONNECTIONS │  │  DDC STATUS │  │  LAST BUILD │             │
│  │   1,234     │  │   ✓ OK      │  │  2 hrs ago  │             │
│  │   today     │  │   45ms      │  │   ✓ OK      │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Log Analysis

### Log Levels

| Level | Use For | Example |
|-------|---------|---------|
| ERROR | Failures needing attention | `Error: Token validation failed` |
| WARN | Potential issues | `Warn: Rate limit approaching` |
| INFO | Normal operations | `Info: User connected wallet` |
| DEBUG | Development details | `Debug: Token payload: {...}` |

### Structured Logging

```javascript
// Use structured logs for easier parsing
function log(level, message, data = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };
  console.log(JSON.stringify(entry));
}

// Usage
log('info', 'Wallet connected', { address: '0x...', method: 'metamask' });
log('error', 'Token validation failed', { tokenId: 'abc', reason: 'expired' });
```

### Log Search (Vercel)

```bash
# Search for errors
vercel logs | grep -i error

# Search by path
vercel logs --path=/api/ddc

# Search by status code
vercel logs | jq 'select(.statusCode >= 500)'
```

### Common Patterns to Watch

```bash
# High error count
grep -c "ERROR" logs.txt

# Slow requests (> 2s)
grep "duration" logs.txt | awk -F: '$NF > 2000'

# Failed auth attempts
grep "401\|403" logs.txt | wc -l

# Unusual traffic patterns
# (Many requests from single IP)
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10
```

---

## Metrics to Track

### Availability Metrics

| Metric | Formula | Target | Source |
|--------|---------|--------|--------|
| Uptime % | (Total time - Downtime) / Total time × 100 | 99.9% | UptimeRobot |
| MTTR | Average time to recover from incidents | < 30 min | Incident log |
| MTBF | Average time between failures | > 7 days | Incident log |

### Performance Metrics

| Metric | Target | Source |
|--------|--------|--------|
| P50 response time | < 200ms | Vercel Analytics |
| P95 response time | < 1s | Vercel Analytics |
| P99 response time | < 3s | Vercel Analytics |
| Error rate | < 1% | Logs |

### Business Metrics

| Metric | What It Measures |
|--------|------------------|
| Wallet connections | User engagement |
| Tokens issued | Platform usage |
| Data uploads | Value delivered |
| Returning users | Retention |

---

## Health Check Endpoints

### Recommended Health Endpoints

```javascript
// api/health.js - Basic health check
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}

// api/health/deep.js - Deep health check
export default async function handler(req, res) {
  const checks = {
    api: 'ok',
    ddc: 'unknown',
    redis: 'unknown',
  };
  
  // Check DDC
  try {
    const client = await getDDCClient();
    checks.ddc = client.isConnected ? 'ok' : 'error';
    await client.disconnect();
  } catch (e) {
    checks.ddc = 'error';
  }
  
  // Check Redis
  try {
    const redis = await getRedisClient();
    await redis.ping();
    checks.redis = 'ok';
  } catch (e) {
    checks.redis = 'error';
  }
  
  const allOk = Object.values(checks).every(v => v === 'ok');
  
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
}
```

### Using Health Checks

```bash
# Quick check
curl -s https://proofi-virid.vercel.app/api/health | jq

# Deep check
curl -s https://proofi-virid.vercel.app/api/health/deep | jq

# Use in monitoring script
if ! curl -sf https://proofi.ai/api/health > /dev/null; then
  send_alert "critical" "Health check failed"
fi
```

---

## Quick Reference

### Monitoring URLs

| What | URL |
|------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Vercel Logs | `vercel logs --follow` |
| Cere Stats | https://stats.cere.network |
| Uptime Monitor | (configure your provider) |

### Commands

```bash
# View live logs
vercel logs --follow

# Check deployment status
vercel ls

# Quick health check
curl -sf https://proofi.ai || echo "DOWN!"

# Check all endpoints
./monitor-api.sh
```

### Alert Contacts

| Severity | Channel |
|----------|---------|
| Critical | Slack #proofi-alerts + Phone |
| Warning | Slack #proofi-alerts |
| Info | Slack #proofi-logs |

---

*Last updated: 2025-02-08*
