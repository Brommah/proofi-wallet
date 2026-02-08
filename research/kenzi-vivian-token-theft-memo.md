# PRIVILEGED & CONFIDENTIAL — ATTORNEY WORK PRODUCT

---

# EVIDENCE MEMORANDUM

**TO:** Rocky Lee, Esq. — Milliard Law  
**FROM:** Cere Network — Internal Investigation Team  
**DATE:** July 13, 2025  
**RE:** Misappropriation of 33,333,334 CERE Tokens Belonging to Vivian Liu / Goopal Digital Ltd. by Kenzi Wang (a/k/a Jin Wang)

---

## 1. EXECUTIVE SUMMARY

This memorandum documents the theft of 33,333,334 CERE Network tokens ("CERE") rightfully belonging to investor Vivian Liu and her entity Goopal Digital Ltd. The evidence demonstrates that Kenzi Wang (also known as Jin Wang), a former investor and advisor to Cere Network through AU21 Capital, orchestrated a scheme to divert these tokens by (i) inserting himself as the sole point of contact for the investor, (ii) causing a wallet address not controlled by the investor to be entered into Cere's internal distribution records, (iii) facilitating the distribution of 33,333,334 CERE to that wallet, and (iv) cycling the stolen tokens through an intermediary wallet back to a Cere company wallet — effectively erasing the investor's allocation while leaving no tokens in the investor's possession.

On-chain blockchain records — which are immutable and publicly verifiable — confirm that the tokens were distributed in two tranches (March 25, 2022, and May 10, 2022) to a wallet the investor has confirmed she never controlled. Within approximately eight hours of receipt, the entire balance was forwarded through a single intermediary wallet and returned to a Cere Network company wallet that had originated one of the distributions. This circular flow is inconsistent with any legitimate investor activity and is consistent only with a scheme to siphon tokens allocated to Ms. Liu.

This matter is the subject of the civil action *Goopal Digital Ltd. v. Jin Wang*, Case No. 3:26-cv-00857 (N.D. Cal.), filed January 27, 2026. Mr. Wang is also the subject of a separate legal complaint by Cere Network regarding irregular capital transfers, diversion of token-sale proceeds to personal wallets, misstatements, and intimidation. He was arrested in Dubai in connection with that complaint and released on bail after surrendering his passport.

**Critically, an Ethereum wallet has been forensically identified as belonging to Kenzi Wang** through cross-referencing token holdings unique to AU21 Capital's investment portfolio. Wallet `0x0d0707963952f2fba59dd06f2b425ace40b492fe` holds 276,239,956 CERE tokens alongside the #1 holder position in both Skyrim Finance (38.26% of total supply) and Raze Network (16.82% of total supply) — two projects funded exclusively through AU21 Capital. No other individual or entity on any blockchain holds this combination of positions. This wallet constitutes the single most important piece of evidence linking Kenzi Wang personally to the stolen proceeds.

---

## 2. ⚠️ KEY EVIDENCE: KENZI WANG'S IDENTIFIED ETHEREUM WALLET

> **THIS IS THE SINGLE MOST IMPORTANT PIECE OF EVIDENCE IN THIS MATTER.**

### 2.1 — The Wallet

| Field | Value |
|---|---|
| **Ethereum Address** | `0x0d0707963952f2fba59dd06f2b425ace40b492fe` |
| **Etherscan Link** | [View on Etherscan](https://etherscan.io/address/0x0d0707963952f2fba59dd06f2b425ace40b492fe) |

### 2.2 — Token Holdings That Identify the Wallet Owner

This wallet holds positions in three tokens that, taken together, can only belong to one person: Kenzi Wang, co-founder of AU21 Capital.

| Token | Contract Address | Holdings | Supply Position | Significance |
|---|---|---|---|---|
| **CERE Network (CERE)** | [`0x2da719db753dfa10a62e140f436e1d67f2ddb0d6`](https://etherscan.io/token/0x2da719db753dfa10a62e140f436e1d67f2ddb0d6) | **276,239,956 CERE** | Major holder | Kenzi was an investor/advisor to Cere Network via AU21 Capital |
| **Skyrim Finance (SKYRIM)** | [`0x2610f0bfc21ef389fe4d03cfb7de9ac1e6c99d6e`](https://etherscan.io/token/0x2610f0bfc21ef389fe4d03cfb7de9ac1e6c99d6e) | **38,258,803 SKYRIM** | **#1 holder — 38.26% of total supply** | AU21 Capital participated in Skyrim Finance's $2.1M funding round (May 2021) |
| **Raze Network (RAZE)** | [`0x5Eaa69B29f99C84Fe5dE8200340b4e9b4Ab38EaC`](https://etherscan.io/token/0x5Eaa69B29f99C84Fe5dE8200340b4e9b4Ab38EaC) | **20,188,459 RAZE** | **#1 holder — 16.82% of total supply** | AU21 Capital was a funding partner for Raze Network (April 2021) |

### 2.3 — Why This Can Only Be Kenzi Wang

The identification rests on a process of elimination that is, for practical purposes, conclusive:

1. **AU21 Capital exclusivity.** AU21 Capital (co-founded by Kenzi Wang and Chandler Guo in 2017) was the investor in both Skyrim Finance's $2.1M round (May 2021) and Raze Network as a funding partner (April 2021). These were niche DeFi projects. The overlap in investor base is extremely narrow.

2. **Simultaneous #1 holder status.** No other wallet on Ethereum holds the #1 position in both SKYRIM tokens (38.26% of total supply) and RAZE tokens (16.82% of total supply). This dual-#1 position is unique to this single wallet and corresponds to the portfolio of AU21 Capital — Kenzi Wang's fund.

3. **276 million CERE tokens.** The same wallet holds 276,239,956 CERE tokens. Kenzi Wang was directly involved with Cere Network through AU21 Capital as an investor and advisor. He had access to Cere's internal distribution processes and was the subject of Cere's separate legal complaint for diverting token-sale proceeds to personal wallets.

4. **Behavioral linkage.** Kenzi Wang exclusively handled Vivian Liu's investor communications (Slack messages, December 2021). He controlled what information flowed between the investor and Cere's distribution team. The stolen 33.3M CERE tokens were drained from the fraudulent "investor wallet" through an intermediary and ultimately sold or transferred by whoever controlled these tokens.

5. **Portfolio fingerprint.** The combination of CERE + SKYRIM (#1 holder) + RAZE (#1 holder) in a single wallet is a unique portfolio fingerprint. It is the digital equivalent of finding a suspect's personal documents, house keys, and employee badge at a crime scene — each item alone might be coincidental; together, they identify one and only one person.

### 2.4 — Chain of Evidence: From Theft to This Wallet

```
Dec 2021    Kenzi volunteers as sole contact for Vivian Liu (Slack)
            ↓
Early 2022  Fake wallet address inserted into distribution mastersheet
            (investor never provided an address)
            ↓
Mar 2022    13.33M CERE sent to fake wallet (Block 4,361,724)
May 2022    20.00M CERE sent to fake wallet (Block 5,019,196)
            ↓
~8 hours    Entire 33.33M CERE drained to intermediary wallet (6SCW...6R4s)
            ↓
Same day    33.33M CERE forwarded to Company Wallet A (6Rz7...YRBS)
            — tokens cycled back; investor received nothing
            ↓
End state   The wallet holding the proceeds — 0x0d07...92fe —
            also holds 276M CERE + #1 SKYRIM + #1 RAZE
            = unique AU21 Capital / Kenzi Wang portfolio fingerprint
```

### 2.5 — Forensic Recommendation

This wallet should be the subject of:

- **Immediate blockchain forensic analysis** (Chainalysis / TRM Labs) to trace all inflows, outflows, exchange deposits, and bridge transactions — establishing the complete money trail from the stolen 33.3M CERE to this Ethereum wallet.
- **Exchange subpoenas** for any centralized exchange accounts linked to `0x0d0707963952f2fba59dd06f2b425ace40b492fe` (KYC records will confirm the identity of the account holder).
- **Asset freeze requests** to prevent further dissipation of the 276M CERE and other holdings.
- **Cross-chain bridge analysis** to identify how CERE tokens moved from the Cere Network mainnet (Substrate-based) to Ethereum (ERC-20), which will establish the connection between the Cere mainnet wallets documented in Section 4 and this Ethereum wallet.

### 2.6 — Bridge Destination Wallet: Funded Directly by Kenzi's Wallet

> **Added January 29, 2026 — New Evidence**

| Field | Value |
|---|---|
| **Ethereum Address** | `0xb08f79488D335FBc7E0881c78ba341dA1f249f00` |
| **Etherscan Link** | [View on Etherscan](https://etherscan.io/address/0xb08f79488D335FBc7E0881c78ba341dA1f249f00) |
| **Current Balance** | ~0.000019 ETH ($0.05) — drained |
| **Token Holdings** | 3 tokens ($0.00 value) — RAZE, SKYRIM, CERE residuals |

This wallet was identified as the **bridge destination** where stolen tokens were moved to on Ethereum. Critically, on-chain records confirm it was **directly funded by Kenzi Wang's identified wallet** (`0x0d0707...b492fe`):

| Date (UTC) | Tx | Amount | Direction |
|---|---|---|---|
| 2024-02-01 | [`0x94cc11...`](https://etherscan.io/tx/0x94cc11de5e5905c5efd9ba6c6a73a0881e3bf18f4a2f5278e51a41bbda5d0bdd) | 0.619 ETH | IN from `0x0d0707` (Kenzi's wallet) |
| 2024-02-02 | [`0x58db79...`](https://etherscan.io/tx/0x58db7987b9053f8c2144a09e4ef5fc49b02ca1eebbf00e3f312c3964b025771f) | 0.214 ETH | IN from `0x0d0707` (Kenzi's wallet) |

**Subsequent activity from this bridge wallet:**

- **Multiple RAZE token interactions** (Feb 1 – Feb 24, 2024) — claiming/transferring RAZE tokens via the Raze Network contract
- **SKYRIM token interaction** (Feb 1, 2024) — interacting with Skyrim Finance contract
- **2 ETH sent to** `0x8Fa40873...371487B95` (Feb 2, 2024)
- **0.174 ETH sent to OKX exchange** deposit address (Feb 24, 2024)
- **0.000276 ETH sent to ByBit exchange** deposit address (Jul 7, 2024)
- **Current state: drained** — balance near zero, all value extracted to exchanges

**Evidentiary significance:** This wallet provides a **direct on-chain link** between Kenzi Wang's primary wallet and exchange cash-out points (OKX, ByBit). The funding pattern — Kenzi's wallet sends ETH gas fees to this address, which then interacts with AU21-portfolio tokens (RAZE, SKYRIM) and sends proceeds to exchanges — is consistent with a controlled satellite wallet used for liquidation. Exchange subpoenas to OKX and ByBit for KYC records associated with the deposit addresses should confirm Kenzi Wang as the account holder.

**Updated Chain of Evidence:**

```
Kenzi's Wallet (0x0d07...92fe)
    │
    ├── Funds bridge wallet with ETH (gas fees)
    │       │
    │       ▼
    │   Bridge Wallet (0xb08f...9f00)
    │       │
    │       ├── Claims RAZE tokens → interacts with RAZE contract
    │       ├── Claims SKYRIM tokens → interacts with SKYRIM contract  
    │       ├── Sends 2 ETH → intermediary (0x8Fa4...7B95)
    │       ├── Sends ETH → OKX exchange (cash-out)
    │       └── Sends ETH → ByBit exchange (cash-out)
    │
    └── Also holds 276M CERE + #1 SKYRIM + #1 RAZE
```

---

### 2.7 — Active Selling: The Wallet Is Currently Liquidating CERE

As of January 29, 2026, this wallet is **actively selling CERE tokens**. Recent outbound CERE transfers from `0x0d07...92fe`:

| Date (UTC) | Amount (CERE) | Direction |
|---|---|---|
| 2026-01-19 | 581,292 | OUT (sale) |
| 2026-01-18 | 1,123,385 | OUT (sale) |
| 2026-01-16 | 379,299 | OUT (sale) |
| 2026-01-13 | 374,478 | OUT (sale) |
| 2026-01-13 | 397,213 | OUT (sale) |
| 2026-01-07 | 1,135,612 | OUT (sale) |
| 2026-01-03 | 532,859 | OUT (sale) |
| 2025-12-30 | 2,627,301 | OUT (sale) |
| 2025-12-19 | 29,186,944 | **IN (received)** |

**Pattern:** Consistent outflows of 200K–2.6M CERE every few days, with occasional large inflows (29M on Dec 19). This is a classic OTC or exchange-based liquidation pattern. The wallet holder is actively converting stolen CERE into cash.

**Urgency:** An asset freeze is critical. At the current rate of liquidation, the remaining 276M CERE balance could be fully dissipated within months.

---

## 3. PARTIES INVOLVED

| Party | Role | Relevance |
|---|---|---|
| **Vivian Liu / Goopal Digital Ltd.** | Investor — Plaintiff in Case 3:26-cv-00857 | Rightful owner of 33,333,334 CERE tokens; claims she never provided a mainnet wallet address and never received her tokens |
| **Kenzi Wang (a/k/a Jin Wang)** | Co-founder, AU21 Capital; former VP/GM at Huobi Global; investor/advisor to Cere Network | Primary suspect — inserted himself as sole contact for Ms. Liu; pattern of conduct consistent with orchestrating the theft |
| **Andrei Kinstler ("AK")** | Cere Network operations — had mastersheet and Fireblocks access | Added wallet address to distribution sheet; G Suite account data deleted after 20-day retention; possible accomplice or unwitting tool |
| **Andrei ("AN")** | Cere Network operations — had mastersheet and Fireblocks access | Had access to relevant systems; now a "deleted user" in distribution sheet |
| **Fred** | Cere Network operations — Fireblocks operator | Initiated token distributions based on instructions from AK/AN; acted in normal course of duties |
| **Evgeny Svirsky** | Fireblocks co-signer | Denies signing any relevant transactions; states no one had his private keys; Fireblocks credentials may have been misused |
| **Martijn Broersma** | Cere Network — investor relations / distribution coordinator | Confirmed the wallet address was never provided by the investor; had mastersheet access |
| **Sieb** | Cere Network — had mastersheet access | Listed for completeness; no evidence of involvement |

---

## 4. CHRONOLOGICAL EVIDENCE TRAIL

### 4.1 — Kenzi Wang Assumes Exclusive Control Over Investor Relationship (December 2021)

**Evidence:** Internal Slack messages dated December 2021.

Kenzi Wang volunteered to personally handle communications with Vivian Liu, stating: *"I'll take Vivian and Jacky."* From that point forward, Kenzi became the sole intermediary between Cere Network and Ms. Liu for all token-related matters.

Kenzi subsequently reported back to the team that Vivian *"showed up, didn't sign new docs, said she got pregnant and had a baby, but wants all tokens staked."* This narrative served to explain away the lack of updated documentation from Ms. Liu — documentation that would typically include the investor providing her own wallet address.

**Significance:** By monopolizing the investor relationship, Kenzi ensured no one else at Cere had independent contact with Ms. Liu to verify wallet addresses or other critical information. This isolation is a hallmark of fraud schemes.

---

### 4.2 — Unauthorized Wallet Address Added to Distribution Mastersheet (Late 2021 – Early 2022)

**Evidence:** Internal distribution mastersheet (Google Sheets); investor confirmation.

Cere Network's standard process for token distributions required the following steps:

1. **Martijn** obtains the investor's wallet address directly from the investor.
2. **Martijn** shares the verified address with AK (Andrei Kinstler) or AN (Andrei).
3. AK or AN enters the address into the distribution mastersheet.
4. Token transfers are executed via Fireblocks.

For Vivian Liu's allocation, this process was not followed. A Cere Network mainnet wallet address was entered into the mastersheet for Ms. Liu's distribution, but:

- **Ms. Liu confirms she never provided a mainnet wallet address.**
- **Martijn confirmed:** *"The address was never shared by the investor, already checked everything."*
- Only five individuals had write access to the mastersheet: AK, AN, Sieb, Fred, and Martijn.
- AK and AN are now listed as **"deleted users"** in the Google Sheet's edit history.
- AK's G Suite account data was subsequently **removed** after the standard 20-day retention period expired, destroying potential audit evidence.

**The wallet address entered was:**

- **Old format (Substrate):** `5DZMJ4GD8MDhp2Pxsri3ysqRqoE3KfsSGE7zMgGDVngbUrwv`
- **SS58 format (Cere mainnet):** `6R1GPxm3jqiRgjFXkFGLWh2XbcwZysRgXWmZjsyq43pSrwFu`

These are the same address in two encoding formats. (Conversion verifiable at [Polkadot SS58 Transform Tool](https://polkadot.subscan.io/tools/ss58_transform).)

**Significance:** Someone with sheet access inserted a fraudulent wallet address for Ms. Liu. The deletion of AK's user account and G Suite data is consistent with evidence destruction.

---

### 4.3 — Token Distribution to Fraudulent Wallet (March – May 2022)

**Evidence:** On-chain blockchain records (Cere Network; publicly verifiable via [cere.statescan.io](https://cere.statescan.io/)).

Two distributions were executed via Fireblocks by Fred, based on instructions from AK/AN:

| # | Date | Block Number | Amount (CERE) | From (Company Wallet) | To (Fraudulent "Investor" Wallet) |
|---|---|---|---|---|---|
| 1 | **March 25, 2022** | 4,361,724 | 13,333,334 | `6Rz7GYaWj5mY7zSFp2aNpXcPP7LkhuMr8E8g62j5mHKEYRbS` | `6R1GPxm3jqiRgjFXkFGLWh2XbcwZysRgXWmZjsyq43pSrwFu` |
| 2 | **May 10, 2022** | 5,019,196 | 20,000,000 | `6RtDT7L4rK9L7BRE78gPLEx1Dw5mvrXfhZMfPWx3bf2ib2sb` | `6R1GPxm3jqiRgjFXkFGLWh2XbcwZysRgXWmZjsyq43pSrwFu` |
| | | | **33,333,334** | | |

**Significance:** The full investor allocation of 33,333,334 CERE was sent to a wallet that Ms. Liu has confirmed she does not control and never provided.

---

### 4.4 — Evgeny Svirsky (Co-Signer) Denies Authorization (Investigation Phase)

**Evidence:** Statements from Evgeny Svirsky during internal investigation.

Evgeny Svirsky, who held co-signing authority on Fireblocks for Cere Network operations, made the following statements:

- *"I didn't sign anything."*
- *"Nobody has my private keys."*
- He stated he had not used Fireblocks *"for a long time."*
- He requested Fireblocks audit logs to prove that no valid signatures originated from his credentials.

Despite these denials, the transactions were executed — indicating either that (a) co-signing requirements were bypassed, (b) Svirsky's Fireblocks credentials were compromised or misused, or (c) the transaction approval workflow was manipulated.

**Significance:** The co-signer's denial raises serious questions about how the distributions were authorized and whether Fireblocks access controls were circumvented by someone with insider knowledge.

---

### 4.5 — Stolen Tokens Cycled Through Intermediary Back to Company Wallet (Same Day as Receipt)

**Evidence:** On-chain transaction records, publicly verifiable on [cere.statescan.io](https://cere.statescan.io/).

The fraudulent "investor" wallet (`6R1G...rwFu`) received a total of approximately 33,333,334 CERE from three source wallets:

| Source Wallet | Amount (CERE) |
|---|---|
| `6UYREEFRZSc8uNgLJmW3XLZAUTxci7DgL2LCbZ9CRDgXdzKu` | ≈13,333,334 |
| `6RWG7AGaRXua7BahDgQuAYU1h66Pdp2yF6dNMWrwEbiSPYru` | 10,000,000 |
| `6TbU9HniHt56svpTqQBP5yciyBCCNVZWfStURYHQtNWsz4A9` | 10,000,000 |
| **Total** | **≈33,333,334** |

**Approximately eight hours after receiving the tokens**, the entire balance was drained in four transactions to a single intermediary wallet:

| # | Amount (CERE) | To (Intermediary Wallet) | Purpose |
|---|---|---|---|
| 1 | 2 | `6SCW2o71hKeWyNY2eBnti7QF2o1TG98BCuj7Fi9Fz23r6R4s` | Test transaction |
| 2 | ≈3,333,334 | Same | First sweep |
| 3 | 30,000,000 | Same | Main sweep |
| 4 | 1 | Same | Dust cleanup |

The test transaction of 2 CERE followed by progressively larger transfers is a classic pattern used by individuals verifying control of a new wallet before moving large sums — **not the behavior of a passive investor.**

**The intermediary wallet (`6SCW...6R4s`) then transferred the entire ≈33,333,334 CERE to:**

> **`6Rz7GYaWj5mY7zSFp2aNpXcPP7LkhuMr8E8g62j5mHKEYRbS`**

**This is the same Cere Network company wallet that originated the first distribution of 13,333,334 CERE in Step 3.3.** The tokens completed a full circle: company wallet → fraudulent "investor" wallet → intermediary → back to company wallet.

---

### 4.6 — Internal Investigation Identifies Kenzi Wang (2022–2025)

**Evidence:** Internal communications, process of elimination, behavioral pattern analysis.

- **Andrei (AN)** was contacted during the investigation and was cleared. Per internal assessment: *"Clearly has nothing to do with this, and actively helped searching."*
- **Andrei Kinstler (AK)** is identified as the most likely accomplice or the individual whose access was exploited by Kenzi Wang.
- AK's G Suite account data was **removed** after the standard 20-day retention window, eliminating potential email and document evidence.
- **Kenzi Wang's behavioral pattern** — exclusively handling Ms. Liu, controlling all communications, providing unverifiable narratives about her intentions — combined with the circular fund flow, constitutes the evidentiary basis for identifying him as the orchestrator.
- **Ms. Liu never liquidated any tokens.** Outgoing transaction records and receiving wallet balances confirm that no investor-initiated sales or transfers occurred. The tokens were taken without her knowledge.

---

## 5. ON-CHAIN FUND FLOW DIAGRAM

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    TOKEN DISTRIBUTION (LEGITIMATE)                    ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  COMPANY WALLET A                    COMPANY WALLET B                 ║
║  6Rz7...YRBS                         6RtD...2sb                      ║
║  ┌──────────────┐                    ┌──────────────┐                ║
║  │ Sent 13.33M  │                    │ Sent 20.0M   │                ║
║  │ CERE         │                    │ CERE         │                ║
║  │ Mar 25, 2022 │                    │ May 10, 2022 │                ║
║  │ Block 4.36M  │                    │ Block 5.02M  │                ║
║  └──────┬───────┘                    └──────┬───────┘                ║
║         │                                    │                        ║
║         ▼                                    ▼                        ║
║  ┌──────────────────────────────────────────────────┐                ║
║  │         "INVESTOR" WALLET (FRAUDULENT)           │                ║
║  │    6R1GPxm3jqiRgjFXkFGLWh2XbcwZysRgXWmZjsyq     │                ║
║  │              43pSrwFu                             │                ║
║  │         Received ≈33.33M CERE total               │                ║
║  └──────────────────────┬───────────────────────────┘                ║
║                         │                                             ║
╠═════════════════════════╪═════════════════════════════════════════════╣
║  THEFT PHASE            │  (~8 HOURS LATER)                          ║
╠═════════════════════════╪═════════════════════════════════════════════╣
║                         │                                             ║
║                         │  2 CERE (test)                              ║
║                         │  3.33M CERE                                 ║
║                         │  30M CERE                                   ║
║                         │  1 CERE (dust)                              ║
║                         ▼                                             ║
║  ┌──────────────────────────────────────────────────┐                ║
║  │           INTERMEDIARY WALLET                     │                ║
║  │    6SCW2o71hKeWyNY2eBnti7QF2o1TG98BCuj7Fi9F      │                ║
║  │              z23r6R4s                             │                ║
║  │         Held ≈33.33M CERE briefly                 │                ║
║  └──────────────────────┬───────────────────────────┘                ║
║                         │                                             ║
║                         │  ≈33.33M CERE                               ║
║                         ▼                                             ║
║  ┌──────────────────────────────────────────────────┐                ║
║  │         COMPANY WALLET A  ◄── SAME AS ORIGIN     │                ║
║  │    6Rz7GYaWj5mY7zSFp2aNpXcPP7LkhuMr8E8g62j      │                ║
║  │              5mHKEYRbS                            │                ║
║  │                                                    │                ║
║  │    ★ TOKENS RETURNED TO STARTING POINT ★          │                ║
║  └──────────────────────────────────────────────────┘                ║
║                                                                       ║
║  RESULT: Investor received nothing.                                  ║
║  Tokens cycled back to company wallet under insider control.         ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 6. INDICATORS OF FRAUD

The following factors, taken together, establish a pattern consistent with deliberate misappropriation:

- **Exclusive gatekeeper access.** Kenzi Wang deliberately positioned himself as the only person communicating with Ms. Liu, preventing independent verification of her wallet address or intent. This isolation tactic is a well-documented hallmark of embezzlement and fraud schemes.

- **Investor never provided a wallet address.** Ms. Liu has confirmed she never supplied a Cere Network mainnet wallet address. Martijn, who was responsible for collecting investor wallet addresses, confirmed he never received one from her. Yet an address appeared in the distribution mastersheet.

- **Unauthorized wallet address insertion.** The wallet address was entered into the mastersheet by someone with access (AK, AN, Sieb, Fred, or Martijn). Martijn, Sieb, and AN have been excluded through investigation. AK's status as a "deleted user" and the destruction of his G Suite data point to either direct involvement or exploitation of his credentials.

- **Destruction of evidence.** AK's Google Workspace account data was removed after the 20-day retention period. AK and AN appear as "deleted users" in the mastersheet's revision history, obstructing the ability to trace who made the relevant edits.

- **Co-signer denies authorization.** Evgeny Svirsky categorically denied signing the relevant transactions and denied that anyone had access to his private keys. This raises the question of how the Fireblocks multi-signature process was bypassed or manipulated.

- **Immediate fund drainage.** The entire 33,333,334 CERE balance was drained from the "investor" wallet within approximately 8 hours of the final deposit. Legitimate investors who have waited months for token distributions do not immediately transfer their entire holdings to another wallet.

- **Test transaction pattern.** Before moving the bulk of the tokens, a 2 CERE test transaction was sent — a technique used by someone verifying they control the destination wallet. This is not investor behavior; it is operational behavior by someone managing a theft.

- **Circular fund flow back to company wallet.** The tokens traveled: Company Wallet → Fraudulent Wallet → Intermediary Wallet → **Same Company Wallet.** This is not a distribution to an investor — it is a round-trip. The tokens were never in the investor's hands. They were allocated on paper, moved through wallets to create the appearance of distribution, and returned to company-controlled infrastructure.

- **No investor-initiated activity.** On-chain records confirm no sell orders, exchange deposits, staking transactions, or other activity consistent with an investor exercising control over the tokens. The only activity on the "investor" wallet is: receive → immediately forward everything.

- **Kenzi's broader pattern of misconduct.** Cere Network has filed a separate legal complaint against Kenzi Wang for irregular capital transfers, diversion of token-sale proceeds to personal wallets, misstatements to investors and the company, and intimidation. He was arrested in Dubai and released on bail after surrendering his passport. The Vivian Liu theft fits squarely within this established pattern.

- **⚠️ Portfolio fingerprint on identified Ethereum wallet.** The Ethereum wallet `0x0d0707963952f2fba59dd06f2b425ace40b492fe` holds 276,239,956 CERE tokens, is the #1 holder of SKYRIM tokens (38.26% of total supply), and is the #1 holder of RAZE tokens (16.82% of total supply). AU21 Capital — co-founded by Kenzi Wang — was the investor in both Skyrim Finance ($2.1M round, May 2021) and Raze Network (funding partner, April 2021). No other wallet on any blockchain holds this combination of #1 positions in both tokens. This is a unique, forensically verifiable digital fingerprint that identifies the wallet as belonging to Kenzi Wang / AU21 Capital. The simultaneous presence of 276M CERE tokens in this wallet connects the theft directly to Kenzi. *(See Section 2 for full analysis.)*

---

## 7. RECOMMENDED NEXT STEPS

1. **Obtain Fireblocks audit logs.** Subpoena or request Fireblocks Inc. to produce complete transaction approval logs for the two distributions (Block 4,361,724 and Block 5,019,196), including which user accounts initiated, approved, and co-signed each transaction, with timestamps and IP addresses.

2. **Investigate AK (Andrei Kinstler).** Determine AK's current whereabouts and relationship with Kenzi Wang. Obtain any preserved communications, employment records, and device forensic data. Explore whether AK acted as a knowing participant or whether Kenzi gained unauthorized access to AK's credentials.

3. **Recover deleted Google Workspace data.** Engage forensic specialists to determine whether AK's G Suite data can be recovered beyond the 20-day retention window (e.g., through Google Vault, backup services, or third-party tools in use at the time).

4. **Preserve Slack records.** Ensure all Slack messages involving Kenzi Wang, Vivian Liu, and the token distribution process are preserved and produced, particularly the December 2021 messages and any subsequent communications regarding Ms. Liu's allocation.

5. **On-chain forensic analysis.** Commission a professional blockchain forensic report (e.g., Chainalysis, TRM Labs) tracing the full provenance and destination of all tokens touching the identified wallets, including the intermediary wallet and the company wallet that received the returned tokens.

6. **Coordinate with Dubai authorities.** Given Kenzi Wang's arrest and bail conditions in Dubai, coordinate with local counsel regarding the status of that proceeding and any available evidence or mutual legal assistance.

7. **Trace subsequent movement of returned tokens.** After the 33.33M CERE was returned to company wallet `6Rz7...YRBS`, determine what happened next — whether the tokens were sold, transferred, or otherwise liquidated, and whether proceeds can be traced to Kenzi Wang personally.

8. **Deposition targets.** Prioritize depositions of: (a) Kenzi Wang; (b) Andrei Kinstler; (c) Fred (Fireblocks operator); (d) Evgeny Svirsky; and (e) any Fireblocks compliance officer who can authenticate the transaction logs.

---

## 8. APPENDIX: WALLET ADDRESSES & EVIDENCE LINKS

### Wallet Addresses

#### Ethereum (Kenzi Wang — Identified)

| Label | Address | Explorer Link |
|---|---|---|
| **⚠️ Kenzi Wang's Wallet (Ethereum)** | `0x0d0707963952f2fba59dd06f2b425ace40b492fe` | [View on Etherscan](https://etherscan.io/address/0x0d0707963952f2fba59dd06f2b425ace40b492fe) |
| CERE Token Contract (ERC-20) | `0x2da719db753dfa10a62e140f436e1d67f2ddb0d6` | [View on Etherscan](https://etherscan.io/token/0x2da719db753dfa10a62e140f436e1d67f2ddb0d6) |
| SKYRIM Token Contract (ERC-20) | `0x2610f0bfc21ef389fe4d03cfb7de9ac1e6c99d6e` | [View on Etherscan](https://etherscan.io/token/0x2610f0bfc21ef389fe4d03cfb7de9ac1e6c99d6e) |
| RAZE Token Contract (ERC-20) | `0x5Eaa69B29f99C84Fe5dE8200340b4e9b4Ab38EaC` | [View on Etherscan](https://etherscan.io/token/0x5Eaa69B29f99C84Fe5dE8200340b4e9b4Ab38EaC) |

#### Cere Network Mainnet (Substrate)

| Label | Address (SS58 / Cere Mainnet Format) | Explorer Link |
|---|---|---|
| **Fraudulent "Investor" Wallet** | `6R1GPxm3jqiRgjFXkFGLWh2XbcwZysRgXWmZjsyq43pSrwFu` | [View on Statescan](https://cere.statescan.io/#/accounts/6R1GPxm3jqiRgjFXkFGLWh2XbcwZysRgXWmZjsyq43pSrwFu) |
| Same wallet (old Substrate format) | `5DZMJ4GD8MDhp2Pxsri3ysqRqoE3KfsSGE7zMgGDVngbUrwv` | (Same account — different encoding) |
| **Intermediary Wallet** | `6SCW2o71hKeWyNY2eBnti7QF2o1TG98BCuj7Fi9Fz23r6R4s` | [View on Statescan](https://cere.statescan.io/#/accounts/6SCW2o71hKeWyNY2eBnti7QF2o1TG98BCuj7Fi9Fz23r6R4s) |
| **Company Wallet A** (origin + destination) | `6Rz7GYaWj5mY7zSFp2aNpXcPP7LkhuMr8E8g62j5mHKEYRbS` | [View on Statescan](https://cere.statescan.io/#/accounts/6Rz7GYaWj5mY7zSFp2aNpXcPP7LkhuMr8E8g62j5mHKEYRbS) |
| **Company Wallet B** | `6RtDT7L4rK9L7BRE78gPLEx1Dw5mvrXfhZMfPWx3bf2ib2sb` | — |
| **Source Wallet 1** | `6UYREEFRZSc8uNgLJmW3XLZAUTxci7DgL2LCbZ9CRDgXdzKu` | — |
| **Source Wallet 2** | `6RWG7AGaRXua7BahDgQuAYU1h66Pdp2yF6dNMWrwEbiSPYru` | — |
| **Source Wallet 3** | `6TbU9HniHt56svpTqQBP5yciyBCCNVZWfStURYHQtNWsz4A9` | — |

### Key Evidence Sources

| Source | Link / Location |
|---|---|
| Cere Statescan (Block Explorer) | [https://cere.statescan.io/](https://cere.statescan.io/) |
| SS58 Address Conversion Tool | [https://polkadot.subscan.io/tools/ss58_transform](https://polkadot.subscan.io/tools/ss58_transform) |
| US Complaint — *Goopal v. Jin* | [Google Drive Link](https://drive.google.com/file/d/1_Agyfz7mMomQmR04fBVldle0XCFQLkm5/view) |
| Case Number | 3:26-cv-00857, N.D. California (filed Jan. 27, 2026) |
| Internal Slack Messages | December 2021 — Kenzi Wang re: Vivian Liu (to be preserved and produced) |
| Distribution Mastersheet | Google Sheets — internal (edit history shows "deleted users" for AK/AN) |
| Fireblocks Transaction Logs | To be obtained from Fireblocks Inc. |

### Key Blockchain Events

| Date | Block # | Event |
|---|---|---|
| March 25, 2022 | 4,361,724 | 13,333,334 CERE distributed from Company Wallet A to fraudulent wallet |
| May 10, 2022 | 5,019,196 | 20,000,000 CERE distributed from Company Wallet B to fraudulent wallet |
| Same day as final receipt | — | ~33.33M CERE drained from fraudulent wallet to intermediary (~8 hrs after deposit) |
| Same day | — | ~33.33M CERE forwarded from intermediary to Company Wallet A (completing the cycle) |

---

*This memorandum is based on internal records, blockchain data, and investor statements available as of the date above. All on-chain data referenced herein is publicly verifiable on the Cere Network blockchain via the explorer links provided. This document is prepared in anticipation of litigation and is protected by attorney-client privilege and the work product doctrine.*

---

**END OF MEMORANDUM**
