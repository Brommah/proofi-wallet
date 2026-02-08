# Proofi Wallet — Strategic Blueprint

**Date:** February 4, 2026  
**Author:** Clawd (Strategy Agent)  
**Status:** Actionable — all proposals buildable on existing infrastructure  

---

## OUTPUT 1: Three Specialized Skill Agents

---

### Agent 1: `proofi-qa` — DDC Integration Test Agent

**Purpose:** Automated end-to-end testing of every Proofi flow — from OTP auth through DDC storage, credential issuance, and wallet index consistency. Catches regressions before they reach production.

**Specific Capabilities:**
- **Auth Flow Testing:** Simulates full email OTP → PIN → key derivation flow against the live or local API, verifying JWT issuance, signature auth headers, and session restore
- **DDC Read/Write Verification:** Stores memos and credentials to DDC Bucket #1229, then reads them back via CNS index lookup, verifying data integrity and CID consistency
- **Wallet Index Integrity:** Reads the `pi-{hash}` CNS entry for a test wallet, verifies the index JSON structure, adds an entry, re-reads to confirm append, then cleans up
- **Credential Verification:** Issues a W3C VC, stores it, retrieves it, and runs `signatureVerify()` against the issuer's sr25519 public key to confirm the full issuance→verification loop
- **Regression Snapshots:** Stores a baseline of API responses (health, balance, DDC list) and diffs against future runs to catch breaking changes
- **Load Simulation:** Fires concurrent memo stores to test DDC client connection pooling and rate limits

**Codebase Interaction:**
- Imports directly from `@proofi/core` (KeyringManager) and `@proofi/comm` (RpcChannel) for client-side operations
- Calls `@proofi/api` endpoints via HTTP (same as the SDK would)
- Reads `ddc/service.ts` exports (`storeCredential`, `readCredential`, `readWalletIndex`, `addToWalletIndex`) for server-side DDC verification
- Outputs structured test reports to `proofi/reports/qa-{date}.json`

**Example Workflow:**
```
1. Agent boots → reads @proofi/api server.ts to discover all endpoints
2. Calls POST /auth/otp/send with test email
3. In dev mode, reads OTP from console log (or uses configured test OTP bypass)
4. Calls POST /auth/otp/verify → receives JWT + derivationSalt
5. Derives sr25519 keypair client-side using KeyringManager
6. Calls POST /auth/register-address with signature auth
7. Stores a test memo via POST /ddc/memo
8. Reads wallet index via GET /ddc/list/{walletAddress}
9. Verifies memo appears in index with correct CID
10. Issues a test credential, stores it, reads it back, verifies signature
11. Outputs: ✅ 10/10 tests passed, 0 regressions, DDC latency avg 1.2s
```

---

### Agent 2: `proofi-ux` — Visual QA & Component Agent

**Purpose:** Renders every Proofi UI screen, detects visual regressions, validates brand compliance (colors, fonts, spacing per brand-guide.md), and generates screenshot-based reports for review.

**Specific Capabilities:**
- **Screen Capture Pipeline:** Launches the Proofi wallet UI (Vite dev server or Vercel production), navigates through all 6 screens (Login → Pin → Account → DDC → Connect → Sign), captures screenshots at each state
- **Brand Compliance Checker:** Parses CSS against `brand-guide.md` tokens — verifies `--accent: #3B82F6`, font stack order (Space Grotesk → Inter → JetBrains Mono), spacing multiples of 8px, and that background is always white/off-white
- **Responsive Audit:** Captures each screen at mobile (375px), tablet (768px), and desktop (1280px) viewports. Flags layout breakages.
- **Accessibility Scan:** Runs axe-core against each screen, reports WCAG violations (contrast ratios, missing labels, keyboard navigation)
- **Component Catalog Generation:** Extracts all React components from `packages/ui/src/components/`, renders them in isolation with various props, generates a visual component library
- **Diff Mode:** Compares current screenshots against a baseline set, highlights pixel-level changes with bounding boxes

**Codebase Interaction:**
- Reads `packages/ui/src/screens/*.tsx` and `packages/ui/src/components/**` to understand component tree
- Reads `brand-guide.md` for design tokens and rules
- Launches `pnpm dev` in the ui package, uses Playwright/Puppeteer for headless rendering
- Reads Zustand stores (`stores/*.ts`) to understand state shapes and mock them for isolated screen testing
- Outputs visual reports to `proofi/reports/ux-audit-{date}/` with screenshots and JSON findings

**Example Workflow:**
```
1. Agent starts Proofi UI dev server (port 5173)
2. Opens headless browser at http://localhost:5173
3. LoginScreen: captures screenshot, checks email input has correct font (Inter 16px), 
   button uses --accent color, border radius matches brand guide
4. Enters test email → OTP → arrives at PinScreen
5. PinScreen: verifies PIN dot indicators, keyboard layout, spacing
6. Navigates to AccountScreen: checks balance display uses JetBrains Mono,
   QR code renders correctly, Send/Receive buttons are properly styled
7. Navigates to DdcScreen: verifies "Data Vault" label styling, memo list rendering
8. Runs responsive check — resizes to 375px, captures all screens again
9. Runs axe-core on each page
10. Generates report: 2 brand violations (button letter-spacing off by 0.5px), 
    1 a11y issue (missing aria-label on QR), 0 layout breaks
```

---

### Agent 3: `proofi-sim` — Ecosystem Simulation Agent

**Purpose:** Simulates realistic multi-actor scenarios on the Proofi infrastructure — universities issuing credentials, employers verifying them, users managing wallets — to validate the ecosystem works end-to-end before real partners onboard.

**Specific Capabilities:**
- **Actor System:** Creates and manages multiple simulated Proofi wallets (university issuer, employer verifier, individual user) with distinct keypairs
- **Credential Lifecycle Simulation:** University actor issues a credential to user actor → stores on DDC → employer actor retrieves and verifies → full loop validated
- **Throughput Testing:** Simulates 100 users each storing 5 credentials, measuring DDC storage latency, index growth, and CNS resolution time
- **Revocation Scenarios:** Tests credential revocation flows — issuer updates credential status, verifier checks status, user sees updated state
- **SDK Integration Testing:** Runs a mini host app that embeds the Proofi iframe via `@proofi/sdk`, exercises `connect()`, `getSigner()`, and `disconnect()` programmatically
- **Economics Modeling:** Tracks CERE token consumption per operation (memo store, credential issue, index update) to project costs at scale
- **Chaos Testing:** Randomly introduces network delays, DDC timeouts, and invalid signatures to verify error handling paths

**Codebase Interaction:**
- Uses `@proofi/sdk` (ProofiWallet class) for host-side integration testing
- Directly calls `@proofi/api` endpoints for server-side actor simulation
- Imports `@proofi/core` KeyringManager to generate and manage multiple keypairs
- Reads `ddc/service.ts` to understand storage patterns and CNS naming conventions (`pi-{hash}`)
- Monitors Cere chain via `@polkadot/api` for on-chain transaction confirmation
- Outputs simulation reports with latency histograms, success rates, and token consumption to `proofi/reports/sim-{date}.json`

**Example Workflow:**
```
1. Agent creates 3 actors: University of Amsterdam (issuer), Acme Corp (verifier), Alice (user)
2. Each actor goes through OTP → PIN → wallet derivation (3 distinct addresses)
3. University signs a W3C VerifiableCredential (BSc Computer Science for Alice)
4. Credential stored on DDC under Alice's wallet index
5. Acme Corp queries Alice's public credential feed
6. Acme Corp calls sr25519 signatureVerify() on the credential proof
7. Verification succeeds → credential is valid, issued by known university
8. Agent measures: issuance latency 1.8s, storage 2.1s, verification 0.3s
9. Repeats with 50 concurrent issuances to test scaling
10. Reports: all 50 succeeded, avg latency 2.4s, 12.5 CERE consumed
```

---

## OUTPUT 2: Ten Real Concepts Leveraging Proofi Wallet

---

### 1. ProofiDegree — Tamper-Proof University Diplomas

**One-liner:** Universities issue blockchain-verified diplomas that graduates carry forever in their Proofi wallet.

**How it uses Proofi:**
- **Wallet:** University gets an issuer wallet (email OTP auth, sr25519 keypair). Graduate gets a holder wallet.
- **DDC:** The W3C Verifiable Credential (diploma) is stored as a JSON-LD document in DDC Bucket #1229 under the graduate's wallet index. The university's public key is registered as a trusted issuer.
- **Chain:** Credential hash anchored on Cere chain for timestamping. Issuer's DID resolves to their on-chain sr25519 public key.

**Target Market:** Universities (250,000+ worldwide), graduates (entering job market), employers (instant verification)

**Wow Factor:** An employer scans a QR code → credential resolves from DDC in <2 seconds → cryptographic verification proves authenticity without ever contacting the university. No background check company needed. No 3-week wait. Instant, irrefutable proof.

---

### 2. ProofiBadge — Live Skill Credentials for Bootcamps & Courses

**One-liner:** Course platforms issue skill badges that update as learners complete modules — a living, growing credential.

**How it uses Proofi:**
- **Wallet:** Course platform (Codecademy, Coursera, independent bootcamp) has an issuer wallet. Each student has a Proofi wallet.
- **DDC:** Each badge is a VC stored in the student's DDC index. As modules complete, the issuer issues updated VCs (version 1 → "React Basics", version 2 → "React + TypeScript", version 3 → "Full Stack React"). Old versions remain accessible, showing progression.
- **Chain:** Each badge issuance is a DDC write with a new CID; the wallet index (CNS) always points to the latest state.

**Target Market:** Online education ($400B market), bootcamps, corporate training programs

**Wow Factor:** A portfolio page that's ALIVE — badges animate in, show completion dates, link to the actual credential on DDC. Click any badge → see the full VC with issuer signature, completion evidence, and skill graph. Not a PNG on LinkedIn — a cryptographic proof.

---

### 3. ProofiGig — Freelancer Reputation Passport

**One-liner:** Freelancers collect verified work reviews across platforms into one portable reputation wallet.

**How it uses Proofi:**
- **Wallet:** Freelancer authenticates with email → gets Proofi wallet. Each client who signs off on work gets a one-time issuer capability.
- **DDC:** After a gig, the client issues a "work completion credential" — rating, scope, dates, deliverables — stored in the freelancer's DDC vault. The freelancer controls which reviews are public.
- **Chain:** Credential count and aggregate rating are derivable from the public credential index, creating an on-chain reputation score.

**Target Market:** 1.57 billion freelancers worldwide, platforms like Fiverr/Upwork, direct clients

**Wow Factor:** A freelancer sends a Proofi link to a new client. The client sees 47 verified gig completions, each cryptographically signed by the actual client company. Not self-reported reviews — verifiable proof of work. Freelancer migrates from Upwork to independent work and takes their entire reputation with them.

---

### 4. ProofiHealth — Patient-Controlled Medical Records

**One-liner:** Patients store verified vaccination records, test results, and prescriptions in their encrypted Proofi vault.

**How it uses Proofi:**
- **Wallet:** Patient creates Proofi wallet (email + PIN). Healthcare provider has an issuer wallet.
- **DDC:** Medical credentials (vaccination certificate, lab results, prescriptions) stored as encrypted VCs in the patient's DDC vault. Only the patient's key can decrypt. They issue time-limited access tokens to doctors/insurers.
- **Chain:** Credential existence is provable on-chain without revealing contents (zero-knowledge friendly architecture).

**Target Market:** Healthcare ($12T global market), travelers (vaccine passports), insurance companies

**Wow Factor:** Traveling abroad? Open Proofi wallet → share vaccination credential via QR → border agent verifies in 2 seconds. Switching doctors? Grant new doctor access to your full history — no fax machines, no "we'll request your records from your previous provider." YOU are the source of truth.

---

### 5. ProofiDAO — Governance Credentials for DAOs

**One-liner:** DAOs issue membership, voting rights, and contributor credentials that live in members' Proofi wallets.

**How it uses Proofi:**
- **Wallet:** DAO has an org wallet. Members authenticate via email → get personal Proofi wallets.
- **DDC:** Membership credentials, role assignments (Core Contributor, Reviewer, Treasury Signer), and voting weight certificates stored as VCs. DAO governance proposals can reference credential-gated permissions.
- **Chain:** Cere chain records credential issuance timestamps. Proofi wallet's sr25519 key can sign governance votes, making credentials and voting use the same identity.

**Target Market:** 13,000+ active DAOs, web3 communities, open source foundations

**Wow Factor:** A DAO member's Proofi wallet shows: "Core Contributor since March 2025, 142 governance votes cast, 23 proposals authored." All verifiable. When they join a new DAO, they carry their entire governance history. DAOs can set entry requirements: "Must hold 3+ verified contributor credentials from recognized DAOs."

---

### 6. ProofiEvent — Verifiable Event Attendance & Networking

**One-liner:** Conference attendees get cryptographic proof of attendance and verified contact exchange — no more lost business cards.

**How it uses Proofi:**
- **Wallet:** Event organizer has an issuer wallet. Attendees use their Proofi wallets.
- **DDC:** Attendance credentials issued per event (with track/session data). When two attendees exchange contacts, both store a signed "connection credential" in their vaults — mutual proof of meeting.
- **Chain:** Event credential serves as a soulbound proof-of-attendance on Cere chain.

**Target Market:** $1.5T events industry, conferences (Web Summit, Devcon, CES), professional networking

**Wow Factor:** After a conference, your Proofi wallet shows: "Attended ETHGlobal 2026 (verified by organizer), connected with 23 people (mutual attestations), attended 8 sessions." Two years later, you can cryptographically PROVE you were there. For speakers: verified proof of speaking engagement, not a self-reported LinkedIn entry.

---

### 7. ProofiRent — Tenant Verification Portfolio

**One-liner:** Renters build a verified portfolio of landlord references, payment history, and identity documents to secure apartments instantly.

**How it uses Proofi:**
- **Wallet:** Tenant has a Proofi wallet. Previous landlords issue "tenancy credentials" — dates, payment record, condition. Identity verification services issue KYC credentials.
- **DDC:** All credentials stored in tenant's DDC vault. Tenant selectively shares with new landlords via temporary access links (time-limited, revocable).
- **Chain:** Credential count and issuer diversity visible on-chain as a "trust signal" without revealing personal data.

**Target Market:** 44% of Americans are renters, 1.1 billion renters globally, property management companies

**Wow Factor:** Apartment hunting? Instead of gathering reference letters, bank statements, and ID copies for each application — share a Proofi link. New landlord sees: 3 verified previous tenancies (all positive), KYC verified identity, income verification credential. Application approved in hours, not weeks.

---

### 8. ProofiSupply — Product Provenance Tracking

**One-liner:** Products carry verifiable origin credentials — from raw material to shelf — stored on DDC and verifiable by any consumer.

**How it uses Proofi:**
- **Wallet:** Each supply chain participant (farmer, processor, distributor, retailer) has a Proofi wallet. Products get a "product wallet" (derived from product ID).
- **DDC:** At each supply chain step, the handler issues a "provenance credential" — location, timestamp, handling conditions, certifications — stored in the product's DDC index. Each credential is signed by the handler's sr25519 key.
- **Chain:** The chain of custody is a verifiable credential chain where each issuer's identity resolves on Cere chain.

**Target Market:** $26B supply chain management market, organic/fair-trade certification, luxury goods authentication

**Wow Factor:** Scan a QR code on your coffee bag → see its entire journey: farm in Colombia (GPS + photo credential), processed in Medellín (certification credential), shipped via Rotterdam (logistics credential), roasted in Amsterdam (quality credential). Every step signed by the actual handler. Not a marketing story — cryptographic proof.

---

### 9. ProofiCreator — Content Authenticity Certificates

**One-liner:** Digital creators sign their work with verifiable authorship credentials — proving who made what, when.

**How it uses Proofi:**
- **Wallet:** Creator authenticates with Proofi. Their sr25519 key becomes their creator identity.
- **DDC:** Each piece of content (art, music, writing, code) gets an "authorship credential" — content hash, creation timestamp, creator signature — stored in the creator's DDC vault. Derivative works reference the original credential CID.
- **Chain:** Content hash + creator address registered on Cere chain as an immutable timestamp. Proves "I created this before that date."

**Target Market:** 50M+ content creators globally, photographers, musicians, writers, AI art disputes

**Wow Factor:** In the age of AI-generated content, proving human authorship is gold. A photographer's portfolio shows each image with a Proofi seal: hash of the original file, signed by the photographer's verified wallet, timestamped on-chain. When someone claims the image is AI-generated, the photographer proves: "Here's the raw file hash from the moment of creation, cryptographically signed by my verified identity."

---

### 10. ProofiAge — Privacy-Preserving Age & Identity Verification

**One-liner:** Prove you're over 18 (or over 21, or a resident of X country) without revealing your ID, birthday, or any other personal data.

**How it uses Proofi:**
- **Wallet:** User has a Proofi wallet. A trusted identity verifier (government agency, bank, ID verification service) issues age/residency credentials.
- **DDC:** The full identity credential (with birthday, address, etc.) is stored encrypted in the user's DDC vault. A separate "derived credential" contains only the boolean claim ("over 18: true") signed by the same issuer.
- **Chain:** The derived credential's hash is on-chain, linking it to the issuer's verified public key without revealing the underlying data.

**Target Market:** Age-gated services ($500B+ — alcohol, gambling, adult content), e-commerce, social platforms facing regulatory pressure

**Wow Factor:** Buying alcohol online? Instead of uploading a photo of your passport to a random website, share a Proofi age credential. The merchant sees: "This person is over 18, verified by [trusted issuer], signature valid." They learn NOTHING else — not your name, not your birthday, not your address. Privacy AND compliance. This is the killer app for digital identity.

---

## OUTPUT 3: Chrome Extension Spec — Proofi Ecosystem Hub

---

### Overview

**Name:** Proofi Hub  
**Tagline:** "Your credentials. Your ecosystem. One click."  
**Purpose:** Chrome extension that serves as the gateway to the entire Proofi/Cere ecosystem — wallet access, credential management, DDC stats, ecosystem app directory, and live activity feed.

---

### Key Screens

#### Screen 1: Dashboard (Default Popup — 400×560px)

```
┌──────────────────────────────────────────┐
│  ◇ Proofi Hub                    ⚙️  ─   │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  5Gn8...kR4j          🟢 Connected │  │
│  │  12.45 CERE                        │  │
│  │  ████████████ ← identity strength  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │  📜  │  │  📝  │  │  🔗  │           │
│  │  7   │  │  23  │  │  4   │           │
│  │ Creds│  │ Memos│  │ Apps │           │
│  └──────┘  └──────┘  └──────┘           │
│                                          │
│  ── LIVE ACTIVITY ──────────────────     │
│  ⬡ Credential verified    2m ago        │
│  ⬡ Memo stored on DDC     15m ago       │
│  ⬡ New app connected      1h ago        │
│  ⬡ Badge earned: React    3h ago        │
│                                          │
│  ── DDC STATS ──────────────────────     │
│  Bucket #1229  │  Storage: 14.2 MB      │
│  Objects: 156  │  Last write: 2m ago    │
│                                          │
│  [ 🌐 Ecosystem ]  [ 📤 Share Profile ] │
│                                          │
└──────────────────────────────────────────┘
```

**Elements:**
- **Wallet Summary:** Address (truncated), CERE balance (via `/balance/:address` API), identity strength bar (calculated from credential count + diversity)
- **Quick Stats:** Credential count, memo count, connected app count — pulled from wallet's DDC index
- **Live Activity Feed:** Recent wallet events — credential issuances, memo stores, app connections, badge earnings. Polled from DDC index changes.
- **DDC Stats:** Real-time bucket stats — total storage used, object count, last write timestamp
- **Action Buttons:** Open ecosystem directory, share public profile link

#### Screen 2: Credential Viewer (Click any credential)

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
│  ── VERIFICATION PROOF ─────────────     │
│  Issuer Key: 5Fhq...rT9              │  │
│  Algorithm:  sr25519                     │
│  Verified:   ✅ Signature matches        │
│  Timestamp:  On-chain ✅                 │
│                                          │
│  [ 📋 Copy Proof Link ]                 │
│  [ 🔄 Re-verify ]                       │
│  [ 📤 Share ]                            │
│                                          │
└──────────────────────────────────────────┘
```

**Elements:**
- **Credential Card:** Visual presentation of the W3C VC with key fields extracted
- **Verification Proof Section:** Live re-verification — fetches credential from DDC, runs `signatureVerify()`, checks issuer's on-chain key. Shows green checkmarks for each verification step.
- **Actions:** Copy a verification link (anyone can verify), re-verify on demand, share to specific recipient

#### Screen 3: Ecosystem Directory (Full Tab Page)

```
┌──────────────────────────────────────────────────────────────────┐
│  ◇ Proofi Ecosystem                                    🔍 Search │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ── FEATURED ───────────────────────────────────────────────     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 🎓           │  │ 🏋️           │  │ 🏠           │          │
│  │ ProofiDegree │  │ ProofiBadge  │  │ ProofiRent   │          │
│  │ University   │  │ Skill        │  │ Tenant       │          │
│  │ diplomas     │  │ credentials  │  │ portfolio    │          │
│  │              │  │              │  │              │          │
│  │ 1.2K users   │  │ 890 users    │  │ 340 users    │          │
│  │ [Connect →]  │  │ [Connect →]  │  │ [Connect →]  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ── CATEGORIES ─────────────────────────────────────────────     │
│  [Education] [Work] [Health] [Identity] [Creator] [Governance]   │
│                                                                  │
│  ── ALL APPS ───────────────────────────────────────────────     │
│  ┌────┬──────────────────────┬──────────┬────────────┐          │
│  │ 🎓 │ ProofiDegree         │ 1.2K     │ Connect →  │          │
│  │ 🏋️ │ ProofiBadge          │ 890      │ Connect →  │          │
│  │ 💼 │ ProofiGig            │ 567      │ Connect →  │          │
│  │ 🏥 │ ProofiHealth         │ 234      │ Connect →  │          │
│  │ 🏛️ │ ProofiDAO            │ 445      │ Connect →  │          │
│  │ 🎪 │ ProofiEvent          │ 178      │ Connect →  │          │
│  │ 🏠 │ ProofiRent           │ 340      │ Connect →  │          │
│  │ 📦 │ ProofiSupply         │ 89       │ Connect →  │          │
│  │ 🎨 │ ProofiCreator        │ 1.1K     │ Connect →  │          │
│  │ 🔞 │ ProofiAge            │ 2.3K     │ Connect →  │          │
│  └────┴──────────────────────┴──────────┴────────────┘          │
│                                                                  │
│  ── NETWORK STATS ──────────────────────────────────────────     │
│  Total Wallets: 8,234  │  Credentials Issued: 45,891            │
│  DDC Storage: 2.1 GB   │  Apps: 10  │  Verifications: 12,345   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Elements:**
- **Featured Apps:** Top 3 ecosystem apps with visual cards, user counts, one-click connect
- **Category Filter:** Tabs for credential types — Education, Work, Health, Identity, Creator, Governance
- **App Directory:** Full list with icons, descriptions, user counts, and direct connect buttons
- **Network Stats:** Aggregate metrics from Cere chain — total wallets, credentials issued, DDC storage consumed, verification count

#### Screen 4: Settings & Identity

```
┌──────────────────────────────────────────┐
│  ← Back              SETTINGS            │
├──────────────────────────────────────────┤
│                                          │
│  ── IDENTITY ───────────────────────     │
│  Email:    mart@proofi.ai                │
│  Address:  5Gn8...kR4j                   │
│  Key Type: sr25519                       │
│  PIN:      [Change PIN]                  │
│                                          │
│  ── CONNECTED APPS ─────────────────     │
│  ProofiDegree     ✅  [Revoke]          │
│  ProofiCreator    ✅  [Revoke]          │
│  Demo App         ✅  [Revoke]          │
│                                          │
│  ── PERMISSIONS ────────────────────     │
│  Auto-approve reads:   [ON]             │
│  Notify on writes:     [ON]             │
│  Require PIN for sign: [ON]             │
│                                          │
│  ── ADVANCED ───────────────────────     │
│  Export Credentials (JSON-LD bundle)     │
│  Backup Wallet Index (DDC snapshot)      │
│  View Raw DDC Index                      │
│                                          │
│  ── NETWORK ────────────────────────     │
│  RPC: wss://rpc.mainnet.cere.network     │
│  DDC: Mainnet (Bucket #1229)             │
│  API: proofi-api-production.up.railway   │
│                                          │
└──────────────────────────────────────────┘
```

---

### Core Features

#### 1. Wallet Integration (No iframe needed)
The extension runs `@proofi/core` KeyringManager directly in the extension's background service worker. Email OTP auth is handled via a popup flow that communicates with the Proofi API. The derived sr25519 keypair is stored encrypted in `chrome.storage.local` (AES-256-GCM, key derived from user's PIN via PBKDF2).

**Auth Flow in Extension:**
1. User clicks extension icon → Login popup
2. Enter email → OTP sent
3. Enter OTP → API returns `derivationSalt`
4. Enter PIN → Client derives keypair: `PBKDF2(PIN, derivationSalt) → seed → sr25519 keypair`
5. Keypair stored encrypted in `chrome.storage.local`
6. Extension icon shows green dot (connected)

#### 2. Content Script Injection (dApp Auto-Detection)
The extension injects a content script that detects `window.__PROOFI_DAPP__` or `<meta name="proofi-app-id">` on web pages. When detected:
- Shows a connection prompt in the extension popup
- Injects `@proofi/inject` into the page (Polkadot extension API compatibility)
- Any dApp using `@polkadot/extension-dapp` will see "Proofi Hub" as an available wallet
- Custom Proofi SDK calls route through `chrome.runtime.sendMessage` → background service worker

#### 3. Credential Notifications
Background service worker polls the wallet's DDC index every 5 minutes:
- New credential issued to this wallet → Chrome notification: "🎓 New credential from University of Amsterdam"
- Credential verified by third party → Chrome notification: "✅ Your BSc diploma was just verified"
- Connected app activity → Badge update on extension icon

#### 4. One-Click Verification
On any page showing a Proofi credential link:
- Content script detects `proofi.ai/verify/...` URLs
- Adds a green shield overlay: "✅ Proofi Verified"
- Click → popup shows full verification proof (fetched from DDC, signature checked)

#### 5. Credential Sharing
Right-click context menu: "Share Proofi Credential" → opens credential selector → generates a shareable verification link or QR code that anyone can verify without the extension.

---

### Tech Stack

```
proofi-hub-extension/
├── manifest.json              # Manifest V3
├── src/
│   ├── background/
│   │   ├── service-worker.ts  # Main background logic
│   │   ├── wallet.ts          # KeyringManager wrapper + encrypted storage
│   │   ├── ddc-poller.ts      # DDC index polling for notifications
│   │   └── api-client.ts      # Proofi API HTTP client
│   ├── popup/
│   │   ├── App.tsx            # React popup UI (400×560px)
│   │   ├── screens/
│   │   │   ├── Dashboard.tsx  # Main dashboard view
│   │   │   ├── Login.tsx      # Email + OTP + PIN auth
│   │   │   ├── Credential.tsx # Individual credential viewer
│   │   │   └── Settings.tsx   # Settings & connected apps
│   │   ├── components/        # Shared UI components
│   │   └── stores/            # Zustand stores (wallet, credentials, activity)
│   ├── ecosystem/
│   │   └── index.html         # Full-tab ecosystem directory page
│   ├── content/
│   │   ├── detector.ts        # dApp detection (meta tags, __PROOFI_DAPP__)
│   │   ├── injector.ts        # @proofi/inject script injection
│   │   └── verifier.ts        # Proofi link detection & overlay
│   └── shared/
│       ├── types.ts           # Shared type definitions
│       ├── constants.ts       # API URLs, bucket ID, network config
│       └── crypto.ts          # Encryption/decryption for chrome.storage
├── packages/
│   ├── core/                  # @proofi/core (vendored — KeyringManager)
│   ├── comm/                  # @proofi/comm (vendored — RPC channel)
│   └── inject/                # @proofi/inject (vendored — Polkadot compat)
├── assets/
│   ├── icons/                 # Extension icons (16, 32, 48, 128px)
│   └── fonts/                 # Space Grotesk, Inter, JetBrains Mono
├── vite.config.ts             # Vite build config (CRXJS plugin)
├── tailwind.config.ts         # Tailwind with Proofi design tokens
└── tsconfig.json
```

**Dependencies:**
| Package | Purpose |
|---------|---------|
| React 18 | Popup & ecosystem page UI |
| Zustand | State management (same pattern as wallet UI) |
| Vite + CRXJS | Build & hot-reload for Manifest V3 |
| Tailwind CSS | Styling with Proofi brand tokens |
| @polkadot/util-crypto | sr25519 operations, signature verification |
| @polkadot/keyring | Key management |
| @cere-ddc-sdk/ddc-client | DDC read operations (credential fetching) |

---

### Build Plan

#### Phase 1: Core Wallet (Week 1-2)
- [ ] Scaffold Manifest V3 extension with Vite + CRXJS
- [ ] Port `@proofi/core` KeyringManager to run in service worker (WASM sr25519 in MV3)
- [ ] Build login popup: email → OTP → PIN → keypair derivation
- [ ] Encrypted keypair storage in `chrome.storage.local`
- [ ] Dashboard popup: address, balance (via `/balance/:address` API), connection status
- [ ] Basic settings page with network info

#### Phase 2: DDC Integration (Week 3-4)
- [ ] DDC index reading from service worker (wallet index via CDN: `cdn.ddc-dragon.com`)
- [ ] Credential list in popup (parsed from DDC index)
- [ ] Individual credential viewer with live re-verification
- [ ] Memo list display
- [ ] DDC stats (object count, storage used)
- [ ] Activity feed (derived from index changes between polls)

#### Phase 3: Content Scripts (Week 5-6)
- [ ] dApp detector content script (meta tags + global variable)
- [ ] `@proofi/inject` injection for Polkadot extension compatibility
- [ ] Proofi verification link detection + green shield overlay
- [ ] Right-click context menu: "Share Proofi Credential"
- [ ] Chrome notifications for new credentials and verifications

#### Phase 4: Ecosystem Page (Week 7-8)
- [ ] Full-tab ecosystem directory (opens via extension button)
- [ ] App cards with descriptions, user counts, connect buttons
- [ ] Category filtering and search
- [ ] Network stats aggregation (total wallets, credentials, storage)
- [ ] One-click connect to any ecosystem app (passes wallet connection)

#### Phase 5: Polish & Launch (Week 9-10)
- [ ] Brand compliance audit (brand-guide.md tokens in Tailwind config)
- [ ] Accessibility pass (keyboard nav, screen reader, contrast)
- [ ] Performance optimization (lazy load DDC data, cache credentials)
- [ ] Chrome Web Store listing: screenshots, description, privacy policy
- [ ] Beta launch with existing Proofi wallet users
- [ ] Collect feedback → iterate

---

### Security Model

| Concern | Mitigation |
|---------|------------|
| Private key storage | AES-256-GCM encrypted in `chrome.storage.local`, key derived from PIN via PBKDF2 (100K iterations) |
| Session management | Auto-lock after 15 minutes of inactivity, require PIN to unlock |
| Content script injection | Only inject `@proofi/inject` on pages with verified `proofi-app-id` meta tag |
| API communication | All API calls over HTTPS, signature auth (not JWT) for sensitive operations |
| Cross-origin messaging | Strict origin checking in `@proofi/comm`, only approved origins can communicate |
| Extension permissions | Minimal: `storage`, `notifications`, `activeTab` (not `<all_urls>` — only inject on detected dApp pages) |

---

## Summary: The Strategic Vision

**Proofi Wallet** is not just a wallet — it's the identity layer for the Cere ecosystem. The three agents (`proofi-qa`, `proofi-ux`, `proofi-sim`) ensure quality, visual consistency, and real-world readiness. The ten ecosystem concepts demonstrate that Proofi + DDC + Cere chain unlock use cases worth billions in market value. And the Chrome extension transforms Proofi from "a wallet you visit" into "a wallet that's always with you."

The flywheel:
1. **Ecosystem apps** give users reasons to create Proofi wallets
2. **More wallets** attract more app developers
3. **Chrome extension** makes the wallet frictionless and ever-present
4. **Verifiable credentials** create real-world value that's impossible to fake
5. **DDC storage** ensures users own their data forever — no platform lock-in

Proofi becomes to digital identity what Gmail became to email: the default, the standard, the one everyone has.
