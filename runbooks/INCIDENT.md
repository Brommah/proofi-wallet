# Proofi Incident Response Runbook

> How to handle production incidents, from detection to post-mortem.

---

## 🚨 Severity Levels

### P0 - Critical (Complete Outage)

**Definition:** Service is completely unavailable or data breach confirmed.

**Examples:**
- proofi.ai returns 5xx for all users
- User private keys exposed
- DDC data inaccessible
- Smart contract compromised

**Response Time:** Immediate (within 15 minutes)
**Resolution Target:** 1 hour
**Who to Page:** Everyone

### P1 - High (Major Feature Broken)

**Definition:** Core functionality broken for most users.

**Examples:**
- Wallet creation failing
- Data uploads broken
- Extension not connecting
- Payment processing down

**Response Time:** 30 minutes
**Resolution Target:** 4 hours
**Who to Page:** On-call + relevant team lead

### P2 - Medium (Degraded Service)

**Definition:** Feature partially working or affecting subset of users.

**Examples:**
- Slow response times (>5s)
- Some data categories failing
- Mobile layout broken
- Intermittent connection issues

**Response Time:** 2 hours
**Resolution Target:** 24 hours
**Who to Page:** On-call only

### P3 - Low (Minor Issue)

**Definition:** Cosmetic issues or edge cases.

**Examples:**
- Typos in UI
- Minor styling issues
- Rare edge case bugs
- Non-critical feature requests

**Response Time:** Next business day
**Resolution Target:** 1 week
**Who to Page:** None (ticket in backlog)

---

## 🔥 Response Procedures

### P0 Response Protocol

```
┌─────────────────────────────────────────────────────────────┐
│                    P0 INCIDENT TIMELINE                     │
├─────────────────────────────────────────────────────────────┤
│  T+0     │ Alert received - Acknowledge immediately         │
│  T+5     │ Initial assessment - Confirm severity            │
│  T+10    │ War room opened - All hands notified             │
│  T+15    │ First status update posted                       │
│  T+30    │ Root cause identified OR escalation              │
│  T+60    │ Fix deployed OR rollback completed               │
│  T+2h    │ All-clear OR extended incident declared          │
└─────────────────────────────────────────────────────────────┘
```

**Step-by-Step:**

1. **Acknowledge** (T+0)
   ```
   @channel 🚨 P0 INCIDENT ACKNOWLEDGED
   Issue: [Brief description]
   Impact: [Who is affected]
   Investigating now.
   ```

2. **Assess** (T+5)
   - Check Vercel deployment status
   - Check Railway API logs
   - Check DDC cluster status
   - Identify blast radius

3. **Communicate** (T+10)
   - Open incident channel: `#incident-YYYY-MM-DD`
   - Post status update every 15 minutes
   - Assign Incident Commander

4. **Mitigate** (T+15-60)
   - If deployment caused: ROLLBACK IMMEDIATELY
   - If DDC issue: Switch to backup cluster
   - If database: Enable read-only mode

5. **Resolve**
   - Deploy fix or confirm rollback
   - Verify all systems nominal
   - Post all-clear message

6. **Post-Mortem** (within 48h)
   - Schedule blameless review
   - Document in `/docs/incidents/`

### P1 Response Protocol

1. Acknowledge in #proofi-alerts
2. Investigate logs and metrics
3. Determine if rollback needed
4. Implement fix or workaround
5. Monitor for 1 hour after resolution
6. Quick write-up (no formal post-mortem unless recurring)

### P2/P3 Response Protocol

1. Create GitHub issue with severity label
2. Prioritize in next sprint
3. Fix and verify in staging first
4. Deploy during normal release cycle

---

## 📢 Communication Templates

### Initial Alert (Internal)

```
🚨 **[P{X}] INCIDENT: {Title}**

**Status:** Investigating
**Impact:** {Description of user impact}
**Started:** {Time UTC}
**Incident Commander:** @{name}

Updates every 15 minutes.
```

### Status Update (Internal)

```
📋 **INCIDENT UPDATE** - {Time UTC}

**Status:** {Investigating | Identified | Monitoring | Resolved}
**Summary:** {What we know now}
**Next Steps:** {What we're doing}
**ETA:** {When we expect resolution}
```

### User-Facing Status (Status Page)

```
**{Title}**

We're currently experiencing issues with {feature}. 
Our team is actively investigating.

Started: {Time}
Last Update: {Time}

We apologize for any inconvenience and will update 
this page as we learn more.
```

### All-Clear (Internal)

```
✅ **INCIDENT RESOLVED** - {Title}

**Duration:** {X hours Y minutes}
**Root Cause:** {Brief description}
**Resolution:** {What fixed it}
**Post-Mortem:** Scheduled for {date}

Thanks to everyone who helped! 🙏
```

### User-Facing Resolution

```
**Resolved: {Title}**

The issue affecting {feature} has been resolved. 
All services are operating normally.

We apologize for any inconvenience. A detailed 
analysis is underway to prevent future occurrences.

Duration: {X hours}
Resolved: {Time}
```

---

## 📝 Post-Mortem Process

### Timeline

| Day | Action |
|-----|--------|
| D+0 | Incident resolved |
| D+1 | Collect all logs, metrics, chat logs |
| D+2 | Post-mortem meeting (1 hour) |
| D+3 | Document published |
| D+7 | Action items reviewed |

### Post-Mortem Template

Create file: `/docs/incidents/YYYY-MM-DD-title.md`

```markdown
# Incident Post-Mortem: {Title}

**Date:** {Date}
**Severity:** P{X}
**Duration:** {X hours Y minutes}
**Author:** {Name}

## Summary
{2-3 sentences describing what happened}

## Impact
- Users affected: {number or percentage}
- Revenue impact: {if any}
- Data affected: {if any}

## Timeline (all times UTC)
- HH:MM - First alert received
- HH:MM - Team acknowledged
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - All-clear declared

## Root Cause
{Detailed technical explanation}

## Resolution
{What was done to fix it}

## What Went Well
- {Thing 1}
- {Thing 2}

## What Went Wrong
- {Thing 1}
- {Thing 2}

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| {Action} | @{name} | {date} | ⏳ |

## Lessons Learned
{Key takeaways for the team}
```

### Blameless Culture

- Focus on systems, not people
- "What allowed this to happen?" not "Who caused this?"
- Every incident is a learning opportunity
- No punishment for mistakes made in good faith

---

## 🛠️ Incident Tools

| Tool | Purpose | Access |
|------|---------|--------|
| Vercel Dashboard | Deployment status, logs | team@proofi.ai |
| Railway Dashboard | API logs, metrics | team@proofi.ai |
| Sentry | Error tracking | sentry.io/proofi |
| Telegram | Team alerts | #proofi-alerts |
| GitHub Issues | Incident tracking | proofi-wallet repo |

---

## 📞 On-Call Rotation

| Week | Primary | Secondary |
|------|---------|-----------|
| 1 | @martijn | @backup1 |
| 2 | @backup1 | @martijn |
| ... | ... | ... |

**On-Call Responsibilities:**
- Monitor #proofi-alerts
- Respond to P0/P1 within SLA
- Escalate if unable to resolve
- Hand off to next on-call

---

*Last Updated: February 2025*
