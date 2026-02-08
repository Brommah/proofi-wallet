# Proofi Competitive Landscape Analysis

*Last Updated: July 2025*

---

## Executive Summary

The personal data ownership and sovereignty market is fragmented across multiple verticals, with no single player offering a unified, user-friendly solution that combines **encrypted storage**, **verifiable credentials**, **selective disclosure**, and **third-party access control**. 

### Key Market Observations:

1. **Technical solutions exist, but UX remains a barrier** — Solid, Ceramic, and SSI protocols offer robust data sovereignty, but require significant technical knowledge to use effectively.

2. **Encrypted storage is commoditized** — Proton (100M+ users), Tresorit, and Filen prove consumer demand for privacy, but they focus solely on storage, not data portability or access control.

3. **Identity solutions are B2B-focused** — SpruceID ($41.5M raised) and Privado ID target enterprises and governments, leaving a gap for consumer-grade identity wallets.

4. **AI + personal data is emerging** — Personal.ai, Rewind/Limitless, and Mem.ai show early traction but prioritize AI features over data sovereignty.

5. **Web3 social data is niche** — Lens Protocol and Orbis serve crypto-native users but haven't crossed to mainstream adoption.

### The Opportunity for Proofi:
A unified platform that combines the **encryption standards of Proton**, the **verifiable credentials of Disco/Privado**, and the **data portability vision of Solid** — with a **consumer-first UX** that doesn't require understanding cryptography or blockchain.

---

## Comparison Matrix

| Platform | Category | Encryption | User Control | Third-Party Access | UX Friction | GTM | Funding | Traction |
|----------|----------|------------|--------------|-------------------|-------------|-----|---------|----------|
| **Solid/Inrupt** | Data Vault | ✓ Server-configurable | ✓ Full (Pods) | ✓ ACL-based | 🔴 High | B2B/B2G | $30M Series A | Enterprise pilots |
| **Ceramic Network** | Data Vault | ✓ Decentralized | ✓ DID-based | ✓ Via apps | 🔴 High | B2B/B2D | $30M+ | 500K+ streams |
| **Proton Drive** | Encrypted Storage | ✓ E2E (client-side) | ✓ Full | ⚠️ Link sharing only | 🟢 Low | B2C/B2B | Crowdfunded + revenue | 100M+ accounts |
| **Filen** | Encrypted Storage | ✓ Zero-knowledge | ✓ Full | ⚠️ Link sharing only | 🟢 Low | B2C | Bootstrapped | Growing |
| **Tresorit** | Encrypted Storage | ✓ E2E (client-side) | ✓ Full | ⚠️ Basic sharing | 🟢 Low | B2B | Acquired (Swiss Post) | Enterprise focus |
| **SpruceID** | Decentralized ID | ✓ Client-controlled | ✓ Full (DIDs) | ✓ Verifiable Credentials | 🟡 Medium | B2B/B2G | $41.5M total | Gov contracts |
| **Privado ID** | Decentralized ID | ✓ ZK proofs | ✓ Full (DIDs) | ✓ Selective disclosure | 🟡 Medium | B2B | Polygon-backed | Developer adoption |
| **Disco.xyz** | Decentralized ID | ✓ Client-side | ✓ Backpack model | ✓ Verifiable Credentials | 🟡 Medium | B2C/B2B | Merged w/ Privado | Crypto-native |
| **Veramo** | SDK/Framework | ✓ Developer choice | ✓ Via implementation | ✓ Via VCs | 🔴 High (SDK) | B2D | DIF community | Open-source |
| **Personal.ai** | AI + Data | ✓ Encrypted | ⚠️ Partial | ⚠️ Limited | 🟡 Medium | B2C | VC-backed | Early adopters |
| **Rewind/Limitless** | AI + Data | ✓ Local storage | ✓ Local-first | ❌ No | 🟢 Low | B2C | $41M (a16z) | Pivoting to hardware |
| **Mem.ai** | AI + Data | ✓ TLS (not E2E) | ⚠️ Partial | ❌ No | 🟢 Low | B2C | VC-backed | Productivity users |
| **Apple Health** | Health Data | ✓ E2E | ✓ Full | ✓ Per-app permissions | 🟢 Low | B2C (locked) | Apple | 1B+ devices |
| **Oura** | Health Data | ⚠️ Mixed (edge + cloud) | ⚠️ Export available | ⚠️ Limited API | 🟢 Low | B2C | $200M+ | 2M+ rings sold |
| **Humanity Protocol** | Biometric ID | ✓ ZK proofs | ✓ Palm-based | ✓ Proof of Humanity | 🟡 Medium | B2C | $30M @ $1B val | 150K+ phase 1 |
| **Lens Protocol** | Social Data | ✓ On-chain | ✓ NFT-based | ✓ Portable social graph | 🔴 High | B2C (crypto) | Aave-backed | 400K+ profiles |
| **Lit Protocol** | Access Control | ✓ Threshold crypto | ✓ Programmatic | ✓ Condition-based | 🔴 High (SDK) | B2D | $13M Series A | Dev ecosystem |
| **Orbis/OrbisDB** | Social Data | ✓ Ceramic-based | ✓ DID-based | ✓ Via Ceramic | 🔴 High | B2D | Ceramic ecosystem | Developers |

**Legend:** 🟢 Low friction (consumer-ready) | 🟡 Medium friction (some learning curve) | 🔴 High friction (technical users only)

---

## Deep Dive: Top 5 Competitors

### 1. Solid (Inrupt) — The OG Data Vault

**Overview:** Created by Tim Berners-Lee, Solid is a protocol for storing personal data in "Pods" that users fully control. Inrupt is the commercial entity building enterprise solutions.

**Data Control Model:**
- Users store data in Pods (Personal Online Data Stores)
- Full control over storage location (self-hosted or hosted Pod providers)
- Granular ACL (Access Control Lists) for each resource
- Apps request permission to access specific data

**Encryption:**
- Depends on Pod provider configuration
- Enterprise Solid Server (ESS) supports encryption at rest
- Not inherently E2E encrypted (this is a design choice, not a limitation)

**Third-Party Access:**
- Sophisticated Access Grants system
- Applications request specific permissions
- Users can revoke at any time
- Supports both WebID and DID-based authentication

**UX Assessment:**
- 🔴 **High friction** for consumers — requires understanding of Pods, WebIDs, and linked data
- No mainstream consumer apps yet
- Recent "Data Wallet" product aims to simplify, but still early

**Go-to-Market:**
- **B2B/B2G focus** — Government partnerships (Flanders, Belgium), enterprise pilots
- Open Data Institute took stewardship in Oct 2024
- Not pursuing direct consumer adoption

**Funding & Traction:**
- $30M Series A (Dec 2021)
- Multiple government pilots (Belgium, UK)
- ISO 27001 certification in progress

**Strengths:**
- W3C standards-based
- True data portability
- Strong enterprise credibility

**Weaknesses:**
- Consumer UX far from ready
- Requires understanding of linked data/RDF
- Fragmented Pod provider ecosystem

---

### 2. Proton (Drive, Mail, VPN) — The Privacy Champion

**Overview:** Swiss-based privacy company offering E2E encrypted services. Proton Drive is their cloud storage offering.

**Data Control Model:**
- Users own their data, encrypted before leaving device
- Data stored in Swiss jurisdiction (strong privacy laws)
- Full deletion rights

**Encryption:**
- ✓ **Client-side E2E encryption** — Proton cannot access your files
- Uses elliptic curve cryptography
- Zero-access encryption for all services

**Third-Party Access:**
- Limited to link sharing with optional passwords
- No granular credential-based access
- No verifiable credential integration

**UX Assessment:**
- 🟢 **Low friction** — Works like any cloud storage (Google Drive, Dropbox)
- Native apps for all platforms
- Intuitive interface

**Go-to-Market:**
- **B2C primary**, B2B growing
- Freemium model (10GB free)
- Strong brand around privacy

**Funding & Traction:**
- Crowdfunded origins, now revenue-profitable
- **100M+ accounts** (April 2023)
- $4M+ in grants distributed to aligned organizations

**Strengths:**
- Proven consumer adoption at scale
- Swiss legal jurisdiction
- E2E encryption is table-stakes

**Weaknesses:**
- No data portability beyond export
- No verifiable credentials
- No selective disclosure for third parties
- Just storage, not a platform for data apps

---

### 3. SpruceID — Enterprise SSI Infrastructure

**Overview:** Building identity infrastructure for governments and enterprises using DIDs and Verifiable Credentials. Created Sign-In with Ethereum (SIWE).

**Data Control Model:**
- Users control DIDs (Decentralized Identifiers)
- Credentials stored in user wallets
- Users present credentials to verifiers

**Encryption:**
- Client-controlled key management
- Credentials cryptographically signed
- Supports various DID methods

**Third-Party Access:**
- ✓ **Full Verifiable Credential support**
- Selective disclosure via ZK proofs or credential presentation
- Standards-compliant (W3C VC, DID)

**UX Assessment:**
- 🟡 **Medium friction** — Requires wallet setup
- Consumer-facing products still early
- Focus on SDK/API for integrators

**Go-to-Market:**
- **B2B/B2G primary**
- Government digital identity projects
- Enterprise authentication solutions

**Funding & Traction:**
- $7.5M seed (2021, Ethereal + Electric Capital)
- $34M Series A (2022, led by a16z)
- **Total: $41.5M**
- Active government contracts (California DMV mobile driver's license)

**Strengths:**
- Enterprise credibility
- Standards-compliant
- Strong technical team

**Weaknesses:**
- No consumer-facing product
- Relies on partners to build UX
- No integrated storage solution

---

### 4. Privado ID (fka Polygon ID) — ZK-Native Identity

**Overview:** Built on iden3 protocol, offering zero-knowledge proof-based identity verification. Recently merged with Disco.xyz to expand capabilities.

**Data Control Model:**
- Users hold credentials in mobile wallet
- DIDs controlled by user's private keys
- Credentials issued by trusted issuers

**Encryption:**
- ✓ **ZK proofs native** — Can prove attributes without revealing underlying data
- On-device proof generation
- No central storage of user data

**Third-Party Access:**
- ✓ **Best-in-class selective disclosure**
- Example: Prove you're over 18 without revealing birthday
- Supports complex query conditions

**UX Assessment:**
- 🟡 **Medium friction** — Wallet app relatively polished
- Requires understanding of credentials
- Crypto-native onboarding

**Go-to-Market:**
- **B2B/B2D primary**
- Web3 native (Polygon ecosystem)
- KYC and compliance use cases

**Funding & Traction:**
- Backed by Polygon Labs
- Disco.xyz merger adds credential management expertise
- Growing developer ecosystem

**Strengths:**
- Native ZK proofs (strongest privacy)
- Open-source (iden3)
- Active development

**Weaknesses:**
- Crypto wallet required (barrier for mainstream)
- Limited consumer awareness
- No data storage layer

---

### 5. Personal.ai — AI That Remembers You

**Overview:** An AI assistant that builds a "memory" from your data, giving you a personalized AI that knows your context.

**Data Control Model:**
- Users upload data to build "Memory Stack"
- Data encrypted at rest
- Users can review, modify, delete memories

**Encryption:**
- ✓ Encrypted at rest
- TLS in transit
- Not full zero-knowledge (company has access for AI processing)

**Third-Party Access:**
- Can share AI personas with others
- No granular credential-based sharing
- Limited external integrations

**UX Assessment:**
- 🟡 **Medium friction** — Requires active training/feeding
- Messaging-based interface
- Learning curve for optimal use

**Go-to-Market:**
- **B2C primary**
- Knowledge workers, personal productivity
- Voice cloning as differentiator

**Funding & Traction:**
- VC-backed (undisclosed amount)
- "MODEL-2" launched at CES 2024
- Early adopter community

**Strengths:**
- Novel "AI twin" concept
- Strong on personal memory/context
- Committed to user ownership values

**Weaknesses:**
- Not true zero-knowledge
- No interoperability standards
- Walled garden approach

---

## Gaps Proofi Can Fill

### Gap 1: Consumer-Grade UX for Data Sovereignty

**The Problem:** Current solutions require understanding of Pods (Solid), DIDs (SSI), or blockchain (Web3). Mainstream users don't want to manage cryptographic keys.

**Proofi Opportunity:** 
- Abstract away complexity behind familiar UX patterns
- "Connect with Proofi" as simple as "Sign in with Google"
- Key management through biometrics/device security

### Gap 2: Unified Storage + Credentials + Access Control

**The Problem:** Proton does storage. SpruceID does credentials. Lit Protocol does access control. Users need three different systems.

**Proofi Opportunity:**
- Single platform: store your data, get credentials from issuers, control access
- Vertical integration with consumer-friendly interface
- One app to rule them all

### Gap 3: Verifiable Credentials Without Crypto Wallets

**The Problem:** All current VC/DID solutions require crypto wallet familiarity. This alienates 99% of potential users.

**Proofi Opportunity:**
- Native mobile app (not a "wallet")
- No blockchain knowledge required
- VCs work behind the scenes

### Gap 4: Selective Disclosure for Normal Use Cases

**The Problem:** ZK proofs are powerful but complex. Most selective disclosure demos are technical showcases, not real products.

**Proofi Opportunity:**
- Practical use cases: prove income range for apartment rental, prove degree without transcript, verify employment without salary
- Partnership-ready API for businesses that need verification

### Gap 5: AI-Ready Personal Data

**The Problem:** Personal.ai and Mem.ai show demand for AI + personal data, but neither offers true data ownership. Rewind pivoted to hardware.

**Proofi Opportunity:**
- Own your data, then let AI apps access it with permission
- Position as the "data layer" for personal AI
- Revenue opportunity: charge AI providers for access (with user consent/cut)

### Gap 6: Health Data Beyond Walled Gardens

**The Problem:** Apple Health is excellent but locked to Apple ecosystem. Oura exports data but doesn't enable controlled sharing. Humanity Protocol is ZK but niche.

**Proofi Opportunity:**
- Cross-platform health data aggregation
- Verified health credentials (test results, vaccination status)
- User-controlled sharing with healthcare providers, insurers, employers

### Gap 7: B2C Revenue Model for Privacy

**The Problem:** Most privacy-focused companies rely on B2B (SpruceID, Solid/Inrupt) or subscriptions (Proton). No one has cracked "user monetizes their data."

**Proofi Opportunity:**
- Users license their verified data to researchers, marketers (opt-in)
- Revenue sharing model
- Legitimate data marketplace alternative to surveillance capitalism

---

## Positioning Recommendations

### Positioning Statement:
> **Proofi is the personal data wallet that gives you control. Store your data encrypted, get verifiable credentials from trusted sources, and share only what's needed — without understanding cryptography.**

### Target Segments (Priority Order):

1. **Privacy-Conscious Professionals** (ages 28-45)
   - Already use Proton, Signal, or similar
   - Willing to pay for privacy
   - Early adopter mindset

2. **Freelancers/Gig Workers**
   - Need to prove credentials constantly (ID, insurance, certifications)
   - Pain point: repetitive document sharing
   - Immediate utility

3. **Health-Conscious Quantified Selfers**
   - Track data across Oura, Whoop, Apple Health
   - Want unified view + sharing control
   - Premium users

4. **Job Seekers/Renters**
   - Regular need for verified credentials (background checks, income proof)
   - Clear use case for selective disclosure
   - Mainstream appeal

### Competitive Positioning Matrix:

```
                    Consumer-Friendly
                          ↑
                          |
       Proton  ← ← ← ← PROOFI → → → → → Disco
       (storage only)      |         (crypto-native)
                          |
                          |
         Apple ← ← ← ← ← ↓ → → → → → Solid
       (walled garden)              (too complex)
                          
                    Enterprise/Technical
```

### Key Differentiators to Emphasize:

1. **"Own, Don't Rent"** — Your data is yours, not the platform's
2. **"Prove Without Revealing"** — Share only what's necessary
3. **"One App, All Your Data"** — Storage, credentials, access control unified
4. **"No PhD Required"** — Privacy technology made human

### Competitive Comparisons to Use:

| Versus | Proofi Advantage |
|--------|------------------|
| Proton | + Verifiable credentials, + Selective disclosure, + Data portability |
| Solid | + Consumer UX, + Mobile-first, + No technical knowledge needed |
| SpruceID | + Consumer product (not just infrastructure), + Storage included |
| Privado ID | + No crypto wallet required, + Storage included, + Broader than Web3 |
| Personal.ai | + True zero-knowledge, + Standards-based, + Interoperable |

### Strategic Partnerships to Pursue:

1. **Credential Issuers:** Universities, professional certification bodies, government agencies
2. **Data Consumers:** Background check companies, HR platforms, insurance
3. **Privacy Ecosystem:** Proton (co-marketing), Brave Browser, DuckDuckGo
4. **Developer Platforms:** Auth0, Okta (SSO integration)

---

## Appendix: Company/Product Details

### Funding Summary Table

| Company | Total Raised | Last Round | Lead Investors |
|---------|--------------|------------|----------------|
| Inrupt (Solid) | $30M+ | Series A (2021) | Glasswing, Amadeus |
| SpruceID | $41.5M | Series A (2022) | a16z |
| Lit Protocol | $13M+ | Series A (2024) | 1kx |
| Humanity Protocol | $30M | Series A (2024) | — ($1B valuation) |
| Proton | N/A (revenue-based) | Crowdfund + revenue | Community |
| Rewind/Limitless | $41M+ | — | a16z |

### Technology Standards Referenced

- **W3C DID:** Decentralized Identifiers standard
- **W3C VC:** Verifiable Credentials data model
- **Solid Protocol:** W3C data pods specification
- **iden3:** Zero-knowledge identity protocol
- **SIWE:** Sign-In with Ethereum standard

---

*This analysis is for internal strategic planning. Market conditions change rapidly — validate assumptions with user research.*
