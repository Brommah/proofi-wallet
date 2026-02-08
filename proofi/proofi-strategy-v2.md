# Proofi Wallet — Strategic Blueprint v2

**Date:** February 4, 2026  
**Author:** Clawd (Opus Strategy Agent)  
**Status:** Actionable — every proposal grounded in the live codebase  
**Codebase:** Brommah/proofi-wallet (6 packages, 36 API endpoints, live on Railway+Vercel)

---

# Table of Contents

1. [OUTPUT 1: Three Specialized Skill Agents](#output-1-three-specialized-skill-agents)
2. [OUTPUT 2: Ten Real Ecosystem Concepts](#output-2-ten-real-ecosystem-concepts)
3. [OUTPUT 3: Chrome Extension — Proofi Hub](#output-3-chrome-extension--proofi-hub)

---

# OUTPUT 1: Three Specialized Skill Agents

## Critical Context: Design System Inconsistency (the problem these agents solve)

Before defining agents, I need to document what I found reading every component. **The Proofi codebase has a design system split that needs reconciliation:**

### Current State of the UI (from reading every `.tsx` file):

**The "Brutal Dark" system** (used by LoginScreen, PinScreen, AccountScreen, DdcScreen, PinUnlockModal, OtpInput):
- Background: `#000` (void black)
- Accent: `#00E5FF` (electric cyan)
- Success: `#00FF88`
- Error: `#FF3366`
- Warning: `#FFB800`
- Font-display: `Bebas Neue` (`.text-display`)
- Font-mono: `Space Mono` (`.text-mono`)
- Font-body: `Inter` (`.text-body`)
- Labels: `Space Mono 0.625rem uppercase tracking-wider`
- Border-radius: `0` everywhere (enforced in `index.css`)
- Inputs: `.input-brutal` — `bg-obsidian, border-2 border-smoke, focus:border-cyan`
- Buttons: `.btn-primary` — `bg-cyan, color-void, font-display, uppercase`
- Cards: `border border-[#2A2A2A]` or `border-[#1A1A1A]`
- All sharp corners, no shadows, noise texture overlay

**The "Polished Rounded" system** (used by Button.tsx, SignScreen, ConnectScreen):
- Uses Tailwind utility classes: `rounded-2xl`, `rounded-xl`, `rounded-lg`
- Background: `bg-gray-900`, `bg-gray-800`
- Colors: `bg-blue-500`, `text-purple-400`, `text-amber-400`
- Button component: `rounded-xl px-5 py-2.5 text-sm font-semibold` — completely different from `.btn-primary`
- Cards: `rounded-2xl bg-gray-900 border border-gray-800`
- Uses soft shadows, gradients implied by the layered approach

**The Brand Guide** (`brand-guide.md`):
- Background: white/off-white (light mode)
- Accent: `#3B82F6` (blue, not cyan)
- Fonts: Space Grotesk / Inter / JetBrains Mono (NOT Bebas Neue, NOT Space Mono)
- Border-radius: `0` (same as brutal system)
- No shadows, no gradients

**Bottom line:** Three different design languages exist simultaneously. The live wallet uses the Brutal Dark system for 4/6 screens, but SignScreen and ConnectScreen use a completely different rounded system. The brand guide describes a third system (light, white background, blue accent). No agent strategy is meaningful without addressing this.

---

## Agent 1: `proofi-qa` — End-to-End Integration Test Agent

### Purpose
Automated testing of every Proofi flow — from email OTP authentication through DDC storage, credential issuance, wallet index management, and cross-device deterministic wallet recovery. This agent catches regressions before they reach production and validates that the decentralized index system remains consistent under concurrent operations.

### Specific Capabilities

**1. Authentication Flow Testing**
The agent simulates the complete 5-step auth flow:
1. `POST /auth/otp/send` with test email
2. Reads OTP from server console (dev mode) or test bypass
3. `POST /auth/otp/verify` → validates response contains `{ token, derivationSalt, email, hasAddress }`
4. Client-side key derivation: `PBKDF2(PIN, derivationSalt, 100000, SHA-256)` → 32-byte seed → `sr25519.fromSeed(seed)` → keypair
5. `POST /auth/register-address` with `Authorization: Bearer {JWT}` → registers `email → address` mapping

The agent validates:
- OTP rate limiting (6 attempts per email per 10 minutes, as defined in `otp/service.ts`)
- Derivation salt determinism (same email always produces same salt, given same `MASTER_SECRET`)
- Keypair determinism (same email + same PIN + same salt = same sr25519 address)
- JWT structure (ES256 signed, contains email claim, JWKS endpoint at `/auth/jwks`)
- Session restore (`localStorage` items: `proofi_token`, `proofi_email`, `proofi_address`, `proofi_encrypted_seed`)

**2. Signature Authentication Testing**
Tests the primary auth mechanism (non-JWT):
```
Authorization: Signature {address}:{timestamp}:{signature}
Message format: "proofi:{timestamp}:{address}"
Verification: sr25519 signatureVerify(message, signature, address)
Replay window: |now - timestamp| < 5 minutes
```
The agent:
- Generates valid signature headers from a test keypair
- Validates all authenticated endpoints accept signature auth
- Tests replay protection (reuse a timestamp from 6 minutes ago → should fail)
- Tests malformed signatures (wrong address, wrong format, truncated sig)
- Validates JWT fallback still works for backward compatibility

**3. DDC Storage Integrity Testing**
Tests every DDC operation against Bucket #1229:
- `POST /ddc/memo` → stores memo, returns `{ cid, cdnUrl }`
- `POST /ddc/credential` → issues W3C VC, returns `{ cid, cdnUrl, credential }`
- `GET /ddc/list` → reads wallet index via CNS (`pi-{last16chars}`)
- `GET /ddc/verify/{cid}` → retrieves credential and runs `signatureVerify()`
- CDN URL resolution: validates `cdn.ddc-dragon.com/1229/{cid}` returns stored data

The agent validates:
- CID consistency (same content → same CID)
- CNS name resolution (the `pi-{hash}` pattern resolves correctly)
- Index append semantics (`addToWalletIndex()` prepends entries, doesn't lose existing ones)
- Write lock correctness (concurrent writes to same wallet index don't lose data)
- In-memory cache invalidation (after write, subsequent reads reflect the update)
- Content types are preserved (memo vs credential vs GameAchievement)

**4. Credential Lifecycle Testing**
Full W3C Verifiable Credential lifecycle:
1. Issue: `POST /ddc/credential` with `{ claimType: "ProofOfIdentity", claimData: {...} }`
2. Store: credential stored on DDC with issuer signature (`Sr25519Signature2024`)
3. Retrieve: fetch credential from CDN URL
4. Verify: `signatureVerify()` against issuer's sr25519 public key (the server wallet's key)
5. Parse: validate `@context`, `type`, `issuer`, `credentialSubject`, `issuanceDate`, `proof` fields

The agent validates:
- Credential JSON-LD structure conforms to W3C VC Data Model
- Issuer address matches the server's funded wallet (`getIssuerAddress()`)
- Signature is valid sr25519 over the credential's canonical form
- `credentialSubject.address` matches the authenticated user's wallet
- Different credential types render correctly: `ProofOfIdentity`, `ProofOfOwnership`, `ProofOfMembership`, `ProofOfCompletion`, `GameAchievement`

**5. Cross-Device Recovery Testing**
Tests the deterministic wallet property:
1. User A authenticates on "device 1" (browser context 1): email + PIN → wallet address X
2. User A authenticates on "device 2" (browser context 2): same email + same PIN → must produce address X
3. Agent verifies: DDC index for wallet X is accessible from both contexts
4. Agent verifies: credentials stored from device 1 are visible from device 2

**6. Load & Chaos Testing**
- Fires 50 concurrent memo stores to test DDC client connection pooling
- Fires 20 concurrent `addToWalletIndex()` calls to test write lock behavior
- Introduces random 5-second delays in DDC responses to test timeout handling
- Tests behavior when DDC is unreachable (graceful error, no data corruption)
- Measures latency histograms: OTP send/verify, key derivation, DDC store, DDC read, signature verification

### Codebase Interaction

| What it imports | From | Purpose |
|---|---|---|
| `KeyringManager` | `@proofi/core` | Client-side keypair derivation and signing |
| `deriveSeedFromPin()` pattern | `stores/authStore.ts` | Replicate exact PBKDF2 derivation logic |
| `authHeaders()` pattern | `screens/DdcScreen.tsx` | Generate signature auth headers |
| `storeCredential`, `readCredential`, `readWalletIndex`, `addToWalletIndex` | `ddc/service.ts` | Direct DDC operations for server-side testing |
| `verifySignatureAuth` | `auth/signature.ts` | Validate signature verification logic |
| `OtpService` | `otp/service.ts` | Test OTP rate limiting and format |

### Example Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  proofi-qa Run #47 — 2026-02-04 14:30:00 CET               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. AUTH FLOW                                               │
│     ├─ OTP send for test@proofi.ai .......... ✅ 230ms     │
│     ├─ OTP verify (code: 847291) ............ ✅ 180ms     │
│     ├─ JWT structure valid .................. ✅            │
│     ├─ JWKS endpoint responds .............. ✅            │
│     ├─ derivationSalt deterministic ......... ✅            │
│     ├─ Key derivation (PBKDF2 100k) ........ ✅ 890ms     │
│     ├─ sr25519 keypair generated ............ ✅ 45ms      │
│     ├─ Address: 5Gn8kR4j... (matches prev) . ✅           │
│     └─ register-address .................... ✅ 120ms     │
│                                                             │
│  2. SIGNATURE AUTH                                          │
│     ├─ Valid signature accepted ............. ✅            │
│     ├─ Expired timestamp rejected ........... ✅            │
│     ├─ Malformed signature rejected ......... ✅            │
│     ├─ Wrong address rejected ............... ✅            │
│     └─ JWT fallback still works ............. ✅            │
│                                                             │
│  3. DDC STORAGE                                             │
│     ├─ Store memo ........................... ✅ 1.8s      │
│     ├─ CID returned matches CDN content ..... ✅            │
│     ├─ CNS name pi-{hash} resolves ......... ✅ 340ms     │
│     ├─ Wallet index updated correctly ....... ✅            │
│     ├─ Store credential (ProofOfIdentity) ... ✅ 2.1s      │
│     ├─ Credential W3C structure valid ....... ✅            │
│     ├─ Credential signature verifies ........ ✅ 120ms     │
│     ├─ DDC list returns both items .......... ✅            │
│     └─ CDN URL accessible .................. ✅            │
│                                                             │
│  4. CONCURRENT WRITES                                       │
│     ├─ 20 concurrent addToWalletIndex() ..... ✅ all 20    │
│     ├─ No entries lost ...................... ✅            │
│     └─ Write lock prevented corruption ...... ✅            │
│                                                             │
│  5. CROSS-DEVICE RECOVERY                                   │
│     ├─ Same email+PIN → same address ........ ✅            │
│     ├─ DDC index accessible from ctx 2 ...... ✅            │
│     └─ Credentials visible from ctx 2 ...... ✅            │
│                                                             │
│  SUMMARY: 25/25 passed | 0 failures | 0 regressions        │
│  DDC latency: avg 1.9s write, 0.34s read                   │
│  CERE consumed: ~0.5 CERE (storage gas)                     │
│                                                             │
│  Output: proofi/reports/qa-2026-02-04.json                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent 2: `proofi-ux` — Mobile-First Visual Alignment Agent

### Purpose
This agent addresses the critical design inconsistency problem. It audits every screen against a unified design specification, enforces mobile-first responsive behavior, identifies visual regressions, and generates actionable CSS patches. It's the enforcer of visual consistency.

### The Mobile Alignment Problem (What This Agent Solves)

The current Proofi wallet UI is built with `max-w-[400px] mx-auto` on the root `<div>` in `App.tsx`. This means:
- **It's mobile-width but not mobile-optimized.** It constrains to 400px but doesn't use proper mobile viewport meta, safe area insets, or touch interaction patterns.
- **The bottom nav** uses `fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[400px]` — correct positioning but no safe area padding for iOS notch devices.
- **Touch targets** are inconsistent: `.btn-primary` is `h-14` (56px, good), but filter chips in DdcScreen are `py-1.5 px-3` (~30px hit area, too small for mobile).
- **OTP input boxes** are `h-14 w-11` (56×44px) — adequate but tight on smaller screens (iPhone SE: 375px → 6 boxes × 44px + 5 × 8px gaps = 304px, leaves only 71px for padding).
- **SignScreen and ConnectScreen** use `rounded-2xl` cards and `rounded-xl` buttons — violating the brutal design system's zero-radius rule.
- **The `body::before` noise overlay** with `z-index: 9999` may interfere with touch events on some browsers.

### Specific Capabilities

**1. Screen-by-Screen Visual Audit**

The agent launches the wallet UI and systematically captures every screen at multiple viewport sizes:

| Viewport | Device | Width | Purpose |
|---|---|---|---|
| `375×812` | iPhone SE/13 mini | 375px | Minimum supported mobile |
| `390×844` | iPhone 14/15 | 390px | Standard iPhone |
| `393×873` | Pixel 7 | 393px | Standard Android |
| `400×860` | Proofi max-width | 400px | Current design boundary |
| `768×1024` | iPad Mini | 768px | Tablet (should scale up) |
| `1280×800` | Desktop | 1280px | Desktop (400px centered) |

For each viewport, it captures:

- **LoginScreen** in 3 states: empty, email entered, OTP input
- **PinScreen** in 3 states: create (step 1), confirm (step 2), restore flow
- **AccountScreen** in 4 states: main, send, receive, loading
- **DdcScreen** in 5 states: empty vault, items loaded, filter active, search active, add-to-vault open
- **ConnectScreen**: connection request dialog
- **SignScreen**: sign request dialog
- **PinUnlockModal**: overlay modal
- **DetailModal**: credential/memo detail view

Total: ~24 states × 6 viewports = **144 screenshots** per audit run.

**2. Design System Consistency Checker**

The agent parses every component's JSX and CSS classes, then validates against the canonical design system:

| Rule | Expected (Brutal Dark) | Check |
|---|---|---|
| Border radius | `0` everywhere (`.rounded-none` or no radius) | Flag any `rounded-*` class except `rounded-full` on status dots |
| Background | `bg-[#000]`, `bg-[#0A0A0A]`, `bg-[#141414]` | Flag any `bg-gray-*` or `bg-white` |
| Accent color | `#00E5FF` (`text-[#00E5FF]`, `border-[#00E5FF]`) | Flag any `text-blue-*`, `bg-blue-*` |
| Display font | `Bebas Neue` via `.text-display` class | Flag any `font-display` that isn't `.text-display` |
| Mono font | `Space Mono` via `.text-mono` class | Flag any bare `font-mono` that doesn't use Space Mono |
| Buttons | `.btn-primary` or `.btn-secondary` | Flag any inline button styles or `<Button>` component usage |
| Cards | `border border-[#2A2A2A]` or `border-[#1A1A1A]` | Flag any `border-gray-*` |
| Inputs | `.input-brutal` | Flag any bare `<input>` without `.input-brutal` |
| Labels | `.text-label` | Flag any inline label styling |
| Shadows | None | Flag any `shadow-*` or `box-shadow` |

**Specific violations currently detectable:**

```
⚠ SignScreen.tsx:
  - Line 23: `rounded-2xl` on container → should be `rounded-none` or no radius
  - Line 24: `bg-purple-500/10` → should use `bg-[#00E5FF]/10` or custom accent
  - Line 26: `text-purple-400` → off-palette
  - Line 51: `rounded-2xl bg-gray-900 border border-gray-800` → should be brutal card style
  - Line 53: `rounded-xl bg-gray-800` → rounded corners, wrong background

⚠ ConnectScreen.tsx:
  - Line 19: `rounded-2xl` on icon container
  - Line 21: `text-blue-400` → should be `text-[#00E5FF]`
  - Line 37: `rounded-2xl bg-gray-900 border border-gray-800` → same as SignScreen
  - Line 54: `rounded-lg bg-gray-800/50` → rounded corners

⚠ Button.tsx:
  - Entire component: Uses `rounded-xl`, `bg-blue-500`, `bg-gray-800` 
  - This component is ONLY used by SignScreen and ConnectScreen
  - Should be replaced with `.btn-primary` / `.btn-secondary` from index.css

⚠ AddressDisplay.tsx:
  - Line 26: `rounded-lg bg-gray-800 border border-gray-700` → should be brutal style
```

**3. Mobile Touch Target Audit**

Validates interactive elements meet the 44×44px minimum (WCAG 2.1 AA target size):

| Element | Current Size | Status |
|---|---|---|
| `.btn-primary` | full-width × 56px | ✅ Good |
| `.btn-secondary` | full-width × ~48px | ✅ Good |
| OTP input boxes | 44×56px | ✅ Good |
| Filter chips (DdcScreen) | ~60×30px | ⚠ Height too small (30px < 44px) |
| Nav items (bottom nav) | ~200×56px | ✅ Good |
| Search clear button (DdcScreen) | ~16×16px | ❌ Way too small (16px) |
| Back button (← BACK) | text-only, ~60×24px | ⚠ Height too small |
| Refresh button (DdcScreen header) | ~20×20px | ❌ Too small |
| Vault item cards | full-width × ~80px | ✅ Good |
| COPY/SHARE buttons | text-only, ~40×20px | ⚠ Too small |

**4. Safe Area & PWA Readiness Check**

For mobile web app experience, validates:
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- Bottom nav respects `env(safe-area-inset-bottom)` for iPhone notch/home indicator
- Top content respects `env(safe-area-inset-top)` for status bar
- `manifest.json` exists for PWA add-to-homescreen
- Theme color meta tag matches background (`#000000`)

**5. Accessibility Audit**

Runs axe-core and custom checks:
- Color contrast ratios (WCAG AA: 4.5:1 for text, 3:1 for large text)
  - `#8A8A8A` on `#000000` = 5.9:1 ✅ (body text)
  - `#4A4A4A` on `#000000` = 3.3:1 ⚠ (barely passes for large text, fails for small text)
  - `#00E5FF` on `#000000` = 10.7:1 ✅ (accent)
  - `#FF3366` on `#000000` = 5.0:1 ✅ (error)
- Focus indicators on all interactive elements
- `aria-label` on icon-only buttons (refresh, search clear, copy)
- Form label associations (`<label>` connected to `<input>`)
- Screen reader announcements for state changes (OTP sent, credential stored)
- Keyboard navigation order follows visual flow

**6. CSS Patch Generation**

When violations are found, the agent generates exact CSS/TSX patches:

```diff
// SignScreen.tsx — align to brutal design system
- <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4">
+ <div className="border border-[#2A2A2A] bg-[#0A0A0A] p-5 space-y-4">

- <Button variant="primary" fullWidth onClick={approve}>
+ <button onClick={approve} className="btn-primary flex-1 rounded-none h-14">
    Sign
- </Button>
+ </button>
```

### Codebase Interaction

| File | Purpose |
|---|---|
| `App.tsx` | Root layout, nav, screen routing — viewport constraints |
| `screens/*.tsx` (all 6) | Each screen audited for design tokens, touch targets, responsive behavior |
| `components/*.tsx` (all 4) | Component-level audit (Button.tsx is the main offender) |
| `index.css` | Canonical design system — source of truth for CSS classes |
| `stores/*.ts` | State shapes for mocking screen states in isolation |
| `brand-guide.md` | Brand reference (though the brutal dark system has diverged from this — agent documents the delta) |

### Example Workflow

```
proofi-ux Run — 2026-02-04
━━━━━━━━━━━━━━━━━━━━━━━━━━

📸 CAPTURING: 144 screenshots across 6 viewports × 24 states

🔍 DESIGN SYSTEM AUDIT:
   ├─ LoginScreen.tsx ............... ✅ 0 violations
   ├─ PinScreen.tsx ................. ✅ 0 violations
   ├─ AccountScreen.tsx ............. ✅ 0 violations
   ├─ DdcScreen.tsx ................. ✅ 0 violations (brutal system)
   ├─ SignScreen.tsx ................. ❌ 6 violations (rounded, off-palette)
   ├─ ConnectScreen.tsx .............. ❌ 5 violations (rounded, off-palette)
   ├─ Button.tsx .................... ❌ COMPONENT SHOULD BE REPLACED
   └─ AddressDisplay.tsx ............ ❌ 2 violations (rounded, off-palette)

📱 MOBILE TOUCH TARGETS:
   ├─ 8 elements below 44px minimum
   ├─ Filter chips: increase to py-3 (48px total)
   ├─ Clear search: add p-2 wrapper (36→44px)
   ├─ Refresh button: add p-3 wrapper (20→44px)
   └─ Back buttons: increase to py-3 px-4

📐 SAFE AREA:
   ├─ viewport-fit=cover: MISSING
   ├─ safe-area-inset-bottom on nav: MISSING
   ├─ PWA manifest: MISSING
   └─ theme-color meta: MISSING

♿ ACCESSIBILITY:
   ├─ 3 contrast failures (ash text on void background)
   ├─ 4 missing aria-labels (icon buttons)
   ├─ 2 missing form associations
   └─ Focus indicators present on inputs, missing on cards

🩹 PATCHES GENERATED: 4 files, 23 line changes
   → proofi/reports/ux-patches/SignScreen.patch
   → proofi/reports/ux-patches/ConnectScreen.patch
   → proofi/reports/ux-patches/Button.removal.patch
   → proofi/reports/ux-patches/mobile-safe-area.patch

📊 OUTPUT: proofi/reports/ux-audit-2026-02-04/
   ├─ screenshots/ (144 images)
   ├─ violations.json
   ├─ touch-targets.json
   ├─ accessibility.json
   └─ patches/ (4 patch files)
```

---

## Agent 3: `proofi-sim` — Multi-Actor Ecosystem Simulation Agent

### Purpose
Simulates realistic multi-party scenarios on the Proofi infrastructure: universities issuing diplomas, employers verifying them, freelancers building reputation portfolios, events distributing attendance proofs. This validates that the entire credential ecosystem works end-to-end before real partners onboard, and generates realistic load patterns that expose scaling issues.

### Why This Agent Is Critical

Proofi's current test coverage validates single-user flows: one person stores a memo, one person issues a credential. But the ecosystem concepts in Output 2 require **multi-party interactions** where:
- Different actors have different roles (issuer vs holder vs verifier)
- Credentials flow between wallets
- Verification happens without the original issuer being online
- Multiple apps share the same wallet's DDC index
- Credential schemas must be interoperable

None of this is tested today. This agent tests it all.

### Specific Capabilities

**1. Actor System**

The agent creates and manages a constellation of simulated Proofi wallets, each with a distinct role:

```
ACTOR REGISTRY
───────────────────────────────────────────────────────────
│ Actor             │ Role     │ Email               │ Address     │
├───────────────────┼──────────┼─────────────────────┼─────────────┤
│ Univ. of Amsterdam│ Issuer   │ admin@uva.sim       │ 5Fhq...rT9 │
│ Coursera          │ Issuer   │ creds@coursera.sim   │ 5HGj...wX2 │
│ Acme Corp         │ Verifier │ hr@acme.sim          │ 5Dkq...pR7 │
│ Alice (student)   │ Holder   │ alice@test.sim       │ 5Gn8...kR4 │
│ Bob (freelancer)  │ Holder   │ bob@test.sim         │ 5Ckw...mT5 │
│ Charlie (client)  │ Issuer   │ charlie@client.sim   │ 5Hnr...jQ8 │
│ Event: ETHGlobal  │ Issuer   │ orga@ethglobal.sim   │ 5Frp...sW3 │
│ Clinic: MedVault  │ Issuer   │ admin@medvault.sim   │ 5Gkj...nP6 │
│ DAO: ProtoDAO     │ Issuer   │ gov@protodao.sim     │ 5Ems...rV1 │
│ Platform: RentSafe│ Verifier │ check@rentsafe.sim   │ 5Bwn...hL4 │
───────────────────────────────────────────────────────────
```

Each actor goes through the full OTP → PIN → wallet derivation flow. All actors share DDC Bucket #1229 (the live production bucket) but with clearly tagged test data.

**2. Credential Flow Simulations**

**Scenario A: University Diploma Issuance & Verification**
```
UvA (issuer) → issues BSc Computer Science credential → stores in Alice's DDC index
  ↓
Acme Corp (verifier) → queries Alice's public credential feed
  ↓
Acme Corp → fetches credential from DDC via CID
  ↓
Acme Corp → signatureVerify(credential.proof, UvA.publicKey) → ✅ VALID
  ↓
Acme Corp → checks issuanceDate, credentialSubject fields → ✅ AUTHENTIC
```

**What's actually tested:**
- The issuer (UvA) can store a credential in another wallet's DDC index (requires the holder's consent or a shared store endpoint)
- The verifier (Acme Corp) can read a credential from DDC using only the CID/CDN URL (no auth needed for public reads)
- `sr25519 signatureVerify()` works with the issuer's public key extracted from the credential's `issuer.address` field
- The credential survives a full store→read→verify cycle without data loss

**Current limitation found:** The existing API stores credentials signed by the *server wallet* (the funded `cere-wallet.json`), not by an arbitrary issuer's wallet. For the ecosystem to work, the API needs an endpoint where an issuer signs with their own wallet and stores the pre-signed credential. The agent documents this gap and proposes the solution:

```
NEW ENDPOINT: POST /ddc/credential/pre-signed
Body: { credential: <complete W3C VC with proof already attached> }
Auth: Signature header from the holder's wallet (to authorize storage in their index)
Behavior: Store the credential on DDC without re-signing (the issuer already signed it)
```

**Scenario B: Freelancer Reputation Chain**
```
Charlie (client) → issues "work completion" credential → stores in Bob's DDC index
  ↓
[Repeat with 10 different clients, each issuing a completion credential]
  ↓
New client → queries Bob's DDC index → sees 10 verified work completions
  ↓
New client → verifies each credential's issuer signature → all ✅
  ↓
New client → sees aggregate: "10 gigs, all verified, 8 unique clients"
```

**Scenario C: Credential Revocation**
```
UvA → issues credential to Alice → stores on DDC
  ↓
[Time passes, credential needs revocation]
  ↓
UvA → issues "revocation credential" referencing original CID
  ↓
Verifier → reads credential → checks for revocation entries → REVOKED
```

**Note:** DDC is append-only. Revocation requires a separate revocation credential or a credential status list pattern. The agent tests both approaches and recommends the better one.

**Scenario D: Cross-App Credential Sharing**
```
Alice connects to ProofiDegree → app issues a diploma credential
  ↓
Alice connects to ProofiGig → app reads Alice's DDC index → sees diploma
  ↓
ProofiGig uses diploma as part of Alice's professional profile
```

**What's tested:** Multiple ecosystem apps reading the same wallet's DDC index and correctly parsing different credential types.

**3. Throughput & Scaling Tests**

| Simulation | Scale | Metrics Captured |
|---|---|---|
| 100 users each storing 5 credentials | 500 DDC writes | Write latency P50/P90/P99, total CERE consumed |
| 50 concurrent OTP sends | API rate limiting | Which requests are throttled, response codes |
| 20 wallets each with 50 credentials in index | Large index read | Index read latency vs index size |
| 10 verifiers each verifying 100 credentials | 1000 verify operations | Verification latency, CDN cache hit rate |
| DDC bucket storage projection at 10K/100K/1M users | Cost modeling | CERE per user per month |

**4. Economics Modeling**

The agent tracks CERE token consumption for every operation:

```
OPERATION COST BREAKDOWN (measured, not estimated)
──────────────────────────────────────────────────
Store memo (avg 200 bytes):      0.05 CERE
Store credential (avg 1.2KB):    0.08 CERE  
Update wallet index (avg 500B):  0.05 CERE
Total per credential issuance:   ~0.18 CERE (store + index update × 2)
Total per memo:                  ~0.10 CERE

PROJECTION:
  1K users × 10 creds/user = 10K creds → ~1,800 CERE
  10K users × 20 creds/user = 200K creds → ~36,000 CERE
  100K users × 30 creds/user = 3M creds → ~540,000 CERE

Current bucket balance: 105 CERE → supports ~580 credentials
```

**5. Failure Mode Testing**

| Failure | Expected Behavior | Tested |
|---|---|---|
| DDC node unreachable | API returns 503, no data corruption | Yes |
| CNS resolution timeout | Falls back to in-memory cache | Yes |
| Invalid signature on credential | `signatureVerify()` returns false, API returns 401 | Yes |
| Wallet index corrupted (invalid JSON) | API returns error, doesn't overwrite with partial data | Yes |
| Concurrent index writes race condition | Write lock serializes, no entries lost | Yes |
| Server wallet runs out of CERE | Storage operations fail gracefully with clear error | Yes |
| Expired JWT with no signature fallback | Returns 401, user re-authenticates | Yes |

### Codebase Interaction

| Import | Source | Purpose |
|---|---|---|
| Full `@proofi/api` server | `server.ts` | Runs against live or local API |
| `@proofi/core` KeyringManager | `packages/core/` | Creates multiple actor keypairs |
| `@proofi/sdk` ProofiSDK | `packages/sdk/` | Tests SDK integration for host apps |
| `@polkadot/api` | External | Reads on-chain state (balance, transactions) |
| `@cere-ddc-sdk/ddc-client` | External | Direct DDC reads for verification |

### Example Workflow

```
proofi-sim Run — Scenario: Full Ecosystem Day
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACTORS CREATED: 10 wallets (4 issuers, 4 holders, 2 verifiers)
AUTH TIME: 10 actors × ~1.3s = 13s total

SCENARIO A: University Diploma
  ├─ UvA issues BSc CS to Alice .............. ✅ 2.1s
  ├─ Credential in Alice's DDC index ......... ✅
  ├─ Acme Corp fetches credential ............ ✅ 0.4s
  ├─ Acme Corp verifies sr25519 signature .... ✅ 0.12s
  └─ Full lifecycle: 2.62s

SCENARIO B: Freelancer Reputation (10 gigs)
  ├─ 10 clients each issue completion cred ... ✅ avg 2.3s each
  ├─ Bob's index shows 10 credentials ....... ✅
  ├─ All 10 signatures verify ............... ✅ avg 0.11s each
  └─ Full lifecycle: 24.1s

SCENARIO C: Event Attendance
  ├─ ETHGlobal issues attendance to 4 holders  ✅ 8.8s total
  ├─ Each holder's index updated ............ ✅
  └─ Cross-verification: all 4 verify ........ ✅ 0.5s

THROUGHPUT TEST: 50 concurrent credential stores
  ├─ Success: 50/50
  ├─ Latency: P50=2.1s, P90=3.4s, P99=5.2s
  ├─ No index corruption detected
  └─ CERE consumed: 9.0 CERE

ECONOMICS:
  ├─ Cost per credential: 0.18 CERE ($0.0036 at $0.02/CERE)
  ├─ Cost per user per year (30 creds): 5.4 CERE ($0.108)
  ├─ Bucket #1229 remaining: 96 CERE (~533 more credentials)
  └─ ⚠ NEED REFILL at 10K users

GAPS IDENTIFIED:
  1. No pre-signed credential endpoint (issuers can't use own keys)
  2. No revocation mechanism tested (append-only DDC)
  3. Index read latency grows linearly with entry count (no pagination)
  4. Server wallet is single point of payment (needs deposit model)

OUTPUT: proofi/reports/sim-2026-02-04.json (full metrics + gap analysis)
```

---

# OUTPUT 2: Ten Real Ecosystem Concepts

Each concept is designed to be **buildable NOW** on the existing Proofi infra (email OTP auth → sr25519 wallet → DDC storage → W3C VCs → signature verification). Where a concept requires API extensions, I specify exactly what's needed.

---

## 1. ProofiDegree — Tamper-Proof University Diplomas

**One-liner:** Universities issue blockchain-verified diplomas that graduates own forever — verified in 2 seconds by anyone, without contacting the university.

**How it uses Proofi:**

| Layer | Usage |
|---|---|
| **Wallet** | University admin authenticates via email OTP → gets issuer wallet (sr25519). Graduate authenticates → gets holder wallet. Each wallet is deterministic from email+PIN, so the university can issue from any device. |
| **DDC** | The diploma is a W3C VC stored as JSON-LD in DDC Bucket #1229 under the graduate's wallet index (CNS: `pi-{grad_addr_hash}`). Fields: `credentialSubject.degree`, `credentialSubject.institution`, `credentialSubject.graduationDate`, `credentialSubject.gpa`. The issuer's sr25519 signature is in the `proof` field. |
| **Chain** | The issuer's public key resolves on Cere chain. The credential's CID can optionally be anchored as an on-chain remark for timestamping. The DDC storage itself is paid from the platform's funded wallet. |

**API extension needed:** `POST /ddc/credential/issued-by` — endpoint accepting a pre-signed credential where the issuer used their own wallet key (not the server wallet). This separates the issuer identity from the storage payer.

**Target Market:** 250,000+ universities worldwide, 7.9M graduates/year in the US alone, employers conducting 300M background checks/year.

**Wow Factor:** An employer scans a QR code on a résumé. The QR encodes a CDN URL: `cdn.ddc-dragon.com/1229/{cid}`. The credential loads in <1 second. The employer's browser runs `sr25519.signatureVerify()` — pure client-side, no API call needed. Green checkmark: "BSc Computer Science, University of Amsterdam, 2025. Cryptographically verified." No background check company. No $200 fee. No 3-week wait. Two seconds.

---

## 2. ProofiBadge — Living Skill Credentials for Bootcamps & Courses

**One-liner:** Course platforms issue skill badges that evolve as you learn — not a static PNG, but a cryptographic proof of skill that grows with you.

**How it uses Proofi:**

| Layer | Usage |
|---|---|
| **Wallet** | Course platform (bootcamp, MOOC) gets an issuer wallet. Each student gets a holder wallet via email OTP. The student's wallet is the same across all platforms — one identity, many issuers. |
| **DDC** | Each badge is a VC with a `credentialSubject.skills` array. As modules complete, the issuer issues updated VCs with expanded skill arrays. Version history is preserved in DDC (old CIDs remain accessible, new CIDs in the index show progression). The wallet index entries have `credentialType: "SkillBadge"` and `createdAt` timestamps showing progression. |
| **Chain** | Each badge issuance creates a new DDC entry. The CNS index pointer updates atomically via `addToWalletIndex()`. Timeline of skill acquisition is immutable. |

**Buildable now?** Yes. Uses existing `POST /ddc/credential` with `claimType: "ProofOfCompletion"` and structured `claimData`. The DdcScreen already categorizes credentials by type and shows them with appropriate icons.

**Target Market:** Online education ($400B market), 220M+ learners on MOOCs, coding bootcamps ($800M market), corporate training ($370B market).

**Wow Factor:** A developer's portfolio page pulls their Proofi wallet credentials. Badges appear with animation — each one showing the skill, the issuer, the date. Click a badge → see the full VC with sr25519 proof. Not a Credly PNG that anyone can screenshot. A cryptographic chain of proof: "This person learned React (Feb 2025), then TypeScript (Apr 2025), then Full Stack (Jul 2025), each verified by Codecademy's wallet." The progression tells a story that a résumé can't.

---

## 3. ProofiGig — Freelancer Reputation Passport

**One-liner:** Freelancers collect verified client reviews into a portable reputation wallet that survives platform death, deplatforming, and career pivots.

**How it uses Proofi:**

| Layer | Usage |
|---|---|
| **Wallet** | Freelancer has a Proofi wallet (their permanent professional identity). Each client gets a temporary issuer capability — they authenticate, issue one "work completion" credential, done. No ongoing account needed. |
| **DDC** | Each gig completion is a VC: `credentialSubject.project` (name), `credentialSubject.rating` (1-5), `credentialSubject.deliverables` (array), `credentialSubject.dates` (start/end), `credentialSubject.feedback` (text). Stored in the freelancer's DDC index. The freelancer controls visibility — they can share their full index or generate selective proof links. |
| **Chain** | Credential count and issuer diversity are publicly derivable from the wallet index. A "reputation score" can be computed client-side by counting unique issuer addresses and averaging ratings from their credentials. |

**API extension needed:** A lightweight "issue one credential" flow for non-power-users (the client). Could be a simple web page where the client enters details, signs with their wallet, and the credential is stored in the freelancer's index. One `POST /ddc/credential` call.

**Target Market:** 1.57 billion freelancers worldwide ($1.3T market), platforms losing trust (Upwork takes 20% fee), independent consultants.

**Wow Factor:** A freelancer leaves Upwork with zero portable reputation. They sign up for Proofi, email their top 10 clients a link. Each client clicks, enters their review, and signs with their wallet. In one afternoon, the freelancer has 10 cryptographically verified work reviews that no platform controls. They send this Proofi link to new clients forever. The reviews are immutable — the client can't retract them, the freelancer can't edit them. Pure, verifiable trust.

---

## 4. ProofiHealth — Patient-Controlled Medical Records

**One-liner:** Patients store verified vaccination records, lab results, and prescriptions in their encrypted Proofi vault — and share them with a QR code scan.

**How it uses Proofi:**

| Layer | Usage |
|---|---|
| **Wallet** | Patient creates a Proofi wallet (email + PIN). Healthcare provider has an issuer wallet. The PIN protects the wallet on-device; the DDC data can be encrypted with the patient's public key for at-rest encryption. |
| **DDC** | Medical credentials stored as VCs: `credentialSubject.vaccination` (type, date, lot), `credentialSubject.labResult` (test, value, range), `credentialSubject.prescription` (medication, dosage, duration). Each credential is stored with `credentialType: "MedicalCredential"`. Patient shares selective access by providing CDN URLs for specific credentials. |
| **Chain** | Credential existence provable without revealing contents. The CID on DDC is public, but the content can be encrypted — a verifier with the shared key can decrypt and verify, others see only encrypted data. |

**API extension needed:** Encrypted credential storage — the credential JSON is encrypted with the holder's public key before DDC storage. The holder decrypts locally before sharing. Alternatively, the holder generates a time-limited shared key for a specific verifier.

**Target Market:** Healthcare ($12T global market), travelers needing vaccine passports, the 80% of patients who can't access their own medical records.

**Wow Factor:** Traveling internationally. Border agent asks for vaccination proof. Instead of digging through email for a PDF from 2023, you open the Proofi app → Medical → show QR code → agent scans → sees: "COVID-19 Vaccine (Pfizer), 3 doses, last: 2025-09-15, issued by: Amsterdam UMC, signature: ✅ VALID." The agent learned nothing about you except that you're vaccinated. Not your name, not your birthday, not your other medical history. Just the fact they need, cryptographically proven.

---

## 5. ProofiDAO — Governance Credentials for DAOs

**One-liner:** DAOs issue membership tokens, voting rights, and contributor credentials that members carry in their Proofi wallets — portable governance across the DAO ecosystem.

**How it uses Proofi:**

| Layer | Usage |
|---|---|
| **Wallet** | DAO has an org wallet (multi-sig potential in future). Members authenticate via email → get Proofi wallets. The sr25519 key can sign governance votes. Same key for identity and voting — no separate governance token needed. |
| **DDC** | Membership credential: `credentialType: "ProofOfMembership"`, `claimData: { dao: "ProtoDAO", role: "Core Contributor", joinDate: "2025-03-01", votingWeight: 1 }`. Role changes trigger new credentials (promotion = new VC, old one remains as history). Voting history stored as a series of vote credentials. |
| **Chain** | Cere chain records credential issuance timestamps. Future: a lightweight governance smart contract reads the credential to validate voting eligibility. |

**Buildable now?** Yes. Uses existing `ProofOfMembership` credential type. DdcScreen already shows these with a 👥 icon.

**Target Market:** 13,000+ active DAOs, web3 communities, open source foundations, co-ops.

**Wow Factor:** A DAO contributor joins a new DAO. Instead of "trust me, I've contributed before," they share their Proofi wallet link. The new DAO sees: "Core Contributor at ProtoDAO since March 2025 (verified). 142 governance votes cast. 23 proposals authored. Reputation: 4.8/5 across 3 DAOs." All cryptographically verified. The DAO can grant immediate elevated access based on proven credentials, not social proof.

---

## 6. ProofiEvent — Verifiable Event Attendance & Networking

**One-liner:** Conferences issue cryptographic proof-of-attendance and enable verified contact exchange — no more "who was that person I met?"

**How it uses Proofi:**

| Layer | Usage |
|---|---|
| **Wallet** | Event organizer has an issuer wallet. Each attendee authenticates via email → gets a Proofi wallet. Check-in kiosks issue attendance credentials. |
| **DDC** | Attendance credential: `credentialType: "ProofOfAttendance"`, `claimData: { event: "ETHGlobal 2026", location: "Amsterdam", dates: "2026-04-15/17", tracks: ["DeFi", "Identity"], role: "Speaker" }`. Contact exchange: when two people swap, both issue a "ConnectionCredential" to each other — mutual attestation of meeting. |
| **Chain** | Attendance credential is a soulbound proof (can't be transferred, only issued by the event organizer's verified wallet). |

**Buildable now?** Yes. Uses standard credential issuance. The "contact exchange" requires both parties to issue credentials to each other, which can be done via the existing `POST /ddc/credential` endpoint.

**Target Market:** $1.5T events industry, 1.2B business cards exchanged annually (most lost within a week), conference organizers seeking digital transformation.

**Wow Factor:** Two years after a conference, someone claims "I spoke at ETHGlobal 2026." You can verify in 2 seconds — their Proofi wallet shows a ProofOfAttendance credential with role: "Speaker", signed by ETHGlobal's verified organizer wallet. No photo evidence needed. No "I think I remember you." Cryptographic proof you were there, what you did, and who you met.

---

## 7. ProofiRent — Tenant Verification Portfolio

**One-liner:** Renters build a verified portfolio of landlord references, payment history, and identity verification — apartment applications in minutes, not weeks.

**How it uses Proofi:**

| Layer | Usage |
|---|---|
| **Wallet** | Tenant has a Proofi wallet. Previous landlords issue "tenancy credentials" — dates, payment consistency, property condition. KYC services issue identity verification credentials. |
| **DDC** | Tenancy credential: `credentialSubject.tenancy` with fields for `address`, `startDate`, `endDate`, `monthlyRent`, `paymentConsistency` ("always on time"), `propertyCondition` ("excellent"), `wouldRentAgain` (true/false). Income verification: `credentialType: "IncomeVerification"` issued by employer or bank. |
| **Chain** | Number of verified tenancy credentials and unique landlord issuers creates an on-chain "trust score" without revealing personal data. |

**Target Market:** 44% of Americans rent (44.1M households), 1.1B renters globally, property management companies tired of paper applications.

**Wow Factor:** Apartment hunting in a competitive market. You send the landlord your Proofi link. They see: "3 previous tenancies (2018-2024), all verified by different landlords. Payment: always on time. Condition: excellent. All 3 landlords would rent again. KYC: verified identity." Application approved same day. The landlord didn't need to call references, verify employment, or request bank statements. Everything is cryptographically verified, and you shared only what's relevant — not your full financial history.

---

## 8. ProofiSupply — Product Provenance Tracking

**One-liner:** Products carry verifiable origin credentials from farm to shelf — scan a QR code, see the entire chain of custody with cryptographic proof.

**How it uses Proofi:**

| Layer | Usage |
|---|---|
| **Wallet** | Each supply chain participant (farmer, processor, shipper, retailer) has a Proofi wallet. Products get a "product wallet" derived from a deterministic product ID (using the same email+PIN pattern but with `productId@supply.proofi.ai` as the email). |
| **DDC** | Each handler issues a provenance credential: `credentialType: "ProvenanceStep"`, `claimData: { product: "Ethiopian Yirgacheffe Coffee", step: "Harvest", location: { lat, lng }, handler: "Kefa Cooperative", certifications: ["Fair Trade", "Organic"], timestamp: "2026-01-15" }`. The chain of credentials in the product's DDC index tells the full story. |
| **Chain** | Each step is a separate DDC write with its own CID. The credential chain is ordered by `createdAt` in the wallet index. Any consumer can verify each handler's identity and certification. |

**API extension needed:** Product wallet derivation — a variant of the auth flow that creates wallets for products, not people. Could use a service account pattern where the supply chain platform's wallet creates sub-wallets.

**Target Market:** $26B supply chain management market, organic certification ($200B organic market), luxury goods authentication ($350B market), conflict mineral tracking (regulatory requirement).

**Wow Factor:** You scan the QR code on your coffee bag at the supermarket. A page loads showing: "Farm: Kefa Cooperative, Jimma, Ethiopia (GPS verified, photo attached). Processed: Jan 22, Addis Ababa (Fair Trade certified, signed by processor). Shipped: Jan 28, Djibouti → Rotterdam (temperature log attached, shipping credential). Roasted: Feb 5, Lot & Dun, Amsterdam (quality grade: 87/100)." Every step is signed by the actual handler's wallet. Not a marketing story — cryptographic provenance.

---

## 9. ProofiCreator — Content Authenticity Certificates

**One-liner:** Digital creators sign their work with verifiable authorship credentials — proving who made what, when, in an age where AI-generated content is indistinguishable from human.

**How it uses Proofi:**

| Layer | Usage |
|---|---|
| **Wallet** | Creator authenticates with Proofi → their sr25519 key becomes their creator identity. The wallet address serves as a persistent creator ID across all platforms. |
| **DDC** | Each piece of content gets an "authorship credential": `credentialType: "ContentAuthorship"`, `claimData: { contentHash: sha256(file), title: "Sunset over Amsterdam", mediaType: "image/jpeg", dimensions: "4000x3000", createdAt: "2026-02-04T14:30:00Z", toolsUsed: ["Canon EOS R5", "Lightroom"], aiGenerated: false }`. The content hash is the key — it links the credential to the exact file. |
| **Chain** | Content hash + creator address + timestamp form an immutable proof-of-creation. The CID on DDC provides the evidence. The Cere chain block height provides the timestamp. |

**Buildable now?** Yes. Uses standard credential issuance. The client-side hashing (SHA-256 of the content file) happens in the creator's browser. The hash is included in the `claimData` and signed as part of the credential.

**Target Market:** 50M+ content creators globally, photographers ($44B market), musicians, writers, news organizations fighting deepfakes, brands needing authentic UGC.

**Wow Factor:** A photographer posts an image. Someone claims it's AI-generated. The photographer shares a Proofi link: "This image (hash: `a3f8c2...`) was created by wallet `5Gn8...` on February 4, 2026 at 14:30 CET. Signed with sr25519. Verified ✅." The hash matches the original file exactly. The timestamp predates the AI claim. The signature proves the photographer's wallet created the credential. In a world drowning in AI content, human authorship with cryptographic proof is the new premium.

---

## 10. ProofiAge — Privacy-Preserving Age & Identity Verification

**One-liner:** Prove you're over 18 without revealing your birthday, name, or any other personal data — privacy AND compliance, simultaneously.

**How it uses Proofi:**

| Layer | Usage |
|---|---|
| **Wallet** | User has a Proofi wallet. A trusted identity verifier (government, bank, established KYC provider like Onfido/Jumio) issues age/residency credentials to the user's wallet. |
| **DDC** | Two-layer credential system: (1) Full identity credential stored encrypted in user's DDC vault — birthday, full name, address, ID number. Only the user's key can decrypt. (2) Derived credential stored unencrypted: `credentialType: "AgeVerification"`, `claimData: { claim: "age >= 18", result: true, verifierName: "Government of Netherlands", verifiedAt: "2026-01-15" }`. The derived credential contains ONLY the boolean claim and the verifier's signature — no personal data. |
| **Chain** | The derived credential's CID is on DDC, its issuer's public key resolves on Cere chain. Anyone can verify that a trusted verifier attested "this person is over 18" without learning anything else. |

**API extension needed:** Encrypted storage mode for DDC credentials (full identity credential). Selective disclosure mechanism — a way to derive a minimal credential from a complete one, both signed by the same issuer.

**Target Market:** Age-gated services ($500B+ market — alcohol, cannabis, gambling, adult content), e-commerce age checks ($4.9T e-commerce market), social platforms under regulatory pressure (EU Digital Services Act, UK Online Safety Act).

**Wow Factor:** You're buying alcohol online. The checkout asks for age verification. Instead of uploading a photo of your passport to a random e-commerce site (which then has your full identity data forever), you share a Proofi age credential. The merchant sees exactly one thing: "This person is 18+, verified by Government of Netherlands, signature valid ✅." They learn nothing else. Not your name. Not your birthday. Not your address. Not your ID number. The merchant is compliant (they verified age), and you're private (you revealed nothing). This is the killer app for digital identity. Every other solution forces a privacy-vs-compliance tradeoff. Proofi eliminates it.

---

# OUTPUT 3: Chrome Extension — Proofi Hub

## Design Philosophy

The extension follows the **Brutal Dark** design system from the wallet UI (not the brand guide's light system). This is a deliberate choice: the wallet is the living product, the brand guide is aspirational for the marketing site. The extension must be visually indistinguishable from the wallet — same fonts, colors, borders, and zero border-radius.

**Design tokens (from `index.css`):**
- Background: `#000000` (void), `#0A0A0A` (obsidian), `#141414` (graphite)
- Accent: `#00E5FF` (cyan)
- Success: `#00FF88`, Warning: `#FFB800`, Error: `#FF3366`
- Borders: `#1A1A1A` (steel), `#2A2A2A` (smoke)
- Text: `#FFFFFF` (white), `#8A8A8A` (silver), `#4A4A4A` (ash)
- Display: `Bebas Neue`, Mono: `Space Mono`, Body: `Inter`
- Border-radius: `0` everywhere
- No shadows, no gradients

---

## Key Screens

### Screen 1: Dashboard (Default Popup — 400×580px)

This is what opens when you click the extension icon. It must deliver maximum value in a single glance.

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  ┌─ PROOFI HUB ──────────────────────── ⚙ ─────┐   │
│  │  DATA OWNERSHIP PROTOCOL              Settings│   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  BALANCE                                      │   │
│  │  12.45                                        │   │
│  │  CERE                        MAINNET · ● LIVE │   │
│  │                                               │   │
│  │  5Gn8kR4j...mT5v                    [COPY]   │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  CREDS   │ │  MEMOS   │ │  APPS    │            │
│  │          │ │          │ │          │            │
│  │    7     │ │    23    │ │    4     │            │
│  │          │ │          │ │          │            │
│  │  ▲ +2   │ │  ▲ +5   │ │  ── 0   │            │
│  │  7d     │ │  7d     │ │  7d     │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│                                                      │
│  ── IDENTITY STRENGTH ──────────────────────────    │
│  ████████████████████░░░░░░░░  67%                  │
│  Add: employment history, skill badges              │
│                                                      │
│  ── LIVE ACTIVITY ──────────────────────────────    │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 📜  Credential verified          2m ago      │   │
│  │     BSc Computer Science · UvA               │   │
│  ├──────────────────────────────────────────────┤   │
│  │ 📝  Memo stored on DDC           15m ago     │   │
│  │     "Project notes for Q1..."                │   │
│  ├──────────────────────────────────────────────┤   │
│  │ 🔗  App connected                1h ago      │   │
│  │     ProofiDegree · read, verify              │   │
│  ├──────────────────────────────────────────────┤   │
│  │ 🎮  Achievement earned           3h ago      │   │
│  │     NEURAL REFLEX · Lightning Reflexes       │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ── DDC STORAGE ────────────────────────────────    │
│  BUCKET #1229      ▏ 14.2 MB USED                  │
│  30 OBJECTS         ▏ LAST WRITE: 2m ago            │
│                                                      │
│  ┌───────────────────────┐┌─────────────────────┐   │
│  │   🌐 ECOSYSTEM        ││   📤 SHARE PROFILE   │   │
│  └───────────────────────┘└─────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Element specifications:**

| Element | Styling | Data Source |
|---|---|---|
| Header | `text-label`, `#00E5FF`, `Space Mono 0.625rem uppercase` | Static |
| Balance | `text-display text-display-xl` (`Bebas Neue`, `clamp(3rem, 12vw, 6rem)`) | `GET /balance/:address` (API proxy, same as AccountScreen) |
| Address | `text-mono text-xs text-[#8A8A8A]` truncated | `localStorage.proofi_address` |
| Stat boxes | `border border-[#2A2A2A] p-4`, count in `text-display text-lg`, delta in `text-mono text-xs text-[#00FF88]` | DDC index entry count, filtered by type |
| Identity strength | Custom progress bar, `bg-[#00E5FF]` filled, `bg-[#2A2A2A]` empty | Calculated: (unique credential types / total possible types) × 100 |
| Activity feed | `border border-[#1A1A1A]` per item, `text-mono text-xs` for time | DDC index entries sorted by `createdAt` |
| DDC stats | `text-label` for labels, `text-mono text-sm` for values | Bucket metadata (future: DDC API for bucket stats) |
| Action buttons | `border-2 border-[#00E5FF]/30 bg-[#00E5FF]/5` (same as AccountScreen action buttons) | Navigation |

### Screen 2: Credential Viewer (Click credential in feed)

```
┌──────────────────────────────────────────────────────┐
│  ← BACK                        CREDENTIAL            │
│──────────────────────────────────────────────────────│
│                                                      │
│  📜  PROOF OF COMPLETION                             │
│  ──────────────────────────────────────              │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  TITLE                                        │   │
│  │  BSc Computer Science                         │   │
│  ├──────────────────────────────────────────────┤   │
│  │  ISSUER                                       │   │
│  │  University of Amsterdam                      │   │
│  │  5Fhq...rT9 · sr25519                        │   │
│  ├──────────────────────────────────────────────┤   │
│  │  DATE                                         │   │
│  │  July 15, 2025                                │   │
│  ├──────────────────────────────────────────────┤   │
│  │  STATUS                                       │   │
│  │  ● VERIFIED — Signature valid                 │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ── VERIFICATION PROOF ─────────────────────────    │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  ISSUER KEY                                   │   │
│  │  5Fhq...rT9                                   │   │
│  ├──────────────────────────────────────────────┤   │
│  │  ALGORITHM                                    │   │
│  │  Sr25519Signature2024                         │   │
│  ├──────────────────────────────────────────────┤   │
│  │  SIGNATURE                                    │   │
│  │  ● MATCHES                                    │   │
│  ├──────────────────────────────────────────────┤   │
│  │  TIMESTAMP                                    │   │
│  │  ● ON-CHAIN (Block #4,891,023)                │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ── CONTENT ID ─────────────────────────────────    │
│  bafy2bzacea...x4k2                       [COPY]    │
│                                                      │
│  ── CDN URL ────────────────────────────────────    │
│  cdn.ddc-dragon.com/1229/bafy...          [COPY]    │
│                                                      │
│  ┌──────────────────────┐┌──────────────────────┐   │
│  │  📋 COPY PROOF LINK  ││  🔄 RE-VERIFY        │   │
│  └──────────────────────┘└──────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  📤 SHARE WITH SPECIFIC PERSON                │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ▶ RAW DATA (expandable)                             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Verification flow (happens live in the popup):**
1. Extension fetches credential from CDN URL
2. Parses the W3C VC JSON-LD
3. Extracts `proof.signatureValue` and `issuer.address`
4. Calls `signatureVerify(credentialBody, signature, issuerAddress)` using `@polkadot/util-crypto` bundled in the extension
5. Shows green status dot for each verification step
6. If any step fails: red status dot with specific error

### Screen 3: Ecosystem Directory (Full Tab — opens as `chrome-extension://id/ecosystem.html`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ◇ PROOFI ECOSYSTEM                                              🔍 SEARCH │
│  Decentralized apps powered by verifiable credentials                        │
│─────────────────────────────────────────────────────────────────────────────│
│                                                                              │
│  ── NETWORK STATS ──────────────────────────────────────────────────────    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ WALLETS  │ │  CREDS   │ │  DDC     │ │  APPS    │ │ VERIFIES │          │
│  │          │ │  ISSUED  │ │  STORAGE │ │          │ │          │          │
│  │  8,234   │ │  45,891  │ │  2.1 GB  │ │   10    │ │  12,345  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                              │
│  ── FEATURED ───────────────────────────────────────────────────────────    │
│                                                                              │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐   │
│  │                     │ │                     │ │                     │   │
│  │  🎓 PROOFIDEGREE   │ │  🔞 PROOFIAGE      │ │  🎨 PROOFICREATOR  │   │
│  │                     │ │                     │ │                     │   │
│  │  Tamper-proof       │ │  Privacy-preserving │ │  Content            │   │
│  │  university         │ │  age verification   │ │  authenticity       │   │
│  │  diplomas           │ │  without ID reveal  │ │  certificates       │   │
│  │                     │ │                     │ │                     │   │
│  │  1.2K USERS         │ │  2.3K USERS         │ │  1.1K USERS         │   │
│  │                     │ │                     │ │                     │   │
│  │  [ CONNECT → ]     │ │  [ CONNECT → ]     │ │  [ CONNECT → ]     │   │
│  │                     │ │                     │ │                     │   │
│  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘   │
│                                                                              │
│  ── CATEGORIES ─────────────────────────────────────────────────────────    │
│  [EDUCATION] [WORK] [HEALTH] [IDENTITY] [CREATOR] [GOVERNANCE] [EVENTS]     │
│                                                                              │
│  ── ALL APPS ───────────────────────────────────────────────────────────    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ 🎓 │ PROOFIDEGREE    │ University diplomas          │ 1.2K │ CONNECT│   │
│  ├────┼─────────────────┼──────────────────────────────┼──────┼────────┤   │
│  │ 🏋 │ PROOFIBADGE     │ Skill credentials            │  890 │ CONNECT│   │
│  ├────┼─────────────────┼──────────────────────────────┼──────┼────────┤   │
│  │ 💼 │ PROOFIGIG       │ Freelancer reputation        │  567 │ CONNECT│   │
│  ├────┼─────────────────┼──────────────────────────────┼──────┼────────┤   │
│  │ 🏥 │ PROOFIHEALTH    │ Medical records              │  234 │ CONNECT│   │
│  ├────┼─────────────────┼──────────────────────────────┼──────┼────────┤   │
│  │ 🏛 │ PROOFIDAO       │ DAO governance               │  445 │ CONNECT│   │
│  ├────┼─────────────────┼──────────────────────────────┼──────┼────────┤   │
│  │ 🎪 │ PROOFIEVENT     │ Event attendance             │  178 │ CONNECT│   │
│  ├────┼─────────────────┼──────────────────────────────┼──────┼────────┤   │
│  │ 🏠 │ PROOFIRENT      │ Tenant verification          │  340 │ CONNECT│   │
│  ├────┼─────────────────┼──────────────────────────────┼──────┼────────┤   │
│  │ 📦 │ PROOFISUPPLY    │ Product provenance           │   89 │ CONNECT│   │
│  ├────┼─────────────────┼──────────────────────────────┼──────┼────────┤   │
│  │ 🎨 │ PROOFICREATOR   │ Content authenticity         │ 1.1K │ CONNECT│   │
│  ├────┼─────────────────┼──────────────────────────────┼──────┼────────┤   │
│  │ 🔞 │ PROOFIAGE       │ Age verification             │ 2.3K │ CONNECT│   │
│  └────┴─────────────────┴──────────────────────────────┴──────┴────────┘   │
│                                                                              │
│  ── HOW IT WORKS ───────────────────────────────────────────────────────    │
│                                                                              │
│  1. CREATE WALLET → Email + PIN, no seed phrases                            │
│  2. COLLECT CREDENTIALS → Apps issue verified credentials to your wallet     │
│  3. SHARE SELECTIVELY → You choose what to share and with whom              │
│  4. VERIFY INSTANTLY → Anyone can verify any credential in 2 seconds         │
│                                                                              │
│  ── DEVELOPERS ─────────────────────────────────────────────────────────    │
│                                                                              │
│  INTEGRATE IN 5 LINES                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  const proofi = new ProofiSDK({ appName: 'Your App' });              │   │
│  │  const addr = await proofi.connect();                                │   │
│  │  await proofi.storeAchievement({ ... });                             │   │
│  │  proofi.disconnect();                                                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│  [ VIEW SDK DOCS → ]  [ GITHUB → ]  [ PLAYGROUND → ]                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Directory styling:**
- App cards use the brutal card system: `border border-[#2A2A2A]`, no radius, hover: `border-[#00E5FF]`
- Category filter chips match DdcScreen's filter chips exactly
- Network stats use the same stat box pattern as the dashboard
- Featured cards use `border-2 border-[#00E5FF]/30 bg-[#00E5FF]/5`
- Code block uses `bg-[#0A0A0A] border border-[#1A1A1A]` with `Space Mono`
- Table rows use alternating `bg-[#000]` / `bg-[#0A0A0A]`

### Screen 4: Settings & Identity

```
┌──────────────────────────────────────────────────────┐
│  ← BACK                          SETTINGS            │
│──────────────────────────────────────────────────────│
│                                                      │
│  ── IDENTITY ───────────────────────────────────    │
│  ┌──────────────────────────────────────────────┐   │
│  │  EMAIL                                        │   │
│  │  mart@proofi.ai                               │   │
│  ├──────────────────────────────────────────────┤   │
│  │  ADDRESS                                      │   │
│  │  5Gn8kR4j...mT5v                    [COPY]   │   │
│  ├──────────────────────────────────────────────┤   │
│  │  KEY TYPE                                     │   │
│  │  sr25519 (Schnorrkel)                         │   │
│  ├──────────────────────────────────────────────┤   │
│  │  NETWORK                                      │   │
│  │  Cere Mainnet (SS58 prefix 54)                │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ── CONNECTED APPS ─────────────────────────────    │
│  ┌──────────────────────────────────────────────┐   │
│  │  ProofiDegree     read, verify    [REVOKE]   │   │
│  ├──────────────────────────────────────────────┤   │
│  │  ProofiCreator    read, sign      [REVOKE]   │   │
│  ├──────────────────────────────────────────────┤   │
│  │  Demo App         read            [REVOKE]   │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ── SECURITY ───────────────────────────────────    │
│  ┌──────────────────────────────────────────────┐   │
│  │  AUTO-LOCK AFTER                              │   │
│  │  [15 MINUTES ▾]                               │   │
│  ├──────────────────────────────────────────────┤   │
│  │  REQUIRE PIN FOR SIGNING                      │   │
│  │  [ON ●]                                       │   │
│  ├──────────────────────────────────────────────┤   │
│  │  NOTIFICATION ON NEW CREDENTIALS              │   │
│  │  [ON ●]                                       │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ── ADVANCED ───────────────────────────────────    │
│  ┌──────────────────────────────────────────────┐   │
│  │  Export All Credentials (JSON-LD bundle)  →   │   │
│  ├──────────────────────────────────────────────┤   │
│  │  Backup Wallet Index (DDC snapshot)       →   │   │
│  ├──────────────────────────────────────────────┤   │
│  │  View Raw DDC Index                       →   │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ── NETWORK CONFIG ─────────────────────────────    │
│  ┌──────────────────────────────────────────────┐   │
│  │  RPC                                          │   │
│  │  wss://archive.mainnet.cere.network/ws        │   │
│  ├──────────────────────────────────────────────┤   │
│  │  DDC                                          │   │
│  │  Mainnet · Bucket #1229                       │   │
│  ├──────────────────────────────────────────────┤   │
│  │  API                                          │   │
│  │  proofi-api-production.up.railway.app         │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │         DISCONNECT WALLET                     │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Toggle styling:** Custom toggle using `border-2 border-[#00E5FF] bg-[#00E5FF]` for ON state, `border-2 border-[#2A2A2A]` for OFF. No rounded toggle — use a sliding square indicator (brutal system).

---

## Core Features (Detailed)

### Feature 1: Extension-Native Wallet (No iframe)

The extension runs `@proofi/core` KeyringManager directly in the **Manifest V3 service worker**. This eliminates the iframe communication layer and gives the extension direct access to signing operations.

**Auth flow:**
```
                    EXTENSION POPUP                   SERVICE WORKER
                    ──────────────                    ──────────────
1. User opens popup
2. Login screen → email input
3. "CONTINUE" button pressed ──────→ sendOTP(email)
                                         │
                                         ▼
                                    POST /auth/otp/send
                                    ← 200 OK
4. OTP screen → 6-digit input
5. OTP entered ──────────────────→ verifyOTP(email, code)
                                         │
                                         ▼
                                    POST /auth/otp/verify
                                    ← { token, derivationSalt }
6. PIN screen → 6-8 digit input
7. PIN entered ─────────────────→ deriveWallet(pin, salt)
                                         │
                                         ▼
                                    PBKDF2(pin, salt, 100000, SHA-256)
                                    → 32-byte seed
                                    → sr25519.fromSeed(seed)
                                    → { address, publicKey, secretKey }
                                         │
                                         ▼
                                    AES-256-GCM encrypt(seed, pin)
                                    → chrome.storage.local.set({
                                        proofi_encrypted_seed,
                                        proofi_address,
                                        proofi_email
                                      })
8. Dashboard shows ← ──────────── wallet connected
```

**Key storage security:**
| Aspect | Implementation |
|---|---|
| Encryption | AES-256-GCM, key derived from PIN via PBKDF2 (50K iterations), 12-byte random IV |
| Storage location | `chrome.storage.local` (encrypted by Chrome at OS level on most platforms) |
| Auto-lock | Service worker sets `chrome.alarms` for 15-minute timeout, clears keypair from memory |
| PIN required | Every signing operation checks if keypair is in memory; if not, triggers PIN unlock popup |

**Critical WASM consideration:** `sr25519` operations use WASM under the hood (`@polkadot/wasm-crypto`). Manifest V3 service workers support WASM via `importScripts()` or `WebAssembly.instantiate()`. The extension build must include the WASM binary as a bundled asset and load it in the service worker context. This is a known Polkadot extension pattern — Talisman and SubWallet both do this.

### Feature 2: Content Script — dApp Detection & Injection

**Detection logic:**
```typescript
// content/detector.ts — injected into every page (lightweight)
const META_TAG = document.querySelector('meta[name="proofi-app-id"]');
const GLOBAL = window.__PROOFI_DAPP__;

if (META_TAG || GLOBAL) {
  const appId = META_TAG?.getAttribute('content') || GLOBAL?.appId || 'unknown';
  chrome.runtime.sendMessage({ type: 'PROOFI_DAPP_DETECTED', appId, url: location.href });
}
```

**What happens when a dApp is detected:**
1. Extension icon gains a cyan dot badge (indicates dApp page)
2. Click extension → dashboard shows "This page uses Proofi" banner
3. If user approves connection, extension injects `@proofi/inject` into the page
4. The inject script registers `window.injectedWeb3['Proofi Hub']`
5. Any Polkadot dApp using `@polkadot/extension-dapp` will see Proofi Hub as available

**Security:** Content script injection is limited by `matches` in manifest.json. The detector script is tiny (~20 lines) and only checks for meta tags / globals. The full `@proofi/inject` is only injected after user approval.

### Feature 3: Credential Verification Overlay

When browsing the web, if the page contains a Proofi verification link (`proofi.ai/verify/*` or `cdn.ddc-dragon.com/1229/*`), the content script adds a verification badge:

```
                    BEFORE                              AFTER
                    ──────                              ─────
Link: cdn.ddc-dragon.com/1229/bafy...    Link: cdn.ddc-dragon.com/1229/bafy... ✅
(plain text)                              (green shield overlay, clickable)
```

**Click the shield → popup opens → shows full credential verification (Screen 2).**

### Feature 4: Chrome Notifications

The service worker polls the wallet's DDC index every 5 minutes (via `chrome.alarms`):

```typescript
chrome.alarms.create('ddc-poll', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'ddc-poll') {
    const currentIndex = await fetchDdcIndex(address);
    const previousIndex = await chrome.storage.local.get('lastIndex');
    
    const newEntries = diff(currentIndex.entries, previousIndex.entries);
    
    for (const entry of newEntries) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icons/128.png',
        title: entry.type === 'credential' ? '📜 New Credential' : '📝 New Memo',
        message: `${entry.credentialType || 'Memo'} added to your vault`,
      });
    }
    
    await chrome.storage.local.set({ lastIndex: currentIndex });
  }
});
```

### Feature 5: Context Menu Credential Sharing

Right-click on any page → "Share Proofi Credential" → credential picker popup → select credential → generates shareable verification link → copies to clipboard.

The link format: `https://proofi.ai/verify?cid={cid}&issuer={issuerAddress}&bucket=1229`

Anyone with this link can verify the credential without the extension, wallet, or any account — pure public verification.

---

## Tech Stack

```
proofi-hub-extension/
├── manifest.json                    # Manifest V3
├── src/
│   ├── background/
│   │   ├── service-worker.ts        # Event-driven SW: auth, signing, DDC polling
│   │   ├── wallet-manager.ts        # KeyringManager wrapper, encrypted storage
│   │   ├── ddc-poller.ts            # chrome.alarms-based DDC index polling
│   │   ├── api-client.ts            # Proofi API client (OTP, register, DDC)
│   │   └── wasm-loader.ts           # @polkadot/wasm-crypto initialization
│   │
│   ├── popup/                       # React app (400×580 popup)
│   │   ├── App.tsx                  # Screen router (same pattern as wallet App.tsx)
│   │   ├── screens/
│   │   │   ├── Dashboard.tsx        # Main view (Screen 1)
│   │   │   ├── Login.tsx            # Email → OTP → PIN (mirrors wallet LoginScreen+PinScreen)
│   │   │   ├── CredentialView.tsx   # Individual credential detail (Screen 2)
│   │   │   └── Settings.tsx         # Settings & identity (Screen 4)
│   │   ├── components/
│   │   │   ├── OtpInput.tsx         # EXACT copy from wallet UI (6-digit, Space Mono)
│   │   │   ├── PinInput.tsx         # EXACT copy from wallet UI (dot indicators)
│   │   │   ├── ActivityFeed.tsx     # Live activity list
│   │   │   ├── StatBox.tsx          # Credential/memo/app count box
│   │   │   └── IdentityStrength.tsx # Progress bar with suggestions
│   │   ├── stores/
│   │   │   ├── walletStore.ts       # Same interface as wallet UI walletStore
│   │   │   ├── credentialStore.ts   # DDC index, credential metadata cache
│   │   │   └── settingsStore.ts     # Auto-lock, notifications, connected apps
│   │   └── styles/
│   │       └── index.css            # EXACT COPY of wallet UI index.css (brutal system)
│   │
│   ├── ecosystem/                   # Full-tab page (Screen 3)
│   │   ├── index.html               # Entry point for chrome-extension://id/ecosystem.html
│   │   ├── App.tsx                  # Ecosystem directory React app
│   │   └── data/
│   │       └── apps.json            # Registry of ecosystem apps (static initially, later API)
│   │
│   ├── content/
│   │   ├── detector.ts              # Lightweight dApp detection (meta tag + global)
│   │   ├── injector.ts              # @proofi/inject loader (on user approval)
│   │   └── verifier.ts              # Proofi link detection + shield overlay
│   │
│   └── shared/
│       ├── types.ts                 # TypeScript types (Credential, WalletIndex, etc.)
│       ├── constants.ts             # API_URL, BUCKET_ID, RPC_ENDPOINTS, CDN_BASE
│       └── crypto.ts                # AES-256-GCM encrypt/decrypt (same as wallet authStore)
│
├── vendor/                          # Vendored packages (not npm — bundled for extension)
│   ├── proofi-core/                 # @proofi/core KeyringManager
│   ├── proofi-inject/               # @proofi/inject Polkadot compatibility
│   └── polkadot-wasm/               # @polkadot/wasm-crypto binary
│
├── assets/
│   ├── icons/                       # 16, 32, 48, 128px (Proofi diamond mark)
│   └── fonts/
│       ├── BebasNeue-Regular.woff2  # Display font
│       ├── SpaceMono-Regular.woff2  # Mono font
│       ├── SpaceMono-Bold.woff2     # Mono bold
│       └── Inter-Variable.woff2     # Body font
│
├── vite.config.ts                   # CRXJS Vite Plugin (Manifest V3 build)
├── tailwind.config.ts               # Tailwind with Proofi design tokens
├── tsconfig.json                    # TypeScript config
└── package.json
```

**Key dependencies:**

| Package | Version | Purpose | Size Impact |
|---|---|---|---|
| React 18 | ^18.2 | Popup + ecosystem UI | ~40KB gzipped |
| Zustand | ^4.5 | State management (same as wallet) | ~1KB gzipped |
| Vite | ^5.x | Build toolchain | Dev only |
| @crxjs/vite-plugin | ^2.0 | MV3 extension build | Dev only |
| @polkadot/util-crypto | ^13.x | sr25519 ops, signature verification | ~800KB with WASM |
| @polkadot/keyring | ^13.x | Key management | Included above |
| @polkadot/util | ^13.x | Hex/u8a utilities | ~30KB |
| Tailwind CSS | ^4.x | Styling (with Proofi tokens) | ~15KB purged |

**Total extension size estimate:** ~1.2MB (mostly WASM binary for sr25519).

---

## Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "name": "Proofi Hub",
  "description": "Your credentials. Your ecosystem. One click.",
  "version": "1.0.0",
  "icons": {
    "16": "assets/icons/icon-16.png",
    "32": "assets/icons/icon-32.png",
    "48": "assets/icons/icon-48.png",
    "128": "assets/icons/icon-128.png"
  },
  "action": {
    "default_popup": "popup/index.html",
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
    "alarms",
    "contextMenus",
    "activeTab"
  ],
  "host_permissions": [
    "https://proofi-api-production.up.railway.app/*",
    "https://cdn.ddc-dragon.com/*",
    "https://proofi.ai/*"
  ],
  "web_accessible_resources": [
    {
      "resources": ["src/content/injector.ts", "vendor/proofi-inject/*"],
      "matches": ["<all_urls>"]
    }
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  }
}
```

**Security notes:**
- `<all_urls>` match for detector is acceptable because the script is ~20 lines and only checks for meta tags
- `wasm-unsafe-eval` CSP is required for `@polkadot/wasm-crypto` — this is the standard approach for all Polkadot extensions
- `host_permissions` limited to Proofi API and DDC CDN only
- No `tabs` permission — extension doesn't read browsing history
- `activeTab` only used for context menu actions (right-click → share credential)

---

## Build Plan

### Phase 1: Core Wallet Extension (Week 1-2)

| Task | Files | Dependency |
|---|---|---|
| Scaffold MV3 extension with Vite+CRXJS | `manifest.json`, `vite.config.ts` | None |
| Port WASM loading for sr25519 in service worker | `background/wasm-loader.ts` | None |
| Build wallet-manager with encrypted storage | `background/wallet-manager.ts` | WASM loader |
| Build Login flow (Email→OTP→PIN) | `popup/screens/Login.tsx` | Wallet manager |
| Copy OtpInput and PIN components from wallet UI | `popup/components/OtpInput.tsx` | None |
| Copy `index.css` from wallet UI verbatim | `popup/styles/index.css` | None |
| Build basic Dashboard (address, balance) | `popup/screens/Dashboard.tsx` | Wallet manager |
| Auto-lock via chrome.alarms | `background/service-worker.ts` | Wallet manager |

**Milestone:** Extension installs, user can authenticate, address shown in popup.

### Phase 2: DDC Integration (Week 3-4)

| Task | Files | Dependency |
|---|---|---|
| DDC index reader (CDN-based, no DDC SDK needed) | `background/ddc-poller.ts` | Wallet manager |
| Parse wallet index JSON → credential list | `stores/credentialStore.ts` | DDC poller |
| Activity feed component | `popup/components/ActivityFeed.tsx` | Credential store |
| Stat boxes (credential/memo/app counts) | `popup/components/StatBox.tsx` | Credential store |
| Identity strength calculator | `popup/components/IdentityStrength.tsx` | Credential store |
| DDC stats display | `popup/screens/Dashboard.tsx` | DDC poller |
| Chrome notifications for new entries | `background/ddc-poller.ts` | DDC poller |

**Milestone:** Dashboard shows live data, notifications work.

### Phase 3: Credential Verification (Week 5-6)

| Task | Files | Dependency |
|---|---|---|
| Credential viewer screen | `popup/screens/CredentialView.tsx` | Credential store |
| Live verification (fetch → parse → signatureVerify) | `popup/screens/CredentialView.tsx` | WASM |
| Content script: Proofi link detection | `content/verifier.ts` | None |
| Green shield overlay on verified links | `content/verifier.ts` | None |
| Context menu: "Share Proofi Credential" | `background/service-worker.ts` | Credential store |

**Milestone:** Credentials viewable and verifiable in extension, web verification overlays work.

### Phase 4: dApp Integration (Week 7-8)

| Task | Files | Dependency |
|---|---|---|
| dApp detector content script | `content/detector.ts` | None |
| @proofi/inject injection on approval | `content/injector.ts` | Wallet manager |
| Polkadot extension API in injected context | `vendor/proofi-inject/` | Inject |
| Connection approval flow in popup | `popup/screens/Dashboard.tsx` | Wallet manager |
| Connected apps management in settings | `popup/screens/Settings.tsx` | Settings store |

**Milestone:** Extension detected by Polkadot dApps, connection flow works.

### Phase 5: Ecosystem Page (Week 9)

| Task | Files | Dependency |
|---|---|---|
| Ecosystem directory page (full tab) | `ecosystem/*` | None |
| App registry (static JSON initially) | `ecosystem/data/apps.json` | None |
| Category filtering and search | `ecosystem/App.tsx` | None |
| Network stats aggregation | `ecosystem/App.tsx` | DDC data |
| One-click connect from directory | `ecosystem/App.tsx` | Wallet manager |

**Milestone:** Full ecosystem page accessible from extension.

### Phase 6: Polish & Chrome Web Store (Week 10)

| Task | Files | Dependency |
|---|---|---|
| Design audit (run `proofi-ux` agent on extension) | All screens | UX agent |
| Mobile popup responsiveness (extension on mobile Chrome) | All CSS | None |
| Performance: lazy-load DDC data, cache credentials | All stores | None |
| Privacy policy page | `ecosystem/privacy.html` | None |
| Chrome Web Store listing (screenshots, description) | CWS dashboard | Everything |
| Beta launch with existing wallet users | — | Everything |

**Milestone:** Extension published to Chrome Web Store.

---

## Security Model (Comprehensive)

| Threat | Attack Vector | Mitigation |
|---|---|---|
| Private key extraction | Attacker reads `chrome.storage.local` | AES-256-GCM encrypted, requires PIN (PBKDF2 50K iterations) |
| Key in memory | Extension memory dump while unlocked | Auto-lock after 15 minutes, clear keypair from service worker memory |
| Content script MITM | Malicious page intercepting injected scripts | Only inject `@proofi/inject` on user-approved pages with valid `proofi-app-id` |
| API phishing | Fake Proofi API endpoint | `host_permissions` restricted to exact API domain, all URLs hardcoded |
| Replay attack | Captured signature auth header reused | 5-minute timestamp window (same as wallet API) |
| Supply chain | Compromised npm dependencies | Vendor critical packages (`@proofi/core`, `@polkadot/wasm-crypto`), pin versions |
| Notification spam | Attacker writes credentials to user's DDC index | Notifications only for entries matching authenticated wallet address |
| Cross-origin leak | Content script leaks wallet data to page | Content script only sends `chrome.runtime.sendMessage` to extension, never exposes wallet state to page context |

---

# Appendix: Mobile-First Alignment Checklist

Based on the `proofi-ux` agent's analysis, here's the specific mobile alignment work needed for the wallet UI to be truly mobile-first:

### CSS Changes Required

```css
/* 1. Safe area support — add to index.css */
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}

/* 2. Bottom nav safe area — add to App.tsx nav */
.bottom-nav-safe {
  padding-bottom: calc(0.75rem + var(--safe-bottom));
}

/* 3. Top content safe area — add to screen containers */
.screen-safe-top {
  padding-top: calc(2rem + var(--safe-top));
}

/* 4. Touch target minimums — update filter chips in DdcScreen */
.touch-target-min {
  min-height: 44px;
  min-width: 44px;
}
```

### Component Changes Required

| Component | Change | Priority |
|---|---|---|
| `App.tsx` | Add `viewport-fit=cover` to HTML template | P0 |
| `App.tsx` | Bottom nav: add `pb-[env(safe-area-inset-bottom)]` | P0 |
| `DdcScreen.tsx` | Filter chips: `py-1.5` → `py-2.5` (44px min-height) | P1 |
| `DdcScreen.tsx` | Search clear button: wrap in `p-3` touch target | P1 |
| `DdcScreen.tsx` | Refresh button: wrap in `p-3` touch target | P1 |
| `SignScreen.tsx` | Replace `rounded-2xl` → remove (brutal system) | P1 |
| `SignScreen.tsx` | Replace `<Button>` → `.btn-primary` / `.btn-secondary` | P1 |
| `ConnectScreen.tsx` | Same as SignScreen — align to brutal system | P1 |
| `Button.tsx` | Delete entirely — replaced by `.btn-primary`/`.btn-secondary` | P1 |
| `AddressDisplay.tsx` | `rounded-lg bg-gray-800` → `border border-[#2A2A2A] bg-[#0A0A0A]` | P2 |
| All back buttons | `py-1` → `py-3 px-4` (44px min-height) | P2 |
| Add `manifest.json` | PWA manifest for add-to-homescreen | P2 |
| Add `<meta name="theme-color" content="#000000">` | Mobile browser chrome | P2 |

### Typography Scale Validation

Current scale works well at 375px minimum:

| Element | Size | 375px Behavior | Verdict |
|---|---|---|---|
| `text-display-xl` | `clamp(3rem, 12vw, 6rem)` | 45px at 375px | ✅ Good |
| `text-display-lg` | `clamp(2rem, 8vw, 4rem)` | 30px at 375px | ✅ Good |
| `text-display-md` | `clamp(1.5rem, 5vw, 2.5rem)` | 18.75px at 375px | ✅ Good |
| `.text-label` | `0.625rem` (10px) | Fixed | ✅ Good (uppercase compensates) |
| `.text-mono` | Various | Fixed | ✅ Good |
| OTP boxes | `w-11` (44px) × 6 + `gap-2` (8px×5) = 304px | 375-304 = 71px padding | ⚠ Tight but works |

---

*End of strategic blueprint. All three outputs are actionable and grounded in the actual codebase. The agents test what exists, the concepts build on what's live, and the extension extends what works.*
