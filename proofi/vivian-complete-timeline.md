# COMPLETE VIVIAN LIU TIMELINE - CHRONOLOGICAL

**For: Matt Miller & Jenny (litigation support)**
**Compiled: February 2, 2026**
**Author: Martijn Broersma**

This is everything. Every date, every communication, every on-chain event, every wallet. Chronological order.

---

## PARTIES

| Person | Role |
|---|---|
| **Vivian Liu (Lujunjin Liu)** | Investor via Goopal Digital Ltd. |
| **Kevin** | Co-plaintiff / part of Kenzi syndicate |
| **Kenzi Wang (Jin Wang)** | AU21 Capital co-founder, former Cere advisor/investor |
| **Andrei Kinstler (AK)** | Cere operations - mastersheet + Fireblocks access (now "deleted user") |
| **Andrei (AN)** | Cere operations - mastersheet access (now "deleted user", cleared in investigation) |
| **Fred Jin** | Cere CEO - Fireblocks operator, executed transfers |
| **Evgeny Svirsky** | Fireblocks co-signer (denies signing relevant transactions) |
| **Martijn Broersma** | Cere - investor relations, distribution coordinator, mastersheet access |

---

## THE TIMELINE

### 2019-2020 - The Investment

- **Vivian Liu** invests **$100,000** in Cere Network via **Goopal Digital Ltd.**
- Investment entitles her to **33,333,334 CERE tokens** (investment allocation)
- Separately, a **Strategic Advisory Agreement** is signed (as "Lujunjin Liu") for **20,000,000 CERE tokens** in advisory compensation
- Kenzi Wang (AU21 Capital) is also an investor/advisor to Cere Network at this time
- Kenzi and Vivian are in the same investor/advisor circle - he knows her personally

### 2021 - Token Distribution Period Begins

- Cere begins distributing tokens to 160+ private investors and 5,000+ Republic platform investors
- **Standard process:**
  1. Martijn obtains investor's wallet address directly from investor
  2. Martijn shares verified address with AK or AN
  3. AK/AN enters address into distribution mastersheet (Google Sheets)
  4. Token transfers executed via Fireblocks (requires multi-sig)

### December 23, 2021 - Kenzi Takes Control

- **Kenzi Wang states in Slack:** "I'll handle Vivian" / "I'll take Vivian and Jacky"
- From this moment, Kenzi becomes the **sole intermediary** between Cere and Vivian Liu
- No one at Cere has independent contact with Vivian from this point
- Kenzi reports back: Vivian "showed up, didn't sign new docs, said she got pregnant and had a baby, but wants all tokens staked"
- This narrative explains away the lack of updated documentation - including why Vivian never provided her own wallet address

### Late 2021 - Early 2022 - Fake Wallet Address Inserted

- A Cere mainnet wallet address appears in the distribution mastersheet for Vivian Liu:
  - **SS58 format:** `6R1GPxm3jqiRgjFXkFGLWh2XbcwZysRgXWmZjsyq43pSrwFu`
  - **Old Substrate format:** `5DZMJ4GD8MDhp2Pxsri3ysqRqoE3KfsSGE7zMgGDVngbUrwv`
  - (Same address, two encoding formats)
- **Vivian Liu never provided this address.** She confirms she never provided a mainnet wallet.
- **Martijn confirmed:** "The address was never shared by the investor, already checked everything"
- Google Sheets edit history shows the address was entered by a **"deleted user"** - meaning no current team member's account is associated with the edit
- Only 5 people had write access: AK, AN, Sieb, Fred, Martijn
- AK's Google Workspace data was **deleted** after the 20-day retention period - destroying email/document audit trail

### March 25, 2022 - First Token Distribution (Tranche 1)

- **13,333,334 CERE** sent from Company Wallet A to fake investor wallet
- **From:** `6Rz7GYaWj5mY7zSFp2aNpXcPP7LkhuMr8E8g62j5mHKEYRbS` (Company Wallet A)
- **To:** `6R1GPxm3jqiRgjFXkFGLWh2XbcwZysRgXWmZjsyq43pSrwFu` (Fake "Vivian" wallet)
- **Block:** 4,361,724
- Executed via Fireblocks by Fred, based on instructions from AK/AN
- Vivian Liu never controlled this wallet

### ~8 Hours After First Distribution - Tokens Drained

- **Entire balance drained** from fake wallet to intermediary wallet `6SCW2o71hKeWyNY2eBnti7QF2o1TG98BCuj7Fi9Fz23r6R4s`
- Transaction pattern:
  1. **2 CERE** - test transaction (verifying wallet control)
  2. **≈3,333,334 CERE** - first sweep
  3. **30,000,000 CERE** - main sweep
  4. **1 CERE** - dust cleanup
- Test-then-sweep pattern = operational behavior by someone managing a theft, NOT investor behavior

### Same Day - Tokens Returned to Origin

- Intermediary wallet (`6SCW...6R4s`) transfers **entire ≈33,333,334 CERE** to:
  - `6Rz7GYaWj5mY7zSFp2aNpXcPP7LkhuMr8E8g62j5mHKEYRbS`
  - **This is the SAME Company Wallet A that originated the first distribution**
- Tokens completed a full circle: Company → Fake Wallet → Intermediary → Back to Company
- Vivian received nothing. The distribution was fabricated on paper.

### May 10, 2022 - Second Token Distribution (Tranche 2)

- **20,000,000 CERE** sent from Company Wallet B to the same fake investor wallet
- **From:** `6RtDT7L4rK9L7BRE78gPLEx1Dw5mvrXfhZMfPWx3bf2ib2sb` (Company Wallet B)
- **To:** `6R1GPxm3jqiRgjFXkFGLWh2XbcwZysRgXWmZjsyq43pSrwFu` (Same fake wallet)
- **Block:** 5,019,196
- Same pattern follows - tokens drained shortly after
- **Total stolen: 33,333,334 CERE** = Vivian's full investment allocation

### Mid-2022 - Kenzi Leaves Cere

- Kenzi Wang departs Cere Network
- The token theft was set up as a "booby trap" - wallet was planted while Kenzi was still at the company
- Tokens were claimed/moved AFTER he left
- He knew Vivian was pregnant, hard to reach - exploited this to delay any inquiry

### 2022-2023 - Investigation Begins

- Vivian (or her associates) eventually escalate, claiming she never received tokens
- Mart and team investigate:
  - Checked mastersheet - wallet address is there but Vivian says she never provided it
  - Contacted former employees (AN - cleared, "actively helped searching")
  - AK's data already deleted - Google 20-day retention expired
  - Evgeny Svirsky (co-signer) denies signing: "I didn't sign anything. Nobody has my private keys."
- Mart confirms to team: "The address was never shared by the investor, already checked everything"
- "They didn't sell anything, see outgoing tx and receiving wallet balances"
- Traced transactions - found the circular flow back to company wallet

### November 14, 2023 - Mart Contacts Vivian Directly

- **Mart emails Vivian and Kevin:**
  - "Hey Vivian, Kevin. Looking at the records, all transactions have been completed."
  - Informs them tokens were sent to the wallet address on file
  - Provides the wallet address and transaction details

### November 15, 2023 - Vivian/Kevin Respond

- Kevin responds (a day later)
- Brief exchange - they claim they **never provided a mainnet wallet**
- Kevin requests a call, books via Calendly for Monday
- Something comes up, misses it
- Kevin says "can do Saturday"
- **Then: silence.** Never heard from Kevin again after confirming his meeting request.
- Mart: "I was in the call and then I was like, okay, know, I'm not gonna have other things to do than worry about this"

### Late 2023 - Advisory Agreement Analysis

- Cere team locates the **Strategic Advisory Agreement** signed by Vivian as "Lujunjin Liu"
- Agreement was for **20,000,000 CERE tokens** in advisory compensation
- **Vivian never did any work.** Only 1-2 calls with the company, then disappeared.
- Never invoiced the company for any work
- Never demanded the 20,000,000 advisory tokens - they were never distributed
- Kenzi was the sole conduit - if she was doing work, she was only communicating it to Kenzi
- The advisory tokens are separate from the 33.3M investment tokens that were stolen

### January 6, 2024 - Stolen Tokens Bridged (Test)

- **33,333 CERE** bridged from Cere mainnet → Polygon → Ethereum (test transaction)
- Lands in Ethereum bridge wallet: `0xb08f79488D335FBc7E0881c78ba341dA1f249f00`
- **Immediately sent to KuCoin** deposit address: `0xB2101F398f0c91F5F802a6A6aFC56C58A4567b81`
- Tx hash: `0xcfe4dc...` ✅ Block 18948896

### January 7, 2024 - Full Amount Bridged and Sold

- **33,299,997.97 CERE** bridged (the remaining full amount)
- Same path: Cere mainnet → Polygon → Ethereum → bridge wallet
- **Immediately sent to KuCoin** same deposit address
- Tx hash: `0x0e2d9f...` ✅ Block 18956627
- **Total cashed out on KuCoin: 33,333,330.97 CERE** ≈ Vivian's full allocation
- Test-then-full pattern: deliberate, cautious, not normal investor behavior

### January - February 2024 - Bridge Wallet Activity

- Bridge wallet `0xb08f...9f00` shows further activity:
  - **Funded by Kenzi's identified wallet** (`0x0d0707...b492fe`):
    - Feb 1, 2024: 0.619 ETH IN (gas funding)
    - Feb 2, 2024: 0.214 ETH IN (gas funding)
  - Claims RAZE tokens (AU21 portfolio project)
  - Claims SKYRIM tokens (AU21 portfolio project)
  - Feb 2, 2024: 2.000 ETH → intermediary `0x8Fa40873...371487B95`
  - Feb 24, 2024: 0.174 ETH → **OKX exchange** deposit
  - Jul 7, 2024: 0.0003 ETH → **ByBit exchange** deposit
  - **Current state: drained** - balance near zero

### Kenzi's Identified Ethereum Wallet - The Smoking Gun

- **Wallet:** `0x0d0707963952f2fba59dd06f2b425ace40b492fe`
- **Portfolio fingerprint (unique to Kenzi Wang / AU21 Capital):**
  - **276,239,956 CERE** - major holder
  - **38,258,803 SKYRIM** - **#1 holder, 38.26% of total supply** (AU21 invested in Skyrim Finance $2.1M round, May 2021)
  - **20,188,459 RAZE** - **#1 holder, 16.82% of total supply** (AU21 funding partner for Raze Network, April 2021)
- No other wallet on ANY blockchain holds #1 positions in both SKYRIM and RAZE simultaneously
- This wallet directly funded the bridge wallet used to sell Vivian's stolen tokens
- **As of January 2026, this wallet is ACTIVELY LIQUIDATING CERE:**
  - Jan 3: 532,859 CERE sold
  - Jan 7: 1,135,612 CERE sold
  - Jan 13: 374,478 + 397,213 CERE sold
  - Jan 16: 379,299 CERE sold
  - Jan 18: 1,123,385 CERE sold
  - Jan 19: 581,292 CERE sold
  - Classic OTC/exchange liquidation pattern

### January 27, 2026 - Vivian's Lawsuit Filed

- **Case:** *Goopal Digital Ltd. v. Jin Wang et al.*, Case No. 3:26-cv-00857, N.D. California
- **Plaintiffs:** Lujunjin "Vivian" Liu and Goopal Digital Ltd.
- **Defendants named:** Fred Jin, Martin (Martijn Broersma), Francois Grenade, Brad Bell, Cerebellum Network (DE), Interdata Network (BVI), CEF AI Inc (DE)
- Filed by small LA plaintiff firm (5 attorneys, 2 partners, 3 associates)
- **Cere legal team assessment:** Kenzi is 100% behind this. He stole her tokens AND told her to sue Cere.
- Complaint has NOT been served yet as of Feb 2, 2026

### February 2, 2026 - Litigation Strategy Call

**Participants:** Fred Jin, Jenny, Matt Miller, Rocky Lee, Martijn Broersma

**Key decisions:**
1. **Dubai is the real battleground** - Feb 26 criminal hearing is the critical deadline
2. **Cerebellum Network Inc will waive service** and file counterclaim against Kenzi
3. **Individual defendants (Mart, Brad, Francois) will NOT waive service** - hope they never get served
4. **Dual-track:** Amend existing CA complaint + file counterclaim in new Vivian case
5. Both filings before Feb 26 for Dubai court admissibility
6. Reach out to plaintiff's counsel: "your client is victim of Kenzi's scam"
7. Arbitration option noted (advisory agreement has clause) but parked

**Damages in counterclaim:**
- Investment: $100K = 33,333,334 CERE tokens (stolen - basis of counterclaim)
- Advisory: 20,000,000 tokens (never distributed, never worked, never invoiced)
- Vivian claims "several hundred hours" of work - company was never informed

**Vivian assessment:** 50/50 whether she's a Kenzi puppet or genuinely defrauded by him

**Matt's action items:**
- Mart to write this chronological narrative (this document)
- Mart to search Kenzi's company inbox for Vivian communications
- Draft counterclaim in ~2 weeks
- Reach out to plaintiff's counsel

---

## WALLET REFERENCE TABLE

### Cere Mainnet

| Label | Address | Role |
|---|---|---|
| Fake "Vivian" wallet | `6R1GPxm3jqiRgjFXkFGLWh2XbcwZysRgXWmZjsyq43pSrwFu` | Received stolen tokens |
| Same (old format) | `5DZMJ4GD8MDhp2Pxsri3ysqRqoE3KfsSGE7zMgGDVngbUrwv` | Same address |
| Intermediary | `6SCW2o71hKeWyNY2eBnti7QF2o1TG98BCuj7Fi9Fz23r6R4s` | Forwarded to company wallet |
| Company Wallet A (origin + return) | `6Rz7GYaWj5mY7zSFp2aNpXcPP7LkhuMr8E8g62j5mHKEYRbS` | Sent 13.3M, received 33.3M back |
| Company Wallet B | `6RtDT7L4rK9L7BRE78gPLEx1Dw5mvrXfhZMfPWx3bf2ib2sb` | Sent 20M |
| Source 1 | `6UYREEFRZSc8uNgLJmW3XLZAUTxci7DgL2LCbZ9CRDgXdzKu` | Distribution source |
| Source 2 | `6RWG7AGaRXua7BahDgQuAYU1h66Pdp2yF6dNMWrwEbiSPYru` | Distribution source |
| Source 3 | `6TbU9HniHt56svpTqQBP5yciyBCCNVZWfStURYHQtNWsz4A9` | Distribution source |

### Ethereum

| Label | Address | Role |
|---|---|---|
| **Kenzi's wallet** | `0x0d0707963952f2fba59dd06f2b425ace40b492fe` | 276M CERE + #1 SKYRIM + #1 RAZE |
| Bridge wallet | `0xb08f79488D335FBc7E0881c78ba341dA1f249f00` | Received bridged tokens, sold on KuCoin |
| KuCoin deposit | `0xB2101F398f0c91F5F802a6A6aFC56C58A4567b81` | 33.3M CERE deposited here |
| OKX deposit | `0x2Ca818...c873e0` | ETH cash-out |
| ByBit deposit | `0xB4263a...26B139` | ETH cash-out |

### Exchanges Involved (Subpoena targets)

| Exchange | Evidence | Jurisdiction |
|---|---|---|
| **KuCoin** | 33.3M CERE deposited and sold | Non-US (Seychelles), but Dubai-registered |
| **OKX** | ETH cash-out from bridge wallet | Non-US, Dubai-registered |
| **ByBit** | ETH cash-out from bridge wallet | Non-US, Dubai-registered |
| **Gate** | Referenced in broader investigation | Non-US |

---

## CHAIN OF EVIDENCE - VISUAL

```
DEC 2021: Kenzi says "I'll handle Vivian" (Slack)
    │
    ▼
EARLY 2022: Fake wallet address inserted in mastersheet by "deleted user"
    │
    ▼
MAR 25, 2022: 13.33M CERE → fake wallet (Block 4,361,724)
MAY 10, 2022: 20.00M CERE → fake wallet (Block 5,019,196)
    │                              TOTAL: 33.33M CERE
    ▼
~8 HOURS LATER: Drained to intermediary (6SCW...6R4s)
    │              Pattern: 2 CERE test → 3.3M → 30M → 1 dust
    ▼
SAME DAY: Intermediary → Company Wallet A (6Rz7...YRBS)
    │              ★ FULL CIRCLE - tokens returned to origin
    │
    ▼
NOV 14, 2023: Mart contacts Vivian - "all transactions completed"
NOV 15, 2023: Kevin responds briefly, then ghosts
    │
    ▼
JAN 6, 2024: 33,333 CERE bridged → Ethereum → KuCoin (test)
JAN 7, 2024: 33,299,997 CERE bridged → Ethereum → KuCoin (full)
    │              TOTAL SOLD ON KUCOIN: 33,333,330.97 CERE
    ▼
FEB 1-2, 2024: Kenzi's wallet (0x0d07) funds bridge wallet with ETH
    │              Bridge wallet also interacts with RAZE + SKYRIM (AU21 portfolio)
    ▼
JAN 2026: Kenzi's wallet actively liquidating remaining 276M CERE
    │
    ▼
JAN 27, 2026: Vivian files lawsuit (orchestrated by Kenzi)
    │
    ▼
FEB 2, 2026: Litigation strategy call - counterclaim strategy defined
    │
    ▼
FEB 26, 2026: Dubai criminal hearing - judge rules
```

---

*This document is prepared for litigation support. All on-chain data is publicly verifiable via cere.statescan.io and etherscan.io.*
