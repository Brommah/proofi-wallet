# HR Pipeline E2E — Weekly Report

**Week of January 25–28, 2026** | Prepared by Mart Broersma  
**Last updated:** January 28, 2026

---

## 1. Executive Summary

This week we transformed Cere's HR pipeline from a collection of manual processes and broken integrations into a fully automated, AI-powered candidate intake system. The **HR Funnel Monitor v3** — a Node.js service deployed on Railway — now handles candidate intake from JOIN, Wellfound, and Webflow; scores every candidate with role-specific AI prompts; pushes results to Notion; and alerts the team via Slack. We also shipped career pages on both **cere.network** and **cef.ai** with source-tracked redirect URLs, enabling the feedback loop Fred outlined on Jan 27.

**Key numbers:**
- **6 roles** with calibrated AI scoring prompts
- **103 candidates** scored, overall MAE of **1.34** (target: ≤1.5)
- **21 candidates** re-scored after prompt sync fix
- **15 candidate sources** corrected in Notion
- **3 intake channels** automated (JOIN, Wellfound, Webflow-ready)
- **4 active job postings** on career pages with tracked URLs

---

## 2. What Didn't Work Well

| Problem | Impact | Resolution |
|---------|--------|------------|
| **Zapier multi-step flows breaking** | Wellfound candidates stuck; 50 pending with avg 10,264 hr wait | Replaced with Google Apps Script email poller → Railway webhook |
| **GPT-4o returning empty evaluations** | Candidates created in Notion without AI scores | Switched to **Gemini 3 Flash Preview** — better output quality and reliability |
| **Auth token issues** | Webhook authentication failures on Wellfound intake | Simplified auth with shared secret headers; added fallback handling |
| **Lever dead links on cere.network** | Career page "Apply" buttons → 404 | Replaced all links with tracked JOIN redirects |
| **74% of candidates had no source** | Impossible to measure channel effectiveness | Built source tracking system; retroactively fixed 15 candidates |
| **Hardcoded inline prompts** | Production service used old prompts, not calibrated versions | Switched to file-based prompt loading from `prompts/` directory |
| **Two repos confusion** | Changes pushed to wrong repo (Brommah/cere-hr-service vs cere-io/HR-2026-E2E) | Documented: always push to `cere` remote for production |
| **Scattered manual processes** | No single source of truth; Lynn/Valery couldn't see pipeline state | Dashboard v3 + Notion Candidate Board as central hubs |

---

## 3. What We Built This Week

### 3.1 HR Funnel Monitor v3 (Railway, Node.js)

The core service powering the entire pipeline. Deployed on Railway from `cere-io/HR-2026-E2E`.

**Features:**
- REST API with webhook endpoints for multiple intake sources
- JOIN API polling (every 15 min)
- Wellfound email poller intake
- Webflow forms poller (ready for career page forms)
- AI candidate scoring with role-specific prompts
- Slack alerting system
- Health monitoring endpoint
- Dashboard v3 web UI

### 3.2 AI Candidate Scoring System

Calibrated, role-specific prompts for 6 roles:

| Role | Prompt Version | File | Notes |
|------|---------------|------|-------|
| AI Engineer | V6 | `AI_Engineer.txt` | Strict on production experience |
| AI Innovator | V9 | `AI_Innovator.txt` | Focuses on shipped AI products |
| Principal Fullstack Engineer | V8 | `Principal_Fullstack_Engineer.txt` | Senior-level bar |
| Founder's Associate (Business Ops) | V7 | `Founders_Associate.txt` | Operations + drive |
| Founder's Associate (Generic) | Generic | `Founders_Associate_Generic.txt` | Operations Generalist |
| Blockchain Engineer | V2 | `Blockchain_Engineer.txt` | Chain-specific knowledge |

**Model switch:** GPT-4o → **Gemini 3 Flash Preview** for better output quality and fewer empty evaluations.

### 3.3 AI Scoring Calibration

| Role | Candidates Scored | MAE | Status |
|------|-------------------|-----|--------|
| Blockchain Engineer | 7 | **0.64** | ✅ Excellent |
| Principal Fullstack | 50 | **1.20** | ✅ Target met |
| AI Engineer | 46 | **1.61** | ⚠️ Near target |
| Founder's Associate | 0 | — | ❌ No human scores yet |
| **OVERALL** | **103** | **1.34** | ✅ Target met (≤1.5) |

- **3x daily cron** (`hr-ai-delta-tracker`): runs at 9am, 1pm, 5pm
- MAE tracking with reports to Notion + Telegram
- 21 candidates re-scored after prompt sync fix — significant corrections (e.g., AI Engineer V6 is stricter: Dhieddine 8→3, Abhineet 8→3)

### 3.4 Dashboard v3

**URL:** https://hr-funnel-monitor-production.up.railway.app/v3

Features:
- **Fred's Queue** — Hot candidates (score ≥8) requiring immediate attention
- **Pipeline Velocity** — Candidates per stage over time
- **Source/Channel breakdown** — Which channels produce the best candidates
- **Role-by-role scoring** — AI score distributions per position

### 3.5 Slack Alerts

| Alert Type | Frequency | Target |
|------------|-----------|--------|
| Fred DM — Pipeline summary | Every 3 hours | Fred's Slack DM |
| Hot Candidate Alert | Real-time | #hr-pipeline channel |
| Stale Candidate Warning | Daily | #hr-pipeline channel |
| SLA Violation | Real-time | #hr-pipeline channel |

### 3.6 Automated Intake Channels

#### JOIN API Polling
- Polls every 15 minutes for new applicants across 4 active jobs
- Replaces manual intake from JOIN dashboard
- Source automatically tagged: `Inbound: Join`

#### Wellfound Email Poller (Google Apps Script)
- Replaces broken Zapier multi-step flows
- Gmail Apps Script monitors Wellfound notification emails → parses candidate data → POSTs to Railway webhook
- Same pipeline as JOIN (Notion + AI Score + Slack)

#### Webflow Forms Poller
- Ready for cere.network career page form submissions
- Uses Webflow Forms API: `GET /v2/sites/:site_id/forms/:form_id/submissions`
- Source tagged: `Inbound: Company Website`

### 3.7 Career Pages + Source Tracking

#### cere.network Career Page
- Populated Webflow CMS with 4 active roles
- All "Apply" links redirect to JOIN with tracked URLs
- **Known issue:** One Lever link still hardcoded in Webflow designer (needs manual fix in Webflow)

#### cef.ai Career Page
- PR merged with all 4 JOIN roles + tracked URLs
- Live on cef.ai

#### Source/Channel Tracking via Redirect URLs

| Source Parameter | Meaning | Example URL |
|-----------------|---------|-------------|
| `?src=cere-website` | Application from cere.network | `join.com/companies/cere/jobs/...?src=cere-website` |
| `?src=cef-ai` | Application from cef.ai | `join.com/companies/cere/jobs/...?src=cef-ai` |
| `?src=x-campaign` | X/Twitter outbound campaign | `join.com/companies/cere/jobs/...?src=x-campaign` |

Flow: Website → `/apply` redirect with `?src=` → JOIN application → Webhook matches source parameter → Notion tracks origin.

### 3.8 Source Data Cleanup
- 15 existing candidates had incorrect source data (raw "Direct" or "LinkedIn" from JOIN API)
- All corrected to `Inbound: Join`
- New candidates automatically get correct source tagging

### 3.9 X/Twitter Campaign Plan
- Google Doc drafted with campaign strategy for AI Engineer / AI Innovator roles
- Source audit revealed 74% of legacy candidates have no source — this campaign will be fully tracked
- Target audience: AI builders in Europe and SF Bay Area

---

## 4. How We Know It's Working

| Signal | What It Tells Us |
|--------|-----------------|
| **`/api/health` endpoint** | Notion ✅, GitHub ✅, Railway ✅ — all services connected |
| **AI alignment cron (3x/day)** | MAE tracking ensures scoring quality doesn't drift |
| **Dashboard v3** | Real-time pipeline state visible to entire team |
| **Slack alerts firing** | Hot candidates, stale warnings, SLA violations all active |
| **Source tracking** | Redirect clicks measurable; every new candidate has a source |
| **Re-scoring results** | Prompt sync fix verified — scores now match calibrated expectations |

---

## 5. How Lynn and Valery Can Use This

### Dashboard Access
**URL:** https://hr-funnel-monitor-production.up.railway.app/v3

### What Each Section Shows

| Section | What It Shows | Action |
|---------|--------------|--------|
| **Fred's Queue** | Candidates scoring ≥8 that need immediate attention | Schedule 15-min screening call within 24h |
| **Pipeline Overview** | All candidates by stage (New → Screening → Interview → Offer) | Check for bottlenecks — candidates stuck in a stage |
| **Source Breakdown** | Where candidates are coming from (JOIN, Wellfound, Website) | See which channels perform best |
| **Role Distribution** | Candidates per open role with score averages | Identify roles with low applicant volume |

### How Candidates Flow Through the Pipeline

```
Application (JOIN/Wellfound/Website)
    ↓
Automatic: Created in Notion + AI Score assigned
    ↓
Slack alert fires (hot candidate if score ≥8)
    ↓
Lynn/Valery: 15-min screening call
    ↓
Bren: 30-40 min deep interview
    ↓
Fred: Final interview (hot candidates)
    ↓
Offer / Reject
```

### What AI Scores Mean

| Score Range | Meaning | Action |
|-------------|---------|--------|
| **8–10** | 🔥 Hot candidate — strong match on hard requirements | Fast-track: schedule screening within 24h |
| **6–7** | ✅ Solid candidate — meets most criteria | Standard process: schedule within the week |
| **4–5** | ⚠️ Borderline — missing some key requirements | Review manually before investing time |
| **1–3** | ❌ Poor fit — missing hard requirements | Archive unless special circumstances |

Scores are calibrated against human reviewers (MAE 1.34 — meaning AI typically agrees within ~1.3 points of human judgment).

### Where to Find Things
- **Candidate Board:** Notion database (ID: `112d8000-83d6-805c-a3aa-e21ec2741ba7`)
- **Job Roles DB:** Notion (ID: `24cd8000-83d6-804d-aaf7-f5b100d71ea9`)
- **Pipeline Architecture:** [Notion KB Page](https://www.notion.so/HR-Pipeline-Architecture-Fred-Vision-Jan-27-2f5d800083d68135b62fe92df86c11c1)

### When a Hot Candidate (Score ≥8) Appears
1. You'll get a Slack alert in #hr-pipeline
2. Fred gets a DM
3. **Within 24 hours:** One of you schedules a 15-min screening call
4. Use the interview template with anchor questions (being built this week)
5. Log feedback in Notion — this feeds the AI calibration loop

---

## 6. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTAKE SOURCES                           │
│                                                                 │
│  ┌─────────┐   ┌───────────────┐   ┌──────────────────────┐   │
│  │  JOIN    │   │  Wellfound    │   │  Webflow Forms       │   │
│  │  (API)   │   │  (Gmail→GAS) │   │  (Forms API)         │   │
│  └────┬─────┘   └──────┬────────┘   └──────────┬───────────┘   │
│       │                │                        │               │
└───────┼────────────────┼────────────────────────┼───────────────┘
        │                │                        │
        ▼                ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              HR FUNNEL MONITOR v3 (Railway)                     │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Deduplication │→│ AI Scoring   │→│ Notion + Drive      │   │
│  │              │  │ (Gemini 3)   │  │ (Candidate DB)      │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Slack Alerts │  │ Dashboard v3 │  │ Health Monitor      │   │
│  │ (DM + Chan)  │  │ (Web UI)     │  │ (/api/health)       │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

SOURCE TRACKING FLOW:
  cere.network/career  ──→  /apply?src=cere-website  ──→  JOIN application
  cef.ai/#jobs         ──→  /apply?src=cef-ai        ──→  JOIN application
  X/Twitter post       ──→  /apply?src=x-campaign    ──→  JOIN application
                                                            ↓
                                              Webhook matches ?src= param
                                                            ↓
                                              Notion: Source field populated
```

---

## 7. Quick Links

| Resource | URL |
|----------|-----|
| **GitHub Repo** | [github.com/cere-io/HR-2026-E2E](https://github.com/cere-io/HR-2026-E2E) |
| **Dashboard v3** | [hr-funnel-monitor-production.up.railway.app/v3](https://hr-funnel-monitor-production.up.railway.app/v3) |
| **Health Endpoint** | [/api/health](https://hr-funnel-monitor-production.up.railway.app/api/health) |
| **Notion Candidate DB** | `112d8000-83d6-805c-a3aa-e21ec2741ba7` |
| **Notion Job Roles DB** | `24cd8000-83d6-804d-aaf7-f5b100d71ea9` |
| **Pipeline Architecture (Notion KB)** | [HR Pipeline Architecture — Fred Vision](https://www.notion.so/HR-Pipeline-Architecture-Fred-Vision-Jan-27-2f5d800083d68135b62fe92df86c11c1) |

---

## 8. Next Steps / Open Items

| Priority | Item | Owner | Due |
|----------|------|-------|-----|
| 🔴 High | Interview templates with 2-3 anchor questions per section | Mart | Friday Jan 30 |
| 🔴 High | Human scores for 58 Founder's Associate candidates | Lynn/Valery | This week |
| 🔴 High | Full Gemini 3 re-score (remaining 53 candidates) | Mart | This week |
| 🟡 Medium | Weekly prompt improvement cycle (human feedback → prompt iteration) | Mart | Ongoing |
| 🟡 Medium | Correlate job descriptions with AI + human + interview scores | Mart | Next week |
| 🟡 Medium | Outbound efficacy tracking (X campaign launch) | Mart | Next week |
| 🟡 Medium | cere.network Lever link still hardcoded in Webflow designer | Mart | This week |
| 🟢 Low | Transcript → Template → AI feedback automation | Mart | Feb |
| 🟢 Low | Cal.com self-scheduling integration | Mart | Feb |

### Fred's Architecture Vision (from Jan 27 sync)

```
INBOUND + OUTBOUND (shared: JD, website)
         ↓
      CAMPAIGN (source tracking ✅ — built this week)
         ↓
   FILTER/FEEDBACK  ← WE ARE HERE
         ↓
     INTERVIEW (15min filter / 30-40min deep)
         ↓
    BACKGROUND
```

**Step ownership:**
1. **Mart** — Scoring, feedback loops, outbound tooling
2. **Lynn/Valery** — Filtering interviews (15 min calls)
3. **Bren** — Deep interviews (30-40 min)
4. **Fred** — Training, oversight, hot candidate interviews

> *"Your job is not telling me the funnel is working. Your job is telling me how can we IMPROVE the feedback loop."* — Fred, Jan 27

---

*Report generated January 28, 2026. Source: [cere-io/HR-2026-E2E](https://github.com/cere-io/HR-2026-E2E)*
