# Proofi Incident Response Guide

> When things break, follow this guide.

---

## Table of Contents

1. [Incident Severity Levels](#incident-severity-levels)
2. [Incident Response Process](#incident-response-process)
3. [Runbooks by Incident Type](#runbooks-by-incident-type)
4. [Communication Templates](#communication-templates)
5. [Post-Incident Procedures](#post-incident-procedures)
6. [Emergency Contacts](#emergency-contacts)
7. [Recovery Procedures](#recovery-procedures)

---

## Incident Severity Levels

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       SEVERITY LEVELS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SEV 1 - CRITICAL 🚨                                                   │
│  ━━━━━━━━━━━━━━━━━━                                                    │
│  • Complete service outage                                              │
│  • Data breach or security incident                                     │
│  • All users affected                                                   │
│  Response: Immediate, all hands                                         │
│  Target resolution: < 1 hour                                            │
│                                                                         │
│  SEV 2 - HIGH ⚠️                                                       │
│  ━━━━━━━━━━━━━━                                                        │
│  • Major feature broken (wallet, tokens)                                │
│  • Significant performance degradation                                  │
│  • Many users affected                                                  │
│  Response: Within 30 minutes                                            │
│  Target resolution: < 4 hours                                           │
│                                                                         │
│  SEV 3 - MEDIUM 📋                                                     │
│  ━━━━━━━━━━━━━━━━                                                      │
│  • Minor feature broken                                                 │
│  • Workaround available                                                 │
│  • Some users affected                                                  │
│  Response: Next business day                                            │
│  Target resolution: < 3 days                                            │
│                                                                         │
│  SEV 4 - LOW ℹ️                                                        │
│  ━━━━━━━━━━━━━━                                                        │
│  • Cosmetic issues                                                      │
│  • Minor bugs with easy workaround                                      │
│  • Few users affected                                                   │
│  Response: Planned maintenance                                          │
│  Target resolution: Next release                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Quick Reference

| Severity | Example | Response Time | Escalation |
|----------|---------|---------------|------------|
| SEV 1 | Site down, breach | Immediate | Everyone |
| SEV 2 | Wallet broken | 30 min | On-call + lead |
| SEV 3 | Demo page error | Next day | Assigned dev |
| SEV 4 | Typo on page | Planned | Backlog |

---

## Incident Response Process

### Phase 1: Detection & Triage (0-5 min)

```
┌─────────────────────────────────────────────┐
│           INCIDENT DETECTED                 │
│                    ↓                        │
│     ┌──────────────────────────┐           │
│     │  1. Verify the incident  │           │
│     │     Is it real?          │           │
│     │     Can you reproduce?   │           │
│     └───────────┬──────────────┘           │
│                 ↓                           │
│     ┌──────────────────────────┐           │
│     │  2. Assess severity      │           │
│     │     Who is affected?     │           │
│     │     What's broken?       │           │
│     └───────────┬──────────────┘           │
│                 ↓                           │
│     ┌──────────────────────────┐           │
│     │  3. Assign incident lead │           │
│     │     Start communication  │           │
│     └──────────────────────────┘           │
└─────────────────────────────────────────────┘
```

**Checklist:**

- [ ] Confirm incident is real (not false alarm)
- [ ] Determine severity level
- [ ] Create incident channel (e.g., #incident-2025-02-08-1)
- [ ] Designate incident lead
- [ ] Start incident log

### Phase 2: Investigation (5-30 min)

```
┌─────────────────────────────────────────────┐
│           INVESTIGATION                     │
│                                             │
│  1. Gather information                      │
│     - When did it start?                    │
│     - What changed recently?                │
│     - What do the logs say?                 │
│                                             │
│  2. Form hypothesis                         │
│     - Most likely cause?                    │
│     - Second most likely?                   │
│                                             │
│  3. Test hypothesis                         │
│     - Can we prove it?                      │
│     - What's the quickest test?             │
│                                             │
└─────────────────────────────────────────────┘
```

**Key Commands:**

```bash
# Check recent deployments
vercel ls | head -5

# Check logs for errors
vercel logs --since=1h | grep -i error

# Check git for recent changes
git log --oneline -10
git diff HEAD~1

# Check Vercel status
curl -s https://www.vercel-status.com/api/v2/status.json | jq
```

### Phase 3: Mitigation (15-60 min)

```
┌─────────────────────────────────────────────┐
│           MITIGATION                        │
│                                             │
│  Priority: Stop the bleeding               │
│                                             │
│  Options (in order of preference):          │
│                                             │
│  1. Quick fix if obvious                    │
│     git commit && vercel --prod             │
│                                             │
│  2. Rollback to last good deploy            │
│     vercel promote <prev-url>               │
│                                             │
│  3. Feature flag / disable                  │
│     Disable broken feature temporarily      │
│                                             │
│  4. Scale up / restart                      │
│     Not usually applicable to serverless    │
│                                             │
└─────────────────────────────────────────────┘
```

### Phase 4: Resolution

- [ ] Verify fix is working
- [ ] Monitor for recurrence (30 min - 2 hrs)
- [ ] Update status page / notify users
- [ ] Document what happened

### Phase 5: Post-Incident

- [ ] Schedule post-mortem (within 48 hours)
- [ ] Write incident report
- [ ] Create follow-up tickets
- [ ] Archive incident channel

---

## Runbooks by Incident Type

### 🚨 Site Completely Down

**Symptoms:** proofi.ai returns 5xx or doesn't load

**Step 1: Check external status**
```bash
# Is Vercel down?
curl -s https://www.vercel-status.com/api/v2/status.json | jq '.status.indicator'
# "none" = OK, anything else = issues

# Is DNS working?
dig proofi.ai +short
# Should return Vercel IP
```

**Step 2: Check deployment**
```bash
# List recent deployments
vercel ls

# If latest is broken, rollback
vercel promote https://proofi-<previous-good-hash>.vercel.app
```

**Step 3: If Vercel is down**
- Nothing you can do
- Post on Twitter/status page: "Experiencing issues due to provider outage"
- Monitor https://vercel-status.com

---

### 🔐 Security Incident / Data Breach

**Symptoms:** Unauthorized access detected, data exposed

**IMMEDIATELY:**

1. **Contain**
   ```bash
   # Rotate all secrets
   vercel env rm DDC_PRIVATE_KEY
   # Generate new key and add
   vercel env add DDC_PRIVATE_KEY production
   
   # Force redeploy with new secrets
   vercel --prod --force
   ```

2. **Preserve evidence**
   ```bash
   # Export logs before they rotate
   vercel logs --since=24h > incident-logs-$(date +%Y%m%d).txt
   ```

3. **Assess scope**
   - What data was accessed?
   - How many users affected?
   - When did it start?

4. **Notify**
   - Legal/compliance (if applicable)
   - Affected users (within 72 hours for GDPR)

**DO NOT:**
- Delete evidence
- Ignore it hoping it goes away
- Communicate publicly without legal approval

---

### 💳 Wallet Connection Broken

**Symptoms:** Users can't connect wallet, modal doesn't open

**Step 1: Reproduce**
```
Open https://proofi.ai
Click Connect
Check browser console (F12)
```

**Step 2: Common causes**

| Error | Cause | Fix |
|-------|-------|-----|
| `ProofiSDK is undefined` | SDK not loaded | Check script tag |
| `Failed to load iframe` | Wallet app down | Check /app status |
| `postMessage blocked` | CORS/CSP issue | Check headers |
| `timeout` | Network/firewall | Check user's network |

**Step 3: Quick fixes**
```bash
# If wallet app is broken
vercel logs --path=/app

# If SDK issue, check the JS file
curl -I https://proofi-virid.vercel.app/proofi-sdk.js

# Force redeploy
git commit --allow-empty -m "Force redeploy"
git push
```

---

### 🐌 Slow Performance

**Symptoms:** Pages load slowly, timeouts

**Step 1: Identify bottleneck**
```bash
# Check specific page load
curl -w "\nTime: %{time_total}s\n" -o /dev/null -s https://proofi.ai

# Check API response times
curl -w "\nTime: %{time_total}s\n" -o /dev/null -s https://proofi-virid.vercel.app/api/health
```

**Step 2: Common causes**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Slow first load | Cold start | Pre-warm, optimize bundle |
| Slow all loads | Large assets | Compress images, split code |
| Slow API only | DDC/external service | Check DDC status |
| Increasing slowness | Memory leak | Redeploy |

**Step 3: Quick wins**
```bash
# Check for large files
find . -size +500k -name "*.js" -o -name "*.png"

# Check bundle size
ls -lh *.js | sort -k5 -h
```

---

### 🔌 DDC Connection Failed

**Symptoms:** Can't read/write to decentralized storage

**Step 1: Check DDC status**
```bash
# Ping RPC endpoint
curl -I wss://rpc.testnet.cere.network/ws

# Check network stats
open https://stats.testnet.cere.network
```

**Step 2: Check credentials**
```bash
# Verify env var is set
vercel env ls | grep DDC
```

**Step 3: If DDC is down**
- Enable offline mode if available
- Queue writes for later
- Show graceful error to users

**Step 4: Temporary workaround**
```javascript
// Fallback to localStorage
try {
  await ddcClient.put(data);
} catch (e) {
  localStorage.setItem('pending-' + Date.now(), JSON.stringify(data));
  console.log('Saved locally, will sync later');
}
```

---

### 🚫 Token Validation Failing

**Symptoms:** All tokens rejected, agents can't access data

**Step 1: Check token details**
```javascript
import { parseToken } from '@proofi/agent-sdk';

const token = parseToken(tokenString);
console.log({
  expiresAt: new Date(token.expiresAt * 1000),
  now: new Date(),
  isExpired: token.expiresAt * 1000 < Date.now(),
});
```

**Step 2: Common causes**

| Error | Cause | Fix |
|-------|-------|-----|
| TokenExpired | Clock skew | Sync server time |
| InvalidSignature | Key mismatch | Check agent keypair |
| ScopeError | Wrong permissions | Request new token |
| Revoked | User revoked | Request new token |

**Step 3: If clock skew**
```bash
# Check server time
date

# Sync time (Linux)
sudo ntpdate pool.ntp.org

# Vercel uses AWS time (should be accurate)
```

---

### 🏗️ Build/Deploy Failed

**Symptoms:** vercel --prod fails, GitHub push doesn't deploy

**Step 1: Check build logs**
```bash
vercel logs --scope=build
```

**Step 2: Common fixes**

| Error | Fix |
|-------|-----|
| `npm install failed` | Clear cache: `rm -rf node_modules && npm install` |
| `TypeScript error` | Fix type errors: `npx tsc --noEmit` |
| `Out of memory` | Add to build: `NODE_OPTIONS=--max_old_space_size=4096` |
| `Missing env var` | Add to Vercel: `vercel env add VAR_NAME` |

**Step 3: Force clean deploy**
```bash
rm -rf node_modules .vercel
npm install
vercel --prod
```

---

## Communication Templates

### Internal Alert (Slack)

```
🚨 *INCIDENT: [Brief Description]*

*Severity:* SEV [1-4]
*Status:* Investigating
*Started:* [Time]
*Lead:* @[name]
*Channel:* #incident-YYYY-MM-DD

*Impact:* [Who is affected and how]

*Current status:*
- [What we know]
- [What we're doing]

Will update in 30 min.
```

### Status Page Update

```
*[Investigating] Service Disruption*

We are currently investigating reports of [issue description].

Some users may experience [specific impact].

We will provide updates as we learn more.

Posted: [Time] UTC
```

### Resolution Notice

```
*[Resolved] Service Disruption*

The issue affecting [description] has been resolved.

*Duration:* [Start time] - [End time] ([X] minutes)
*Impact:* [What was affected]
*Root cause:* [Brief explanation]

We apologize for any inconvenience. A detailed post-mortem will follow.
```

---

## Post-Incident Procedures

### Post-Mortem Template

```markdown
# Incident Post-Mortem: [Title]

**Date:** YYYY-MM-DD
**Duration:** X hours Y minutes
**Severity:** SEV [1-4]
**Authors:** [Names]

## Summary
[1-2 sentence summary of what happened]

## Timeline (all times UTC)
- HH:MM - [Event]
- HH:MM - [Event]
- HH:MM - [Event]

## Root Cause
[What actually caused the incident]

## Impact
- Users affected: [Number/percentage]
- Features affected: [List]
- Duration: [Time]

## Detection
How was the incident detected?
[Monitoring / User report / etc.]

## Resolution
What fixed it?
[Steps taken]

## Lessons Learned

### What went well
- [Thing]
- [Thing]

### What went poorly
- [Thing]
- [Thing]

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| [Action] | @name | YYYY-MM-DD | Open |

## Appendix
[Logs, screenshots, data]
```

### Action Items Categories

1. **Prevent recurrence** - Stop this specific issue
2. **Improve detection** - Catch it faster next time
3. **Improve response** - Fix it faster next time
4. **Documentation** - Update runbooks

---

## Emergency Contacts

### Internal Team

| Role | Name | Contact | Escalation |
|------|------|---------|------------|
| Primary On-Call | [Name] | [Phone/Slack] | First |
| Secondary On-Call | [Name] | [Phone/Slack] | If primary unavailable |
| Engineering Lead | [Name] | [Phone/Slack] | SEV 1-2 |
| Security Lead | [Name] | [Phone/Slack] | Security incidents |

### External Services

| Service | Status Page | Support |
|---------|-------------|---------|
| Vercel | vercel-status.com | support@vercel.com |
| Cere DDC | stats.cere.network | [Discord/Support] |
| Upstash | status.upstash.com | support@upstash.com |

### Escalation Path

```
SEV 4: Assigned developer handles
          ↓
SEV 3: Team lead notified
          ↓
SEV 2: On-call + Engineering lead
          ↓
SEV 1: All hands + Executive notification
```

---

## Recovery Procedures

### Vercel Rollback

```bash
# List recent deployments
vercel ls

# Find the last good deployment URL
# Format: https://proofi-<hash>.vercel.app

# Promote to production
vercel promote https://proofi-<last-good-hash>.vercel.app

# Verify
curl -I https://proofi.ai
```

### Git Rollback

```bash
# Find last good commit
git log --oneline -20

# Revert the bad commit
git revert <bad-commit-hash>
git push origin main

# Or hard reset (destructive!)
git reset --hard <good-commit-hash>
git push --force origin main  # ⚠️ Careful!
```

### Database/State Recovery

For Upstash Redis:

```bash
# Upstash has automatic backups
# Contact support@upstash.com for point-in-time recovery
```

For DDC data:

```
# DDC data is immutable - old data remains
# Simply point to previous CID if needed
```

### Secret Rotation

```bash
# Generate new secrets
openssl rand -base64 32  # General secret
# Or use specific key generation for crypto keys

# Update in Vercel
vercel env rm SECRET_NAME production
vercel env add SECRET_NAME production

# Redeploy
vercel --prod --force

# Update any external services using old secret
```

---

## Incident Checklist

### Starting an Incident

- [ ] Verify incident is real
- [ ] Assess severity (SEV 1-4)
- [ ] Create incident channel
- [ ] Post initial alert
- [ ] Assign incident lead
- [ ] Start incident log

### During an Incident

- [ ] Log all actions taken
- [ ] Update status every 30 min
- [ ] Escalate if needed
- [ ] Don't make changes without logging

### Resolving an Incident

- [ ] Verify fix is working
- [ ] Monitor for 30 min minimum
- [ ] Post resolution notice
- [ ] Schedule post-mortem

### After an Incident

- [ ] Hold post-mortem (within 48 hrs)
- [ ] Write incident report
- [ ] Create action items
- [ ] Archive incident channel
- [ ] Update runbooks if needed

---

*Last updated: 2025-02-08*
