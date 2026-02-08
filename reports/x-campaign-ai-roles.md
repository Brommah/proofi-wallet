# X (Twitter) Outbound Campaign — AI Engineer / AI Innovator
## Cere Network — First Real Outbound Job Campaign

---

## 1. CURRENT SOURCE AUDIT (300 candidates sampled)

| Source | Count | % | Status |
|--------|-------|---|--------|
| (none / unknown) | 222 | 74% | ⚠️ Legacy data, no tracking |
| Inbound: Company Website [unknown] | 66 | 22% | ⚠️ Webflow? Lever? Unknown origin |
| Outbound: LinkedIn | 8 | 2.7% | Patrick's campaigns |
| Inbound: LinkedIn | 2 | 0.7% | Direct LinkedIn applications |
| Referral | 2 | 0.7% | Manual referrals |
| Inbound: Join | ~30 | recent | ✅ Automated (last 3 days) |

**Key insight:** 74% of candidates have NO source tracking. Only the recent Join-polled candidates have clean source data. This is the #1 gap for Fred's feedback loop.

---

## 2. INTEGRATION STATUS

### ✅ LIVE: Join.com (4 active jobs)
- Automated: Poll every 15 min → Notion + AI score + Slack alert
- Jobs: Blockchain Engineer, FA (Business Ops), Principal Software Engineer, AI Lead Engineer

### ⚠️ NEEDS SETUP: Webflow (cere.network/career)
- **Current state:** Career page at cere.network/career links to Lever (dead link) and cef.ai/#jobs (JS-only, no static content)
- **Webflow has an API:** `GET /v2/sites/:site_id/forms/:form_id/submissions` for form data
- **Integration plan:**
  1. Create application form on Webflow career page (name, email, role, LinkedIn, CV upload)
  2. Use Webflow Forms API to poll submissions (similar to Join poller)
  3. Or: Webflow webhook on form submit → Railway webhook endpoint
  4. Source: "Inbound: Company Website"

### ⚠️ NEEDS SETUP: Wellfound
- **Current state:** 50 pending candidates, avg 10,264 hours wait (cycle NOT healthy)
- **Wellfound has NO public API** — they use Zapier/partner integrations
- **Integration options:**
  1. **Email parsing:** Wellfound sends notification emails → parse with Gmail API → create Notion entry
  2. **Browser automation:** Clawdbot browser skill to scrape Wellfound dashboard periodically
  3. **Zapier (minimal):** Single Zap: Wellfound new applicant → Railway webhook (least code, uses their official integration)
  4. **Manual import:** Export CSV from Wellfound weekly → import script
- **Recommendation:** Option 3 (single Zapier zap → our webhook) is most reliable for Wellfound specifically, since they don't have an API. One Zap is much more reliable than the old multi-step Zapier flows.

### 🆕 NEW: X (Twitter) Outbound — see campaign below

---

## 3. WHAT WE'RE ACTUALLY LOOKING FOR

### From the AI Engineer V6 Prompt (hard requirements):
- ≥2 years professional Python (verified in work context)
- Shipped AI/GenAI system to production (academic doesn't count)
- Located in or relocatable to **Europe or SF Bay Area**
- Willing for **hybrid/in-person** work

### From the AI Innovator V9 Prompt (what matters):
- **Proven builders** who repeatedly shipped impactful AI products
- Production deployment experience (not coursework)
- Concept → production track record
- Business impact evidence (revenue, users, operational gains)

### From Fred's Vision (Jan 27):
- **Target Pyramid:**
  1. TOP: Super motivated + super driven + high ceiling
  2. MID: Mission-driven + Problem-solving potential  
  3. BASE: Experience (least important)
- "Someone hungry, skills like Rahul but more engaged"
- Location: Berlin or SF preferred

### From High-Scoring Candidates (AI ≥ 9):
- **Location pattern:** SF Bay Area dominates (60%+), Germany/Europe second
- **Profile pattern:** Production AI/ML engineers with shipped systems
- **Role titles:** ML Engineer, AI Engineer, Senior Data Scientist, Applied AI
- **Common traits:** Python + cloud + production deployments + metrics

---

## 4. X CAMPAIGN — AI ENGINEER / AI INNOVATOR

### Target Audience
- AI/ML engineers with 2-5 years production experience
- Currently at mid-stage startups or big tech (ready for something more impactful)
- Located in SF Bay Area, Berlin, or major EU tech hubs
- Active in AI/ML Twitter communities
- Interested in Web3/decentralization (bonus, not required)

### Targeting Parameters (X Ads Manager)
- **Interests:** Artificial Intelligence, Machine Learning, Deep Learning, Python, Startups
- **Followers of:** @huaboringface, @OpenAI, @AnthropicAI, @GoogleAI, @ylecun, @kaborning, @hardmaru
- **Locations:** San Francisco, Berlin, London, Amsterdam, Munich, Paris
- **Keywords:** "AI engineer", "ML engineer", "shipping AI", "production ML", "GenAI"

### Tweet Variations

**Variation 1 — Builder Identity**
```
We don't hire AI researchers.

We hire AI builders.

If you've shipped production AI systems (not just Jupyter notebooks), Cere Network is building decentralized data infrastructure where your models actually matter.

Berlin / SF · Apply: join.com/companies/cefai

#AIJobs #MLEngineering
```

**Variation 2 — Anti-Corporate**
```
Tired of your models sitting in staging for 6 months?

At Cere, you ship to production. Week one.

We're building the decentralized data cloud for AI — and we need engineers who move fast and break new ground.

📍 Berlin / SF
🔗 join.com/companies/cefai

#AIEngineer #Web3Jobs
```

**Variation 3 — Mission-Driven (Fred's pyramid: motivation > experience)**
```
The AI revolution is drowning in data.

Cere's DDC distributes the load — AI inference at the edge, decentralized, real-time.

If you're driven by hard problems (not just paychecks), we want to talk.

AI Engineer & AI Innovator roles open.
→ join.com/companies/cefai
```

**Variation 4 — Short & Punchy**
```
🔥 Hiring: AI Engineers who ship.

Not researchers. Not theorists. Builders.

Production Python. Deployed models. Real impact.

Cere Network — Decentralized Data Cloud
Berlin / SF Bay Area

Apply → join.com/companies/cefai
```

**Variation 5 — Community/Culture**
```
What if your AI models ran on decentralized infrastructure instead of AWS?

That's what we're building at Cere Network.

Small team. Massive ambition. Real ownership.

Looking for AI Engineers & Innovators who want to build the future of data.

🌍 Berlin / SF
```

### Hashtag Strategy
**Primary:** #AIJobs #MLEngineering #AIEngineer
**Secondary:** #Web3Jobs #DecentralizedAI #BuildInPublic
**Community:** #MachineLearning #DeepLearning #GenAI #LLM

### Budget Recommendation
- **Test budget:** $500-1,000 for 2 weeks
- **A/B test:** Run all 5 variations, kill losers after 3 days
- **Target CPC:** $2-5 for AI/ML audience
- **Expected:** 100-250 clicks, 10-25 applications
- **Scale:** If CPA < $50/application, scale to $2-3K/month

### Source Tracking
- Use UTM parameters: `?utm_source=twitter&utm_medium=paid&utm_campaign=ai_engineer_jan26`
- Create dedicated Join.com application link with campaign tracking
- Map to Notion Source: "Outbound: X (Twitter)"
- Add "Outbound: X (Twitter)" to the Source select options in Notion

---

## 5. ACTION ITEMS

### Immediate (this week)
1. [ ] Set up Webflow form polling or webhook → Notion
2. [ ] Set up Wellfound → Railway webhook (single Zapier zap)
3. [ ] Add Source options: "Outbound: X (Twitter)", "Inbound: Webflow"
4. [ ] Create X Ads account if not exists
5. [ ] Launch 5 tweet variations with $500 test budget
6. [ ] Fix cere.network/career links (Lever is dead, cef.ai doesn't load)

### Next sprint
7. [ ] Backfill source data for the 222 candidates with no source
8. [ ] Source-to-score analytics (which source brings best candidates?)
9. [ ] Campaign performance tracking in Notion
10. [ ] Scale winning X ad creatives

---

*Generated: 2026-01-28 | Based on: Notion candidate data, AI prompts V6/V9, Fred vision (Jan 27)*
