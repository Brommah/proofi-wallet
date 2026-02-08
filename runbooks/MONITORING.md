# Proofi Monitoring Guide

> Key metrics, alerts, and observability for Proofi infrastructure.

---

## 📊 Key Metrics to Track

### Frontend (Vercel)

| Metric | Description | Target | Alert Threshold |
|--------|-------------|--------|-----------------|
| **Uptime** | Site availability | 99.9% | < 99.5% |
| **Response Time (p50)** | Median page load | < 500ms | > 1000ms |
| **Response Time (p95)** | 95th percentile load | < 2s | > 5s |
| **Error Rate** | 4xx/5xx responses | < 0.1% | > 1% |
| **Core Web Vitals (LCP)** | Largest Contentful Paint | < 2.5s | > 4s |
| **Core Web Vitals (FID)** | First Input Delay | < 100ms | > 300ms |
| **Core Web Vitals (CLS)** | Cumulative Layout Shift | < 0.1 | > 0.25 |

### API (Railway)

| Metric | Description | Target | Alert Threshold |
|--------|-------------|--------|-----------------|
| **Request Latency (p50)** | Median API response | < 100ms | > 500ms |
| **Request Latency (p99)** | 99th percentile | < 1s | > 3s |
| **Error Rate** | 5xx responses | < 0.1% | > 0.5% |
| **Active Connections** | Concurrent requests | < 1000 | > 800 |
| **Memory Usage** | Container memory | < 70% | > 85% |
| **CPU Usage** | Container CPU | < 60% | > 80% |

### Database (PostgreSQL)

| Metric | Description | Target | Alert Threshold |
|--------|-------------|--------|-----------------|
| **Connection Pool** | Active connections | < 80% | > 90% |
| **Query Time (p95)** | Slow queries | < 100ms | > 500ms |
| **Disk Usage** | Storage used | < 70% | > 85% |
| **Replication Lag** | Replica delay | < 1s | > 10s |

### Cere DDC

| Metric | Description | Target | Alert Threshold |
|--------|-------------|--------|-----------------|
| **Upload Success Rate** | Successful data stores | > 99% | < 95% |
| **Download Latency** | Data retrieval time | < 500ms | > 2s |
| **Storage Used** | Bucket utilization | < 80% | > 90% |
| **Node Availability** | DDC cluster health | > 99.9% | < 99% |

### Business Metrics

| Metric | Description | Track Frequency |
|--------|-------------|-----------------|
| **Daily Active Users** | Unique users/day | Daily |
| **Wallet Creations** | New wallets/day | Daily |
| **Data Uploads** | Credentials stored/day | Daily |
| **Query Volume** | Agent queries/hour | Hourly |
| **CERE Earnings** | User earnings/day | Daily |
| **Extension Installs** | Chrome store installs | Weekly |

---

## 🚨 Alert Configuration

### Critical Alerts (P0/P1 - Page immediately)

```yaml
alerts:
  - name: site_down
    condition: uptime < 99% for 5 minutes
    severity: P0
    notify: [telegram, sms]
    
  - name: api_error_spike
    condition: error_rate > 5% for 2 minutes
    severity: P0
    notify: [telegram, sms]
    
  - name: database_down
    condition: db_connection_failed for 1 minute
    severity: P0
    notify: [telegram, sms]
    
  - name: ddc_unavailable
    condition: ddc_upload_success < 50% for 5 minutes
    severity: P1
    notify: [telegram]
```

### Warning Alerts (P2 - Notify in channel)

```yaml
alerts:
  - name: high_latency
    condition: p95_latency > 2s for 10 minutes
    severity: P2
    notify: [telegram]
    
  - name: memory_pressure
    condition: memory_usage > 80% for 15 minutes
    severity: P2
    notify: [telegram]
    
  - name: ssl_expiring
    condition: ssl_days_remaining < 14
    severity: P2
    notify: [telegram]
```

### Informational Alerts (P3 - Daily digest)

```yaml
alerts:
  - name: traffic_spike
    condition: requests > 2x normal for 1 hour
    severity: P3
    notify: [email]
    
  - name: new_error_type
    condition: new_error_fingerprint detected
    severity: P3
    notify: [email]
```

---

## 📈 Dashboard Recommendations

### Executive Dashboard

Display on TV/large monitor for team visibility:

```
┌─────────────────────────────────────────────────────────────┐
│                    PROOFI STATUS                            │
├──────────────────────┬──────────────────────────────────────┤
│   UPTIME: 99.97%     │   USERS TODAY: 1,234                │
│   ●●●●●●●●●●●●●●●●●● │   ████████████░░░░                   │
├──────────────────────┼──────────────────────────────────────┤
│   API LATENCY        │   ERROR RATE                        │
│   p50: 45ms          │   0.02%                              │
│   p95: 180ms         │   ████░░░░░░░░░░░░                   │
├──────────────────────┼──────────────────────────────────────┤
│   WALLETS CREATED    │   CERE EARNED (24h)                 │
│   +89 today          │   2,450 CERE                        │
└──────────────────────┴──────────────────────────────────────┘
```

### Technical Dashboard

For engineering team:

1. **Request Volume** - Time series of requests/minute
2. **Error Rate** - Stacked by error type
3. **Latency Distribution** - Heatmap of response times
4. **Top Endpoints** - Sorted by traffic/errors
5. **Database Queries** - Slow query log
6. **Memory/CPU** - Resource utilization over time

### Business Dashboard

For stakeholders:

1. **User Funnel** - Signup → Profile → First Upload
2. **Retention Cohorts** - D1, D7, D30 retention
3. **Data Categories** - Popular categories uploaded
4. **Agent Integrations** - Queries by agent
5. **Token Flows** - Earnings, fees, transactions

---

## 📋 Log Analysis

### Log Locations

| Service | Location | Retention |
|---------|----------|-----------|
| Vercel Functions | Vercel Dashboard → Logs | 7 days |
| Railway API | Railway Dashboard → Logs | 7 days |
| PostgreSQL | Railway → Database → Logs | 7 days |
| Sentry | sentry.io/proofi | 90 days |

### Useful Log Queries

**Find all errors in last hour:**
```
level:error timestamp:[now-1h TO now]
```

**Find slow requests (>1s):**
```
duration:>1000 method:POST
```

**Find failed wallet creations:**
```
action:wallet_create status:error
```

**Find DDC upload failures:**
```
service:ddc operation:upload status:failed
```

### Log Format (Structured)

All services should log in this format:
```json
{
  "timestamp": "2025-02-08T12:00:00Z",
  "level": "info|warn|error",
  "service": "api|web|extension",
  "action": "wallet_create|data_upload|query",
  "userId": "user_xxx",
  "duration": 145,
  "status": "success|error",
  "error": "Error message if any",
  "metadata": {}
}
```

---

## 🔍 Debugging Runbook

### High Latency Investigation

1. **Check recent deployments**
   - Did latency spike after a deploy?
   - Rollback if correlation found

2. **Check database**
   ```sql
   SELECT query, calls, mean_time 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   ```

3. **Check external services**
   - DDC cluster status
   - Third-party API latency

4. **Check resource limits**
   - Memory/CPU approaching limits?
   - Scale up if needed

### Error Rate Investigation

1. **Group errors by type**
   - Sentry → Issues → Sort by frequency

2. **Check for patterns**
   - Specific endpoint?
   - Specific user agent?
   - Geographic pattern?

3. **Review recent changes**
   - Code deploys
   - Config changes
   - Database migrations

4. **Check dependencies**
   - External API failures
   - DDC connectivity

---

## 🛠️ Monitoring Tools Setup

### Vercel Analytics (Built-in)

- Automatically tracks Core Web Vitals
- Enable in Vercel Dashboard → Analytics
- Free tier sufficient for current scale

### Sentry (Error Tracking)

```javascript
// Already integrated in proofi-sdk.js
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### Custom Metrics (Railway)

```javascript
// Log structured metrics
console.log(JSON.stringify({
  metric: 'api_request',
  endpoint: '/api/wallet/create',
  duration: 145,
  status: 200,
  timestamp: Date.now()
}));
```

### Uptime Monitoring

Recommended: [UptimeRobot](https://uptimerobot.com) (Free tier)

Endpoints to monitor:
- `https://proofi.ai` - Homepage
- `https://proofi.ai/api/health` - API health
- `https://proofi-api-production.up.railway.app/health` - Backend

---

## 📅 Regular Maintenance

### Daily
- [ ] Review error dashboard (Sentry)
- [ ] Check key metrics are in range
- [ ] Review any overnight alerts

### Weekly
- [ ] Review slow query log
- [ ] Check storage/resource trends
- [ ] Update alert thresholds if needed

### Monthly
- [ ] Review SLA compliance
- [ ] Capacity planning review
- [ ] Update runbooks if processes changed

---

*Last Updated: February 2025*
