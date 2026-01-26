# Push Not Pull Framework

> "If you have to look at a dashboard, you've already lost."
> — Fred's Law

## Filosofie

**Pull systemen** dwingen mensen om actief informatie te zoeken: dashboards refreshen, logs checken, status pages bezoeken. Dit kost cognitieve energie en leidt tot gemiste issues.

**Push systemen** brengen relevante informatie naar je toe met directe actiemogelijkheden. Geen context switching, geen "ik check het straks wel."

### De Drie Regels

1. **Push > Pull** — Stuur DMs/notifications met directe action links, geen "check the dashboard"
2. **Executable > Readable** — "If you show it, write instructions so others can run it"
3. **Working ≠ Done** — Alles heeft peer review en iteratie nodig

---

## Audit: Pull Systemen in Onze Stack

### 🔴 Nog Pull (actie nodig)

| Systeem | Huidige staat | Impact |
|---------|---------------|--------|
| **Git PR status** | Check GitHub/GitLab UI | Gemiste reviews, stale PRs |
| **Deployment logs** | SSH + tail logs | Failures pas laat ontdekt |
| **Cron job failures** | Check logs handmatig | Silent failures |
| **Disk/memory usage** | `df -h` handmatig | Problemen pas bij crash |
| **API health** | Status page checken | Downtime pas gemeld door users |
| **Meeting notes** | Check Notion/docs | Context verloren tussen meetings |
| **Expense approvals** | Check finance dashboard | Bottleneck op approvals |

### 🟢 Al Push (behouden)

| Systeem | Implementatie |
|---------|---------------|
| **Calendar reminders** | Clawdbot → Telegram met prep docs |
| **Real estate alerts** | Cron 2x/dag → DM met nieuwe woningen |
| **Security audits** | Daily scan → Alert alleen bij issues |
| **LinkedIn stalker** | Automated hourly, geen actie nodig |

---

## Push Alternatieven

### 1. Git PR Lifecycle

**Trigger:** PR opened / review requested / merged / stale (>48h)

```
┌─────────────────────────────────────────────────────────────┐
│ 🔔 PR needs your review                                      │
│                                                              │
│ **cere-hr-service#142**                                     │
│ "Add Notion sync for employee onboarding"                   │
│ by @charlotte • 3 files changed • +127 -23                  │
│                                                              │
│ [👀 Review] [✅ Approve] [💬 Comment] [⏰ Snooze 4h]         │
└─────────────────────────────────────────────────────────────┘
```

**Actions:**
- `Review` → Open PR in browser
- `Approve` → One-click approve via API
- `Comment` → Reply in thread, post to PR
- `Snooze` → Remind in X hours

### 2. Deployment Pipeline

**Trigger:** Deploy started / succeeded / failed / rollback needed

```
┌─────────────────────────────────────────────────────────────┐
│ 🚨 Deploy FAILED: cere-hr-service                           │
│                                                              │
│ **Error:** Connection refused to Notion API                 │
│ **Commit:** a]7f3b2c "Add retry logic for API calls"         │
│ **By:** @mart • 2 min ago                                   │
│                                                              │
│ [📋 View Logs] [🔄 Retry] [⏪ Rollback] [🔇 Mute 1h]        │
└─────────────────────────────────────────────────────────────┘
```

### 3. System Health

**Trigger:** Threshold crossed (disk >80%, memory >90%, API p99 >500ms)

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Disk space warning: gateway-01                           │
│                                                              │
│ **Usage:** 84% (168GB / 200GB)                              │
│ **Largest dirs:**                                            │
│ • /var/log/clawdbot: 45GB                                   │
│ • /tmp/builds: 23GB                                         │
│                                                              │
│ [🗑️ Clean Logs] [🧹 Clear Tmp] [📊 Details] [😴 Snooze 24h] │
└─────────────────────────────────────────────────────────────┘
```

### 4. Cron Job Monitor

**Trigger:** Job failed / job succeeded after previous failure / job taking too long

```
┌─────────────────────────────────────────────────────────────┐
│ ❌ Cron failed: real-estate-scan                            │
│                                                              │
│ **Schedule:** 09:00 daily                                   │
│ **Error:** Funda captcha triggered                          │
│ **Last success:** 2 days ago                                │
│                                                              │
│ [🔄 Run Now] [📋 View Output] [⚙️ Edit Cron] [🔕 Disable]   │
└─────────────────────────────────────────────────────────────┘
```

### 5. Meeting Follow-up

**Trigger:** 30min after meeting end

```
┌─────────────────────────────────────────────────────────────┐
│ 📝 Meeting ended: Cere x Scalantec                          │
│                                                              │
│ Attendees: Nicolas Schell, Fred, Mart                       │
│ Duration: 45 min                                            │
│                                                              │
│ [📄 Add Notes] [✅ Create Tasks] [📧 Send Follow-up]        │
│ [📅 Schedule Next] [⏭️ Skip]                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Slack Alert Template

### Message Structure

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🔔 {SEVERITY_EMOJI} {TITLE}",
        "emoji": true
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*{MAIN_MESSAGE}*\n{DETAILS}"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "📍 {SOURCE} • ⏰ {TIMESTAMP} • 👤 {ACTOR}"
        }
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "{ACTION_1_LABEL}" },
          "style": "primary",
          "url": "{ACTION_1_URL}"
        },
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "{ACTION_2_LABEL}" },
          "url": "{ACTION_2_URL}"
        },
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "⏰ Snooze" },
          "action_id": "snooze_{ALERT_ID}"
        }
      ]
    }
  ]
}
```

### Severity Emojis

| Level | Emoji | Use Case |
|-------|-------|----------|
| Critical | 🚨 | Immediate action required, production down |
| Warning | ⚠️ | Action needed within hours |
| Info | 🔔 | FYI, optional action |
| Success | ✅ | Positive confirmation |
| Question | ❓ | Decision needed |

### Action Button Patterns

**Primary actions (green button):**
- Most likely next step
- Non-destructive
- One-click resolution when possible

**Secondary actions:**
- Alternative paths
- View more details
- Delegate or escalate

**Utility actions:**
- Snooze/remind later
- Mute this type
- Open settings

---

## Telegram Alternative (voor Clawdbot)

Telegram heeft inline buttons. Format:

```typescript
// Clawdbot message with inline buttons
await message.send({
  action: 'send',
  target: 'mart',
  message: `🚨 **Deploy FAILED: cere-hr-service**
  
Error: Connection refused to Notion API
Commit: a7f3b2c "Add retry logic"
By: @mart • 2 min ago`,
  inlineButtons: [
    [
      { text: '📋 Logs', url: 'https://...' },
      { text: '🔄 Retry', callback: 'deploy:retry:cere-hr' }
    ],
    [
      { text: '⏪ Rollback', callback: 'deploy:rollback:cere-hr' },
      { text: '🔇 Mute 1h', callback: 'mute:deploy:3600' }
    ]
  ]
});
```

---

## Implementation Checklist

### Phase 1: Quick Wins (This Week)

- [ ] **GitHub webhook** → Slack/Telegram voor PR events
- [ ] **Cron wrapper** die failures pusht
- [ ] **Disk space cron** (daily check, alert >80%)

### Phase 2: Core Systems (This Month)

- [ ] **Deploy pipeline notifications** met action buttons
- [ ] **Meeting follow-up automation** (calendar integration)
- [ ] **Centralized alert routing** (één plek voor alle notifications)

### Phase 3: Intelligence (Next Quarter)

- [ ] **Smart batching** — groepeer gerelateerde alerts
- [ ] **Priority learning** — leer van welke alerts actie krijgen
- [ ] **Auto-resolve** — sommige issues direct fixen, alleen notificeren

---

## Design Principles

### 1. One Notification, Complete Context

Geen "click here for details." De notification bevat genoeg info om te beslissen:
- Wat ging er mis?
- Hoe erg is het?
- Wat zijn mijn opties?

### 2. Actions Have URLs

Elke actie is een deep link. `[View Logs]` opent direct de juiste log line, niet de homepage.

### 3. Snooze > Dismiss

Mensen dismissten dingen niet omdat ze onbelangrijk zijn, maar omdat ze het nu niet kunnen handlen. Bied snooze aan.

### 4. Smart Defaults

De primary button is de meest waarschijnlijke actie. 80% van de tijd zou één klik genoeg moeten zijn.

### 5. Escalation Built-In

Als iets 2x gesnoozed wordt of 24h oud is, escaleer automatisch of verhoog urgentie.

---

## Anti-Patterns

### ❌ "Check the dashboard"

```
Bad:  "Deployment finished. Check status page for details."
Good: "✅ Deployed cere-hr-service v2.3.1 to prod. 
       3 new features, 0 errors in first 5 min.
       [View Changelog] [Monitor Errors]"
```

### ❌ Alert Fatigue

```
Bad:  Alert on every metric fluctuation
Good: Alert only when threshold crossed + sustained 5 min
      Batch related alerts
      Include trend ("up 20% vs yesterday")
```

### ❌ Dead-End Notifications

```
Bad:  "Error occurred" (no action possible)
Good: "Error occurred: {reason}. [Retry] [View Details] [Escalate]"
```

### ❌ Missing Actor

```
Bad:  "PR merged"
Good: "PR #142 merged by @charlotte into main"
```

---

## Monitoring the Push System

Ironic, but necessary. Track:

1. **Notification volume** — zijn we annoying?
2. **Action rate** — welk % krijgt een klik?
3. **Time to action** — hoe snel na notification?
4. **Snooze patterns** — wat wordt vaak uitgesteld?
5. **Escalation rate** — wat wordt gemist?

Weekly review: welke notifications hebben nooit actie gekregen? Kill them.

---

## Quick Reference Card

```
┌────────────────────────────────────────────────────────────┐
│                   PUSH NOT PULL                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ✅ DO                          ❌ DON'T                   │
│  ──────────────────────────────────────────────────────   │
│  DM with action buttons         "Check the dashboard"     │
│  Complete context in message    "Click for details"       │
│  Deep links to exact location   Links to homepage         │
│  Snooze option                  Only dismiss              │
│  Batch related alerts           Every event = notification│
│  Include the actor              Anonymous alerts          │
│  Primary action = most likely   Alphabetical buttons      │
│                                                            │
│  FORMULA:                                                  │
│  {Emoji} {Title}                                          │
│  {What happened} • {How bad} • {Who}                      │
│  [Primary Action] [Alternative] [Snooze]                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Appendix: Webhook Recipes

### GitHub → Slack (via Clawdbot)

```bash
# .github/workflows/notify-pr.yml
on:
  pull_request:
    types: [opened, review_requested]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Push notification
        run: |
          curl -X POST "${{ secrets.CLAWDBOT_WEBHOOK }}" \
            -H "Content-Type: application/json" \
            -d '{
              "type": "pr_review_needed",
              "pr_url": "${{ github.event.pull_request.html_url }}",
              "title": "${{ github.event.pull_request.title }}",
              "author": "${{ github.event.pull_request.user.login }}",
              "reviewers": "${{ github.event.pull_request.requested_reviewers }}"
            }'
```

### Cron Wrapper Script

```bash
#!/bin/bash
# /usr/local/bin/cron-push
# Usage: cron-push "job-name" command args...

JOB_NAME="$1"
shift

OUTPUT=$("$@" 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  curl -X POST "$CLAWDBOT_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"cron_failed\",
      \"job\": \"$JOB_NAME\",
      \"exit_code\": $EXIT_CODE,
      \"output\": \"$(echo "$OUTPUT" | tail -20 | jq -Rs .)\"
    }"
fi
```

---

*Framework v1.0 — Last updated: 2026-01-26*
*Inspired by Fred's workflow philosophy*
