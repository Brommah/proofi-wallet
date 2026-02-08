# X Ads Campaign Launch Guide — Step by Step
> For Mart | Generated: 2026-01-29
> Account: @cereofficial | Ad Credits: €1700+

---

## Quick Start: Launch the First Campaign

The AI Lead Engineer campaign is already in **Draft** in X Ads Manager.

### Step 1: Fix the Image
The current ad uses an old branded Cere image with text. Replace it:

1. Go to [X Ads Manager → Campaigns](https://ads.x.com/campaign_form/18ce55llagh/)
2. Click "AI Lead Engineer - Outbound Jan 2026"
3. Go to Ad Group → Ad 1
4. Under "Single media" → click the current image → Delete
5. Upload: `assets/x-ad-ai-engineer-creative.png` (1200×628px, dark network visual)

### Step 2: Verify the URL
The Website URL should be: `https://cere.network/career`
- **NOT** `/careers` (404!)
- If it still says `/careers`, change it to `/career`

### Step 3: Set Budget
- Daily budget: €50-100/day for testing (you have €860+ expiring Feb 7)
- Or total campaign budget: €500 for 2-week test
- Bid type: Auto bid (let X optimize)

### Step 4: Review Targeting
Already configured:
- ✅ Follower look-alikes: @huggingface, @OpenAI, @AnthropicAI, @LangChainAI
- ✅ Locations: EU + SF Bay Area
- Check: does it look right?

### Step 5: Launch
Click "Launch Campaign" 🚀

---

## Create the Other 4 Campaigns

For each role, create a new campaign with:

### Campaign 2: Principal Software Engineer
**Tweet copy** (use Variation A):
```
hot take: the best infrastructure engineers alive right now aren't at FAANG. they're at places where "figure it out" is the entire job description. rust, go, distributed systems, no training wheels. that's where the craft lives.
```

**Card headline:** `Build the decentralized data cloud from the ground up`
**Website URL:** `https://cere.network/career`
**Image:** `assets/x-ad-principal-swe-creative.png`
**Targeting keywords:** distributed systems, Rust programming, Go programming, cloud native, infrastructure engineer
**Follower look-alikes:** @jonhoo (Rust), @kelaboratory (Bryan Cantrill), tokio project

---

### Campaign 3: Blockchain Engineer
**Tweet copy** (use Variation C — shortest, punchiest):
```
substrate. solidity. L1/L2. building a decentralized data cloud — not another DeFi fork. if that distinction matters to you, check this out 👀
```

**Card headline:** `Smart contracts & L1/L2 infra for decentralized data`
**Website URL:** `https://cere.network/career`
**Image:** `assets/x-ad-blockchain-eng-creative.png`
**Targeting keywords:** blockchain developer, Substrate framework, Polkadot developer, Solidity developer, smart contracts, Web3 developer
**Follower look-alikes:** @gavofyork (Gavin Wood), @Polkadot, @OpenZeppelin, @paradigm

---

### Campaign 4: Founder's Associate
**Tweet copy** (use Variation B):
```
what if instead of climbing a corporate ladder for 10 years, you spent 2 years working directly with a SV-veteran CEO on strategy, ops, and BD at a web3 company scaling globally? that path exists rn. just saying 🤷
```

**Card headline:** `Work directly with a Silicon Valley veteran CEO`
**Website URL:** `https://cere.network/career`
**Image:** `assets/x-ad-founders-associate-creative.png`
**Targeting keywords:** Web3 strategy, crypto startup, startup operations, chief of staff startup, business development crypto
**Follower look-alikes:** @BanklessHQ, @MessariCrypto, @a16zcrypto

---

### Campaign 5: AI Innovator
**Tweet copy** (use Variation C):
```
shipped production AI? bored of incremental improvements? high ceiling, zero bureaucracy, real problems. this might be your move 👀
```

**Card headline:** `Ship production AI — concept to deployment, no ceiling`
**Website URL:** `https://cere.network/career`
**Image:** `assets/x-ad-ai-innovator-creative.png`
**Targeting keywords:** artificial intelligence, machine learning, large language models, AI startup founder, MLOps
**Follower look-alikes:** @karpathy, @ylecun, @svpino, @swyx

---

## A/B Testing Strategy

For each campaign, create **3 ads** (one per variation A/B/C) within the same ad group.
X will automatically optimize towards the best performer.

After 3 days:
- Check which variation has best CTR
- Pause the lowest performer
- After 7 days: pause the second lowest
- Scale the winner

## Budget Split (suggested)

| Campaign | Daily Budget | Notes |
|----------|-------------|-------|
| AI Lead Engineer | €30/day | Existing draft, ready to launch |
| Principal SWE | €20/day | |
| Blockchain Engineer | €15/day | Smaller audience |
| Founder's Associate | €15/day | Non-tech audience |
| AI Innovator | €20/day | |
| **Total** | **€100/day** | ~€700/week, fits within ad credits |

## Key URLs Reference

### 🎯 BEST OPTION: Use Tracked Redirect URLs
These go through our Railway service and log every click with source tracking:

| Role | Tracked URL (use in ads!) | Status |
|------|--------------------------|--------|
| AI Lead Engineer | `https://hr-funnel-monitor-production.up.railway.app/apply/ai-lead-engineer?src=x-campaign` | ✅ 302 → Join.com |
| Principal SWE | `https://hr-funnel-monitor-production.up.railway.app/apply/principal-software-engineer?src=x-campaign` | ✅ 302 → Join.com |
| Blockchain Engineer | `https://hr-funnel-monitor-production.up.railway.app/apply/blockchain-engineer?src=x-campaign` | ✅ 302 → Join.com |
| Founder's Associate | `https://hr-funnel-monitor-production.up.railway.app/apply/founders-associate?src=x-campaign` | ✅ 302 → Join.com |

> **Why tracked URLs?** We log every click and can match it to applications. This tells us exactly how many X ad clicks → actual applications.

### Fallback URLs (no tracking)
| What | URL | Status |
|------|-----|--------|
| Career page | https://cere.network/career | ✅ Working |
| ~~Career page~~ | ~~https://cere.network/careers~~ | ❌ 404! |
| Join.com | https://join.com/companies/cefai | ✅ Working |
| ~~Lever~~ | ~~https://jobs.lever.co/cere-network~~ | ❌ DEAD |

## All Assets Location

```
assets/
├── x-ad-ai-engineer-creative.png      (1200×628, AI Engineer)
├── x-ad-principal-swe-creative.png     (1200×628, Principal SWE)
├── x-ad-blockchain-eng-creative.png    (1200×628, Blockchain Eng)
├── x-ad-founders-associate-creative.png (1200×628, Founder's Assoc)
└── x-ad-ai-innovator-creative.png      (1200×628, AI Innovator)

reports/
├── x-campaign-all-roles-copy.md        (all 15 tweets + headlines)
├── x-campaign-ai-roles.md              (original strategy doc)
├── sourcing-strategy-all-roles.md      (GitHub repos, keywords, look-alikes)
├── launch-readiness.md                 (full audit)
└── x-ads-launch-guide.md              (this file)
```
