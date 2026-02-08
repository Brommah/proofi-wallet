# Proofi Wallet — Strategy, Agents & Ecosystem Blueprint

**Date:** February 4, 2026  
**Author:** Clawd (Strategy Agent — Opus)  
**Status:** Actionable — all proposals buildable on existing infrastructure  
**Context:** Proofi Wallet is LIVE — Railway API + Vercel UI, Cere Mainnet, DDC Bucket #1229

---

## Table of Contents

- [OUTPUT 1: Three Specialized Skill Agents](#output-1-three-specialized-skill-agents)
- [OUTPUT 2: Ten Real Concepts Leveraging Proofi Wallet](#output-2-ten-real-concepts-leveraging-proofi-wallet)
- [OUTPUT 3: Chrome Extension Spec — Proofi Ecosystem Hub](#output-3-chrome-extension-spec--proofi-ecosystem-hub)
- [Strategic Summary: The Flywheel](#strategic-summary-the-flywheel)

---

## OUTPUT 1: Three Specialized Skill Agents

These are practical AI agents that can be built as Clawdbot skills or standalone tools. Each directly accelerates Proofi development, testing, and visual quality.

---

### Agent 1: `proofi-qa` — DDC Integration Test Agent

**Purpose:** Automated end-to-end testing of every Proofi flow — from OTP auth through DDC storage, credential issuance, and wallet index consistency. Catches regressions before they hit production and validates the decentralized architecture stays truly decentralized.

**Specific Capabilities:**

| Capability | What It Does |
|---|---|
| **Auth Flow Testing** | Simulates full email OTP → PIN → key derivation flow against the live or local API. Verifies JWT issuance, signature auth headers (`X-Wallet-Address` + `X-Wallet-Signature`), and session restore. Tests both JWT and signature-based auth paths. |
| **DDC Read/Write Verification** | Stores memos and credentials to DDC Bucket #1229 via the API, then reads them back via CNS index lookup (`pi-{hash}`). Verifies data integrity, CID consistency, and that the wallet index JSON structure is valid. |
| **Wallet Index Integrity** | Reads the CNS entry for a test wallet, verifies the index JSON structure matches `{ items: [...], updated }`, adds an entry, re-reads to confirm append. Tests the "no database, DDC-only index" guarantee. |
| **Credential Lifecycle** | Issues a W3C Verifiable Credential, stores it on DDC, retrieves it, runs `sr25519Verify()` against the issuer's public key. Tests the full issue → store → retrieve → verify loop. |
| **Regression Snapshots** | Stores baseline API responses (GET `/health`, GET `/balance/:address`, GET `/ddc/list/:address`) and diffs against future runs. Detects breaking API changes, schema drift, and DDC connectivity issues. |
| **Load Simulation** | Fires concurrent memo stores (10, 50, 100 parallel requests) to test DDC client connection pooling, rate limits, and CNS update consistency under load. |
| **SDK Compatibility** | Tests both `ProofiSDK` (lightweight 5-line integration) and `@proofi/sdk` (full TypeScript SDK) against the API to ensure both paths work identically. |

**Codebase Interaction:**

```
proofi-wallet/
├── packages/
│   ├── api/          → Calls HTTP endpoints directly (same as any client)
│   │   └── src/
│   │       ├── routes/auth.ts       → Tests OTP send/verify/register flows
│   │       ├── routes/ddc.ts        → Tests memo store/list/credential endpoints
│   │       └── ddc/service.ts       → Validates DDC storage patterns match
│   ├── core/         → Imports KeyringManager for client-side key derivation
│   │   └── src/
│   │       └── keyring.ts           → Uses generateKeypairFromPin() for test wallets
│   ├── sdk/          → Tests ProofiWallet class integration
│   └── comm/         → Tests RpcChannel message passing (if iframe testing)
```

**Example Workflow:**

```
1.  Agent boots → reads packages/api/src/server.ts to discover all routes
2.  Calls POST /auth/otp/send with test email (test@proofi.qa)
3.  In dev mode, reads OTP from API console log (or uses configured test bypass)
4.  Calls POST /auth/otp/verify → receives JWT + derivationSalt
5.  Derives sr25519 keypair client-side: PBKDF2(PIN, derivationSalt) → seed → sr25519
6.  Calls POST /auth/register-address with signature auth header
7.  Stores a test memo via POST /ddc/memo → body: { content: "QA test memo #{timestamp}" }
8.  Reads wallet index via GET /ddc/list/{walletAddress}
9.  Verifies memo appears in index with correct CID and timestamp
10. Issues a test VC via POST /ddc/credential → verifies it round-trips through DDC
11. Runs signatureVerify() on the credential proof
12. Outputs: ✅ 11/11 tests passed, 0 regressions, DDC latency avg 1.2s
```

**Mobile UI Alignment:**
- Captures mobile viewport (375px) screenshots before/after each test run
- Flags any screen that takes >3 seconds to load on throttled 3G (important for mobile-first)
- Validates that all API responses are small enough for mobile data budgets (<50KB per response)

---

### Agent 2: `proofi-ux` — Visual QA & Mobile-First Design Agent

**Purpose:** Renders every Proofi UI screen, detects visual regressions, validates brand compliance, audits responsive behavior, and generates screenshot-based reports. This is the agent that ensures the wallet LOOKS right on every device.

**Specific Capabilities:**

| Capability | What It Does |
|---|---|
| **Screen Capture Pipeline** | Launches Proofi wallet UI (Vite dev server or Vercel production), navigates through all screens (Login → PIN → Account → DDC → Connect → Sign), captures pixel-perfect screenshots at each state |
| **Brand Compliance Checker** | Parses CSS against brand guide tokens — verifies accent color (`#3B82F6`), font stack (Space Grotesk → Inter → JetBrains Mono), spacing multiples of 8px, white/off-white backgrounds, border radius consistency |
| **Mobile-First Audit** | Captures each screen at 375px (iPhone SE), 390px (iPhone 14), 412px (Pixel 7), 768px (iPad), 1280px (desktop). Flags any layout breakage, overflow, or touch target under 44px |
| **Touch Target Validation** | Identifies all interactive elements and verifies minimum 44×44px touch area per Apple/Google HIG guidelines — critical for mobile-first |
| **Accessibility Scan** | Runs axe-core against each screen. Reports WCAG 2.1 AA violations: contrast ratios, missing labels, keyboard navigation, focus indicators |
| **Component Catalog** | Extracts all React components from `packages/ui/src/components/`, renders them in isolation with various props/states, generates a visual component library reference |
| **Pixel Diff Mode** | Compares current screenshots against baseline set, highlights pixel-level changes with bounding boxes and percentage change indicators |
| **Gesture Simulation** | Tests swipe, pull-to-refresh, and scroll behaviors in mobile viewports — validates that mobile interactions feel native |

**Codebase Interaction:**

```
proofi-wallet/
├── packages/
│   └── ui/
│       ├── src/
│       │   ├── screens/          → Navigates through each screen sequentially
│       │   │   ├── LoginScreen.tsx
│       │   │   ├── PinScreen.tsx
│       │   │   ├── AccountScreen.tsx
│       │   │   ├── DdcScreen.tsx
│       │   │   ├── ConnectScreen.tsx
│       │   │   └── SignScreen.tsx
│       │   ├── components/       → Renders each component in isolation
│       │   ├── stores/           → Mocks Zustand stores for isolated testing
│       │   └── index.css         → Validates CSS custom properties
│       └── brand-guide.md        → Reads for design token validation
```

**Example Workflow:**

```
1.  Agent starts Proofi UI dev server: cd packages/ui && pnpm dev
2.  Opens headless browser (Playwright) at http://localhost:5173
3.  LoginScreen (375px viewport):
    - Captures screenshot
    - Checks: email input uses Inter 16px, CTA button uses --accent (#3B82F6),
      border-radius matches brand guide, padding is 8px multiple
    - Touch target audit: login button is 48px tall ✅
4.  Enters test email → OTP → arrives at PinScreen
5.  PinScreen: verifies PIN dot indicators are 12px, keyboard layout is correct,
    numpad buttons are 56×56px minimum
6.  Navigates to AccountScreen: balance uses JetBrains Mono,
    QR code renders at correct resolution, Send/Receive buttons pass touch audit
7.  Navigates to DdcScreen: "Data Vault" label styling, memo list scroll behavior
8.  Resizes: 390px, 412px, 768px, 1280px — captures all screens at each breakpoint
9.  Runs axe-core on each page at each viewport
10. Generates diff against last baseline
11. Report: 2 brand violations (button letter-spacing 0.5px off), 1 a11y issue
    (missing aria-label on QR code), 0 layout breaks, all touch targets pass
```

**Mobile UI Alignment — this is the agent's core value:**
- Ensures every screen works perfectly at 375px before anything else
- Validates safe area insets for notched phones (padding-top for status bar)
- Tests with iOS Safari and Chrome Android viewports (different rendering)
- Generates a "Mobile Readiness Score" (0-100) per screen
- Produces before/after comparison images for every change

---

### Agent 3: `proofi-sim` — Ecosystem Simulation Agent

**Purpose:** Simulates realistic multi-actor scenarios — universities issuing credentials, employers verifying them, freelancers building reputation, events issuing attendance proofs — to validate the ecosystem works end-to-end before real partners onboard. This agent proves the 10 ecosystem concepts (Output 2) are actually buildable.

**Specific Capabilities:**

| Capability | What It Does |
|---|---|
| **Actor System** | Creates and manages multiple simulated Proofi wallets with distinct roles: issuer, holder, verifier. Each actor has a real sr25519 keypair derived through the normal auth flow |
| **Credential Lifecycle** | Full credential lifecycle: issuance → DDC storage → retrieval → verification → revocation → re-verification (should fail). Tests every state transition |
| **Multi-Concept Testing** | Dedicated simulation scripts for each of the 10 ecosystem concepts — e.g., "ProofiDegree scenario" issues 5 diplomas from 3 universities to 5 students, then has 2 employers verify them |
| **Throughput Testing** | Simulates 100 users × 5 credentials each = 500 DDC operations. Measures latency percentiles (p50, p95, p99), index growth rate, and CNS resolution time |
| **Economics Calculator** | Tracks exact CERE token consumption per operation type: memo store (~0.12 CERE), credential issue (~0.15 CERE), index update (~0.08 CERE). Projects costs at 1K, 10K, 100K users |
| **Chaos Testing** | Injects random failures: DDC timeout, invalid signature, expired JWT, wrong PIN, concurrent writes to same index. Validates every error path returns sensible errors |
| **Interoperability Testing** | Tests credential exchange between actors who authenticated via different methods (email OTP vs future social login), verifying cross-origin credential validity |
| **Report Generation** | Produces rich simulation reports with latency histograms, success rates, token consumption breakdowns, and "ecosystem readiness scores" per concept |

**Codebase Interaction:**

```
proofi-wallet/
├── packages/
│   ├── api/          → All actor operations go through HTTP API endpoints
│   │   └── src/
│   │       ├── routes/auth.ts    → Actor registration
│   │       ├── routes/ddc.ts     → Credential issuance and retrieval
│   │       └── ddc/service.ts    → Validates storage patterns
│   ├── core/         → KeyringManager creates actor keypairs
│   │   └── src/
│   │       └── keyring.ts        → Multiple keypair derivation
│   └── sdk/          → Tests SDK integration from "host app" perspective
│
│   @polkadot/api    → Monitors Cere chain for transaction confirmation
│   @cere-ddc-sdk    → Direct DDC reads for verification (bypass API)
```

**Example Workflow — "ProofiDegree" Scenario:**

```
1.  Agent creates 3 actors:
    - University of Amsterdam (issuer, email: uva@sim.proofi.ai)
    - Acme Corp (verifier, email: acme@sim.proofi.ai)
    - Alice (holder, email: alice@sim.proofi.ai)
2.  Each actor: POST /auth/otp/send → verify → register-address
3.  University issues W3C VC:
    {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      "type": ["VerifiableCredential", "UniversityDegreeCredential"],
      "issuer": "did:cere:5Fhq...rT9",
      "credentialSubject": {
        "id": "did:cere:5Gn8...kR4j",
        "degree": { "type": "BachelorDegree", "name": "BSc Computer Science" }
      },
      "proof": { "type": "Sr25519Signature2020", ... }
    }
4.  Credential stored in Alice's DDC wallet index
5.  Acme Corp fetches Alice's public credential list
6.  Acme Corp runs sr25519Verify() on credential proof
7.  Verification: ✅ Signature valid, issuer key matches UvA's registered address
8.  Measurements: issuance 1.8s, storage 2.1s, index update 0.9s, verification 0.3s
9.  Scale test: 50 concurrent issuances → all succeed, avg latency 2.4s
10. Token cost: 12.5 CERE for 50 full credential lifecycles
11. Report saved to proofi/reports/sim-proofi-degree-{date}.json
```

**Mobile UI Alignment:**
- Generates mock data that populates the wallet UI for screenshot testing (feeds into `proofi-ux`)
- Simulates the exact data shapes that the mobile UI will render: credential cards, memo lists, activity feeds
- Tests that DDC response sizes stay under mobile-friendly limits at scale

---

## OUTPUT 2: Ten Real Concepts Leveraging Proofi Wallet

Each concept is buildable NOW with the existing Proofi infrastructure: email OTP auth → sr25519 wallet → DDC storage (Bucket #1229) → W3C Verifiable Credentials → on-chain anchoring.

---

### 1. ProofiDegree — Tamper-Proof University Diplomas

**One-liner:** Universities issue blockchain-verified diplomas that graduates carry forever in their Proofi wallet — verified in 2 seconds, not 2 weeks.

**How it uses Proofi:**
- **Wallet:** University registers as an issuer (email OTP → sr25519 keypair). Their public key becomes a trusted issuer DID (`did:cere:{address}`). Graduate creates a holder wallet.
- **DDC:** The W3C VC (diploma) stored as JSON-LD in DDC Bucket #1229 under the graduate's wallet index. University's issuer credentials stored in their own DDC index for discoverability.
- **Chain:** Credential hash anchored on Cere chain via DDC write transaction. Issuer's DID resolves to their on-chain sr25519 public key. Timestamp is immutable.

**Target Market:** 250,000+ universities worldwide, 500M+ graduates, employers (instant verification eliminates $15B background check industry)

**Wow Factor:** An employer scans a QR code → credential resolves from DDC in <2 seconds → `sr25519Verify()` proves authenticity without ever contacting the university. No background check company. No 3-week wait. The graduate OWNS their diploma forever — even if the university closes.

**Build Effort:** 2-3 weeks (issuer portal + verifier page + credential template)

---

### 2. ProofiBadge — Living Skill Credentials

**One-liner:** Course platforms issue skill badges that evolve as learners progress — a living, growing credential portfolio, not static PNGs.

**How it uses Proofi:**
- **Wallet:** Course platform (bootcamp, Coursera, internal training) has an issuer wallet. Students authenticate with email → get Proofi wallets instantly.
- **DDC:** Each badge is a VC stored in the student's DDC index. As modules complete, new VCs are issued (v1: "React Basics" → v2: "React + TypeScript" → v3: "Full Stack React"). All versions remain in DDC — showing progression over time.
- **Chain:** Each badge issuance is a DDC write with a new CID. The wallet index always reflects the latest state.

**Target Market:** Online education ($400B market), corporate L&D ($380B), bootcamp graduates proving skills to employers

**Wow Factor:** A developer's Proofi wallet shows an animated skill tree — badges light up as they're earned, each one clickable to reveal the full VC with issuer signature, completion date, and score. Not a self-reported LinkedIn skill — a cryptographic proof from the actual course platform. Employers see real verified skills, not keyword-stuffed profiles.

**Build Effort:** 2 weeks (badge issuer API + portfolio view component)

---

### 3. ProofiGig — Portable Freelancer Reputation

**One-liner:** Freelancers collect verified work completions across clients and platforms into one portable, cryptographically-proven reputation wallet.

**How it uses Proofi:**
- **Wallet:** Freelancer authenticates with email → gets Proofi wallet. Each client who signs off on completed work issues a "work completion credential" from their own wallet.
- **DDC:** After a gig, the client issues a VC containing: scope, deliverables, dates, rating, budget range, and a written review. Stored in the freelancer's DDC vault. The freelancer controls visibility — can make reviews public or keep them private.
- **Chain:** Total credential count is derivable from the public index. An aggregate reputation score can be computed by any verifier without trusting a central platform.

**Target Market:** 1.57 billion freelancers worldwide, platforms (Fiverr, Upwork, Toptal), direct enterprise clients

**Wow Factor:** A freelancer sends a Proofi profile link to a potential client. The client sees 47 verified work completions, each signed by the actual client company's sr25519 key. Not self-reported reviews — cryptographic proof of delivery. The freelancer leaves Upwork, takes their entire reputation with them. Platform lock-in: destroyed.

**Build Effort:** 3 weeks (client credential issuance flow + reputation aggregation view)

---

### 4. ProofiHealth — Patient-Owned Medical Records

**One-liner:** Patients store verified vaccination records, lab results, and prescriptions in their encrypted Proofi vault — share on their terms, not the hospital's.

**How it uses Proofi:**
- **Wallet:** Patient creates Proofi wallet (email + PIN). Healthcare provider operates an issuer wallet with a verified medical authority DID.
- **DDC:** Medical credentials (vaccination cert, lab results, prescriptions) stored as encrypted VCs in the patient's DDC vault. Encryption uses the patient's sr25519 key — only they can decrypt. Time-limited access tokens generated for sharing with specific doctors/insurers.
- **Chain:** Credential existence provable on-chain without revealing contents. The hash is public; the data is private.

**Target Market:** Healthcare ($12T global market), travelers (vaccine passports), insurance (instant claims verification)

**Wow Factor:** Traveling internationally? Open Proofi → share vaccination QR → border control verifies in 2 seconds. Switching doctors? Grant new provider time-limited access to your full history via a Proofi share link. No faxes. No "we'll request your records." YOU are the source of truth for YOUR health data.

**Build Effort:** 4 weeks (encryption layer + access control + medical VC templates)

---

### 5. ProofiDAO — Governance Identity Credentials

**One-liner:** DAOs issue membership, roles, and voting history credentials that members carry across the entire web3 governance ecosystem.

**How it uses Proofi:**
- **Wallet:** DAO creates an organizational Proofi wallet. Members authenticate via email → get personal wallets. No MetaMask required — email OTP makes DAO participation accessible to non-crypto-natives.
- **DDC:** Role credentials ("Core Contributor since March 2025"), voting history VCs, and proposal authorship records stored in each member's DDC index. The DAO's issuer key signs each credential.
- **Chain:** Proofi wallet's sr25519 key can sign governance votes directly. Same key for identity AND voting — no fragmented identity.

**Target Market:** 13,000+ active DAOs, web3 communities, open source governance (Apache, Linux Foundation), cooperative organizations

**Wow Factor:** A DAO contributor's Proofi wallet shows: "Core Contributor since 2025, 142 governance votes cast, 23 proposals authored, trusted by 3 DAOs." When joining a new DAO, they carry their entire governance reputation. New DAOs can set entry criteria: "Must hold 3+ verified contributor credentials." This is **portable governance identity** — it doesn't exist yet.

**Build Effort:** 3 weeks (DAO issuer tools + governance credential templates + cross-DAO discovery)

---

### 6. ProofiEvent — Verified Attendance & Networking Graph

**One-liner:** Conference attendees get cryptographic proof of attendance and build a verified networking graph — every connection is mutual and provable.

**How it uses Proofi:**
- **Wallet:** Event organizer creates an issuer wallet. Attendees create (or already have) Proofi wallets. Check-in via QR scan at the venue.
- **DDC:** Attendance credentials issued per event (with track/session metadata). When two attendees tap phones or scan QR codes to exchange contacts, both wallets store a signed "connection credential" — mutual cryptographic proof they met. Session-specific credentials prove which talks they attended.
- **Chain:** Attendance credential functions as a soulbound proof-of-presence anchored on Cere chain.

**Target Market:** $1.5T events industry, tech conferences (Web Summit, Devcon, CES), professional networking (replacing broken business card exchange)

**Wow Factor:** After a conference, your Proofi wallet shows: "Attended ETHGlobal 2026 ✓ (verified by organizer), connected with 23 people (mutual attestations), attended 8 sessions (verified check-ins)." Two years later, you can cryptographically PROVE you were there. For speakers: verified speaking credentials, not self-reported. This turns every conference into a verifiable professional milestone.

**Build Effort:** 3 weeks (NFC/QR mutual attestation flow + event issuer dashboard + attendee badge view)

---

### 7. ProofiRent — Instant Tenant Verification Portfolio

**One-liner:** Renters build a verified portfolio of landlord references, payment history, and identity proofs that unlock apartments in hours, not weeks.

**How it uses Proofi:**
- **Wallet:** Tenant has a Proofi wallet. Previous landlords issue "tenancy credentials" (dates, payment record, property condition). KYC providers issue identity verification credentials.
- **DDC:** All credentials stored in tenant's DDC vault. Tenant generates time-limited, revocable share links for each apartment application — new landlord sees verified history without getting permanent access to personal data.
- **Chain:** Credential count and issuer diversity visible on-chain as a "trust signal" without revealing any personal details.

**Target Market:** 1.1 billion renters globally, 44% of Americans rent, property management companies ($22B market)

**Wow Factor:** Apartment hunting? Instead of gathering reference letters, pay stubs, bank statements, and ID copies for EACH application — share one Proofi link. New landlord sees: 3 verified previous tenancies (all positive, signed by actual landlords), KYC-verified identity, income verification credential. Application approved in hours. Tenant applies to 10 apartments with one link instead of 10 document packages.

**Build Effort:** 3 weeks (landlord issuer flow + tenant portfolio view + share link generator)

---

### 8. ProofiSupply — Product Provenance Chain

**One-liner:** Products carry a verifiable chain of custody — from raw material to shelf — where every handler's attestation is cryptographically signed and stored on DDC.

**How it uses Proofi:**
- **Wallet:** Each supply chain participant (farmer, processor, distributor, retailer) has a Proofi wallet. Products get a "product wallet" (deterministically derived from product ID/SKU).
- **DDC:** At each supply chain step, the handler issues a "provenance credential" to the product wallet — location, timestamp, handling conditions, certifications, photos. Each credential signed by the handler's sr25519 key. The product's DDC index becomes its complete history.
- **Chain:** The chain of custody is a linked series of VCs where each issuer's identity resolves on Cere chain. Tampering is impossible — you'd need every handler's private key.

**Target Market:** $26B supply chain management market, organic/fair-trade certification ($300B organic market), luxury goods authentication ($350B luxury market), pharmaceutical track-and-trace

**Wow Factor:** Scan a QR code on your coffee bag → see its entire journey: farm in Colombia (GPS + photo credential from farmer), processed in Medellín (certification credential from processor), shipped via Rotterdam (logistics credential from shipper), roasted in Amsterdam (quality credential from roaster). Every step signed by the actual handler's verified wallet. Not a marketing story — cryptographic proof of origin.

**Build Effort:** 4 weeks (product wallet derivation + supply chain issuer flow + consumer-facing provenance viewer)

---

### 9. ProofiCreator — Content Authenticity & Authorship Proof

**One-liner:** Digital creators sign their work with verifiable authorship credentials — proving who made what and when, in the age of AI-generated everything.

**How it uses Proofi:**
- **Wallet:** Creator authenticates with Proofi. Their sr25519 key becomes their creator identity (`did:cere:{address}`). The same key signs all their work.
- **DDC:** Each piece of content (art, music, writing, photo, code) gets an "authorship credential" — content hash (SHA-256 of original file), creation timestamp, creator signature, metadata (dimensions, format, tools used). Stored in the creator's DDC vault. Derivative works reference the original credential CID, creating a provenance chain.
- **Chain:** Content hash + creator address registered on Cere chain as an immutable timestamp. Proves "this person created this content before this date" — irrefutable.

**Target Market:** 50M+ content creators globally, photographers fighting AI scraping, musicians proving original composition, writers (AI plagiarism concerns), AI art labeling compliance

**Wow Factor:** In the age of deepfakes and AI generation, proving human authorship is gold. A photographer's portfolio shows each image with a Proofi seal: SHA-256 hash of the original RAW file, signed by the photographer's verified wallet, timestamped on-chain before the image was ever published. When someone claims it's AI-generated, the photographer proves: "Here's the cryptographic proof from the moment of creation." This is the C2PA standard's vision, implemented with zero infrastructure cost on DDC.

**Build Effort:** 3 weeks (content hashing tool + authorship credential template + creator portfolio view + verification badge component)

---

### 10. ProofiAge — Zero-Knowledge Age & Identity Verification

**One-liner:** Prove you're over 18, over 21, or a resident of a specific country — without revealing your name, birthday, address, or ANY personal data.

**How it uses Proofi:**
- **Wallet:** User has a Proofi wallet. A trusted identity verifier (government agency, bank, iDIN, ID verification service) issues a full identity credential after verification.
- **DDC:** The full identity credential (containing birthday, address, government ID number) is stored **encrypted** in the user's DDC vault — only their key can decrypt it. A **separate derived credential** contains only the boolean claim: `{ "over18": true, "verified": true, "issuer": "did:cere:{verifier}" }` — signed by the same trusted issuer.
- **Chain:** The derived credential's hash is on-chain, linking it to the issuer's verified public key. The full identity data is NEVER on-chain and NEVER leaves the user's encrypted vault.

**Target Market:** Age-gated services ($500B+ — alcohol, gambling, cannabis, adult content), e-commerce age gates, social platforms facing regulatory pressure (EU DSA, UK Online Safety Act), dating apps (age verification mandates)

**Wow Factor:** Buying alcohol online? Instead of uploading a passport photo to a random e-commerce site, tap "Share age proof" in Proofi. The merchant sees: "This person is over 18, verified by [trusted issuer], signature valid, checked at [timestamp]." They learn NOTHING else — not your name, birthday, address, or ID number. **Privacy AND compliance.** This is arguably the killer app for digital identity — the regulatory pressure is building NOW and no one has a frictionless solution yet.

**Build Effort:** 4 weeks (derived credential issuance + verifier API + merchant integration widget + privacy-preserving verification flow)

---

### Ecosystem Concept Summary Table

| # | Concept | Market Size | Build Effort | CERE/Tx | Users (Y1 Target) |
|---|---------|------------|-------------|---------|-------------------|
| 1 | ProofiDegree | $15B (verification) | 2-3 weeks | ~0.15 | 10K graduates |
| 2 | ProofiBadge | $400B (ed-tech) | 2 weeks | ~0.12 | 5K learners |
| 3 | ProofiGig | $1.5T (freelance) | 3 weeks | ~0.15 | 3K freelancers |
| 4 | ProofiHealth | $12T (healthcare) | 4 weeks | ~0.20 | 2K patients |
| 5 | ProofiDAO | $20B (DAO tooling) | 3 weeks | ~0.12 | 5K members |
| 6 | ProofiEvent | $1.5T (events) | 3 weeks | ~0.10 | 8K attendees |
| 7 | ProofiRent | $22B (prop mgmt) | 3 weeks | ~0.15 | 2K tenants |
| 8 | ProofiSupply | $26B (supply chain) | 4 weeks | ~0.18 | 1K products |
| 9 | ProofiCreator | $100B (creator) | 3 weeks | ~0.15 | 10K creators |
| 10 | ProofiAge | $500B+ (age-gated) | 4 weeks | ~0.12 | 20K users |

**Total addressable token burn at 66K users:** ~15,000 CERE/year (extremely capital efficient)

---

## OUTPUT 3: Chrome Extension Spec — Proofi Ecosystem Hub

---

### Overview

**Name:** Proofi Hub  
**Tagline:** "Your credentials. Your ecosystem. One click."  
**Purpose:** Chrome extension that serves as the always-present gateway to the Proofi/Cere ecosystem — wallet access, credential management, DDC stats, ecosystem app directory, live activity feed, and instant verification.

**Why a Chrome Extension?**
- Wallet extensions are the standard UX in web3 (MetaMask proved this)
- Always available — no need to navigate to a separate website
- Content script injection enables automatic dApp detection
- Push notifications for credential events
- Right-click context menus for instant sharing
- Badge on the extension icon shows credential count (social proof)

---

### Key Screens

#### Screen 1: Dashboard (Default Popup — 400×560px)

```
┌──────────────────────────────────────────┐
│  ◇ Proofi Hub                    ⚙️  ─   │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  👤 Martijn B.        🟢 Connected │  │
│  │  5Gn8...kR4j                       │  │
│  │  12.45 CERE    ██████████░░ 78%    │  │
│  │               identity strength ↑  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │  📜  │  │  📝  │  │  🔗  │           │
│  │  7   │  │  23  │  │  4   │           │
│  │ Creds│  │ Memos│  │ Apps │           │
│  └──────┘  └──────┘  └──────┘           │
│                                          │
│  ── LIVE ACTIVITY ──────────────────     │
│  🟢 Credential verified    2m ago       │
│  🔵 Memo stored on DDC     15m ago      │
│  🟣 New app connected      1h ago       │
│  🟡 Badge earned: React    3h ago       │
│                                          │
│  ── DDC VAULT ──────────────────────     │
│  Bucket #1229  │  Storage: 14.2 MB      │
│  Objects: 156  │  Last write: 2m ago    │
│                                          │
│  ┌──────────────┐  ┌──────────────┐     │
│  │ 🌐 Ecosystem │  │ 📤 Share ID  │     │
│  └──────────────┘  └──────────────┘     │
│                                          │
└──────────────────────────────────────────┘
```

**Elements:**
- **Identity Card:** Display name (from profile credential), truncated address, CERE balance (via `/balance/:address`), identity strength bar (calculated: 1 point per credential type, weighted by issuer trust level)
- **Quick Stats:** Credential count, memo count, connected apps — all pulled from DDC wallet index in real-time
- **Live Activity Feed:** Recent events from DDC index diff — new credentials, memo stores, verifications, app connections. Color-coded by event type.
- **DDC Vault Stats:** Real-time bucket usage — storage consumed, object count, last write timestamp
- **Action Buttons:** Open ecosystem directory (full-tab), share public identity link (generates verifiable profile URL)

#### Screen 2: Credential Viewer (Tapped from dashboard)

```
┌──────────────────────────────────────────┐
│  ← Back           CREDENTIAL             │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  🎓 BSc Computer Science          │  │
│  │  ─────────────────────────────     │  │
│  │  Issuer:  University of Amsterdam  │  │
│  │  Date:    2025-07-15               │  │
│  │  Status:  ✅ VERIFIED              │  │
│  │                                    │  │
│  │  DDC CID: bafy...x4k2             │  │
│  │  Signature: sr25519 ✓             │  │
│  │  Chain Anchor: Block #4,891,023   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ── LIVE VERIFICATION ──────────────     │
│  ① Fetched from DDC          ✅ 0.8s   │
│  ② Issuer key resolved       ✅ 0.2s   │
│  ③ sr25519Verify() passed    ✅ 0.01s  │
│  ④ Timestamp on-chain        ✅ 0.3s   │
│  Total verification time:    1.31s      │
│                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │ 📋   │  │ 🔄   │  │ 📤   │          │
│  │ Copy │  │ Verify│  │ Share│          │
│  │ Link │  │ Again │  │      │          │
│  └──────┘  └──────┘  └──────┘          │
│                                          │
└──────────────────────────────────────────┘
```

**Elements:**
- **Credential Card:** Visual W3C VC rendering with key fields extracted and displayed in human-readable format
- **Live Verification Section:** 4-step verification with timing — fetches from DDC, resolves issuer DID, runs `sr25519Verify()`, checks on-chain timestamp. Each step shows green checkmark and latency.
- **Actions:** Copy verification link (anyone can verify without extension), re-verify on demand (live re-fetch), share to specific recipient (generates time-limited access link)

#### Screen 3: Ecosystem Directory (Full Tab — opens via extension button)

```
┌──────────────────────────────────────────────────────────────────┐
│  ◇ Proofi Ecosystem                                    🔍 Search │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ── FEATURED ───────────────────────────────────────────────     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 🎓           │  │ 🔞           │  │ 🎨           │          │
│  │ ProofiDegree │  │ ProofiAge    │  │ ProofiCreator│          │
│  │ Verified     │  │ Privacy-     │  │ Content      │          │
│  │ diplomas     │  │ preserving   │  │ authorship   │          │
│  │              │  │ age proof    │  │ proof        │          │
│  │ 1.2K users   │  │ 2.3K users   │  │ 1.1K users   │          │
│  │ [Connect →]  │  │ [Connect →]  │  │ [Connect →]  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ── CATEGORIES ─────────────────────────────────────────────     │
│  ┌─────────┐ ┌──────┐ ┌───────┐ ┌────────┐ ┌───────┐ ┌─────┐  │
│  │Education│ │ Work │ │Health │ │Identity│ │Creator│ │ Gov │  │
│  └─────────┘ └──────┘ └───────┘ └────────┘ └───────┘ └─────┘  │
│                                                                  │
│  ── ALL APPS ───────────────────────────────────────────────     │
│                                                                  │
│  🎓 ProofiDegree        University diplomas          1.2K  →    │
│  🏋️ ProofiBadge         Skill credentials             890  →    │
│  💼 ProofiGig           Freelancer reputation          567  →    │
│  🏥 ProofiHealth        Medical records                234  →    │
│  🏛️ ProofiDAO           Governance credentials         445  →    │
│  🎪 ProofiEvent         Event attendance               178  →    │
│  🏠 ProofiRent          Tenant verification            340  →    │
│  📦 ProofiSupply        Product provenance              89  →    │
│  🎨 ProofiCreator       Content authorship            1.1K  →    │
│  🔞 ProofiAge           Age verification              2.3K  →    │
│                                                                  │
│  ── LIVE NETWORK STATS ─────────────────────────────────────     │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────┐  │
│  │   8,234     │ │   45,891     │ │   2.1 GB   │ │  12,345  │  │
│  │   Wallets   │ │  Credentials │ │ DDC Storage│ │ Verifies │  │
│  └─────────────┘ └──────────────┘ └────────────┘ └──────────┘  │
│                                                                  │
│  ── BUILD ON PROOFI ────────────────────────────────────────     │
│  Want to add your app to the ecosystem?                          │
│  [ 📖 Developer Docs ]  [ 🔧 SDK Quickstart ]  [ 💬 Discord ]  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### Screen 4: Login / Onboarding

```
┌──────────────────────────────────────────┐
│  ◇ Proofi Hub                            │
├──────────────────────────────────────────┤
│                                          │
│           ◇                              │
│        PROOFI                            │
│                                          │
│   Own your identity.                     │
│   Verify everything.                     │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  📧 Enter your email              │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │         Continue →                 │  │
│  └────────────────────────────────────┘  │
│                                          │
│  No seed phrases. No gas fees.           │
│  Just email + PIN = your wallet.         │
│                                          │
│  ── HOW IT WORKS ───────────────────     │
│  1. Enter email → receive code           │
│  2. Set a 6-digit PIN                    │
│  3. Your wallet is created instantly     │
│  4. Credentials stored on DDC            │
│  5. Only you control your data           │
│                                          │
│  Powered by Cere Network                 │
│                                          │
└──────────────────────────────────────────┘
```

#### Screen 5: Settings & Identity Management

```
┌──────────────────────────────────────────┐
│  ← Back              SETTINGS            │
├──────────────────────────────────────────┤
│                                          │
│  ── IDENTITY ───────────────────────     │
│  Email:    mart@proofi.ai                │
│  Address:  5Gn8...kR4j   [Copy]         │
│  Key:      sr25519                       │
│  PIN:      ••••••  [Change]             │
│                                          │
│  ── CONNECTED APPS ─────────────────     │
│  ProofiDegree     ✅  [Disconnect]      │
│  ProofiCreator    ✅  [Disconnect]      │
│  ProofiAge        ✅  [Disconnect]      │
│                                          │
│  ── SECURITY ───────────────────────     │
│  Auto-lock timeout:   [15 min ▾]        │
│  Require PIN to sign: [ON]              │
│  Biometric unlock:    [Coming soon]     │
│                                          │
│  ── NOTIFICATIONS ──────────────────     │
│  New credentials:     [ON]              │
│  Verifications:       [ON]              │
│  App activity:        [ON]              │
│                                          │
│  ── DATA ───────────────────────────     │
│  [Export Credentials (JSON-LD)]         │
│  [Backup Wallet Index (DDC)]            │
│  [View Raw DDC Index]                   │
│                                          │
│  ── NETWORK ────────────────────────     │
│  RPC: wss://rpc.mainnet.cere.network     │
│  DDC: Mainnet Bucket #1229               │
│  API: proofi-api-production.up.railway   │
│                                          │
└──────────────────────────────────────────┘
```

---

### Core Features

#### 1. Native Wallet Integration (No iframe)

The extension runs `@proofi/core` KeyringManager directly in the Manifest V3 background service worker. No iframe embedding — the wallet runs natively inside the extension.

**Auth Flow:**
```
1. User clicks extension icon → Login popup opens (400×560px)
2. Enter email → POST /auth/otp/send → OTP delivered to inbox
3. Enter OTP → POST /auth/otp/verify → API returns derivationSalt + JWT
4. Enter 6-digit PIN → Client derives keypair:
   PBKDF2(PIN, derivationSalt, 100K iterations) → seed → sr25519 keypair
5. Keypair encrypted with AES-256-GCM (key from PIN via PBKDF2)
   → stored in chrome.storage.local
6. Extension icon shows green dot (🟢 Connected)
7. Session persists until auto-lock timeout or manual lock
```

**Key Storage Security:**
- Private key NEVER stored in plaintext
- AES-256-GCM encryption with key derived from PIN via PBKDF2 (100K iterations)
- Re-entering PIN required to decrypt and use the key
- Auto-lock clears the decrypted key from memory after timeout

#### 2. Content Script: dApp Auto-Detection & Injection

The extension includes a content script that detects Proofi-compatible dApps:

**Detection methods:**
```javascript
// Method 1: Meta tag detection
<meta name="proofi-app-id" content="proofi-degree-v1" />

// Method 2: JavaScript global
window.__PROOFI_DAPP__ = { appId: "proofi-degree-v1", version: "1.0" }

// Method 3: Well-known URL
GET /.well-known/proofi.json → { "appId": "...", "name": "...", "permissions": [...] }
```

**When a dApp is detected:**
1. Extension popup shows connection prompt with app name and requested permissions
2. User approves → content script injects `@proofi/inject` into the page
3. The page sees "Proofi Hub" in the `@polkadot/extension-dapp` wallet list
4. Any Polkadot-compatible dApp works out of the box
5. Custom Proofi SDK calls (`proofi.getCredentials()`, `proofi.signMessage()`) route through `chrome.runtime.sendMessage` → background service worker → signed response

#### 3. Credential Notifications (Push Alerts)

Background service worker polls DDC wallet index every 5 minutes:

| Event | Notification |
|-------|-------------|
| New credential issued to wallet | 🎓 "New credential from University of Amsterdam" |
| Credential verified by third party | ✅ "Your BSc diploma was just verified" |
| New app connection request | 🔗 "ProofiDegree wants to connect" |
| Credential about to expire | ⚠️ "Your driver's license credential expires in 7 days" |

Extension icon badge shows unread notification count (red circle with number).

#### 4. One-Click Inline Verification

Content script detects Proofi verification URLs on any webpage:

```javascript
// Detects: proofi.ai/verify/*, proofi-virid.vercel.app/verify/*
// Also detects: DDC CIDs referenced in proofi-credential meta tags
```

When detected:
- Adds a green shield overlay next to the credential reference: "✅ Proofi Verified"
- Hover → tooltip with issuer name and verification time
- Click → popup shows full 4-step verification proof (fetched from DDC, signature checked, on-chain timestamp verified)

#### 5. Context Menu: Credential Sharing

Right-click on any webpage → "Share Proofi Credential":
1. Opens credential selector (list of wallet's credentials)
2. User picks credential(s) to share
3. Extension generates a shareable verification link: `proofi.ai/verify/{encoded-proof}`
4. Link copies to clipboard or opens sharing dialog
5. Anyone with the link can verify — no extension or wallet needed

#### 6. Ecosystem App Gateway

The extension serves as the single entry point for all Proofi ecosystem apps:
- "Ecosystem" button opens a full-tab page with all 10 concept apps
- One-click connect passes wallet connection to any ecosystem app
- Connected apps show in Settings with disconnect option
- Each app card shows: user count, category, last activity, connection status

---

### Tech Stack

```
proofi-hub-extension/
├── manifest.json                 # Manifest V3 (Chrome MV3)
├── src/
│   ├── background/
│   │   ├── service-worker.ts     # Main background logic, message routing
│   │   ├── wallet.ts             # KeyringManager wrapper + AES-256-GCM storage
│   │   ├── ddc-poller.ts         # DDC index polling (5-min interval)
│   │   ├── notifications.ts     # Chrome notification dispatch
│   │   └── api-client.ts         # Proofi API HTTP client (auth, DDC, balance)
│   │
│   ├── popup/                    # React popup (400×560px)
│   │   ├── App.tsx               # Root with router
│   │   ├── screens/
│   │   │   ├── Dashboard.tsx     # Main dashboard (Screen 1)
│   │   │   ├── Login.tsx         # Email → OTP → PIN flow (Screen 4)
│   │   │   ├── Credential.tsx    # Individual credential viewer (Screen 2)
│   │   │   ├── Credentials.tsx   # Full credential list
│   │   │   ├── Memos.tsx         # Memo list + create
│   │   │   └── Settings.tsx      # Settings & identity (Screen 5)
│   │   ├── components/
│   │   │   ├── CredentialCard.tsx # Reusable credential display
│   │   │   ├── ActivityFeed.tsx  # Live activity event list
│   │   │   ├── DdcStats.tsx      # DDC vault statistics
│   │   │   ├── IdentityBar.tsx   # Identity strength indicator
│   │   │   └── VerifyBadge.tsx   # Verification proof display
│   │   └── stores/
│   │       ├── walletStore.ts    # Zustand: address, balance, connection state
│   │       ├── credentialStore.ts # Zustand: credential list from DDC
│   │       └── activityStore.ts  # Zustand: activity feed events
│   │
│   ├── ecosystem/                # Full-tab ecosystem page (Screen 3)
│   │   ├── index.html            # Entry point
│   │   ├── App.tsx               # Ecosystem directory
│   │   ├── AppCard.tsx           # Individual app listing
│   │   └── NetworkStats.tsx      # Aggregate Cere/DDC statistics
│   │
│   ├── content/                  # Content scripts (injected into web pages)
│   │   ├── detector.ts           # dApp detection (meta, global, well-known)
│   │   ├── injector.ts           # @proofi/inject injection (Polkadot compat)
│   │   └── verifier.ts           # Proofi link detection + green shield overlay
│   │
│   └── shared/
│       ├── types.ts              # Shared TypeScript types
│       ├── constants.ts          # API URLs, bucket ID, network config
│       ├── crypto.ts             # AES-256-GCM encrypt/decrypt for storage
│       └── messages.ts           # Chrome message type definitions
│
├── packages/                     # Vendored Proofi packages
│   ├── core/                     # @proofi/core (KeyringManager, sr25519)
│   ├── comm/                     # @proofi/comm (RPC channel)
│   └── inject/                   # @proofi/inject (Polkadot extension compat)
│
├── assets/
│   ├── icons/                    # Extension icons: 16, 32, 48, 128px
│   │   ├── icon-16.png
│   │   ├── icon-32.png
│   │   ├── icon-48.png
│   │   └── icon-128.png
│   ├── fonts/                    # Brand fonts
│   │   ├── SpaceGrotesk-*.woff2
│   │   ├── Inter-*.woff2
│   │   └── JetBrainsMono-*.woff2
│   └── shield-verified.svg      # Green shield for inline verification
│
├── vite.config.ts                # Vite build config with CRXJS plugin
├── tailwind.config.ts            # Tailwind with Proofi brand tokens
├── tsconfig.json
├── package.json
└── README.md
```

**Core Dependencies:**

| Package | Version | Purpose |
|---------|---------|---------|
| React 18 | ^18.3 | Popup & ecosystem page UI |
| Zustand | ^5.0 | State management (same pattern as wallet UI) |
| Vite | ^6.0 | Build tooling |
| @crxjs/vite-plugin | ^2.0 | Chrome MV3 dev/build with HMR |
| Tailwind CSS | ^4.0 | Styling with Proofi brand tokens |
| @polkadot/util-crypto | ^13.0 | sr25519 operations, signature verification |
| @polkadot/keyring | ^13.0 | Key management, address encoding |
| @cere-ddc-sdk/ddc-client | ^2.x | DDC read operations |
| webextension-polyfill | ^0.12 | Cross-browser compatibility (future Firefox/Edge) |

---

### Build Plan

#### Phase 1: Core Wallet Extension (Week 1-2)

**Goal:** Working extension with auth flow and basic wallet display.

- [ ] Scaffold Manifest V3 extension with Vite + CRXJS
- [ ] Port `@proofi/core` KeyringManager to run in MV3 service worker
  - Handle WASM sr25519 in service worker context (may need `offscreen` document)
- [ ] Build login popup: email → OTP → PIN → keypair derivation
- [ ] Implement AES-256-GCM encrypted key storage in `chrome.storage.local`
- [ ] Dashboard popup: address display, CERE balance (via API), connection indicator
- [ ] Auto-lock logic: clear decrypted key after timeout, require PIN to re-unlock
- [ ] Extension icon states: grey (disconnected), green (connected), red (error)

**Milestone:** User can install extension, log in with email + PIN, see their address and balance.

#### Phase 2: DDC Integration (Week 3-4)

**Goal:** Read credentials and memos from DDC, display in the popup.

- [ ] DDC index reading from service worker (via CDN: `cdn.ddc-dragon.com`)
- [ ] Credential list view in popup — parsed from DDC wallet index
- [ ] Individual credential viewer with 4-step live verification
- [ ] Memo list view — read from DDC index
- [ ] DDC vault stats (object count, storage estimate)
- [ ] Activity feed — computed from index diffs between polls
- [ ] Identity strength calculation (credential count × type diversity × issuer trust)

**Milestone:** Extension shows all credentials and memos from DDC, with live verification.

#### Phase 3: Content Scripts & Notifications (Week 5-6)

**Goal:** Extension interacts with web pages — detects dApps, overlays verification badges, sends notifications.

- [ ] dApp detector content script: `<meta>`, `window.__PROOFI_DAPP__`, `/.well-known/proofi.json`
- [ ] Connection prompt UI when dApp detected
- [ ] `@proofi/inject` injection for Polkadot extension API compatibility
- [ ] Proofi verification link detection on web pages + green shield overlay
- [ ] Right-click context menu: "Share Proofi Credential" → credential selector → link generation
- [ ] Chrome notifications: new credentials, verifications, connection requests
- [ ] Badge counter on extension icon for unread notifications

**Milestone:** Extension auto-detects Proofi dApps, shows verification badges on pages, sends push notifications.

#### Phase 4: Ecosystem Directory (Week 7-8)

**Goal:** Full-tab ecosystem page that showcases all Proofi concepts.

- [ ] Full-tab HTML page: ecosystem directory with app cards
- [ ] Category filtering (Education, Work, Health, Identity, Creator, Governance)
- [ ] Search functionality across all ecosystem apps
- [ ] App detail view: description, screenshots, user count, connect button
- [ ] One-click connect: passes wallet session to ecosystem app
- [ ] Network stats aggregation (total wallets, credentials, DDC usage, verifications)
- [ ] "Build on Proofi" section: link to docs, SDK quickstart, Discord

**Milestone:** Beautiful ecosystem page that makes Proofi feel like a thriving platform.

#### Phase 5: Polish, Security Audit & Launch (Week 9-10)

**Goal:** Production-ready extension on Chrome Web Store.

- [ ] Brand compliance audit: all Proofi design tokens applied (via Tailwind config)
- [ ] Accessibility pass: keyboard navigation, screen reader, contrast ratios
- [ ] Performance: lazy-load DDC data, cache credentials locally, minimize API calls
- [ ] Security audit: key storage, content script isolation, message origin validation
- [ ] Privacy policy & terms of service for Chrome Web Store
- [ ] Chrome Web Store listing: screenshots (5), detailed description, category selection
- [ ] Beta launch: invite existing Proofi wallet users to install
- [ ] Feedback collection → priority fixes → v1.1

**Milestone:** Extension live on Chrome Web Store, available to anyone.

---

### Security Model

| Threat | Mitigation |
|--------|-----------|
| **Private key extraction** | AES-256-GCM encrypted in `chrome.storage.local`. Key derived from PIN via PBKDF2 (100K iterations). PIN never stored — only used to derive encryption key at unlock time. |
| **Session hijacking** | Auto-lock after configurable timeout (default 15 min). Decrypted key cleared from service worker memory. Re-authentication required. |
| **Malicious content script** | Content scripts only inject `@proofi/inject` on pages with verified `proofi-app-id` meta tag from registered apps. Origin allowlist enforced. |
| **Cross-origin attacks** | All `chrome.runtime.sendMessage` calls validated with strict type checking. No `eval()` or dynamic code execution. CSP enforced via manifest. |
| **API token theft** | Signature-based auth (`X-Wallet-Address` + `X-Wallet-Signature`) preferred over JWT for sensitive operations. JWT used only for initial session establishment. |
| **Extension permission scope** | Minimal permissions: `storage`, `notifications`, `activeTab`. NOT `<all_urls>` — content script only activates on pages with proofi meta tags or verification URLs. `host_permissions` limited to proofi API domain. |
| **Supply chain attack** | All `@proofi/*` packages vendored (not installed from npm). Dependencies pinned with lockfile. Subresource integrity for CDN loads. |

---

### Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "name": "Proofi Hub",
  "version": "1.0.0",
  "description": "Your credentials. Your ecosystem. One click.",
  "icons": {
    "16": "assets/icons/icon-16.png",
    "32": "assets/icons/icon-32.png",
    "48": "assets/icons/icon-48.png",
    "128": "assets/icons/icon-128.png"
  },
  "action": {
    "default_popup": "src/popup/index.html",
    "default_icon": "assets/icons/icon-32.png"
  },
  "background": {
    "service_worker": "src/background/service-worker.ts",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/detector.ts"],
      "run_at": "document_idle"
    }
  ],
  "permissions": [
    "storage",
    "notifications",
    "activeTab",
    "contextMenus",
    "offscreen"
  ],
  "host_permissions": [
    "https://proofi-api-production.up.railway.app/*",
    "https://proofi-virid.vercel.app/*",
    "https://cdn.ddc-dragon.com/*",
    "https://rpc.mainnet.cere.network/*"
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'none';"
  },
  "web_accessible_resources": [
    {
      "resources": ["src/content/injector.ts", "assets/shield-verified.svg"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

---

## Strategic Summary: The Flywheel

```
                    ┌─────────────────────┐
                    │   Ecosystem Apps     │
                    │   (10 concepts)      │
                    └──────────┬──────────┘
                               │
                    Give users reasons
                    to create wallets
                               │
                               ▼
┌─────────────────┐     ┌─────────────┐     ┌──────────────────┐
│  Chrome Extension│◄────│ More Wallets │────►│  More Developers │
│  (always-present │     │  (network    │     │  (build on the   │
│   gateway)       │     │   effect)    │     │   ecosystem)     │
└────────┬─────────┘     └──────┬──────┘     └────────┬─────────┘
         │                      │                      │
         │               Credentials                   │
         │               create value                  │
         │                      │                      │
         │                      ▼                      │
         │              ┌──────────────┐               │
         └─────────────►│  DDC Storage  │◄──────────────┘
                        │  (user-owned  │
                        │   data vault) │
                        └──────────────┘
```

**The virtuous cycle:**

1. **Ecosystem apps** (ProofiDegree, ProofiAge, ProofiCreator, etc.) give real-world reasons to create a Proofi wallet
2. **More wallets** means more credentials stored on DDC, more CERE burned, more network value
3. **Chrome extension** makes the wallet frictionless and ever-present — users never leave the ecosystem
4. **More users** attract more developers to build ecosystem apps (network effects)
5. **DDC storage** ensures users own their data forever — no platform lock-in keeps them loyal
6. **Skill agents** (qa, ux, sim) maintain quality and speed as the ecosystem grows

**What makes this defensible:**

| Competitive Advantage | Why It Matters |
|----------------------|---------------|
| **No seed phrases** | Email + PIN onboarding means non-crypto users can join |
| **No database** | Fully decentralized — DDC index means no server to hack or shut down |
| **W3C VCs** | Standards-compliant credentials work across any verifier, not just Proofi |
| **sr25519 signatures** | Substrate-native crypto means direct Cere chain integration |
| **DDC storage** | User data survives even if Proofi (the company) disappears |
| **Chrome extension** | MetaMask-style UX for the credential economy |

**Proofi becomes to digital identity what Gmail became to email:** the default, the standard, the one everyone has.

---

*This strategy is immediately actionable. Every concept is buildable on the existing Proofi infrastructure. Every agent can be implemented as a Clawdbot skill or CI pipeline. The Chrome extension can be shipped in 10 weeks. Start with ProofiAge (biggest market pull) and ProofiDegree (easiest to demo), build the extension in parallel, and let the flywheel spin.*
