# HR Pipeline Guide — For Lynn & Valery

**Last updated:** January 29, 2026 | Prepared by Mart Broersma

---

## Your Role in the Pipeline

You are **Step 2: Filtering Interviews** (15-min screening calls). Here's the full flow:

```
Application (JOIN / Wellfound / Website)
    ↓ [AUTOMATIC]
AI Score assigned + Notion record created
    ↓ [AUTOMATIC]
Slack alert fires (hot candidate if score ≥8)
    ↓
→ LYNN / VALERY: 15-min screening call ←  YOU ARE HERE
    ↓
BREN: 30-40 min deep interview
    ↓
FRED: Final interview (hot candidates)
    ↓
Offer / Reject
```

---

## Dashboard Access

**URL:** https://hr-funnel-monitor-production.up.railway.app/v3

### What Each Section Shows

| Section | What It Shows | Your Action |
|---------|--------------|-------------|
| **Fred's Queue** | Candidates scoring ≥8 that need immediate attention | Schedule 15-min screening call **within 24h** |
| **Pipeline Overview** | All candidates by stage (New → Screening → Interview → Offer) | Check for bottlenecks — candidates stuck in a stage |
| **Source Breakdown** | Where candidates are coming from (JOIN, Wellfound, Website) | See which channels perform best |
| **Role Distribution** | Candidates per open role with score averages | Identify roles with low applicant volume |

---

## Understanding AI Scores

Every candidate who applies gets an automated AI score (1–10) based on their CV, LinkedIn, and role-specific criteria. These scores are **calibrated against human reviewers** — the AI typically agrees within ~1.3 points of human judgment.

| Score Range | Meaning | Your Action |
|-------------|---------|-------------|
| **8–10** | 🔥 Hot candidate — strong match on hard requirements | **Fast-track:** schedule screening within 24h |
| **6–7** | ✅ Solid candidate — meets most criteria | **Standard process:** schedule within the week |
| **4–5** | ⚠️ Borderline — missing some key requirements | **Review manually** before investing interview time |
| **1–3** | ❌ Poor fit — missing hard requirements | **Archive** unless special circumstances |

### What the AI Evaluates

For each candidate, you'll see in Notion:
- **AI Score** (1–10)
- **Summary** — One-paragraph overview of the candidate
- **Strengths** — What makes them a good fit
- **Concerns** — Red flags or gaps
- **Recommendation** — Suggested next step

These are generated per role — an AI Innovator is evaluated differently from a Blockchain Engineer.

---

## When You Get a Slack Alert

### Hot Candidate Alert (Score ≥8)
1. You'll see it in **#hr-pipeline** on Slack
2. Fred also gets a DM
3. **Within 24 hours:** Schedule a 15-min screening call
4. After the call, update the Notion record:
   - Move to next pipeline stage
   - Add your **Human Score** (1–10)
   - Add brief notes on strengths/concerns
5. Your human score feeds back into AI calibration — this is how the system improves!

### Stale Candidate Warning
- Fires daily for candidates stuck in a stage too long
- Check if someone fell through the cracks
- Either advance them or archive with a reason

---

## Where to Find Things

| Resource | Location |
|----------|----------|
| **Candidate Board** | [Notion Database](https://www.notion.so/112d800083d6805ca3aae21ec2741ba7) |
| **Job Roles & Prompts** | [Notion Job Roles DB](https://www.notion.so/24cd800083d6804daaf7f5b100d71ea9) |
| **Pipeline Architecture** | [Notion KB Page](https://www.notion.so/HR-Pipeline-Architecture-Fred-Vision-Jan-27-2f5d800083d68135b62fe92df86c11c1) |
| **Dashboard** | [hr-funnel-monitor v3](https://hr-funnel-monitor-production.up.railway.app/v3) |

---

## The Feedback Loop (Why Your Input Matters)

Every time you add a **Human Score** to a candidate in Notion, it feeds the AI calibration system:

```
AI scores candidate → You interview → You add Human Score
                                            ↓
                            System compares AI vs Human
                                            ↓
                        MAE tracked (mean absolute error)
                                            ↓
                    If MAE rises → prompts get adjusted
```

**Current accuracy by role:**
- Blockchain Engineer: MAE **0.64** ✅ (AI and humans nearly always agree)
- Principal Fullstack: MAE **1.20** ✅
- AI Engineer/Innovator: MAE **1.61** ⚠️ (still tuning)
- Founder's Associate: **No data** ❌ (need human scores!)

**Founder's Associate is the biggest gap.** There are 58 FA candidates with AI scores but zero human scores. If you can prioritize adding human scores for the top FA candidates (AI ≥7), it would dramatically improve the system.

---

## Interview Template (Coming This Week)

A standardized 15-min screening template is being built with:
- 2-3 anchor questions per section
- Role-specific variations
- Scoring rubric aligned with AI criteria

Until the template is ready, focus on:
1. **Motivation** — Why this role? Why Cere?
2. **Relevant experience** — What have they shipped?
3. **Culture fit** — Startup pace, remote work, self-driven?

---

## Quick Reference: Active Roles

| Role | JOIN Link | Key Requirements |
|------|-----------|-----------------|
| AI Lead Engineer | [Apply](https://join.com/companies/cefai/15594661-ai-lead-engineer) | 2+ yrs production Python, shipped AI to prod |
| Blockchain Engineer | [Apply](https://join.com/companies/cefai/15594662-blockchain-engineer) | Solidity, smart contracts, chain-specific knowledge |
| Principal Software Engineer | [Apply](https://join.com/companies/cefai/15594663-principal-software-engineer) | Distributed systems, senior-level bar |
| Founder's Associate | [Apply](https://join.com/companies/cefai/15594664-founders-associate) | Operations + drive, business context |
| AI Innovator | [Apply](https://join.com/companies/cefai/15594665-ai-innovator) | Shipped AI products, not just research |

---

---

## 🤖 Your Own AI Assistant: Setting Up Clawdbot

You can get your own **Clawdbot** — an AI assistant that connects directly to our Notion pipeline. Think of it as having a smart colleague who can instantly answer questions about candidates, run reports, and help manage the pipeline — all through natural conversation on Telegram.

### What You'll Need (Mart Will Help Set Up)

| Item | What It Is | Who Provides |
|------|-----------|-------------|
| **Clawdbot** | The AI assistant app (runs on your Mac) | Mart installs it |
| **Anthropic API Key** | Powers the AI brain (~$20/month typical usage) | You sign up at anthropic.com |
| **Notion API Key** | Lets Clawdbot read/write our candidate database | Shared — Mart provides |
| **Notion Skill** | The "recipe" that teaches Clawdbot how to use Notion | Mart configures |

**What you DON'T need:** No coding, no GitHub, no Railway, no terminal commands. Once it's set up, you just chat with it on Telegram.

### What You Can Ask Clawdbot

Here are real examples — just type these in your Telegram chat with Clawdbot:

#### 📋 Candidate Queries
- *"Show me all candidates scored 8+ this week"*
- *"Who are the top 5 AI Innovator candidates?"*
- *"How many Founder's Associate applications did we get this month?"*
- *"Find candidates from Wellfound with human score above 7"*
- *"Which candidates are stuck in screening for more than 5 days?"*

#### 📊 Reports & Analytics
- *"What's our HQ rate by source this month?"*
- *"Compare AI scores vs human scores for recent candidates"*
- *"Which source is giving us the best quality candidates?"*
- *"Give me a summary of the pipeline — how many at each stage?"*
- *"How many candidates did we process last week vs the week before?"*

#### 🔧 Pipeline Management
- *"Update the human score for [candidate name] to 7"*
- *"Move [candidate name] to the interview stage"*
- *"Add a note to [candidate name]: strong technical background, schedule deep interview"*
- *"Show me candidates I haven't scored yet"*

#### 🎯 Scoring & Prompts
- *"What are the current scoring criteria for Blockchain Engineer?"*
- *"The AI seems to overscore LinkedIn candidates — can you check the calibration?"*
- *"Show me the biggest gaps between AI and human scores"*
- *"Which role has the worst AI accuracy right now?"*

#### 🚨 Alerts & Follow-ups
- *"Set up a daily alert for new candidates scoring 8+"*
- *"Remind me to follow up with candidates from last week's screening"*
- *"Are there any stale candidates I should look at?"*

### How It Works Day-to-Day

```
You (on Telegram): "Show me today's new candidates"

Clawdbot: "📥 3 new candidates today:
  1. Jane Smith — AI Innovator — AI Score: 8.2 — Source: Wellfound
  2. Bob Jones — Principal Fullstack — AI Score: 6.5 — Source: JOIN
  3. Ana Garcia — AI Engineer — AI Score: 9.1 — Source: Lemlist ⭐

  Ana Garcia looks exceptional — 9.1 AI score from outbound. 
  Recommend fast-tracking the screening call."

You: "Schedule Ana for screening, add a note that she was 
     referred by our Lemlist campaign"

Clawdbot: "✅ Done. Moved Ana Garcia to Screening stage 
          and added your note."
```

### Getting Started

1. **Ask Mart** to set up Clawdbot on your machine (takes ~15 minutes)
2. **Open Telegram** and find your Clawdbot chat
3. **Start asking questions** — no training needed, just type naturally
4. **The more you use it, the more useful it gets** — it learns your patterns

### Tips for Best Results

- **Be specific:** "Show AI Innovator candidates from Wellfound scoring above 6" works better than "show me good candidates"
- **Use it for batch work:** Instead of clicking through Notion, ask "show me all unscored candidates from this week" and work through them
- **Ask for analysis:** "Why do LinkedIn candidates score lower than Wellfound candidates?" — it can actually analyze the data and give you insights
- **Update through chat:** After a screening call, just tell Clawdbot the score and notes — faster than navigating Notion

---

## 🤖 Set Up Your Own Clawdbot (Self-Service Power Tools)

You don't need to be technical to use Clawdbot. Think of it as your AI assistant that can talk to the entire HR pipeline — query candidates, run reports, update prompts, and get alerts. Here's how to set it up.

### What You Need

| Item | How to Get It |
|------|--------------|
| **Clawdbot** installed on your Mac | Mart will help with initial install (~15 min) |
| **Anthropic API key** (Claude) | Create at [console.anthropic.com](https://console.anthropic.com) |
| **Notion API key** | Mart shares the existing integration — same access as the pipeline |
| **Telegram** (optional) | For mobile alerts and on-the-go queries |

### What You Do NOT Need
- ❌ Access to the codebase or GitHub
- ❌ Railway or deployment access
- ❌ Any programming knowledge

### What You Can Do

Once set up, just talk to Clawdbot in natural language:

#### 📊 Query Candidates
> "Show me all AI Engineer candidates from this week with score ≥7"
> "Who's stuck in HR Screening for more than 5 days?"
> "List all Founder's Associate candidates with human score but no interview scheduled"
> "How many candidates came in from Wellfound this month?"

#### ✏️ Update Prompts & Scoring
> "Show me the current AI scoring prompt for Blockchain Engineer"
> "Update the AI Innovator prompt to weigh production experience more heavily"
> "Add 'Solana experience' as a bonus criterion for Blockchain Engineer"

The prompts live in Notion — Clawdbot reads and updates them directly.

#### 📈 Run Reports On Demand
> "Give me a pipeline report for this week"
> "Compare AI scores vs human scores for the last 50 candidates"
> "Which source channel has the best conversion rate?"
> "Show me candidates where AI and human scores differ by more than 3 points"

#### 🔔 Set Up Alerts
> "Alert me when a new candidate scores ≥8"
> "Remind me every Monday to review stale candidates"
> "Notify me if any candidate has been in screening for more than 7 days"

Clawdbot can send these alerts to your Telegram, Slack, or email.

#### 🔄 Manage the Feedback Loop
> "Show me candidates with AI scores but no human scores"
> "What's the current MAE for each role?"
> "Which roles need more human scoring data?"

### Getting Started (5-Minute Walkthrough)

1. **Mart installs Clawdbot** on your Mac (one-time setup)
2. **Connect Telegram** — scan a QR code, done
3. **Add your API keys** — Mart walks you through this
4. **Start chatting** — ask Clawdbot anything about the pipeline

From that point on, you're self-sufficient. You can query, update prompts, run reports, and manage alerts without asking Mart or touching any code.

### Example: Daily Workflow with Clawdbot

**Morning (2 min):**
> You: "Morning briefing — any hot candidates overnight?"
> Clawdbot: "3 new candidates scored ≥8: [names + roles + links]"

**During the day:**
> You: "Schedule a screening call reminder for Akash Singh tomorrow at 14:00"
> You: "Move Maria Gonzalez to Interview stage and set human score to 8"

**End of week:**
> You: "Weekly pipeline summary — how many screened, passed, rejected?"
> You: "Which sources performed best this week?"

---

## Questions?

Reach out to **Mart** on Slack or Telegram for:
- Dashboard issues
- AI score questions
- Pipeline automation changes
- Prompt adjustments

> *"Your job is not telling me the funnel is working. Your job is telling me how can we IMPROVE the feedback loop."* — Fred

---

*This document is part of the CEF HR Pipeline documentation suite.*
