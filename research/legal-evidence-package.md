# LEGAL EVIDENCE PACKAGE
## Cere Network / Cerebellum Networks Inc. v. Kenzi Wang (Jin Wang)

**Prepared for:** Matt Miller & Jenny — Litigation Support
**Date:** February 2, 2026
**Author:** Martijn Broersma
**Classification:** Attorney Work Product — Privileged & Confidential

---

## TABLE OF CONTENTS

1. [I. Chronological Narrative](#i-chronological-narrative)
2. [II. On-Chain Evidence Table](#ii-on-chain-evidence-table)
3. [III. Wallet Reference Table](#iii-wallet-reference-table)
4. [IV. Exchange Subpoena Targets](#iv-exchange-subpoena-targets)
5. [V. Key Documents & Communications](#v-key-documents--communications)
6. [VI. Pattern Evidence](#vi-pattern-evidence)
7. [VII. Damages Calculation](#vii-damages-calculation)

---

## I. CHRONOLOGICAL NARRATIVE

### Who / What / When / Where — The Complete Story

#### 2019–2020: The Investment

- **Who:** Vivian Liu (also known as Lujunjin Liu) via Goopal Digital Ltd.
- **What:** Invested $100,000 in Cere Network, entitling her to **33,333,334 CERE tokens**.
- **Separately:** A Strategic Advisory Agreement was signed (as "Lujunjin Liu") for **20,000,000 CERE tokens** in advisory compensation.
- **Context:** Kenzi Wang (AU21 Capital co-founder) was already an investor/advisor to Cere Network. He knew Vivian personally — both were in the same investor/advisor circle.

#### 2021: Token Distribution Begins

- Cere begins distributing tokens to **160+ private investors** and **5,000+ Republic platform investors**.
- **Standard process:**
  1. Martijn obtains investor's wallet address directly from the investor.
  2. Address shared with AK (Andrei Kinstler) or AN for entry into the distribution mastersheet (Google Sheets).
  3. Token transfers executed via Fireblocks (requires multi-signature authorization).
- **Every single investor** received their tokens through this process — except one.

#### December 23, 2021: Kenzi Volunteers as Sole Contact

- **Who:** Kenzi Wang
- **What:** Stated in Slack: **"I'll handle Vivian"** / **"I'll take Vivian and Jacky."**
- **Where:** Internal Cere Slack channel
- **Effect:** From this moment, Kenzi became the **sole intermediary** between Cere and Vivian Liu. No one at Cere had independent contact with Vivian from this point forward.
- **Cover story provided:** Kenzi reported back that Vivian "showed up, didn't sign new docs, said she got pregnant and had a baby, but wants all tokens staked."
- **Purpose of cover story:** Explained away the lack of updated documentation — including why Vivian never directly provided her own wallet address.

#### Late 2021 – Early 2022: Fake Wallet Address Inserted

- **What:** A Cere mainnet wallet address appears in the distribution mastersheet for Vivian Liu.
- **Fake wallet address:**
  - SS58 format: `6R1GPxm3jqiRgjFXkFGLWh2XbcwZysRgXWmZjsyq43pSrwFu`
  - Old Substrate format: `5DZMJ4GD8MDhp2Pxsri3ysqRqoE3KfsSGE7zMgGDVngbUrwv`
  - (Same address, two encoding formats)
- **Vivian Liu never provided this address.** She confirms she never provided a mainnet wallet.
- **Martijn confirmed:** "The address was never shared by the investor, already checked everything."
- **Google Sheets edit history:** Shows the address was entered by a **"deleted user"** — no current team member's account is associated with the edit.
- **Write access:** Only 5 people had write access to the mastersheet: AK, AN, Sieb, Fred, Martijn.
- **Evidence destruction:** AK's (Andrei Kinstler) Google Workspace account was **deleted** after the 20-day retention period — destroying the email/document audit trail that would identify who provided the fake address.

#### March 25, 2022: First Token Distribution (Tranche 1)

- **What:** **13,333,334 CERE** sent from Company Wallet A to the fake "Vivian" wallet.
- **From:** `6Rz7GYaWj5mY7zSFp2aNpXcPP7LkhuMr8E8g62j5mHKEYRbS` (Company Wallet A)
- **To:** `6R1GPxm3jqiRgjFXkFGLWh2XbcwZysRgXWmZjsyq43pSrwFu` (Fake wallet)
- **Block:** 4,361,724
- **Executed by:** Fred Jin via Fireblocks, based on instructions from AK/AN and the mastersheet.
- **Vivian Liu never controlled this wallet.**

#### ~8 Hours After Distribution: Wallet Drained

- **What:** Entire balance drained from fake wallet to intermediary wallet.
- **To:** `6SCW2o71hKeWyNY2eBnti7QF2o1TG98BCuj7Fi9Fz23r6R4s` (Intermediary)
- **Transaction pattern (classic test-then-sweep):**
  1. **2 CERE** — test transaction (verifying wallet control)
  2. **~3,333,334 CERE** — first sweep
  3. **30,000,000 CERE** — main sweep
  4. **1 CERE** — dust cleanup
- **Significance:** No legitimate investor drains a wallet within 8 hours of receiving a distribution. The test-then-sweep pattern is operational behavior by someone managing a theft.

#### Same Day: Tokens Returned to Origin (Circular Flow)

- **What:** Intermediary wallet (`6SCW...6R4s`) transfers **entire ~33,333,334 CERE** back to Company Wallet A (`6Rz7...YRBS`).
- **Significance:** Tokens completed a **full circle**: Company → Fake Wallet → Intermediary → Back to Company. Vivian received nothing. The distribution was fabricated on paper only.

#### May 10, 2022: Second Token Distribution (Tranche 2)

- **What:** **20,000,000 CERE** sent from Company Wallet B to the same fake wallet.
- **From:** `6RtDT7L4rK9L7BRE78gPLEx1Dw5mvrXfhZMfPWx3bf2ib2sb` (Company Wallet B)
- **To:** `6R1GPxm3jqiRgjFXkFGLWh2XbcwZysRgXWmZjsyq43pSrwFu` (Same fake wallet)
- **Block:** 5,019,196
- **Same pattern follows** — tokens drained shortly after.
- **TOTAL STOLEN: 33,333,334 CERE** = Vivian's full investment allocation.

#### Mid-2022: Kenzi Leaves Cere

- Kenzi Wang departs Cere Network.
- **"Booby trap" structure:** Wallet was planted while Kenzi was still at the company. Tokens were claimed/moved AFTER he left.
- He knew Vivian was pregnant and hard to reach — exploited this to delay any inquiry.

#### November 14, 2023: Mart Contacts Vivian Directly

- **Who:** Martijn Broersma → Vivian Liu and Kevin (co-plaintiff)
- **What:** Email informing them: "Hey Vivian, Kevin. Looking at the records, all transactions have been completed." Provided the wallet address and transaction details on file.
- **Where:** Email

#### November 15, 2023: Brief Response, Then Ghosted

- **Kevin responds** (1 day later). Brief exchange.
- They claim they **never provided a mainnet wallet**.
- Kevin requests a call, books via Calendly for Monday.
- Something comes up, misses the Monday call.
- Kevin says "can do Saturday."
- **Then: silence.** Never heard from Kevin again after confirming his meeting request.
- **Significance:** Contact was initiated by Cere, met with brief engagement, then complete radio silence — consistent with Kenzi directing Vivian/Kevin to stop responding once Cere was asking questions.

#### January 6, 2024: Stolen Tokens Bridged (Test Transaction)

- **What:** **33,333 CERE** bridged from Cere mainnet → Polygon → Ethereum.
- **Lands in Ethereum bridge wallet:** `0xb08f79488D335FBc7E0881c78ba341dA1f249f00`
- **Immediately sent to KuCoin deposit address:** `0xB2101F398f0c91F5F802a6A6aFC56C58A4567b81`
- **Tx hash:** `0xcfe4dc...`
- **Block:** 18,948,896

#### January 7, 2024: Full Amount Bridged and Cashed Out

- **What:** **33,299,997.97 CERE** bridged (the full remaining amount).
- **Same path:** Cere mainnet → Polygon → Ethereum → bridge wallet → KuCoin.
- **Tx hash:** `0x0e2d9f...`
- **Block:** 18,956,627
- **TOTAL CASHED OUT ON KUCOIN: 33,333,330.97 CERE** ≈ Vivian's full allocation.
- **Significance:** Test-then-full pattern — deliberate, cautious, not normal investor behavior.

#### February 1–2, 2024: Kenzi's Wallet Funds Bridge Wallet (THE SMOKING GUN)

- **What:** Kenzi's identified Ethereum wallet (`0x0d0707963952f2fba59dd06f2b425ace40b492fe`) sends ETH to the bridge wallet used to sell stolen tokens.
  - Feb 1, 2024: **0.619 ETH** → bridge wallet (gas funding)
  - Feb 2, 2024: **0.214 ETH** → bridge wallet (gas funding)
- **Bridge wallet also interacts with:**
  - **RAZE tokens** (AU21 portfolio project) — claimed from same wallet
  - **SKYRIM tokens** (AU21 portfolio project) — claimed from same wallet
- **Additional bridge wallet activity:**
  - Feb 2, 2024: 2.000 ETH → intermediary `0x8Fa40873...371487B95`
  - Feb 24, 2024: 0.174 ETH → **OKX exchange** deposit
  - Jul 7, 2024: 0.0003 ETH → **ByBit exchange** deposit
- **Current state:** Bridge wallet drained — balance near zero.

#### January 2026: Kenzi's Wallet Actively Liquidating CERE

- **Wallet:** `0x0d0707963952f2fba59dd06f2b425ace40b492fe`
- **Liquidation pattern (classic OTC/exchange sell-off):**
  - Jan 3: 532,859 CERE sold
  - Jan 7: 1,135,612 CERE sold
  - Jan 13: 374,478 + 397,213 CERE sold
  - Jan 16: 379,299 CERE sold
  - Jan 18: 1,123,385 CERE sold
  - Jan 19: 581,292 CERE sold

#### January 27, 2026: Vivian's Lawsuit Filed (Orchestrated by Kenzi)

- **Case:** *Goopal Digital Ltd. v. Jin Wang et al.*, Case No. 3:26-cv-00857, N.D. California
- **Plaintiffs:** Lujunjin "Vivian" Liu and Goopal Digital Ltd.
- **Defendants named:** Fred Jin, Martin (Martijn Broersma), Francois Grenade, Brad Bell, Cerebellum Network (DE), Interdata Network (BVI), CEF AI Inc (DE)
- **Filed by:** Small LA plaintiff firm (5 attorneys, 2 partners, 3 associates)
- **Assessment:** Kenzi is 100% behind this lawsuit. He stole Vivian's tokens AND directed her to sue Cere.
- **Complaint has NOT been served** as of February 2, 2026.

#### January 2026: CoinDesk Article

- **What:** CoinDesk publishes a one-sided article: *"Investors accuse Cere Network of $100M fraud."*
- **Significance:** Kenzi's narrative disseminated as news. Part of the coordinated attack.

#### February 2026: Dubai Criminal Proceedings

- **What:** Kenzi Wang arrested and interrogated in Dubai. Held for one day. **Active travel ban** — cannot leave the country.
- **Two criminal cases filed:** Case No. 31801/2025 and 33359/2025, referred to Dubai Criminal Court.
- **Charges:** Theft of Cere's social media accounts and defamatory publications.
- **Hearing date:** February 26, 2026 — judge rules on further prosecution.
- **Potential sentence:** Up to 5 years imprisonment if convicted.
- **Two additional cases ready** but not yet filed.

#### February 2, 2026: Litigation Strategy Call

- **Participants:** Fred Jin, Jenny, Matt Miller, Rocky Lee, Martijn Broersma
- **Key decisions:**
  1. Dubai is the real battleground — Feb 26 hearing is critical deadline.
  2. Cerebellum Network Inc will waive service and file counterclaim against Kenzi.
  3. Individual defendants (Mart, Brad, Francois) will NOT waive service — hope they never get served.
  4. Dual-track: Amend existing CA complaint + file counterclaim in new Vivian case.
  5. Both filings before Feb 26 for Dubai court admissibility.
  6. Reach out to plaintiff's counsel: "your client is victim of Kenzi's scam."

---

## II. ON-CHAIN EVIDENCE TABLE

### A. Cere Mainnet — Token Theft

| # | Date | From | To | Amount (CERE) | Block | Description |
|---|------|------|----|---------------|-------|-------------|
| 1 | Mar 25, 2022 | `6Rz7...YRBS` (Company A) | `6R1G...rwFu` (Fake wallet) | 13,333,334 | 4,361,724 | Tranche 1 distribution |
| 2 | Mar 25, 2022 (~8h later) | `6R1G...rwFu` (Fake wallet) | `6SCW...6R4s` (Intermediary) | 2 | — | Test transaction |
| 3 | Mar 25, 2022 (~8h later) | `6R1G...rwFu` (Fake wallet) | `6SCW...6R4s` (Intermediary) | ~3,333,334 | — | First sweep |
| 4 | Mar 25, 2022 (~8h later) | `6R1G...rwFu` (Fake wallet) | `6SCW...6R4s` (Intermediary) | 30,000,000 | — | Main sweep |
| 5 | Mar 25, 2022 (~8h later) | `6R1G...rwFu` (Fake wallet) | `6SCW...6R4s` (Intermediary) | 1 | — | Dust cleanup |
| 6 | Mar 25, 2022 | `6SCW...6R4s` (Intermediary) | `6Rz7...YRBS` (Company A) | ~33,333,334 | — | Full circle — returned to origin |
| 7 | May 10, 2022 | `6RtD...b2sb` (Company B) | `6R1G...rwFu` (Fake wallet) | 20,000,000 | 5,019,196 | Tranche 2 distribution |
| 8 | May 10, 2022 (shortly after) | `6R1G...rwFu` (Fake wallet) | Intermediary | 20,000,000 | — | Drained (same pattern) |

**Fake wallet remaining balance:** 1.73 CERE (~$0.00)

### B. Bridging & Cash-Out (Cere → Polygon → Ethereum → Exchanges)

| # | Date | From | To | Amount | Chain | Tx Hash / Block | Description |
|---|------|------|----|--------|-------|-----------------|-------------|
| 9 | Jan 6, 2024 | Cere mainnet | Polygon → Ethereum | 33,333 CERE | Multi | — | Test bridge |
| 10 | Jan 6, 2024 | `0xb08f...9f00` (Bridge wallet) | `0xB210...7b81` (KuCoin) | 33,333 CERE | ETH | `0xcfe4dc...` / Block 18,948,896 | Test sale on KuCoin |
| 11 | Jan 7, 2024 | Cere mainnet | Polygon → Ethereum | 33,299,997.97 CERE | Multi | — | Full bridge |
| 12 | Jan 7, 2024 | `0xb08f...9f00` (Bridge wallet) | `0xB210...7b81` (KuCoin) | 33,299,997.97 CERE | ETH | `0x0e2d9f...` / Block 18,956,627 | Full sale on KuCoin |

**Total cashed out on KuCoin: 33,333,330.97 CERE**

### C. Kenzi's Wallet Funding the Bridge Wallet (Smoking Gun)

| # | Date | From | To | Amount | Chain | Description |
|---|------|------|----|--------|-------|-------------|
| 13 | Feb 1, 2024 | `0x0d07...92fe` (Kenzi) | `0xb08f...9f00` (Bridge) | 0.619 ETH | ETH | Gas funding |
| 14 | Feb 2, 2024 | `0x0d07...92fe` (Kenzi) | `0xb08f...9f00` (Bridge) | 0.214 ETH | ETH | Gas funding |
| 15 | Feb 2, 2024 | `0xb08f...9f00` (Bridge) | `0x8Fa4...7B95` (Intermediary) | 2.000 ETH | ETH | Value transfer |
| 16 | Feb 24, 2024 | `0xb08f...9f00` (Bridge) | OKX deposit | 0.174 ETH | ETH | Exchange cash-out |
| 17 | Jul 7, 2024 | `0xb08f...9f00` (Bridge) | ByBit deposit | 0.0003 ETH | ETH | Exchange cash-out |

### D. Kenzi's Wallet — Active CERE Liquidation (January 2026)

| # | Date | Amount (CERE) | Description |
|---|------|---------------|-------------|
| 18 | Jan 3, 2026 | 532,859 | Sold |
| 19 | Jan 7, 2026 | 1,135,612 | Sold |
| 20 | Jan 13, 2026 | 374,478 | Sold |
| 21 | Jan 13, 2026 | 397,213 | Sold |
| 22 | Jan 16, 2026 | 379,299 | Sold |
| 23 | Jan 18, 2026 | 1,123,385 | Sold |
| 24 | Jan 19, 2026 | 581,292 | Sold |

---

## III. WALLET REFERENCE TABLE

### Cere Mainnet Wallets

| Label | Address | Role | Notes |
|-------|---------|------|-------|
| **Fake "Vivian" Wallet** | `6R1GPxm3jqiRgjFXkFGLWh2XbcwZysRgXWmZjsyq43pSrwFu` | Received stolen tokens | Vivian never provided this address. Balance: 1.73 CERE |
| Same (old format) | `5DZMJ4GD8MDhp2Pxsri3ysqRqoE3KfsSGE7zMgGDVngbUrwv` | Same address, alt encoding | — |
| **Intermediary** | `6SCW2o71hKeWyNY2eBnti7QF2o1TG98BCuj7Fi9Fz23r6R4s` | Forwarded tokens back to company wallet | Used as pass-through |
| **Company Wallet A** | `6Rz7GYaWj5mY7zSFp2aNpXcPP7LkhuMr8E8g62j5mHKEYRbS` | Sent 13.3M CERE; received 33.3M back | Origin AND return address |
| **Company Wallet B** | `6RtDT7L4rK9L7BRE78gPLEx1Dw5mvrXfhZMfPWx3bf2ib2sb` | Sent 20M CERE | Second distribution source |
| Source 1 | `6UYREEFRZSc8uNgLJmW3XLZAUTxci7DgL2LCbZ9CRDgXdzKu` | Distribution source | — |
| Source 2 | `6RWG7AGaRXua7BahDgQuAYU1h66Pdp2yF6dNMWrwEbiSPYru` | Distribution source | — |
| Source 3 | `6TbU9HniHt56svpTqQBP5yciyBCCNVZWfStURYHQtNWsz4A9` | Distribution source | — |

### Ethereum Wallets

| Label | Address | Role | Current Balance |
|-------|---------|------|-----------------|
| **Kenzi's Wallet (IDENTIFIED)** | `0x0d0707963952f2fba59dd06f2b425ace40b492fe` | Main wallet — 276M CERE, #1 SKYRIM holder, #1 RAZE holder | Active — liquidating CERE |
| **Bridge Wallet** | `0xb08f79488D335FBc7E0881c78ba341dA1f249f00` | Received bridged stolen tokens; sold on KuCoin | Drained — near zero |
| **KuCoin Deposit** | `0xB2101F398f0c91F5F802a6A6aFC56C58A4567b81` | 33.3M CERE deposited and sold here | Exchange-controlled |
| OKX Deposit | `0x2Ca818...c873e0` | ETH cash-out destination | Exchange-controlled |
| ByBit Deposit | `0xB4263a...26B139` | ETH cash-out destination | Exchange-controlled |
| ETH Intermediary | `0x8Fa40873...371487B95` | Received 2 ETH from bridge wallet | — |

### Kenzi's Wallet — Portfolio Fingerprint (Unique Identification)

The wallet `0x0d0707963952f2fba59dd06f2b425ace40b492fe` is uniquely identifiable as Kenzi Wang / AU21 Capital through its token holdings:

| Token | Amount | Significance |
|-------|--------|-------------|
| **CERE** | 276,239,956 | Major holder — actively liquidating |
| **SKYRIM** | 38,258,803 | **#1 holder — 38.26% of total supply** (AU21 invested in Skyrim Finance $2.1M round, May 2021) |
| **RAZE** | 20,188,459 | **#1 holder — 16.82% of total supply** (AU21 was funding partner for Raze Network, April 2021) |

**No other wallet on ANY blockchain holds #1 positions in both SKYRIM and RAZE simultaneously.** This portfolio fingerprint is unique to Kenzi Wang / AU21 Capital.

---

## IV. EXCHANGE SUBPOENA TARGETS

### Overview

Four exchanges were used to cash out the stolen CERE tokens and associated ETH proceeds. All four are non-US entities but have Dubai registrations, making them accessible via the Dubai criminal proceedings.

### Exchange Details

| Exchange | What Was Done | Evidence | Jurisdiction | Dubai-Registered? | Subpoena Strategy |
|----------|---------------|----------|-------------|-------------------|-------------------|
| **KuCoin** | 33,333,330.97 CERE deposited and sold (Jan 6-7, 2024) | Tx hashes: `0xcfe4dc...`, `0x0e2d9f...`; Deposit address: `0xB210...7b81` | Seychelles (HQ) | ✅ Yes | **PRIMARY TARGET** — Dubai court order most effective. Request KYC records, trade history, withdrawal addresses for deposit address `0xB210...7b81` during Jan 2024 |
| **OKX** | ETH cash-out from bridge wallet (Feb 24, 2024) | 0.174 ETH deposit to `0x2Ca818...c873e0` | Seychelles (HQ) | ✅ Yes | Request KYC records and full transaction history for deposit address |
| **ByBit** | ETH cash-out from bridge wallet (Jul 7, 2024) | 0.0003 ETH deposit to `0xB4263a...26B139` | BVI (HQ) | ✅ Yes | Request KYC records and full transaction history for deposit address |
| **Gate** | Referenced in broader investigation | Under investigation | Cayman Islands (HQ) | Under investigation | Secondary target — request records once primary exchanges produce results |

### Subpoena Priorities

1. **KuCoin (CRITICAL):** This is where 33.3M CERE tokens were sold. KYC records will identify who controlled the selling account. This is the single most important piece of evidence to obtain.
2. **OKX:** ETH proceeds cash-out. Corroborating evidence.
3. **ByBit:** ETH proceeds cash-out. Corroborating evidence.
4. **Gate:** Referenced but lower priority.

### Jurisdictional Strategy

- **US Court (N.D. Cal.):** Jenny warns that non-US exchanges are very hard to subpoena from US courts.
- **Dubai Court:** All four exchanges have Dubai registrations. **Dubai criminal proceedings are the most effective vector** for compelling exchange cooperation.
- **Recommendation:** Coordinate with Dubai counsel to issue court orders to all four exchanges as part of the criminal case. Dubai courts have direct jurisdiction.

---

## V. KEY DOCUMENTS & COMMUNICATIONS

### A. Google Sheets Distribution Mastersheet — Edit History

- **Document:** Cere Network token distribution mastersheet (Google Sheets)
- **Key evidence:** Cell containing Vivian Liu's wallet address shows it was entered by a **"deleted user"**
- **Significance:** The deleted user is Andrei Kinstler (AK), whose Google Workspace account was subsequently deleted
- **Preservation status:** Google Sheets edit history is still intact and shows the "deleted user" attribution
- **Only 5 people had write access:** AK, AN, Sieb, Fred, Martijn
- **AN has been cleared** — actively helped in the investigation

### B. Kenzi's "I'll Handle Vivian" Communication

- **Date:** December 23, 2021
- **Platform:** Internal Cere Slack channel
- **Statement:** "I'll handle Vivian" / "I'll take Vivian and Jacky"
- **Significance:** Establishes Kenzi as the sole intermediary. From this moment, no one at Cere communicated directly with Vivian.
- **Preservation status:** Slack message history retained

### C. Kenzi's Cover Story

- **Date:** Late December 2021 – Early 2022
- **Platform:** Internal Cere communications
- **Content:** Kenzi reported that Vivian was pregnant, hard to reach, and wanted her tokens staked
- **Significance:** Created plausible explanation for why no signed documentation existed and why Vivian never provided her own wallet address

### D. Mart's Email to Vivian

- **Date:** November 14, 2023
- **From:** Martijn Broersma
- **To:** Vivian Liu and Kevin
- **Content:** "Hey Vivian, Kevin. Looking at the records, all transactions have been completed." Provided wallet address and transaction details.
- **Response:** Kevin responded November 15, claimed they never provided a mainnet wallet, requested a call, then ghosted completely.

### E. AK's Deleted Google Workspace

- **Who:** Andrei Kinstler (AK) — Cere operations, mastersheet + Fireblocks access
- **What:** Google Workspace account deleted after the 20-day retention period
- **Effect:** All emails, documents, and communication logs permanently destroyed
- **Significance:** The audit trail that would show who provided the fake wallet address was deliberately eliminated
- **Remaining evidence:** Google Sheets edit history still shows "deleted user" entered the wallet address

### F. Vivian's Strategic Advisory Agreement

- **Signatory:** "Lujunjin Liu" (Vivian's legal name)
- **Terms:** 20,000,000 CERE tokens for advisory services
- **Actual work performed:** Only 1-2 calls with the company, then disappeared
- **Invoices submitted:** Zero
- **Demand for advisory tokens:** Never made
- **Kenzi was the sole conduit** — if any work was done, it was only communicated to Kenzi
- **Vivian now claims:** "Several hundred hours" of work — company was never informed

### G. Evgeny Svirsky Statement

- **Who:** Fireblocks co-signer
- **Statement:** "I didn't sign anything. Nobody has my private keys."
- **Significance:** Denies authorizing the relevant token transfers, raising questions about Fireblocks signing process

---

## VI. PATTERN EVIDENCE

### A. Dylan Dewdney Affidavit — Kylin/Paralink Invest-Then-Compete

- **Affiant:** Dylan Dewdney, Co-Founder of Kylin Network (Polkadot oracle project)
- **Affidavit draft:** Completed February 2, 2026 — [Google Doc](https://docs.google.com/document/d/1gFICIJLoV4wdiF2W2Uu0Xt9e0srpI2sb/edit)
- **Facts:**
  - Kenzi/AU21 Capital invested in Kylin Network
  - While serving as investor, Kenzi simultaneously financed and controlled **Paralink** — a direct competitor to Kylin
  - **Screenshot evidence** from December 2021/January 2022 confirms Paralink was under Kenzi's control
  - Dylan was introduced to Kenzi by **Kevin Hsu**, who subsequently also damaged Dylan's project
  - This is a classic "invest-then-compete" scheme: invest to gain access to proprietary information, then use it against the investee
- **Dylan's status:** "Happy to sign anything" — willing to testify under oath
- **Legal relevance:** Demonstrates Kenzi's pattern of betraying business relationships for personal gain. Same modus operandi as the Vivian token theft.

### B. Grand Theft — 2018

- **What:** Grand Theft charge (felony) against Kenzi Wang in San Francisco
- **Case number:** 18017577
- **Year:** 2018
- **Significance:** Prior felony charge demonstrates a documented history of theft predating the Cere involvement by several years

### C. $1.3M Influencer Private Sale Theft

- **What:** Kenzi conducted private token sales to crypto influencers on behalf of Cere Network
- **Amount:** $1,300,000 in crypto proceeds collected
- **What happened:** Kenzi kept the entire amount — never remitted to Cere
- **Legal action:** Cerebellum Networks sued Kenzi in May 2023, N.D. California
- **In the complaint:** Kenzi described as "former advisor and independent contractor" — NOT a co-founder (despite his claims)
- **Significance:** Demonstrates a parallel theft scheme at the same company, discovered and prosecuted BEFORE the Vivian token theft was fully understood

### D. AU21 Capital Portfolio Destruction Pattern

| Project | Result | Details |
|---------|--------|---------|
| **SuperBloom/SEED** | Dead — scam warning on BitcoinTalk | Kenzi's first crypto project (2017-2018); co-founder Emmie Chang called him "The Tinder Swindler of crypto" |
| **VegaSwap** | Total loss | AU21 portfolio — project dead |
| **Youclout** | 99.8% loss | AU21 portfolio |
| **AvaXlauncher** | 97% loss | AU21 portfolio |
| **Dragon Kart (KART)** | 99.1% loss, zero volume | AU21 portfolio — dead project |
| **Skyrim Finance** | Tokens sold in volumes only available to insiders | AU21 portfolio |
| **Raze Network** | Tokens sold in volumes only available to insiders | AU21 portfolio |

**Pattern:** AU21 invests early, gets tokens at low prices, sells when tokens hit exchanges, project dies. Classic dump-and-abandon across multiple projects.

### E. Fabricated Credentials

| Claim | Reality |
|-------|---------|
| "General Partner at a16z crypto" | Never on a16z team page. Fabricated. |
| "CEO of hadron.cloud" | Three independent sources confirm Cliff Szu was actual CEO |
| "Traction Labs acquired (per TechCrunch)" | TechCrunch URL returns 404. Reddit confirms Traction Labs simply failed. No acquisition. |
| Symbolic Capital (current entity) | Renamed from Hyperedge Capital — Crunchbase URL reveals the rename. Name changes to obscure history. |

### F. Sandeep Nailwal Connection

- **Who:** Sandeep Nailwal, co-founder of Polygon (one of the largest blockchain platforms)
- **Co-defendant** in federal case: *Interdata vs Wang, Nailwal, Hu* (Case 3:25-cv-03798, N.D. Cal.)
- **Connection:** Sandeep and Kenzi co-founded Symbolic Capital (formerly Hyperedge Capital)
- **Shares same attorney:** David Sergenian
- **Significance:** Kenzi operates within a network of high-profile crypto figures, not as a lone actor

---

## VII. DAMAGES CALCULATION

### A. Stolen CERE Tokens — Investment Allocation

| Metric | Value |
|--------|-------|
| **Tokens stolen** | 33,333,334 CERE |
| **Vivian's investment** | $100,000 |
| **Token price at distribution (Mar 2022)** | ~$0.015 |
| **Value at distribution** | ~$500,000 |
| **Token all-time high** | ~$0.088 (Apr 2022) |
| **Value at ATH** | ~$2,933,333 |
| **Token price at cash-out (Jan 2024)** | ~$0.003–0.005 |
| **Estimated cash-out proceeds** | ~$100,000–$166,000 |
| **Current token price (Feb 2026)** | ~$0.001 |
| **Current theoretical value** | ~$33,333 |

**Basis for counterclaim:** The theft itself — regardless of current token value. The tokens were stolen through fraud and converted without authorization.

### B. Influencer Private Sale Proceeds

| Metric | Value |
|--------|-------|
| **Amount stolen** | $1,300,000 (crypto) |
| **Nature** | Proceeds from token sales conducted by Kenzi on behalf of Cere, never remitted |
| **Existing legal action** | Cerebellum Networks v. Kenzi Wang (2023, N.D. Cal.) |

### C. Advisory Tokens — Offset / Counterclaim Defense

| Metric | Value |
|--------|-------|
| **Advisory allocation** | 20,000,000 CERE tokens |
| **Agreement signed by** | "Lujunjin Liu" (Vivian) |
| **Work performed** | 1-2 calls only. No ongoing services. |
| **Invoices submitted** | Zero |
| **Demand for tokens** | Never made |
| **Company awareness of work** | None — Kenzi was sole conduit |
| **Vivian's current claim** | "Several hundred hours" of work |
| **Counter-argument** | Tokens were never distributed, never demanded, no work product exists. If work was done, it was only reported to Kenzi — not to the company. |

### D. Total Damages Summary (For Counterclaim)

| Category | Amount | Status |
|----------|--------|--------|
| Investment tokens stolen | 33,333,334 CERE ($100K basis) | Core counterclaim |
| Influencer sale proceeds | $1,300,000 | Existing suit — to be amended |
| Advisory tokens (defense) | 20,000,000 CERE (never distributed) | Offset against Vivian's claims |
| Vivian's lawsuit claim | $100,000,000 | Frivolous — orchestrated by Kenzi |

### E. Vivian's $100M Claim — Why It Fails

1. **Vivian's tokens were stolen by Kenzi, not by Cere.** The counterclaim demonstrates this with on-chain evidence.
2. **5,000+ Republic investors and 160+ private investors** all received their tokens without issue. Vivian is the sole exception — the one where Kenzi inserted himself.
3. **The advisory agreement** (20M tokens) was never fulfilled because Vivian never did the work, never invoiced, and never demanded the tokens.
4. **The lawsuit was orchestrated by the thief** to create a smokescreen and attack the victims of his theft.

---

## APPENDIX: ALL ACTIVE LEGAL PROCEEDINGS

| Case | Jurisdiction | Type | Status | Key Date |
|------|-------------|------|--------|----------|
| Dubai Criminal Cases 31801/2025 & 33359/2025 | Dubai Criminal Court | Criminal | Active — Kenzi arrested, travel ban | **Feb 26, 2026** — judge rules |
| Cerebellum Networks v. Kenzi Wang ($1.3M) | N.D. California | Civil | Active — being amended to include Vivian theft | Counterclaim ~2 weeks |
| Goopal Digital v. Jin Wang et al. ($100M) | N.D. California (3:26-cv-00857) | Civil | Filed Jan 27, 2026 — NOT served | Counterclaim to be filed |
| Interdata v. Wang, Nailwal, Hu | N.D. California (3:25-cv-03798) | Civil (Federal) | Active | — |
| San Francisco Grand Theft (2018) | San Francisco | Criminal | Case 18017577 | Historical |

---

## APPENDIX: CHAIN OF EVIDENCE — VISUAL FLOW

```
DEC 23, 2021:  Kenzi says "I'll handle Vivian" (Slack)
     │
     ▼
EARLY 2022:    Fake wallet address inserted in mastersheet by "deleted user" (AK)
     │
     ▼
MAR 25, 2022:  13,333,334 CERE → fake wallet (Block 4,361,724)
MAY 10, 2022:  20,000,000 CERE → fake wallet (Block 5,019,196)
     │                              TOTAL: 33,333,334 CERE
     ▼
~8 HOURS:      Drained to intermediary (6SCW...6R4s)
     │          Pattern: 2 CERE test → 3.3M → 30M → 1 dust
     ▼
SAME DAY:      Intermediary → Company Wallet A (6Rz7...YRBS)
     │          ★ FULL CIRCLE — tokens returned to origin
     │          Vivian received NOTHING
     │
     ▼
NOV 14, 2023:  Mart contacts Vivian — "all transactions completed"
NOV 15, 2023:  Kevin responds briefly, then ghosts
     │
     ▼
JAN 6, 2024:   33,333 CERE bridged → Ethereum → KuCoin (test)
JAN 7, 2024:   33,299,997 CERE bridged → Ethereum → KuCoin (full)
     │          TOTAL SOLD ON KUCOIN: 33,333,330.97 CERE
     ▼
FEB 1-2, 2024: Kenzi's wallet (0x0d07) funds bridge wallet with ETH
     │          Bridge wallet also claims RAZE + SKYRIM (AU21 portfolio tokens)
     ▼
JAN 2026:      Kenzi's wallet actively liquidating remaining 276M CERE
     │
     ▼
JAN 27, 2026:  Vivian files lawsuit (orchestrated by Kenzi)
     │
     ▼
FEB 2, 2026:   Litigation strategy call — counterclaim strategy defined
     │
     ▼
FEB 26, 2026:  Dubai criminal hearing — judge rules
```

---

## APPENDIX: PARTIES REFERENCE

| Person | Role | Current Status |
|--------|------|----------------|
| **Kenzi Wang (Jin Wang)** | AU21 Capital co-founder; former Cere advisor/investor; primary suspect | Arrested in Dubai, travel ban active, criminal proceedings |
| **Vivian Liu (Lujunjin Liu)** | Investor ($100K); plaintiff in $100M suit | 50/50 — either Kenzi's puppet or genuinely defrauded by him |
| **Kevin** | Co-plaintiff, part of Kenzi syndicate | Ghosted after Nov 15, 2023 contact |
| **Andrei Kinstler (AK)** | Cere operations — mastersheet + Fireblocks access | "Deleted user" — Google Workspace destroyed |
| **Fred Jin** | Cere CEO — Fireblocks operator | Defendant in Vivian suit; leading counterstrategy |
| **Martijn Broersma** | Cere — investor relations, distribution coordinator | Defendant in Vivian suit; compiled this evidence |
| **Evgeny Svirsky** | Fireblocks co-signer | Denies signing relevant transactions |
| **Matt Miller** | Cere litigation counsel | Leading counterclaim and amended complaint |
| **Jenny** | Cere litigation counsel | Co-counsel with Matt |
| **Rocky Lee** | Cere strategic counsel | Leading Dubai strategy and counteroffensive |
| **Dylan Dewdney** | Kylin Network co-founder — pattern witness | Willing to sign affidavit re: Kenzi's invest-then-compete scheme |
| **Sandeep Nailwal** | Polygon co-founder, Symbolic Capital co-founder with Kenzi | Co-defendant in Interdata case |
| **David Sergenian** | Attorney for Kenzi and Sandeep | Represents both in federal case |

---

*This document is prepared for litigation support. All on-chain data is publicly verifiable via cere.statescan.io and etherscan.io. Compiled February 2, 2026 by Martijn Broersma.*
