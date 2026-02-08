# Proofi.ai Launch Content — Article Outlines

*Created: 2026-02-02*
*Author voice: Mart (Martijn Broersma) — Dutch, direct, no bullshit, 6 years in the trenches*

---

## Article 1: "Why This Wild Story Should Be the Last One You Read on LinkedIn"

### Working Title
**"Why This Wild Story Should Be the Last One You Read on LinkedIn"**

### Target Audience
- Web3-aware professionals (25-45)
- People fed up with LinkedIn's fakeness and "thought leader" culture
- Crypto/blockchain community who already distrust centralized platforms
- Anyone who's been scammed or seen fraud go unpunished
- Journalists covering tech fraud / Web3

### Hook (First 2 Sentences)
A convicted fraudster stole millions in crypto, ran a fake VC empire, and operated freely on LinkedIn for years — verified badge and all. The platform didn't catch him. I did. And the story of how leads to something much bigger than one con artist.

### Section-by-Section Breakdown

**1. "Meet Kenzi Wang" (400 words)**
- The setup: AU21 Capital, the "VC" that was actually an unregistered broker-dealer
- The playbook: invest in projects, then secretly fund competitors (Kylin vs Paralink)
- Steal tokens, manipulate founders, exploit people on both sides
- Six years of this — and LinkedIn gave him a nice blue checkmark the entire time
- Key detail: used a pregnant woman (Vivian Liu) as a proxy to file lawsuits against the very people he stole from

**2. "LinkedIn Didn't Just Miss It — They Couldn't Catch It" (500 words)**
- LinkedIn's credential system is self-reported. That's it. You type it, it's "verified."
- Anyone can claim any title, any company, any degree
- There is ZERO verification layer. Not even basic checks.
- The Kenzi example: claimed to be founder/GP of a major fund while actively defrauding projects
- Compare to: try boarding a plane with a self-reported passport. Absurd, right?
- But we trust our entire professional identity to this system

**3. "Now Let's Talk About Who Built This System" (400 words)**
- Reid Hoffman co-founded LinkedIn
- Reid Hoffman was tight with Jeffrey Epstein — flew on his plane, visited his island, accepted his money
- This isn't conspiracy. This is documented fact (MIT Media Lab scandal, multiple investigations)
- The point isn't guilt by association — it's this: the people who designed the system that controls your professional identity had zero interest in actual trust
- LinkedIn was built to sell ads and premium subscriptions, not to verify truth
- "Your professional reputation lives on a platform built by people who hung out with a pedophile. Let that sink in."

**4. "What Verification Actually Looks Like" (500 words)**
- Introduction to Proofi.ai (formerly CereProof)
- The concept: what if credentials were issued by the actual institution and signed cryptographically?
- Your degree isn't a text field — it's a signed, verifiable credential on a decentralized network
- Your work history isn't what you typed — it's confirmed by the actual employer, on-chain
- Anyone can verify. Nobody can fake it. No platform controls it.
- Brief mention of the tech: Cere DDC mainnet, sr25519 signing, W3C VC format
- "I didn't build this because I thought it would be cool. I built it because I spent 6 years watching what happens when credentials are just words on a screen."

**5. "The CTA You Won't Expect" (200 words)**
- I'm posting this ON LinkedIn. Ironic? Yes. Strategic? Also yes.
- This is the last post that should matter here
- Subscribe at proofi.ai for early access
- Consider this: every day you keep your profile on LinkedIn, you're legitimizing a system that protects fraudsters
- "I'm not saying delete LinkedIn today. I'm saying: when there's an alternative where your credentials actually mean something, you won't need to be told."

### Emotional Arc
1. **Outrage** → The Kenzi story hooks with injustice
2. **Recognition** → "Wait, LinkedIn really has no verification?"
3. **Disgust** → The Hoffman/Epstein connection lands the gut punch
4. **Hope** → Proofi as the way out
5. **Empowerment** → Reader feels they can take action

### CTA
- Subscribe to proofi.ai for early access
- Share the article ("If this story bothered you, share it")
- Consider your own LinkedIn presence critically

### Estimated Word Count
2,000-2,500 words

### Best Platform to Publish
1. **LinkedIn** (primary — maximum irony, maximum reach, forces the conversation)
2. **Twitter/X** (condensed thread version — 15-20 tweets hitting the Kenzi story + Hoffman/Epstein + Proofi intro)
3. **Medium** (full version for SEO and permanence)

---

## Article 2: "How Blockchain Actually Solves the Credential Problem (And Why Every Previous Attempt Failed)"

### Working Title
**"How Blockchain Actually Solves the Credential Problem (And Why Every Previous Attempt Failed)"**

### Target Audience
- Technical/semi-technical professionals interested in decentralized identity
- HR leaders and recruiters tired of credential fraud
- Web3 builders and developers
- Enterprise decision-makers evaluating verifiable credential solutions
- People who dismissed blockchain credentials because previous attempts died

### Hook (First 2 Sentences)
Blockcerts is dead. Dock.io pivoted. Velocity Network vanished. Every attempt to put credentials on a blockchain has failed — and they all failed for the same reason. They tried to solve a full-stack problem with a single-layer fix.

### Section-by-Section Breakdown

**1. "The Credential Graveyard" (500 words)**
- Blockcerts (MIT, 2016): Pioneer, but just anchored hashes to Bitcoin. No storage, no query, no economics. Institutions had to run their own infrastructure. Dead.
- Dock.io: Had the right idea but no adoption engine. Built credentials without building the ecosystem. Pivoted to "cheqd."
- Velocity Network Foundation: Big names (Microsoft, SAP involvement), consortium model. Died because consortiums are where innovation goes to die. Too many stakeholders, no ship date.
- Learning Machines / Hyland: Got acquired, lost focus, enterprise sales cycle killed momentum
- Common failure pattern: they all treated "put credential on blockchain" as the whole product
- "Putting a hash on a chain isn't a solution. It's a receipt."

**2. "Why This Is a Full-Stack Problem" (400 words)**
- Credentials need: issuance, storage, discovery, verification, privacy, economics, and agents to use them
- Previous attempts solved 1-2 of these and hand-waved the rest
- The LinkedIn comparison: LinkedIn "works" (in a broken way) because it's a full stack — profile, network, search, messaging, jobs
- To kill LinkedIn, you don't need better credentials. You need a better SYSTEM.
- "You can't kill an ecosystem with a feature."

**3. "The Cere + CEF Architecture (In Human Terms)" (800 words)**
- **The Brain Metaphor**: Cere = cerebellum (reflexes, coordination, data), CEF = cephalum (thinking, reasoning, agents)
- **Layer 1 — Trust Layer**: Cere blockchain, 50-70 validators, CERE token, OpenGov. Not crypto theater — this is the math that makes everything else trustworthy.
- **Layer 2 — DDC (Decentralized Data Clusters)**: Where credentials actually LIVE. Dragon 1 cluster: 63 nodes, billions of transactions, 99.9% uptime, 114ms response. Your credential stored across the globe, content-addressable (CID), cryptographically tamper-proof. $0.01/GB/month — 7x cheaper than AWS S3.
- **Layer 3 — Data Processing (Streams, Rafts, Cubbies)**:
  - **Streams**: Real-time data flows — when a new credential is issued, when one is revoked, when someone verifies
  - **Rafts**: Indexed, queryable subsets — "show me all verified software engineers in Amsterdam" becomes a Raft query
  - **Cubbies**: Encrypted shared memory — agents collaborate without seeing each other's data. This is how a recruiter agent can search credentials without accessing the raw data.
- **Layer 4 — ROB (Real-time Orchestration Builder)**: The agent factory. Visual interface to create agents. Deploy a credential-verifying agent in under an hour. No DevOps.
- **Layer 5 — DAC (Data Activity Capture)**: Every credential issuance, every verification, every query generates a receipt. Merkle trees compress millions of operations into verifiable summaries. The protocol IS the auditor.

**4. "The Three Agents That Replace LinkedIn" (600 words)**
- **Personal Agent**: Your AI credential manager
  - Submits documents for verification (diploma, work contract, certification)
  - Controls what's shared and with whom (selective disclosure)
  - Notifies you when someone verifies your credentials
  - Future: ZK proofs — prove you have a degree without revealing which university
- **Org Agent**: The institutional verifier
  - Universities, companies, certification bodies run these
  - Reviews submitted documents, signs credentials on-chain
  - Automated for standard credentials (API integration with university systems)
  - Human review for edge cases
  - Each verification generates a DAC receipt — the org gets paid in CERE tokens
- **Recruiter Agent**: The trust-based search engine
  - Searches verified credentials across the network
  - No more "LinkedIn Premium" to see who's real — everything is cryptographically verified
  - Pays micro-fees in CERE for each query (economic sustainability)
  - Can compose complex queries: "Verified ML engineers with >3 years at FAANG, available, in EU timezone"
  - Results are TRUSTWORTHY because every credential was verified by the issuing institution

**5. "Why the Economics Make This Self-Sustaining" (400 words)**
- The DAC + CERE token loop:
  - Orgs issue credentials → earn CERE
  - Recruiters search/verify → pay CERE
  - Users control their data → free (subsidized by recruiter demand)
  - Node operators store data → earn CERE
  - Validators secure the network → earn CERE
- No ads. No premium subscriptions. No selling your data.
- The protocol is the business model. Automated, transparent, self-correcting.
- Sentinel validators ensure honest behavior through spot-checks and slashing
- "LinkedIn makes money by keeping your data hostage. Proofi makes money by keeping your data honest."

**6. "What's Already Built" (300 words)**
- Working MVP on Cere DDC mainnet (bucket 1229)
- 7+ credentials issued and verified
- Credential issuance with sr25519 signing
- Public profile pages with QR codes
- Claim submission + org approval pipeline
- DDC stress tested: 19,000+ writes at 20/sec, 0 errors, 60+ storage nodes with massive headroom
- "This isn't a whitepaper. It's running code."

### Emotional Arc
1. **Skepticism** → "Oh great, another blockchain credential thing"
2. **Understanding** → "Wait, there's actually a reason those others failed"
3. **Clarity** → "Oh, this is a completely different architecture"
4. **Excitement** → "The agent model actually makes sense"
5. **Conviction** → "The economics are self-sustaining — this could actually work"

### CTA
- Developers: check out the Cere SDK, build on the stack
- Institutions: become an early issuing org on Proofi
- Professionals: claim your proofi.ai profile
- Everyone: read the full Cere Stack article for the deep technical dive

### Estimated Word Count
3,000-3,500 words

### Best Platform to Publish
1. **Substack / Medium** (primary — long-form technical content needs room to breathe)
2. **Twitter/X** (condensed thread: "Why every blockchain credential project failed — and what's different now" — 20-25 tweets)
3. **LinkedIn** (shortened version focusing on the agent model and "what replaces LinkedIn")
4. **Hacker News** (technical audience that would appreciate the architecture breakdown)

---

## Article 3: "I Traced a Fraudster's Wallets for 6 Years. Here's What I Learned About Trust."

### Working Title
**"I Traced a Fraudster's Wallets for 6 Years. Here's What I Learned About Trust."**

### Target Audience
- Crypto/Web3 community (they love on-chain detective stories)
- True crime / fraud investigation enthusiasts
- Professionals who've been burned by credential fraud
- Journalists covering crypto fraud
- General audience who loves a good underdog-vs-fraudster narrative

### Hook (First 2 Sentences)
In 2020, I discovered that a man named Kenzi Wang had stolen millions from the company I worked for. Six years, four countries, two criminal cases, and thousands of wallet traces later, I'm still going — and the technology I used to catch him is now the foundation of something that could prevent people like him from ever operating again.

### Section-by-Section Breakdown

**1. "The Discovery" (500 words)**
- How it started: tokens meant for investors never arrived. Money disappeared.
- First suspicion, then investigation. The sinking feeling when you realize it's not a mistake — it's theft.
- Kenzi Wang: presenting himself as legitimate VC (AU21 Capital) while running an unregistered broker-dealer operation
- The scale: not just our project. Multiple blockchain projects victimized through the same playbook.
- "The thing about fraud in crypto is — unlike a bank, the receipts are public. Every transaction, every wallet, every bridge. If you know where to look."

**2. "Following the Money On-Chain" (700 words)**
- Wallet tracing methodology: starting from known addresses, mapping outflows
- The patterns: tokens stolen → moved through intermediary wallets → bridged across chains → landed at exchanges
- Exchange subpoenas: how we identified which exchanges held the stolen funds (Bybit, OKX, KuCoin, Gate)
- Bridge transactions: the technical challenge of tracing assets across different blockchains
- The "Google Sheets cell" moment: discovering that a "deleted user" had entered wallet addresses for token distribution — a digital booby trap planted before Kenzi left the company
- Chain analysis tools and firms: Chainalysis, TRM Labs, Elliptic — the same tools DOJ and FBI use
- "Blockchain doesn't lie. People do. But the blockchain remembers everything they did."

**3. "The Legal Battleground — Four Countries, Two Criminal Cases" (600 words)**
- Dubai: criminal cases filed, travel ban issued, Feb 26 hearing approaching
- California: lawsuit filed, counterclaim strategy
- The Vivian Liu twist: Kenzi stole her tokens, then convinced her to sue US for not giving them to her
- Dylan Dewdney affidavit: another victim (Kylin Network) proving the pattern — invest, then secretly fund a competitor
- The legal team: Jenny, Matt, Rocky — from defensive to full counter-attack mode
- "Anyone sane would have surrendered by now. But fraudsters aren't sane. They're narcissists."

**4. "The Irony That Changed Everything" (500 words)**
- The realization: the SAME technology that lets me trace a fraudster's wallets can PREVENT fraud from happening
- Blockchain = transparency + immutability + cryptographic proof
- If Kenzi's credentials had been verifiable on-chain, his entire operation collapses before it starts:
  - "GP of AU21 Capital" → Where's the on-chain verification from AU21's org agent?
  - "Investor in 50+ projects" → Show me the verified transaction records
  - "Advisor to [project]" → Where's the signed credential from the project?
- The credential system that catches fraud IS the credential system that prevents it
- "I spent 6 years learning how trust breaks. Then I realized I'd been building the tools to fix it the whole time."

**5. "Proofi: Built by Someone Who Knows How Trust Breaks" (500 words)**
- CereProof → Proofi.ai: the evolution from internal tool to public platform
- Why this is different from yet another "blockchain solves trust" pitch:
  - I've personally traced stolen funds across chains, filed criminal cases, obtained exchange subpoenas
  - I know exactly which attack vectors exist because I've spent 6 years defending against them
  - Every design decision in Proofi comes from real adversarial experience, not theoretical threat modeling
- The Cere + CEF stack: not a whitepaper architecture — running in production, battle-tested
  - DDC: 63 nodes, billions of transactions, 99.9% uptime
  - Credentials issued and verified on mainnet
  - Stress tested: 19,000+ writes/sec, zero errors
- "Most credential platforms are built by people who read about fraud. This one is built by someone who fought it."

**6. "The Vision: A World Where Kenzi Can't Operate" (400 words)**
- Every credential verified on-chain — degrees, work history, certifications, fund registrations
- Every fraud traceable — because the system that verifies also records
- Every professional in control of their own data — not LinkedIn, not a university's database, YOU
- Agent-to-agent verification: your Personal Agent talks to an Org Agent, credentials are issued and verified automatically
- Selective disclosure: prove you're qualified without revealing everything about yourself
- "Imagine a world where before someone invests your money, you can verify every claim they've ever made — instantly, cryptographically, without asking their permission. That's not a dream. That's Proofi."

**7. "What's Next" (200 words)**
- Criminal conviction in Dubai (Feb 26 hearing)
- Full counter-attack: SEC filing, press releases, chain analysis reports
- Proofi public launch: early access at proofi.ai
- The goal: make this the LAST time a story like this is even possible
- "Six years of tracing wallets taught me one thing: trust should never be optional. With Proofi, it won't be."

### Emotional Arc
1. **Intrigue** → The discovery of fraud pulls the reader in
2. **Fascination** → The on-chain detective work is genuinely compelling
3. **Anger** → The scale and audacity of the fraud, the victims involved
4. **Respect** → Six years of relentless pursuit
5. **Revelation** → The irony moment — catching fraud = preventing fraud
6. **Inspiration** → From personal fight to systemic solution
7. **Conviction** → This person actually knows what they're building and why

### CTA
- Follow the Kenzi case: updates at proofi.ai/blog
- Early access: subscribe at proofi.ai
- If you've been defrauded by Kenzi Wang or AU21 Capital: reach out (contact info)
- Developers: the stack is open — build with us

### Estimated Word Count
3,500-4,000 words

### Best Platform to Publish
1. **Twitter/X** (primary — the crypto community LIVES for on-chain detective stories. Thread format: 25-30 tweets with wallet screenshots and chain traces)
2. **Substack** (full long-form version with embedded wallet traces, timeline graphics)
3. **Medium** (SEO play — "crypto fraud investigation" is a high-search-volume topic)
4. **LinkedIn** (abbreviated version — the professional angle, less technical chain analysis, more "what I learned about trust")
5. **YouTube** (Rocky's team: 10-15 min video version with on-screen wallet traces — $20-50K budget already discussed)

---

## Publishing Strategy

### Recommended Order
1. **Article 3 first** (the personal story — builds credibility, goes viral in crypto Twitter)
2. **Article 1 second** (the LinkedIn attack — leverages momentum from Article 3's virality)
3. **Article 2 third** (the technical deep-dive — for the audience that's now curious about HOW)

### Cross-Promotion
- Each article references the others
- Article 3 teases "I'll explain the tech in my next piece"
- Article 1 references "I traced this man's wallets for 6 years" (link to Article 3)
- Article 2 stands alone technically but gains emotional weight from Articles 1 & 3

### Timing Considerations
- **Feb 26 Dubai hearing** is a natural news hook — publish Article 3 the week of the hearing
- Article 1 (LinkedIn attack) works anytime but hits harder if timed with a LinkedIn controversy or fraud news
- Article 2 (technical) should follow within a week of Article 1 to capture the "how does this actually work" audience

### Legal Review Required
- All articles should be reviewed by Matt/Jenny before publication
- Especially Article 1 (Hoffman/Epstein claims must be factually bulletproof)
- Article 3: ensure nothing compromises ongoing Dubai or California legal proceedings
- Rocky should review for strategic alignment with press release timing

---

## Voice Notes for Mart

**Tone reminders:**
- You're not a thought leader. You're a guy who's been in the trenches.
- No corporate speak. No "leveraging synergies." Talk like you're explaining this to a smart friend over beers.
- Dutch directness is your superpower. Use it.
- Personal stories > abstract claims. Always.
- It's okay to be angry. The anger is earned. Channel it.
- Humor works — especially dark/ironic humor about LinkedIn.
- End every article with a sense of "okay, now what do I do?" — give the reader agency.

**Lines to steal from yourself:**
- "We don't need recruiters anymore. You're building a system." (Fred, about HR — applies to credentials too)
- "The receipts are public" (about blockchain tracing)
- "Anyone sane would have surrendered already" (about Kenzi)
- "Putting a hash on a chain isn't a solution. It's a receipt."
- "You can't kill an ecosystem with a feature."
