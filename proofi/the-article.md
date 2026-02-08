# I Spent 6 Years Tracing a Fraudster's Wallets. Here's Why LinkedIn Should Terrify You.

*By Martijn Broersma*

---

In March 2022, 13,333,334 CERE tokens were sent from our company wallet to an investor named Vivian Liu. At least, that's what the spreadsheet said.

Vivian never got those tokens.

Someone had replaced her wallet address in the distribution sheet with one she'd never seen. The tokens landed, sat for about eight hours, then drained through an intermediary wallet and vanished. Two months later, it happened again — 20 million more tokens, same fake wallet, same drain pattern. Gone within hours.

Total stolen: 33,333,334 CERE tokens. From a single investor. By someone inside our operation.

I know who did it. I've spent six years proving it. And the story of how one man ran an intercontinental fraud operation — across four countries, through fake VC funds, fabricated credentials, and stolen wallets — while maintaining a spotless LinkedIn profile the entire time, is the story of why everything about professional trust on the internet is broken.

But it's also the story of how we fix it.

---

## Meet Kenzi Wang. You've Probably Seen His LinkedIn.

Kenzi Wang's profile reads like a Silicon Valley fairy tale. Y Combinator. Huobi Vice President. Columbia graduate. GP at a16z crypto. Investments in Tesla, SpaceX, Perplexity. Co-founder of a $50 million fund with Polygon's Sandeep Nailwal.

Every single claim above is either fabricated or inflated. And I have the receipts.

Let's start at the beginning.

In 2013, Kenzi co-founded Buzzstarter, later renamed Traction Labs. Forbes described him as a "growth engineer" — not CEO, not co-founder. His actual co-founder Tiffany Pham wrote that Forbes piece. But within years, Kenzi had upgraded himself to "CEO and Co-founder" across every platform.

The seed funding? He claims NEA and Lightbank. The real investors, per TechCrunch and AdExchanger: China Rock Capital, Telegraph Hill Capital, 500 Startups, Digital Garage. NEA and Lightbank appear nowhere in any contemporary source. Fabricated.

The "acquisition" of Traction Labs? The TechCrunch URL he cites — `techcrunch.com/2017/03/10/traction-labs-acquired/` — returns a **404 Not Found**. Because the article doesn't exist. Because the acquisition never happened. A Reddit user noted the marketplace "disappeared by the end of 2015" with "no termination of operation announcement." MarketScreener lists the end date as December 31, 2016. No acquirer has ever been named.

The Huobi "VP & General Manager" title? The Org, a verified organizational data platform, lists him as "Director of Growth." And per someone who worked with him closely: Kenzi was "fired from Huobi for many bad reasons." HBUS, Huobi's US operation, ceased all operations in December 2019. He continued claiming the affiliation for years.

The "CEO of hadron.cloud"? Multiple independent sources — LinkedIn bios, CryptoBriefing profiles, Reddit AMA descriptions — confirm Cliff Szu was the actual CEO. Kenzi just... took his title.

Columbia University? He's claimed four different majors across different platforms: Computer Science, Mathematics, Mathematical Sciences, and Math+Finance. His former co-founder Emmie Chang told investigators he "likely lied about graduating from Columbia and Wharton."

GP at a16z crypto? It appears on CypherHunter and nowhere else. He's not on a16z's public team page. Never was.

Invested in Tesla, SpaceX, Perplexity, Apptronik? These claims exist only on a paid Wikitia page created in July 2025 by "Ankush.srg" — a professional paid page creation service. That page contains five fabricated reference URLs, all returning 404 errors.

**Every credential on this man's profile is a lie. And LinkedIn presented each one as fact for over six years.**

---

## The Playbook: How to Steal Millions While Looking Legitimate

Kenzi didn't just lie on his resume. He weaponized those lies to steal.

Here's the playbook, executed across at least seven ventures over eight years:

**Step 1: Present as a connected insider.** Fabricated credentials, inflated titles, paid Wikipedia knock-offs. Looks like the real thing if you don't check.

**Step 2: Gain trust and access.** Join as advisor or co-founder. Get wallet access. Get admin credentials. Get between investors and the company.

**Step 3: Divert value.** This is where it gets specific.

In January 2021, Kenzi directed 75+ token purchasers to send payments to wallets he personally controlled instead of official Cere company wallets. He maintained a separate "Token Sale Tracker" spreadsheet — then later revoked the company's access to it. On January 19, 2021: $2,671,400 USDC found in his personal Binance custody. January 27: another $320,000. April 2023: $1,382,000 in unapproved wallets. May 2023: another $444,500 identified as a "shadow admin gap."

**Total direct theft confirmed: $4,817,900.**

But the token theft was his masterpiece.

In December 2021, Kenzi insisted on handling investor Vivian Liu's token distribution personally. "I'll handle Vivian," he said in Slack. He then inserted a wallet address into the distribution sheet that Vivian had never provided. Google Sheets cell history shows the address was entered by a "deleted user" — not any current team member. The digital equivalent of planting evidence before you torch the building.

When the tokens were distributed in March and May 2022, they went to that fake wallet. 33.3 million CERE tokens. Vivian's entire allocation. Stolen.

**Step 4: Liquidate.** On January 6, 2024, the stolen tokens started moving. First a test transaction: 33,333 CERE bridged from Cere mainnet to Polygon to Ethereum, landing in bridge wallet `0xb08f79488D335FBc7E0881c78ba341dA1f249f00`. Same day: sent to KuCoin. Next day: the remaining 33.3 million CERE followed the same path and hit KuCoin.

Test first. Then move the full amount. Deliberate. Cautious. Sophisticated.

But here's what made the wallet traceable: on January 31, 2024, that same bridge wallet received tokens from Gate.io — the exchange co-founded by Chandler Guo, who also co-founded AU21 Capital with Kenzi. What tokens? 5.37 million SKYRIM and 30.6 million RAZE. Both niche DeFi tokens. Both AU21 Capital portfolio companies. The chances of those three tokens appearing in the same wallet belonging to anyone *other* than Kenzi Wang are essentially zero.

The bridge wallet was then systematically drained through February 2024 across KuCoin, Gate.io, OKX, and ByBit. By July 7, 2024, the final transaction went through: 0.00027 ETH to ByBit. Wallet balance: $0.04. Every penny extracted.

**Blockchain doesn't lie. People do. But the blockchain remembers everything they did.**

**Step 5: DARVO.** Deny, Attack, Reverse Victim and Offender. In January 2026, Kenzi filed a $58 million countersuit in Delaware — accusing our CEO Fred Jin of exactly what Kenzi himself did. An independent investigation by Practus LLP had already concluded: "No evidence to support Wang's allegations regarding Fred Jin's misappropriation of Company funds."

Then the true coup de grâce: the $100 million RICO lawsuit. Filed January 27, 2026 — by Vivian Liu. The same Vivian whose tokens Kenzi stole. Our legal team believes Kenzi orchestrated this lawsuit through Vivian as a proxy. He stole her tokens, then convinced her to sue *us* for not giving them to her.

Let that level of sociopathy sink in.

**Step 6: Move on.** In August 2022 — while actively stealing from Cere — Kenzi raised a $50 million fund with Polygon co-founder Sandeep Nailwal, covered breathlessly by TechCrunch, CoinDesk, Decrypt, The Block, and Forbes India. Not one outlet mentioned his felony grand theft charge from 2018 (Case No. 18017577, San Francisco County Superior Court, California Penal Code § 487(a)). Not one mentioned the SuperBloom scam (his previous project had a BitcoinTalk scam warning page). Not one mentioned the seven domains he squatted that were stripped from him by arbitration.

In July 2024, his new venture Sentient raised $85 million from Peter Thiel's Founders Fund and Pantera Capital. Kenzi is listed as a "core contributor." His wife Sachi Kamiya is "Director of Business Operations." His fund Symbolic Capital is simultaneously an investor. If you can't see the conflict of interest, it's because you're not supposed to.

In May 2024, he orchestrated the $ELE meme coin pump-and-dump with Polygon insiders. Market cap crashed from $17 million to $2 million. Developers who were promised USDC compensation were never paid.

ZachXBT, crypto's most respected fraud investigator, called out Kenzi as early as January 2022 for "threatening and abusing founders." His former co-founder Emmie Chang called him "the white-collar crypto version of the Tinder Swindler."

Total documented damage from Cere alone: **$104,967,900+**. That's $4.8 million in direct theft plus $100 million in lost OTC and subscription revenue from 13+ investors who withdrew because of Kenzi's actions.

And through all of this — every stolen token, every fabricated credential, every pump-and-dump, every felony charge — **his LinkedIn profile remained pristine.**

---

## LinkedIn Didn't Just Miss It. LinkedIn Can't Catch It.

Here's the uncomfortable truth that LinkedIn doesn't want you to think about:

The platform has no verification layer. None. Zero. You type your credentials, and they become "real." That's the entire system.

Try boarding a plane with a self-reported passport. You'd be arrested. But we trust our entire professional identity — the thing that determines whether you get hired, funded, trusted with millions of dollars — to a system with less verification than a nightclub bouncer.

The numbers are damning:

In 2023, LinkedIn blocked or removed **121 million fake accounts**. They claim 99.65% of fakes are caught — which means roughly 424,000 fake accounts *still get through every year*. Those aren't hypothetical. Those are real fake profiles pretending to be real people, running scams, impersonating executives, and stealing identities.

In June 2021, data from **700 million LinkedIn users** — 92% of all accounts — was scraped and sold on the dark web. Email addresses, phone numbers, geolocation records, professional details. LinkedIn's response? They classified it as "scraping, not a breach." A distinction that means absolutely nothing if your data is being sold on a hacker forum for the price of a coffee.

And the endorsement system? Let me quote interviewing.io, who actually studied this: "The point of endorsements isn't to get at the truth. It's to keep recruiters feeling like they're getting value out of the faceted search they're paying almost $10K per seat for." A marketing intern can endorse a brain surgeon for "Neurosurgery." There is no check. No validation. No consequence.

**LinkedIn is a $17 billion company built on self-reported data, meaningless endorsements, and selling YOUR professional identity to recruiters at $10,000 per seat per year.**

You are the product. Recruiters are the customer. And nobody — absolutely nobody — is verifying whether anything on the platform is true.

---

## Now Let's Talk About Who Built This System

LinkedIn was co-founded by Reid Hoffman. The man who became Silicon Valley's most connected "philosopher-king." The man whose platform controls the professional identity of a billion people.

That same Reid Hoffman visited Jeffrey Epstein's private island.

This isn't conspiracy. It's documented. In December 2025, Hoffman confirmed on the Eric Newcomer podcast that he spent a night on Epstein's island, claiming it was in connection with MIT Foundation fundraising. He "was told Epstein would be more likely to donate to MIT if he visited."

In September 2019, Hoffman apologized for his role in Epstein-linked donations to MIT Media Lab. He had invited Epstein to events at the request of MIT Media Lab director Joi Ito, facilitating donations that MIT later acknowledged should never have been accepted.

I'm not making a guilt-by-association argument. I'm making a priorities argument.

The man who designed the platform that controls your professional reputation thought it was worth visiting a pedophile's island to secure a donation. That tells you everything about where "trust" and "verification" ranked in the design philosophy of LinkedIn.

And then there's the current owner. In 2016, Microsoft acquired LinkedIn for $26.2 billion. Microsoft — the company still run by Bill Gates' shadow, serving as its "technology advisor" until he quietly stepped down from the board in 2020. The same Bill Gates who met with Epstein dozens of times after Epstein's 2008 conviction for sex offenses. Who flew on Epstein's private jet. Who, per The New York Times, had Epstein pitch a proposed charitable fund to JPMorgan in which Gates and Epstein would share in the profits. Gates later said those meetings were a "huge mistake."

So let's add this up. LinkedIn: *co-founded* by a man who visited Epstein's island. *Owned* by a company whose technology advisor met with a convicted sex offender dozens of times. This is the institution that controls your professional identity. These are the people who decided that self-reported credentials were good enough.

**Your professional reputation lives on a platform built by people who valued fundraising access over basic moral due diligence. Let that sink in.**

LinkedIn was never designed to verify truth. It was designed to sell access. To monetize your professional graph. To extract maximum revenue from recruiters who pay premium prices for the privilege of searching through unverified data.

And we just... accepted this. For twenty years. Because there was no alternative.

---

## The Credential Graveyard: Why Every Fix Failed

It's not like nobody tried. The blockchain credential space is littered with corpses.

**Blockcerts** (MIT, 2016): The pioneer. They anchored credential hashes to Bitcoin. Noble idea. But a hash on a chain isn't a solution — it's a receipt. No storage layer. No query layer. No economic model. No selective disclosure. You either shared everything or nothing. Learning Machine, the company behind it, got acquired by Hyland and buried in an enterprise content management portfolio.

**Sovrin Network** (2016): Built an entire blockchain for self-sovereign identity. Got 75+ organizations to run nodes. Then in June 2020, they laid off all paid staff because they couldn't solve the "who pays for this?" problem. Their planned token never launched due to SEC complications. The network still technically runs. Like a brain-dead patient on life support — the machines beep, but nobody's home.

**uPort / Veramo / Serto** (ConsenSys, 2017): One of the earliest Ethereum-based identity projects. Pivoted so many times they fragmented into three separate products, none of which survived. Turns out when gas fees hit $50 per identity operation, the market says no.

**Microsoft ION** (2021): Microsoft built Identity Overlay Network on Bitcoin, integrated it with their Entra Verified ID product... then quietly removed it. Pivoted to `did:web` — which is literally just a centralized domain-based identifier. Even Microsoft, with unlimited resources, couldn't make single-layer decentralized identity work. When they walked away, the network's viability collapsed.

**Dock.io**: Still technically alive. Just rebranded to "Truvera" — which, if you've been around startups long enough, you know is the sound of a company looking for product-market fit it never found.

**Velocity Network Foundation**: A consortium of HR companies building an "Internet of Careers." Consortium models are where innovation goes to die. Too many stakeholders, no ship date, no consumer adoption. Still publishing updates. Nobody's reading them.

Here's the pattern. Every single one of these projects tried to solve a full-stack problem with a single-layer fix:

| What they built | What they missed |
|---|---|
| Credential format | Storage, querying, economics, agents |
| Blockchain for identity | Sustainable economics, consumer UX |
| DID library | Storage, querying, economics, product vision |
| DID registry | Commitment, ecosystem, sustainability |
| Credential issuance | Adoption engine, agent orchestration |
| HR consortium | Individual adoption, speed, openness |

**You can't kill an ecosystem with a feature.** LinkedIn "works" — in its broken, unverified way — because it's a full stack: profiles, search, messaging, jobs, endorsements, feed. To replace it, you don't need better credentials. You need a better *system*.

---

## What I've Been Building While Fighting a Fraudster

I joined Cere Network in 2020. I didn't plan to spend six years tracing stolen wallets across four blockchains and four countries. But fraud has a way of rearranging your priorities.

Somewhere between the exchange subpoenas and the Dubai criminal filings, I had a realization that changed everything:

**The same technology that let me trace Kenzi's wallets is the technology that would have prevented his fraud from ever starting.**

If his credentials had been verifiable on-chain, his entire operation collapses on day one:

- "GP of AU21 Capital"? Where's the on-chain verification from a regulated entity?
- "VP at Huobi"? Show me the signed employment credential.
- "Columbia graduate"? Where's the university-issued, cryptographically signed degree?
- "Investor in 50+ projects"? Show me verified transaction records.

Every single lie he told could have been caught instantly if credentials weren't just words on a screen.

Most credential platforms are built by people who read about fraud in case studies. **Proofi is built by someone who fought it for six years.** Every design decision comes from real adversarial experience, not theoretical threat modeling. I know which attack vectors exist because I've personally defended against them — in courts, on blockchains, across jurisdictions.

---

## Proofi.ai: The Full Stack That Actually Works

Proofi is built on the Cere + CEF architecture. Not a whitepaper. Running code. Let me explain what that means in human terms.

### Layer 1: The Trust Anchor

Every credential issued through Proofi gets anchored on the Cere blockchain. Fifty to seventy validators secure the network. Smart contracts handle credential records, revocation registries, and governance. This isn't "put a hash on Bitcoin and hope for the best." It's a purpose-built chain optimized for data operations with governance that ensures no single entity — no company, no founder, no Kenzi Wang — can change the rules.

Think of it as the notary. Except the notary is math, not a human you have to trust.

### Layer 2: Where Your Credentials Actually Live (DDC)

Here's the layer that killed every previous credential project: storage.

Blockcerts had no storage. Sovrin had no storage. Polygon ID stores in user wallets only (lose your phone, lose your credentials). SpruceID uses centralized databases.

Cere's Decentralized Data Clusters (DDC) solve this. Sixty-three nodes in Dragon 1, 99.9% uptime, 114ms average response time. Your credential gets a Content Identifier (CID) — change one bit and you get a different CID. Mathematical integrity guarantee, not a pinky promise.

The encryption layer (EDEK — Curve25519 elliptic curve cryptography) means node operators literally cannot see your credentials. Client-side key generation. Your keys, your data.

And here's the part that makes selective disclosure possible: field-level encryption. Share your degree without sharing your GPA. Share your job title without sharing your salary. Share that you're certified without revealing which certification body if you don't want to. You control what anyone sees.

Cost? One-seventh the price of AWS S3. $0.01 per gigabyte per month. Credential storage that's economically viable at planet scale.

### Layer 3: Making Credentials Searchable (Streams, Rafts, and the DSC)

Storing credentials is useless if you can't find them. The Data Stream Compute layer transforms credential events into queryable knowledge.

**Streams** are continuous real-time flows: new credential issued, credential revoked, someone ran a verification. Think of them as a live feed of everything happening in the credential ecosystem.

**Rafts** are processed, indexed subsets of those streams. Want "all verified software engineers with AWS certifications in Berlin, verified in the last six months"? That's a Raft query. Sub-second results across millions of credentials.

No other credential project has anything remotely like this. It's the difference between a filing cabinet and Google.

### Layer 4: The Agents That Replace LinkedIn (ROB + Cubbies)

This is where it gets interesting.

**Cubbies** are encrypted shared memory spaces. Think of them as secure rooms where AI agents can collaborate without ever seeing each other's raw data. A recruiter's agent can search your credentials without accessing your underlying personal information. Privacy by architecture, not by policy.

The **Real-Time Orchestration Builder (ROB)** is the agent factory. Visual interface. Deploy a credential-verifying agent in under an hour. No DevOps degree required.

This enables three types of agents that fundamentally transform how professional credentials work:

**Your Personal Agent.** This is your AI credential manager. It submits documents for verification — your diploma, your work contract, your AWS certification. It controls what's shared and with whom. It notifies you when someone runs a verification check. In the future: zero-knowledge proofs that let you prove you have a degree without revealing which university. Your credentials. Your rules. No platform in the middle extracting rent.

**Organization Agents.** Run by universities, employers, certification bodies. When you submit a claim — "I graduated from TU Delft in 2018" — TU Delft's Org Agent reviews it, matches it against their records, and issues a cryptographically signed credential on-chain. Automated for standard credentials via API integration with existing institutional systems. Human review for edge cases. Every verification generates an economic receipt — the org earns CERE tokens for doing the work of issuing truth.

**Recruiter Agents.** No more paying LinkedIn $10,000 per seat to search through unverified data. Recruiter Agents search verified credentials across the entire network. Everything returned is cryptographically proven. Want "ML engineers with 3+ years at FAANG companies, available, in EU timezone"? The query runs. The results are trustworthy. Because every credential was verified by the institution that issued it, not typed by the person who claims it.

**LinkedIn charges you to access unverified data. Proofi lets you access verified data. That's not an incremental improvement. That's a category shift.**

### Layer 5: The Economics That Keep It Alive (DAC)

Remember Sovrin? Died because they couldn't answer "who pays for this?"

The Data Activity Capture layer solves this permanently. Every credential operation — issuance, verification, query — generates a cryptographic receipt. Merkle trees compress millions of operations into verifiable summaries every ten minutes. Sentinel validators run random spot-checks to ensure honest behavior through math, not trust.

The economic loop:

- Organizations issue credentials → earn CERE tokens
- Recruiters search and verify → pay CERE tokens
- Individuals control their data → free (subsidized by recruiter demand)
- Node operators store credentials → earn CERE tokens
- Validators secure the network → earn CERE tokens

No ads. No premium subscriptions. No selling your data. The protocol is the business model. Automated, transparent, self-correcting.

If you cheat, you get slashed. Not "we'll look into it" — economic penalties enforced by code.

**LinkedIn makes money by keeping your data hostage. Proofi makes money by keeping your data honest.**

---

## "This Isn't a Whitepaper. It's Running Code."

I need to say this clearly because the blockchain space is 90% vaporware:

Proofi is not a concept. It's not a pitch deck. It's not a whitepaper with a roadmap stretching to 2030.

The DDC has been stress-tested: 19,000+ writes at 20 per second. Zero errors. Sixty-three storage nodes with massive headroom. Credentials have been issued and verified on Cere mainnet. The pipeline works: submit claim → org reviews → credential issued → on-chain anchor → verifiable by anyone, anywhere, instantly.

The Cere blockchain has processed billions of transactions. Dragon 1 has been running at 99.9% uptime. The SDKs support web, iOS, Android, and even Telegram mini-apps. Any developer can integrate in under an hour — not "Hello World," production-ready deployment.

I built this because I watched what happens when credentials are just words on a screen. Six years of watching. Six years of tracing wallets, filing police reports, obtaining exchange subpoenas, coordinating with lawyers across four jurisdictions. Six years of seeing Kenzi Wang operate freely because no system existed to verify that anything he said was true.

---

## The World Where Kenzi Can't Operate

Let me paint the picture.

In the world Proofi creates, Kenzi Wang walks into a meeting claiming to be GP of a major fund. The investor across the table doesn't google him — their Recruiter Agent checks for a verified credential from AU21 Capital. There isn't one. Red flag.

He claims a Columbia degree. The agent checks for a university-issued credential. Four different majors, zero verified credentials. Red flag.

He claims to be VP at Huobi. The agent checks for a signed employment credential. Nothing. Red flag.

He claims Traction Labs was acquired. The agent checks for a verified M&A credential, a signed confirmation from the acquirer. Neither exists. Red flag.

Before the meeting ends, the investor knows. Not because they spent three days doing due diligence. Not because they hired a private investigator. Not because they got lucky and found the right Reddit thread. Because the cryptographic absence of verified credentials is, itself, a signal.

**In a world of verified credentials, silence speaks louder than lies.**

---

## The Bigger Picture: $35 Billion in the Crosshairs

The identity verification market was worth $13.7 billion in 2024 and is projected to hit $63 billion by 2033. The background screening market: $15.5 billion. LinkedIn's revenue alone: $17.1 billion.

These markets exist as separate silos. Sterling, HireRight, and Checkr charge $50-200 per background check. LinkedIn charges $10K per seat for Recruiter. Those costs exist because verification is manual, slow, and siloed.

When credential verification is cryptographic, instant, and costs a fraction of a cent per operation, the entire industry gets compressed into a protocol. Not disrupted — *compressed*. The $15.5 billion background check market doesn't disappear. It becomes a $0.001-per-verification protocol running at 1000x the volume, because when verification is frictionless, everyone verifies everything.

That's not a pitch. That's math.

---

## What Happens Next

Kenzi Wang was arrested in Dubai on our criminal complaint. He's out on bail. Passport surrendered. Travel ban active. Two criminal cases proceeding in Dubai Criminal Court — not Misdemeanor Court, Criminal Court. That means more serious charges, longer potential sentences. Legal assessment: minimum five-year jail exposure if convicted.

We have two additional criminal cases ready to file. An SEC unregistered broker-dealer filing in preparation. Chain analysis firms being engaged to produce the kind of forensic reports that DOJ and FBI accept as evidence.

The February 26 Dubai hearing is a critical milestone. A criminal conviction there forces the entire global settlement conversation.

But here's the thing: even when Kenzi is convicted, the system that enabled him still exists. LinkedIn will still let anyone claim anything. Background checks will still take weeks and cost hundreds of dollars. Professional trust will still be a game of "who has the most convincing profile."

Unless we change the infrastructure.

---

## This Is My Last LinkedIn Post

I'm posting this article on the very platform it indicts. Ironic? Yes. Strategic? Also yes.

Because the 1 billion people on LinkedIn need to hear this. Not in a crypto echo chamber. Not on a niche Substack. Here. Where the problem lives.

I'm not telling you to delete LinkedIn today. I'm telling you that the era of self-reported credentials is ending. That there's now a system where your degree isn't a text field — it's a cryptographic proof. Where your work history isn't what you typed — it's what your employer signed. Where a recruiter doesn't have to trust your profile — they can verify it in milliseconds.

**Proofi.ai is live.** Subscribe for early access. The platform launches soon. When it does, you'll be able to:

- Submit your credentials for verification by the institutions that issued them
- Control exactly who sees what, with field-level encryption
- Let your Personal Agent manage verification requests automatically
- Build a professional identity that's actually *yours* — not LinkedIn's property to monetize

I spent six years learning how trust breaks. Every wallet trace, every fabricated credential, every courtroom filing taught me something about what happens when we let platforms gatekeep professional identity without any accountability.

Proofi is what I built with those lessons.

The fraudsters had their run. The platforms that protected them had their run.

It's time for credentials that can't be faked, on a platform that can't be gamed, owned by the people they belong to.

**Subscribe at [proofi.ai](https://proofi.ai). The receipts are coming.**

---

*If you've been defrauded by Kenzi Wang, AU21 Capital, or Symbolic Capital — or if you have information relevant to ongoing legal proceedings — reach out. We're building the case. And unlike LinkedIn, we verify.*

*If you're an institution interested in becoming an early issuing organization on Proofi, or a developer who wants to build on the Cere + CEF stack: the SDKs are ready. The infrastructure is live. Let's build the trust layer the internet should have had from the start.*
