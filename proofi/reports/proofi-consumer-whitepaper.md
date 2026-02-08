# Proofi — Own Your Identity

### A Consumer Whitepaper

**Version 1.0 — February 2026**

*Verified credentials. No middleman.*

---

## Table of Contents

1. [The Problem: Your Identity Isn't Yours](#1-the-problem-your-identity-isnt-yours)
2. [The Proofi Solution](#2-the-proofi-solution)
3. [How It Works](#3-how-it-works)
4. [Use Cases](#4-use-cases)
5. [Technology Overview](#5-technology-overview)
6. [Competitive Landscape](#6-competitive-landscape)
7. [Vision & Roadmap](#7-vision--roadmap)
8. [Conclusion](#8-conclusion)

---

## 1. The Problem: Your Identity Isn't Yours

### You built your reputation. A corporation owns it.

Every diploma you earned, every job you held, every certification you passed — they all live on platforms you don't control. LinkedIn holds your professional history. Your university's server holds your degree records. Your employer's HR system holds your performance history.

You created all of it. You own none of it.

This creates three systemic failures that affect every working professional on the planet.

### 1.1 Platform Lock-In

LinkedIn has over one billion registered users and generates $17 billion in annual revenue. But LinkedIn's customers aren't its users — they're recruiters who pay up to $10,000 per seat per year to search through your data, and advertisers who buy access to your professional graph.

You are the product, not the customer.

If LinkedIn changes its algorithm, your visibility disappears. If LinkedIn shuts down, your professional history vanishes. If LinkedIn decides to ban your account — for any reason, or no reason — decades of professional reputation go with it. You have no export, no portability, no recourse.

The same is true for every centralized platform that holds your credentials. Your university could lose your records in a server crash. Your former employer could be acquired, dissolved, or simply stop responding to verification requests.

Your professional identity is distributed across dozens of systems you can't access, can't control, and can't take with you.

### 1.2 Credential Fraud

In 2023, LinkedIn blocked over 121 million fake accounts. Their reported 99.65% catch rate still means approximately 424,000 fraudulent profiles slip through every year.

But fake accounts are only half the problem. The deeper issue is that **every credential on LinkedIn is self-reported**. Anyone can claim any degree, any job title, any certification. There is no verification layer. LinkedIn endorsements — where connections vouch for each other's skills — have been widely documented as meaningless. A marketing intern can endorse a brain surgeon for "Neurosurgery." No check. No validation. No consequence.

The result: an entire professional ecosystem built on trust that cannot be verified.

Background check companies like Sterling, HireRight, and Checkr exist specifically because platforms like LinkedIn can't be trusted. Employers pay $50 to $200 per candidate for manual verification that takes days or weeks. It's a $15 billion industry that exists solely because our credential infrastructure is broken.

### 1.3 Data Breaches and Privacy Failures

In June 2021, data from 700 million LinkedIn users — 92% of all accounts — was scraped and sold on the dark web. Email addresses, phone numbers, geolocation records, and professional details, all available for purchase. LinkedIn's response was to classify the incident as "scraping, not a breach" — a distinction without a difference for the people whose data was exposed.

This wasn't an isolated event. LinkedIn has suffered repeated large-scale data exposures, including a 2012 breach that eventually revealed 117 million compromised passwords.

The fundamental architecture is the problem: when one company stores the professional data of a billion people, that company becomes the single most valuable target on the internet. Every breach exposes everyone. And users have no ability to control what data is collected, how it's stored, or who it's shared with.

### The Core Failure

These aren't bugs. They're features of a system where a single corporation sits between you and your professional identity.

Platform lock-in exists because your data is their leverage. Credential fraud persists because verification would slow down the engagement metrics that drive advertising revenue. Breaches are inevitable because centralized data stores are irresistible targets.

The solution isn't a better platform. It's removing the platform as the middleman entirely.

---

## 2. The Proofi Solution

### Self-Sovereign Credentials on Decentralized Storage

Proofi is a decentralized identity and credential platform that puts you in control of your professional identity. Your credentials — diplomas, certifications, employment history, achievements — are stored on decentralized infrastructure that no single company, government, or intermediary can delete, modify, or hold hostage.

### Three Principles

**1. You own your data.**
Your credentials are stored in your personal Data Vault on decentralized infrastructure. Not on Proofi's servers. Not on anyone's servers. On a distributed network of 63+ independent storage nodes with 99.9% uptime. You hold the encryption keys. You decide who sees what. If Proofi as a company disappeared tomorrow, your credentials would remain exactly where they are — accessible, verifiable, and yours.

**2. Credentials are cryptographically verifiable.**
When a university issues you a diploma through Proofi, that credential is cryptographically signed by the university's verified wallet and anchored on a blockchain. It cannot be forged, altered, or fabricated. Anyone can verify it in milliseconds — without contacting the university, without a background check service, without waiting days. The credential speaks for itself.

**3. No crypto knowledge required.**
Proofi abstracts all blockchain complexity behind a familiar experience. You sign up with your email address and a 6-digit PIN. That's it. No seed phrases, no wallet extensions, no gas fees, no token purchases. The decentralized infrastructure works silently in the background. You interact with a clean, intuitive interface that feels like any modern web application.

### What Makes This Different

Previous attempts at decentralized credentials failed because they solved only one piece of the puzzle. A credential format without storage. A blockchain without economics. A standard without a product.

Proofi is built on a complete technology stack — the Cere Network and CEF architecture — that provides every layer needed to make decentralized credentials work at scale: trust anchoring, encrypted storage, real-time querying, automated verification, and sustainable economics.

This isn't a whitepaper project. The infrastructure is live on mainnet. The wallet is deployed. The SDK is available for any developer to integrate.

---

## 3. How It Works

### 3.1 Getting Started: 60-Second Onboarding

Setting up your Proofi identity takes less than a minute:

**Step 1: Enter your email address.**
No social logins, no third-party authentication, no data shared with Google or Apple.

**Step 2: Verify with a one-time code.**
A 6-digit verification code is sent to your email. Enter it to confirm your identity.

**Step 3: Create your PIN.**
Choose a 6-digit PIN that protects your credential vault. This PIN, combined with a unique cryptographic salt, generates your private keys entirely on your device. Your PIN never leaves your browser. The server never sees it.

**That's it.** You now have a self-custodial identity vault backed by enterprise-grade cryptography — without ever seeing a blockchain address, installing an extension, or understanding what "self-custodial" means.

### 3.2 Your Data Vault

Once onboarded, you have access to your personal Data Vault — a private, encrypted space on decentralized storage where all your credentials live.

Think of it as a digital safe deposit box, except:
- No bank holds the key — you do
- It's replicated across dozens of independent nodes worldwide
- It's available 24/7 with 99.9% uptime
- It costs a fraction of centralized cloud storage

Your Data Vault can hold:

| Credential Type | Examples |
|----------------|----------|
| **Education** | University degrees, course certificates, transcripts |
| **Professional** | Employment history, job titles, performance records |
| **Certifications** | AWS, Google Cloud, PMP, industry licenses |
| **Achievements** | Game achievements, hackathon wins, open-source contributions |
| **Personal** | Notes, memos, documents you want to store permanently |

Every item in your vault is encrypted by default. Only you can see it. You choose what to share, with whom, and for how long.

### 3.3 How Credentials Get Verified

Proofi supports two paths to verified credentials:

**Issuer-Verified Credentials**
An organization — a university, an employer, a certification body — reviews your claim and issues a cryptographically signed credential directly to your vault. This is the gold standard. The credential carries the issuer's digital signature, anchored on-chain, and can be instantly verified by anyone.

*Example: You claim you graduated from TU Delft in 2020. TU Delft's verification agent reviews the claim against their records, confirms it, and issues a signed credential to your vault. Any recruiter can now verify your degree in milliseconds — without contacting TU Delft, without a background check service, without waiting.*

**Self-Attested Credentials**
You can also store credentials that haven't been verified by an issuer yet — personal notes, game achievements from integrated apps, or professional claims awaiting verification. These are clearly marked as self-attested rather than issuer-verified. They still live in your encrypted vault and can be upgraded to verified status when an issuer confirms them.

### 3.4 Selective Disclosure: Share Only What's Needed

Traditional credential sharing is all-or-nothing. Send your transcript, and the recipient sees everything — every grade, every course, every semester.

Proofi enables **field-level selective disclosure**. You control exactly which parts of a credential are visible:

- Share that you have a Computer Science degree **without** revealing your GPA
- Confirm your employment at a company **without** disclosing your salary
- Prove you hold an AWS certification **without** revealing when you earned it
- Verify your age is above 18 **without** sharing your date of birth

This is made possible by field-level encryption — each piece of data within a credential is encrypted independently. You can unlock individual fields for specific recipients without exposing the rest.

### 3.5 How Verification Works (For the Recipient)

When a recruiter, employer, or any third party wants to verify your credentials:

1. You share a verification link or approve a request
2. The recipient sees only the fields you've authorized
3. They can independently verify:
   - **Who issued it** — the issuer's cryptographic signature
   - **When it was issued** — the blockchain timestamp
   - **That it hasn't been tampered with** — the content ID mathematically proves integrity
   - **That it hasn't been revoked** — the on-chain revocation registry

This entire verification takes milliseconds and costs a fraction of a cent. No phone calls. No PDF attachments. No waiting for HR departments to respond.

---

## 4. Use Cases

### 4.1 Job Applications

**Today:** You apply for a job. You list your credentials on a resume. The employer pays $50–200 for a background check that takes 3–10 business days. The background check company calls your university, contacts former employers, and manually verifies each claim. Sometimes records are lost. Sometimes institutions don't respond. Sometimes the verification is incomplete.

**With Proofi:** You share a verification link with your prospective employer. They instantly see your verified credentials — degrees, employment history, certifications — each cryptographically signed by the issuing institution. Verification takes seconds, costs fractions of a cent, and is mathematically provable. No intermediary. No delays. No $200 fees.

For job seekers, this means faster hiring. For employers, this means cheaper, more reliable screening. For the economy, this means the $15 billion background check industry gets compressed into a protocol.

### 4.2 Education Verification

**Today:** You graduated five years ago. Your university's records system has been migrated twice since then. You need an official transcript for a graduate school application. You submit a request, pay a fee, wait 2–4 weeks, and hope the mail doesn't lose it.

**With Proofi:** Your degree was issued as a verifiable credential the day you graduated. It lives in your Data Vault permanently. You share it with the graduate school in one click. They verify it instantly. If the university updates your credential (e.g., with honors added retroactively), the updated version appears in your vault automatically.

This is particularly transformative for international students and professionals who need credentials verified across borders — a process that currently involves apostilles, notarizations, and months of bureaucratic delay.

### 4.3 Gaming Achievements

**Today:** You've spent thousands of hours building achievements in games. Those achievements are locked inside each game's servers. If the game shuts down, your achievements vanish. They're not portable, not verifiable, and not yours.

**With Proofi:** Game developers integrate Proofi's lightweight SDK (a few lines of code). Your achievements — high scores, tournament wins, rare completions, speedrun records — are stored in your Data Vault as verifiable credentials. They persist even if the game disappears. You can showcase them across platforms, use them as proof of skill, or simply keep a permanent record of your gaming history.

Any game, any platform. One vault. Your achievements travel with you.

### 4.4 Professional Portfolio

**Today:** Your professional identity is scattered across LinkedIn, personal websites, GitHub, Behance, certification portals, and email attachments. There's no single, verifiable source of truth. Recruiters piece together fragments. Much of it is self-reported and unverifiable.

**With Proofi:** Your Data Vault becomes your portable professional portfolio. Every credential — verified and unverified — lives in one place. You share what's relevant for each context. A recruiter searching for your skill set can find you through verified credentials rather than keyword-stuffed profiles. Your portfolio is yours to maintain, yours to share, and yours to take with you — regardless of which platforms rise or fall.

### 4.5 Freelance and Gig Economy

Freelancers and gig workers face a unique challenge: their reputation is fragmented across Upwork, Fiverr, Toptal, and dozens of other platforms. Switching platforms means starting from zero.

With Proofi, client reviews and project completions become portable credentials. A five-star track record on one platform can be verified on another. Your reputation compounds across your career, not resets with each platform switch.

### 4.6 Healthcare and Licensing

Doctors, nurses, lawyers, and other licensed professionals must maintain up-to-date credentials that are frequently checked. Proofi enables instant verification of licenses, continuing education credits, and board certifications — reducing administrative burden for both professionals and institutions.

---

## 5. Technology Overview

Proofi is built on the Cere Network — a purpose-built decentralized infrastructure for data-intensive applications. This section explains the key technology layers in accessible terms.

### 5.1 The Trust Layer

At the foundation is a blockchain — a tamper-proof public ledger maintained by 50–70 independent validators worldwide. When a credential is issued, a cryptographic record is written to this ledger. This record proves:

- The credential existed at a specific time
- It was issued by a specific organization
- It hasn't been modified since issuance
- Whether it has been revoked

No single entity — not Proofi, not any government, not any corporation — can alter these records. The rules are enforced by code and consensus, not by trust in an institution.

### 5.2 Decentralized Storage (DDC)

Your credentials don't live on a traditional server. They're stored on the **Decentralized Data Cloud (DDC)** — a network of 63+ independent storage nodes distributed globally.

Key properties:

- **Always available:** 99.9% uptime, with data replicated across multiple nodes
- **Tamper-proof:** Every piece of data gets a unique Content ID (CID) — a mathematical fingerprint. If even one character changes, the CID changes. This means tampering is not just difficult, it's mathematically detectable.
- **Encrypted by default:** Your data is encrypted before it leaves your device using military-grade elliptic curve cryptography. Storage nodes can't read your credentials. They store encrypted blobs they can't decrypt.
- **Economically viable:** Storage costs approximately $0.01 per gigabyte per month — roughly one-seventh the cost of Amazon Web Services. This makes it feasible to store credentials for billions of users.

### 5.3 The Wallet

Your Proofi wallet is where your cryptographic keys live. But unlike cryptocurrency wallets that require you to manage 24-word seed phrases, Proofi's wallet works differently:

1. You provide your email and a 6-digit PIN
2. The system combines your PIN with a unique cryptographic salt to generate your private keys
3. This key generation happens entirely in your browser — the server never sees your PIN or your keys
4. The same email + PIN always generates the same keys, so you can access your vault from any device

This is called **self-custody**: you control the keys, but the experience feels as simple as logging into any website.

If you lose your PIN, your keys can be recovered through an encrypted backup process — no seed phrase required, no risk of permanent lockout.

### 5.4 The SDK: For Developers

Any application can integrate Proofi credentials with a lightweight JavaScript SDK:

```javascript
const proofi = new ProofiSDK();
const address = await proofi.connect();
```

That's it — two lines of code to connect a user's credential vault to any web application. The SDK handles wallet embedding, authentication, credential storage, and verification behind the scenes.

This means Proofi isn't a walled garden. It's an open protocol that any app — job boards, educational platforms, games, professional networks — can integrate. Your credentials become a portable layer across the entire internet.

### 5.5 Credential Economics

One of the key reasons previous decentralized identity projects failed was the lack of a sustainable economic model. Proofi solves this through an automated economic layer:

- **Issuing organizations** (universities, employers) earn tokens when their credentials are verified — making truth profitable
- **Verifiers** (recruiters, employers) pay micro-fees per verification — orders of magnitude cheaper than traditional background checks
- **Storage operators** earn for maintaining the decentralized infrastructure
- **Users** access and control their credentials for free — the system is subsidized by verification demand

Every operation generates a cryptographic receipt, and payments are distributed automatically by the protocol. No invoices. No intermediaries. No "who pays for this?" problem.

---

## 6. Competitive Landscape

### 6.1 Why Previous Attempts Failed

The decentralized credential space has a long history of failure. Understanding why is critical to understanding why Proofi is different.

| Project | What They Built | What Happened |
|---------|----------------|---------------|
| **Blockcerts** (MIT, 2016) | Blockchain-anchored academic credentials | Acquired by Hyland, effectively abandoned. No storage, no economics, no ecosystem. |
| **Sovrin Network** (2016) | A blockchain for self-sovereign identity | Laid off all staff in 2020. Never solved "who pays for this?" |
| **uPort** (ConsenSys, 2017) | Ethereum-based identity | Fragmented into three abandoned projects. $50 gas fees per operation. |
| **Microsoft ION** (2021) | DID network on Bitcoin | Microsoft quietly removed it. Retreated to centralized identifiers. |

**The pattern:** Every project tried to solve a full-stack problem with a single-layer fix. A credential format without storage. A blockchain without economics. A standard without a product. You can't replace an ecosystem with a feature.

### 6.2 Current Competitors

**LinkedIn** — The incumbent. $17 billion in revenue built on self-reported, unverifiable data. 121 million fake accounts blocked per year. 700 million users' data exposed. A business model that sells your professional identity to recruiters. LinkedIn doesn't verify truth — it monetizes engagement. Proofi doesn't compete with LinkedIn's social features; it makes LinkedIn's credential model obsolete.

**Dock.io / Truvera** — A Substrate-based credential platform that recently rebranded (a sign of searching for product-market fit). Single-layer solution with no decentralized storage, no real-time querying, no agent orchestration, and minimal adoption.

**Privado ID** (formerly Polygon ID) — Zero-knowledge proof verification, spun off from Polygon in 2024. Powerful privacy technology but no storage layer, no economic model, and requires crypto-native users. A component, not a platform.

**Worldcoin / World ID** — Proves you're a unique human via iris scanning. Banned in multiple countries for biometric data violations. Only solves proof-of-personhood — can't verify education, employment, or skills. Fundamentally different use case.

**Spruce ID** — W3C-compliant credential tools for government use cases. Centralized infrastructure despite decentralized standards. No consumer product, no economic model, no agent orchestration.

### 6.3 Why Proofi Is Different

The competitive analysis comes down to one insight: **no other project has the complete stack.**

| Capability | Proofi | LinkedIn | Dock/Truvera | Privado ID | Worldcoin |
|-----------|--------|----------|--------------|------------|-----------|
| Verifiable credentials | ✅ | ❌ | ✅ | ✅ | ❌ |
| Decentralized storage | ✅ | ❌ | ❌ | ❌ | ❌ |
| Encrypted selective disclosure | ✅ | ❌ | Partial | ✅ (ZK) | ❌ |
| Real-time credential search | ✅ | Partial | ❌ | ❌ | ❌ |
| Sustainable economics | ✅ | Ads+subs | Partial | ❌ | Token |
| No crypto knowledge needed | ✅ | ✅ | ❌ | ❌ | Partial |
| Developer SDK | ✅ | Partial | Partial | ✅ | Partial |
| Consumer-ready UX | ✅ | ✅ | ❌ | ❌ | Partial |

Competitors would need to build five or more layers of infrastructure to match what Proofi offers today. That's years of development and hundreds of millions in investment. The full stack is the moat.

---

## 7. Vision & Roadmap

### The Vision

A world where your professional identity belongs to you — truly, cryptographically, irrevocably.

Where a degree from any university on earth is instantly verifiable by any employer. Where switching jobs doesn't mean rebuilding your reputation from scratch. Where a fraudster can't fake a Columbia degree and steal millions because the absence of a verified credential is itself a signal.

Where the $15 billion background check industry is replaced by a protocol that verifies credentials in milliseconds for fractions of a cent. Where the power dynamic between platforms and users is permanently inverted.

Proofi isn't building a better LinkedIn. It's building the trust infrastructure that makes centralized professional networks unnecessary.

### Roadmap

#### Phase 1: Foundation (Q1 2026) — *Current*
- ✅ Self-custodial wallet with email + PIN onboarding
- ✅ Data Vault with credential and memo storage on DDC mainnet
- ✅ Lightweight SDK for third-party app integration
- ✅ Game achievement storage (first integration vertical)
- ✅ Decentralized credential index (no centralized database)
- 🔄 Founding article launch and early access signups

#### Phase 2: Verification Network (Q2–Q3 2026)
- Issuer onboarding: universities, certification bodies, and employers can issue verified credentials
- Organization verification agents: automated credential verification workflows
- Recruiter search: verified credential discovery across the network
- Mobile-responsive wallet experience
- App permission registry (OAuth-style consent for third-party access)

#### Phase 3: Ecosystem Growth (Q4 2026 — Q1 2027)
- Personal AI agents: automated credential management, verification request handling, privacy controls
- Zero-knowledge proofs: prove you meet criteria (e.g., "degree from a top-50 university") without revealing specifics
- Cross-chain credential portability
- Enterprise API for bulk credential verification
- Credential marketplace: monetize verification demand

#### Phase 4: Global Scale (2027+)
- International credential framework integration (Bologna Process, ECTS, professional licensing bodies)
- Government-issued credential support (digital IDs, licenses, permits)
- Decentralized reputation scoring based on verified credential history
- Full professional network features: verified job listings, credential-gated opportunities, peer verification
- Integration with major job platforms, educational institutions, and HR systems worldwide

### Community and Governance

Proofi is built on infrastructure governed by its token holders through on-chain governance — not by a board of directors, not by a single company. Protocol parameters, fee structures, and development priorities are decided by the community. This ensures that Proofi can never be captured by a single corporate interest the way LinkedIn was captured by Microsoft's advertising model.

---

## 8. Conclusion

### The Credential System Is Broken. Here's How We Fix It.

Today, your professional identity exists at the mercy of platforms that don't serve you. Your credentials are self-reported and unverifiable. Your data is centralized and vulnerable. Your reputation is locked inside walled gardens that extract value from your information while giving you no ownership, no portability, and no privacy.

This isn't a theoretical problem. It costs the global economy billions in fraud, verification overhead, and lost trust. It enables bad actors to fabricate credentials and steal millions. It forces every professional on earth to rebuild their reputation from scratch every time they switch platforms.

Proofi fixes this by removing the middleman entirely.

**Your credentials, issued and signed by the institutions that granted them.** Stored on decentralized infrastructure you control. Encrypted with keys only you hold. Selectively shareable at the field level. Instantly verifiable by anyone. Portable across every platform, every border, every context.

**No corporation between you and your identity.**

The infrastructure is live. The wallet is deployed. The SDK is open.

The era of self-reported credentials is ending. The era of verifiable, self-sovereign professional identity starts now.

---

**Get Started**

→ Visit [proofi.ai](https://proofi.ai) to join the early access list
→ Developers: integrate the SDK in minutes — documentation at proofi.ai/docs
→ Institutions: contact us about becoming an issuing organization

---

*Proofi is built on Cere Network's Decentralized Data Cloud (DDC) mainnet. For technical documentation, architecture details, and developer resources, visit [cere.network](https://cere.network).*

*This document is for informational purposes. Proofi is in active development. Features and timelines may evolve as the product matures.*

---

**© 2026 Proofi.ai — Verified credentials. No middleman.**
