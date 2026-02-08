# Vibe Marketing Playbook
## Based on @boringmarketer (James Dickerson) / The Vibe Marketer Framework
### Applied to Crypto/Web3 Marketing — Cere Network / CEF.ai

---

> **"Vibe marketing is using AI tools and workflow automation to accomplish what traditionally required large teams—enabling one marketer to execute at the level of five while maintaining strategic oversight and creative control."**
> — James Dickerson (@boringmarketer)

---

## 📚 Source Material

| Resource | Link | Key Focus |
|----------|------|-----------|
| 60-min Cursor Masterclass (w/ Amir) | [YouTube](https://www.youtube.com/watch?v=UOcUjMJwYCA) | Using Cursor to grow any business with prompts |
| Vibe Marketing Tutorial (AI Agents) | [YouTube](https://www.youtube.com/watch?v=PduJ0P6r_8o) | AI agents for marketing money flows |
| Cursor + Claude Code Tutorial | [YouTube (summary)](https://startup.whatfinger.com/2025/06/30/cursor-claude-code-is-insane-vibe-marketing-tutorial/) | Programmatic SEO without coding |
| n8n/MCP/Claude 3.7 (40-min) | [YouTube](https://www.youtube.com/watch?v=f9Uk56LvBB0) | Workflow automation with Claude + MCPs |
| The Complete Guide | [thevibemarketer.com](https://www.thevibemarketer.com/guides/what-is-vibe-marketing) | Philosophy, 4 levels, full framework |
| Riley Brown Masterclass (MCPs + Growth) | [X post](https://x.com/boringmarketer/status/1930252229711196249) | Workflows, MCPs, full growth strategy in 33 min |

---

## 🧠 Core Philosophy

### The Shift: Executor → Orchestrator

| Dimension | Traditional Marketing | Vibe Marketing |
|-----------|----------------------|----------------|
| Primary Role | Executor | Orchestrator |
| Focus | Tactical | Strategic |
| Position | Marketing Manager | Marketing Architect |
| Success Metric | Task Completion | System Design |
| Scaling | Add headcount | Add automations |

**Key Insight:** The value is in knowing WHAT to build, not HOW to build it. AI democratizes the "how." You focus on the "what" and "why."

### The Four Levels of Vibe Marketing

1. **Level 1: AI Tools in Silos** — ChatGPT for copy, Midjourney for images, etc. (~20-30% time savings). You are the integration layer.
2. **Level 2: Workflow Automation** — Tools connected via n8n/Make/Zapier. If-then automation. (~40-60% savings). Most stop here.
3. **Level 3: Vibe Coding / Marketers Who Code** ⭐ — Using Cursor + Claude Code to build custom solutions. (~70-85% savings). **THIS IS THE BREAKTHROUGH.**
4. **Level 4: Full Autonomy** — AI agents running campaigns end-to-end. Not fully here yet, but approaching.

**For Cere/CEF.ai: Target Level 3.** A single marketer building custom tools, programmatic content, and automated workflows specifically tailored to crypto audiences.

---

## 🔟 Top 10 Actionable Takeaways

### 1. Build a "Research Engine" That Runs While You Sleep
**What:** Set up automated research workflows that scrape Reddit, Twitter/X, Discord, and competitor content to surface marketing opportunities.

**How (n8n workflow):**
- Reddit node → scrape crypto subreddits (r/CryptoCurrency, r/defi, r/web3, r/Cere_Network)
- Filter by: hot/rising posts, keyword matches (decentralized data, AI infrastructure, data marketplace)
- AI node → analyze sentiment, extract pain points, identify content gaps
- Output → Google Sheet or Notion database with prioritized opportunities

**CEF.ai Application:**
- Monitor discussions about decentralized AI, data infrastructure, competitor mentions (Filecoin, Arweave, Ocean Protocol)
- Auto-surface Reddit threads where Cere/CEF.ai can organically add value
- Track which narratives are gaining traction in real-time

---

### 2. Use MCPs (Model Context Protocol) as Your Secret Weapon
**What:** MCPs connect AI tools to live data sources, making your AI context-aware rather than working in a vacuum.

**Key MCPs from boringmarketer's stack:**
- **FireCrawl MCP** — Scrape any website for data (competitors, industry sites)
- **Perplexity MCP** — Deep research with citations
- **Data for SEO MCP** — Keyword volume validation
- **Browser MCP** — Interact with web pages programmatically

**CEF.ai Application:**
- FireCrawl competitors' docs, blog posts, and feature pages → feed into positioning analysis
- Perplexity for real-time crypto market research and narrative tracking
- SEO MCP to find underserved keywords in the decentralized data / AI infrastructure space

---

### 3. Programmatic SEO at Scale with Cursor + Claude Code
**What:** Build hundreds/thousands of targeted pages automatically using AI coding assistants. No dev team needed.

**The boringmarketer workflow:**
1. Scrape your site with FireCrawl
2. Research keywords with Perplexity MCP
3. Validate keyword volume with Data for SEO
4. Create a PRD (Product Requirements Doc) in natural language
5. Feed PRD to Claude Code
6. Deploy with Vercel
7. Total cost: ~$20 in AI tokens

**CEF.ai Application:**
- Build comparison pages: "CEF.ai vs Filecoin," "CEF.ai vs Ocean Protocol," "Cere Network vs Arweave"
- Create programmatic pages for every use case: "Decentralized data for [industry]" (gaming, healthcare, finance, supply chain)
- Generate landing pages for each integration/partnership
- Target long-tail crypto keywords that big players ignore
- **Goal: 500+ targeted pages capturing search traffic from developers and enterprises evaluating data infrastructure**

---

### 4. The 10-Step n8n Workflow (Zero to Vibe Marketer)
**What:** Boringmarketer's exact framework for going from zero to automated marketing.

**Steps (adapted for CEF.ai):**
1. **Scrape** — Reddit, YouTube, CT (Crypto Twitter) for Cere/CEF.ai related discussions
2. **Generate content ideas** — AI analyzes scraped data → surfaces content opportunities
3. **Research keywords** — Validate which ideas have search volume
4. **Draft content** — AI generates first drafts tailored to crypto audience
5. **Optimize for SEO + LLM discovery** — Structure for both Google and AI chatbot answers
6. **Create social variants** — Auto-repurpose blog → Twitter thread → LinkedIn → Discord announcement
7. **Schedule & publish** — Auto-distribute across platforms
8. **Monitor performance** — Track engagement, clicks, conversions
9. **Iterate** — AI analyzes what worked → feeds back into step 2
10. **Scale** — Replicate winning workflows across all content verticals

---

### 5. Own LLM Discovery (SEO 2.0)
**What:** Beyond traditional SEO — optimize for being cited by AI chatbots (ChatGPT, Perplexity, Claude) when users ask about your category.

**How:**
- Structure content with clear Q&A format that LLMs can easily extract
- Build authoritative comparison content that LLMs reference
- Ensure your brand appears in the "consideration set" when someone asks "What are the best decentralized data platforms?"

**CEF.ai Application:**
- Create definitive guides: "What is decentralized data infrastructure?" (position CEF.ai as the answer)
- Build "alternatives" and "comparison" content that LLMs index
- Publish technical docs/guides that become source material for AI training data
- **Test regularly:** Ask ChatGPT/Perplexity/Claude about your category → see if CEF.ai appears → optimize until it does

---

### 6. Social Repurposing Without AI Slop
**What:** Turn one piece of content into 10+ platform-native pieces without sounding robotic.

**Boringmarketer's approach:**
- Write one substantial piece (blog post, thread, video script)
- Use AI to extract key insights and reformat for each platform
- **Critical:** Maintain authentic voice. Set up brand voice docs that AI references.
- Never publish AI output without human review of tone/accuracy

**CEF.ai Application:**
- One technical blog post → Twitter thread → LinkedIn article → Discord announcement → Telegram update → Reddit post (each in platform-native tone)
- Developer docs → simplified explainer threads for non-technical crypto audience
- Partnership announcements → 5+ content variations across channels
- **Brand voice rules for AI:** Technical but accessible, community-first, no hype/moon talk, focus on real utility

---

### 7. Competitive Intelligence on Autopilot
**What:** Automatically monitor competitors and surface strategic opportunities.

**n8n Workflow:**
- Scrape competitor blogs, changelogs, and social accounts daily
- AI analyzes: new features, messaging changes, community reactions
- Alert when competitors make notable moves
- Weekly digest with strategic recommendations

**CEF.ai Application:**
- Track: Filecoin, Arweave, Ocean Protocol, Akash, Render Network, IPFS ecosystem
- Monitor: funding announcements, partnership news, dev activity, narrative shifts
- Auto-generate "response" content when competitors make moves
- Surface gaps: what are competitors NOT talking about that CEF.ai can own?

---

### 8. Build Custom Internal Tools (The Level 3 Leap)
**What:** Use Cursor/Claude Code to build bespoke marketing tools — no engineering team needed.

**Examples from boringmarketer:**
- Custom analytics dashboards
- Content calendar automation
- Lead scoring systems
- Campaign performance trackers
- All built with natural language prompts in Cursor

**CEF.ai Application:**
- **Token Narrative Tracker** — Monitor CEF/CERE token mentions, sentiment, and narrative trends across CT
- **Community Health Dashboard** — Aggregate Discord, Telegram, Twitter engagement metrics
- **Developer Adoption Tracker** — Monitor GitHub activity, SDK downloads, integration deployments
- **Content Performance Hub** — Track which topics/formats drive the most engagement and conversions
- **Airdrop/Campaign Manager** — Automate eligibility checks, distribution tracking, community rewards

---

### 9. Rapid Experimentation: 100 Experiments > 1 Perfect Campaign
**What:** Use AI speed to run massive numbers of marketing experiments simultaneously.

**The mindset shift:**
- Traditional: spend 2 weeks crafting 1 campaign, hope it works
- Vibe marketing: launch 20 variations in 2 days, measure, double down on winners

**CEF.ai Application:**
- Test 20 different positioning angles simultaneously (data infrastructure, AI enabler, enterprise blockchain, creator economy backbone)
- A/B test ad copy at scale — generate 50 variations, run micro-budgets, identify winners
- Experiment with content formats: technical deep-dives vs. simplified explainers vs. meme-driven vs. narrative threads
- Test community engagement tactics: AMAs, build-in-public, developer spotlights, token utility showcases
- **Track everything.** Let AI analyze results and recommend next experiments.

---

### 10. The "One Marketer = One Department" Operating Model
**What:** Structure your marketing operation so one person with AI tools outputs more than a traditional 5-person team.

**Weekly operating rhythm:**
| Day | Focus | AI-Powered Activity |
|-----|-------|-------------------|
| Monday | Strategy & Planning | AI analyzes last week's data → generates priorities |
| Tuesday | Content Creation | AI drafts all content from research insights |
| Wednesday | Distribution | Automated publishing + social repurposing |
| Thursday | Community & Engagement | AI monitors conversations, surfaces reply opportunities |
| Friday | Analysis & Optimization | AI generates performance report + next week's recommendations |

**CEF.ai Application:**
- One marketing lead operates entire content + growth engine
- n8n handles: social scheduling, content repurposing, competitor monitoring, community alerts
- Cursor/Claude Code handles: landing pages, campaign tools, analytics dashboards
- AI copilot handles: drafting, research, analysis, optimization recommendations
- Human handles: strategy, positioning, partnerships, brand voice, community relationships

---

## 🛠 Recommended Tool Stack for CEF.ai

| Category | Tool | Purpose |
|----------|------|---------|
| AI Coding | **Cursor** | Build landing pages, tools, automations |
| AI Assistant | **Claude Code** | Terminal-based AI for complex implementations |
| Workflow Automation | **n8n** (self-hosted) | Connect all tools, automate repetitive flows |
| AI Copilot | **Claude / ChatGPT** | Drafting, research, analysis |
| MCPs | **FireCrawl, Perplexity, SEO data** | Live data connections for AI |
| Deployment | **Vercel** | Fast deployment of programmatic pages |
| Social | **Buffer / Typefully** | Social scheduling and analytics |
| Research | **Perplexity** | Real-time market/competitor research |
| Design | **Midjourney / Ideogram** | Visual content generation |
| Analytics | **Custom dashboards (built in Cursor)** | Tailored crypto marketing metrics |

---

## 🎯 Quick-Start: First Week Action Plan for CEF.ai

### Day 1-2: Foundation
- [ ] Set up Cursor + Claude Code on your machine
- [ ] Install key MCPs (FireCrawl, Perplexity)
- [ ] Create brand voice document for AI (CEF.ai tone, terminology, positioning)
- [ ] Set up n8n (self-hosted or cloud)

### Day 3-4: First Workflows
- [ ] Build Reddit/Twitter monitoring workflow for crypto keywords
- [ ] Create content repurposing pipeline (1 blog → 5 platform variants)
- [ ] Set up competitor monitoring for top 5 competitors

### Day 5-7: First Programmatic Content
- [ ] Use Cursor to build 5 comparison pages (CEF.ai vs competitors)
- [ ] Deploy to Vercel
- [ ] Set up automated social distribution for new content
- [ ] Review first batch of competitor intelligence data

### Week 2+: Scale
- [ ] Expand to 50+ programmatic pages
- [ ] Build custom analytics dashboard
- [ ] Launch first round of rapid experiments (20 content variations)
- [ ] Establish weekly operating rhythm

---

## 💡 Crypto/Web3-Specific Considerations

1. **Community is king** — Crypto marketing lives and dies by community. AI handles the grunt work so you can spend MORE time in genuine community interaction, not less.

2. **Narrative cycles matter** — Crypto moves in narrative waves. Use AI monitoring to catch narratives early (AI x Crypto, DePIN, Real World Assets) and position CEF.ai accordingly.

3. **Developer marketing is critical** — For infrastructure projects like Cere/CEF.ai, developer adoption drives everything. Programmatic SEO for developer queries is high-ROI.

4. **Regulatory awareness** — AI-generated content about tokens needs human review for compliance. Never auto-publish token price/investment content.

5. **Anti-slop imperative** — Crypto Twitter has a low tolerance for AI-generated garbage. Quality control and authentic voice are non-negotiable. Use AI for speed and scale, but keep the human filter strong.

---

## 📊 Expected Outcomes (90-Day Horizon)

| Metric | Target | How |
|--------|--------|-----|
| Organic search traffic | 10x increase | Programmatic SEO (500+ pages) |
| Content output | 5x increase | AI drafting + auto-repurposing |
| Competitor response time | <24 hours | Automated monitoring + AI analysis |
| LLM brand mentions | Top 3 in category | Structured content optimization |
| Community engagement | 2x increase | More time for genuine interaction (less time on execution) |
| Marketing team size needed | 1-2 people | AI + automation handling 70-85% of execution |

---

*Playbook compiled: January 2026*
*Sources: @boringmarketer / The Vibe Marketer / thevibemarketer.com / Boring Marketing*
*Applied context: Cere Network / CEF.ai — Decentralized Data Infrastructure*
