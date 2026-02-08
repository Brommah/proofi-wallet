# Pricing Model Analysis for Infrastructure/Data Companies

*Research compiled January 2026*

---

## Table of Contents
1. [SaaS Pricing Models](#1-saas-pricing-models)
2. [Infrastructure Pricing Comparison](#2-infrastructure-pricing-comparison)
3. [Web3/Crypto Pricing Models](#3-web3crypto-pricing-models)
4. [What Works for Cere?](#4-what-works-for-cere)
5. [Competitive Pricing Comparison](#5-competitive-pricing-comparison)
6. [Recommendations](#6-recommendations)

---

## 1. SaaS Pricing Models

### Per-Seat Pricing

**How it works:** Charges based on number of users/seats accessing the software.

**Examples:**
- Salesforce: Per-user licensing with volume discounts
- Slack: Per-active-user pricing
- Traditional enterprise software (Microsoft 365, Zoom)

**Pros:**
- Predictable revenue per customer
- Easy to understand and budget
- Scales with team growth

**Cons:**
- ~40% of software companies still use this model but are shifting away
- Doesn't reflect actual value delivered
- Can discourage adoption within organizations
- Punishes growth (users hesitate to add team members)

**Trend:** Declining. Companies like Mixpanel have transitioned away from per-seat to usage-based models.

---

### Usage-Based Pricing

**How it works:** Charges based on actual consumption (API calls, compute, storage, data processed).

**Examples:**
- Snowflake: Credits consumed
- AWS/GCP/Azure: Compute hours, storage GB, data transfer
- Twilio: Per API call
- Stripe: Per transaction

**Pros:**
- 38% of SaaS companies now use usage-based billing
- Aligns cost with value delivered
- Lower barrier to entry (start small, pay more as you grow)
- Companies with UBP report stronger revenue growth
- Snowflake projected +$21M revenue in Q4 2023 from this model

**Cons:**
- Revenue can be unpredictable
- Customers may fear "bill shock"
- Complex to implement and communicate

**Best For:** Infrastructure, API-based services, data platforms

---

### Tiered Pricing

**How it works:** Multiple pricing levels with increasing features/limits at each tier.

**Examples:**
- Most SaaS companies (average 3.5 tiers)
- Good/Better/Best structure
- Free → Pro → Enterprise

**Common Structure:**
| Tier | Target | Typical Features |
|------|--------|------------------|
| Starter/Free | Individuals, exploration | Limited features, usage caps |
| Pro | SMBs, power users | More features, higher limits |
| Business | Growing teams | Collaboration, analytics |
| Enterprise | Large organizations | Custom, SLA, security, support |

**Pros:**
- Caters to different customer segments
- Clear upgrade path
- Industry standard (most widely adopted)

**Cons:**
- May leave money on the table
- Tier boundaries can feel arbitrary
- Analysis paralysis for customers

---

### Hybrid Pricing

**How it works:** Combines multiple models (e.g., per-seat + usage, tiered + overage fees).

**Examples:**
- HubSpot: Base platform fee + contacts-based pricing
- Chargebee: Platform fee ($599/mo) + 0.75% billing overage
- Snowflake: Subscription tier + consumption credits
- MongoDB Atlas: Base cluster price + storage/transfer usage

**Pros:**
- Captures value at multiple dimensions
- Flexible for diverse use cases
- Predictable base + growth upside

**Cons:**
- More complex to understand
- Harder to predict costs

**Trend:** Increasingly popular. ~80% of SaaS companies plan to leverage usage data to enhance pricing strategies.

---

## 2. Infrastructure Pricing Comparison

### Cloud Providers (AWS vs GCP vs Azure)

| Aspect | AWS | Azure | GCP |
|--------|-----|-------|-----|
| **Pricing Model** | Pay-as-you-go + Reserved | Pay-as-you-go + Reserved | Pay-as-you-go + Committed |
| **Billing Granularity** | Per-second (most services) | Per-minute/hour | Per-second |
| **Discount Programs** | Reserved Instances (up to 72%), Savings Plans, Spot | Reserved Instances (up to 72%), Hybrid Benefits | Committed Use (up to 57%), Sustained Use (automatic) |
| **Free Tier** | 12 months + always-free services | 12 months + always-free | $300 credit + always-free |
| **Price Stability** | Most dynamic (frequent changes) | ~0.76 price changes/month | ~0.35 price changes/month |
| **Market Position** | Broadest service range | Best for Microsoft stack | Competitive on compute, BigQuery |

**Key Insights:**
- GCP tends to be cheapest for compute-heavy workloads
- AWS Graviton instances dominate compute-optimized pricing
- Azure has highest memory instance costs
- All offer complex pricing calculators

---

### Snowflake

**Model:** Consumption-based using credits

| Component | Pricing |
|-----------|---------|
| **Compute (Virtual Warehouses)** | Per-second billing, measured in credits |
| **Storage** | ~$23-46/TB/month (varies by plan/region) |
| **Data Transfer** | $20-190/TB (depends on destination) |
| **Cloud Services** | Included up to 10% of compute; billed beyond |

**Credit Costs by Warehouse Size:**
| Size | Credits/Hour |
|------|--------------|
| X-Small | 1 |
| Small | 2 |
| Medium | 4 |
| Large | 8 |
| X-Large | 16 |
| 2X-Large | 32 |
| 6X-Large | 512 |

**Key Features:**
- Pay only while running (no idle charges)
- Auto-suspend/resume
- Pre-purchase discounts available
- Scales 512x from smallest to largest

---

### Databricks

**Model:** Databricks Units (DBU) + cloud infrastructure

| Component | Pricing Range |
|-----------|---------------|
| **DBU Cost** | $0.07-0.65+/DBU depending on tier |
| **Standard Plan** | Starts at $0.40/DBU for all-purpose |
| **Premium/Enterprise** | Higher per-DBU + additional features |
| **Serverless** | Multipliers apply (e.g., 2x for background jobs) |

**Plans:**
- **Standard:** Basic analytics, $0.40/DBU
- **Premium:** RBAC, audit logs
- **Enterprise:** Security, compliance features

**Key Insight:** Total cost = DBU charges + underlying cloud VM costs

---

### MongoDB Atlas

**Model:** Tiered instances + usage-based components

| Tier | RAM | vCPUs | Base Price |
|------|-----|-------|------------|
| M0 (Free) | Shared | Shared | Free |
| M2 | Shared | Shared | $9/mo |
| M5 | Shared | Shared | $25/mo |
| M10 | 2 GB | 2 | $0.08/hr (~$57/mo) |
| M20 | 4 GB | 2 | $0.20/hr (~$146/mo) |
| M50 | 32 GB | 8 | $2.00/hr (~$1,460/mo) |
| M700 | 768 GB | 96 | $33.26/hr (~$24,280/mo) |

**Additional Costs:**
- Data processed: $5/TB (SQL queries)
- Data transfer: Cloud provider rates
- Additional services (Search, Vector, Charts): Separate pricing

---

### Vercel

**Model:** Tiered plans + usage-based add-ons

| Plan | Price | Included |
|------|-------|----------|
| **Hobby** | Free | 1M edge requests, 100GB bandwidth |
| **Pro** | $20/user/mo | 10M requests, 1TB bandwidth |
| **Enterprise** | Custom | Custom limits, SLA |

**Key Usage Metrics:**
- Edge Requests: $2/1M after included
- Fast Data Transfer: $0.15/GB after included
- Serverless Functions: $0.60/1M invocations
- Image Optimization: $0.05/1K transformations

---

### Netlify

**Model:** Credit-based system

| Plan | Credits/Month | Price |
|------|---------------|-------|
| **Free** | 300 | $0 |
| **Personal** | 1,000 | $19/mo |
| **Pro** | 3,000/team | $25/user/mo |
| **Enterprise** | Custom | Custom |

**Credit Consumption:**
- Production deploy: 15 credits
- Bandwidth: 10 credits/GB
- Web requests: 3 credits/10K
- Compute: 5 credits/GB-hour

---

## 3. Web3/Crypto Pricing Models

### Token-Based Access

**How it works:** Users hold/stake tokens to access services or get discounts.

**Examples:**
- Filecoin (FIL): Pay miners in FIL for storage/retrieval
- Arweave (AR): One-time payment in AR for permanent storage
- Cere Network (CERE): Tokens power data cluster operations

**Pros:**
- Creates token utility and demand
- Aligns network participants economically
- Can offer discounts for token holders

**Cons:**
- Price volatility affects user costs
- Adds friction (need to acquire tokens)
- Regulatory uncertainty

---

### Staking Requirements

**How it works:** Users/providers stake tokens as collateral for service quality or access rights.

**Examples:**
- Filecoin: Miners stake FIL as collateral
- Cere: Validators and node operators stake CERE
- The Graph (GRT): Indexers stake for curation

**Pros:**
- Ensures skin-in-the-game
- Creates token lockup (supply reduction)
- Incentivizes good behavior

**Cons:**
- Capital intensive for providers
- Can create barriers to entry
- Slashing risks

---

### Pay-Per-Use with Tokens

**How it works:** Services priced in tokens, often with fiat equivalents.

**Comparison of Decentralized Storage:**

| Platform | Model | Cost | Duration |
|----------|-------|------|----------|
| **Filecoin** | Renewable contracts | ~$0.0001-0.001/GB/mo | Flexible terms |
| **Arweave** | One-time endowment | ~$18/GB (~$0.09/GB/yr over 200 years) | Permanent |
| **Storj** | Usage-based | $4/TB/mo storage, $7/TB/mo download | Monthly |
| **Sia** | Usage-based | Competitive, permissionless | Monthly |

**Key Insight:** 
- For short-term: Filecoin/Storj cheaper
- For 74+ year permanence: Arweave more economical
- Cere: Combines competitive storage with additional features (encryption, dCDN, multi-cluster)

---

## 4. What Works for Cere?

### Current Cere Model Analysis

**Cere's DDC (Decentralized Data Cloud) Features:**
- Multi-cluster topology
- Default user data encryption
- Easy node onboarding
- Mutable & immutable storage
- Integrated wallet solution
- dCDN (decentralized content delivery)
- Fully permissionless

**Token Economics:**
- CERE token powers network operations
- Validators serve as data cluster inspectors
- Node providers earn CERE for services
- Smart contract governance for clusters

**Competitive Advantages vs. Others:**

| Feature | Cere | Filecoin | Arweave | Storj |
|---------|------|----------|---------|-------|
| Multi-cluster topology | ✅ | ❌ | ❌ | ❌ |
| Default encryption | ✅ | ❌ | ❌ | ✅ |
| Easy node onboarding | ✅ | ❌ | ❌ | ✅ |
| Mutable storage | ✅ | ✅ | ❌ | ✅ |
| Immutable storage | ✅ | ✅ | ✅ | ✅ |
| Decentralized CDN | ✅ | ❌ | ❌ | ❌ |
| Integrated wallet | ✅ | ❌ | ✅ | ❌ |
| Fully permissionless | ✅ | ❌ | ❌ | ✅ |

---

### Pricing Page Best Practices

**1. Clarity & Simplicity**
- Use 3-4 tiers maximum (analysis paralysis with more)
- Name tiers to guide decisions (Starter, Pro, Enterprise)
- Show "most popular" badge to guide selection

**2. Transparency Options**
- **Full transparency:** Show all prices (best for self-serve, high velocity)
- **Partial transparency:** Show starter/pro, "Contact us" for enterprise
- **Request-based:** "Book a demo" for complex enterprise sales

**3. Self-Serve vs Enterprise**

| Aspect | Self-Serve | Enterprise |
|--------|------------|------------|
| **Pricing Display** | Full transparency | "Contact sales" |
| **Target** | Developers, SMBs | Large organizations |
| **Conversion** | Instant signup | Sales cycle |
| **Support** | Documentation, community | Dedicated, SLA |
| **Customization** | Standard packages | Custom contracts |

**4. Key Elements for Data Infrastructure Pricing Pages:**
- Usage calculator/estimator
- Clear metrics (GB, requests, compute hours)
- Free tier for exploration
- Comparison table with competitors
- ROI/cost savings vs. alternatives
- Case studies with real numbers

---

### Enterprise vs Self-Serve Strategy

**Self-Serve Motion (Recommended for Cere):**
- Free tier with generous limits for developers
- Usage-based pricing that scales
- Transparent pricing page
- Quick onboarding (sign up → deploy in minutes)
- Documentation-first support

**Enterprise Motion:**
- Dedicated sales for large deployments
- Custom pricing based on volume commitments
- SLA guarantees
- Compliance certifications (SOC2, GDPR)
- Dedicated support

**Hybrid Approach (Best for Cere):**
- Self-serve for developers and startups
- PLG (Product-Led Growth) to land-and-expand
- Sales assist for scaling accounts
- Enterprise sales for large contracts

---

## 5. Competitive Pricing Comparison

### Decentralized Data/Storage Market

| Provider | Storage Cost | Compute | CDN | Token |
|----------|--------------|---------|-----|-------|
| **Cere DDC** | Competitive | ✅ | ✅ | CERE |
| **Filecoin** | ~$0.0001/GB/mo | ❌ | ❌ | FIL |
| **Arweave** | ~$18/GB (permanent) | ❌ | ❌ | AR |
| **Storj** | $4/TB/mo | ❌ | ❌ | STORJ |
| **IPFS** | Varies (pinning services) | ❌ | ❌ | None |

### Centralized Cloud Comparison

| Provider | Object Storage | Compute (entry) | CDN |
|----------|---------------|-----------------|-----|
| **AWS S3** | $0.023/GB/mo | $0.0116/hr (t3.micro) | $0.085/GB |
| **GCP Cloud Storage** | $0.020/GB/mo | $0.0104/hr (e2-micro) | $0.08/GB |
| **Azure Blob** | $0.018/GB/mo | $0.0052/hr (B1ls) | $0.087/GB |

### Data Platforms (Snowflake/Databricks)

| Metric | Snowflake | Databricks |
|--------|-----------|------------|
| Entry price | ~$2-3/credit | ~$0.07-0.40/DBU |
| Storage | $23-46/TB/mo | Cloud rates |
| Typical SMB spend | $500-2,000/mo | $500-5,000/mo |
| Enterprise spend | $50K-500K+/yr | $50K-500K+/yr |

---

## 6. Recommendations for Cere

### Recommended Pricing Model: Hybrid Usage-Based + Tiered

**Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│  FREE TIER          │  PRO               │  ENTERPRISE         │
├─────────────────────┼────────────────────┼─────────────────────┤
│  - X GB storage     │  - Usage-based     │  - Volume discounts │
│  - Y requests/mo    │  - Priority CDN    │  - Custom SLA       │
│  - Basic dCDN       │  - Advanced APIs   │  - Dedicated support│
│  - Community support│  - Email support   │  - Compliance       │
│                     │                    │  - On-chain/off-chain│
│  $0                 │  Pay-as-you-go     │  Contact sales      │
└─────────────────────┴────────────────────┴─────────────────────┘
```

### Specific Recommendations

1. **Implement Usage-Based Core Pricing**
   - Storage: Price per GB/month (competitive with Storj ~$4/TB)
   - Bandwidth: Price per GB transferred
   - Compute/Operations: Price per request or compute unit
   - Consider CERE token discounts (10-20% for token payments)

2. **Create Developer-Friendly Free Tier**
   - Generous enough for real testing (5-10 GB storage)
   - No credit card required
   - Quick onboarding (under 5 minutes)

3. **Pricing Page Design**
   - Simple 3-tier structure (Free/Pro/Enterprise)
   - Interactive calculator for cost estimation
   - Comparison vs. AWS/Filecoin/Arweave
   - Transparent pricing with no hidden fees

4. **Token Integration Strategy**
   - Allow both fiat and CERE payments
   - Token holders get discounts or priority access
   - Staking tiers for node operators
   - Avoid forcing crypto-only (reduces adoption)

5. **Enterprise Features**
   - Custom contracts and SLAs
   - Compliance packages (GDPR, SOC2)
   - Volume discounts (committed use)
   - Dedicated cluster options

### Pricing Metrics to Consider

| Metric | Why It Works |
|--------|--------------|
| Storage (GB/TB) | Easy to understand, standard |
| Bandwidth (GB) | Aligns with CDN value |
| Requests/Operations | API-usage alignment |
| Compute time | For data processing features |

### What to Avoid

- ❌ Per-seat pricing (doesn't fit infrastructure)
- ❌ Complex tier structures (>4 tiers)
- ❌ Crypto-only payments (limits adoption)
- ❌ Hidden fees or surprise charges
- ❌ Annual-only contracts for self-serve

---

## Summary

For Cere's DDC, the optimal pricing model is:

1. **Usage-based pricing** for core services (storage, bandwidth, compute)
2. **Tiered packaging** (Free/Pro/Enterprise) for simplicity
3. **Token incentives** (discounts, staking rewards) without requiring crypto
4. **Self-serve first** with enterprise sales for large accounts
5. **Transparent pricing page** with calculator and competitor comparison

This approach:
- Aligns with industry trends (38%+ of SaaS moving to usage-based)
- Matches successful Web3 storage competitors
- Enables PLG growth while capturing enterprise deals
- Leverages CERE token without creating adoption friction

---

*Sources: Snowflake, Databricks, MongoDB, Vercel, Netlify, Filecoin, Arweave, Cere Network documentation, CoinGecko, CloudZero, industry reports*
