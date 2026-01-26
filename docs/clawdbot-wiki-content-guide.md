# Clawdbot Wiki Content Guide

> How to use Clawdbot to ingest Notion wikis and generate content/FAQs

## Setup: Connect Notion to Clawdbot

### Step 1: Create Notion Integration
1. Go to https://notion.so/my-integrations
2. Click "New integration"
3. Name it "Clawdbot" and select your workspace
4. Copy the API key (starts with `ntn_` or `secret_`)

### Step 2: Store the API Key
Run in Terminal:
```bash
mkdir -p ~/.config/notion
echo "ntn_YOUR_KEY_HERE" > ~/.config/notion/api_key
```

### Step 3: Share Pages with Integration
1. Open any Notion page you want Clawdbot to read
2. Click `...` (three dots) in top right
3. Click "Connect to" → select "Clawdbot"
4. Repeat for each page/wiki you want accessible

### Step 4: Test It
Ask Clawdbot: "Read the Project Source of Truth and list the main sections"

If it works, you're connected! ✅

---

## Project Source of Truth

**Link:** https://www.notion.so/cere/Project-Source-of-Truth-2f1d800083d6807f8b83f0db3615179e

### Why Use It?
- **Single entry point** — find any wiki from one place
- **Quality scores** — know which wikis are reliable (Green 7-10 / Yellow 4-6 / Red 0-3)
- **Ownership** — each wiki has a clear owner to contact
- **Core FAQ mapping** — know which wiki answers which question

### How to Extract Info

Ask Clawdbot to read the Source of Truth first, then drill into specific wikis:

```
Read the Project Source of Truth and list all wikis with status 4 or higher
```

```
Using the Source of Truth, which wiki explains payment flows?
```

```
Read the Core FAQ section and generate candidate-friendly answers for questions 1-5
```

### Structure
- **Checklist** — 10-point quality check for each wiki page
- **Directory** — tree of all wikis with owners and status scores
- **Core FAQ** — maps common questions to the right wiki

---

## Example: DDC Explainer for Candidates

**Goal:** Create content explaining DDC to engineering candidates with no Cere background.

### Step 1: Find the Right Wiki
```
Ask: Read the Project Source of Truth. Which wikis explain DDC and data storage? Only status 4+.
```
**Result:** DDC Wiki (status 4, Sergey), DDC Core Wiki (status 4, Ulad), DDC Client JS SDK Wiki (status 4, Ulad)

### Step 2: Generate Content
```
Ask: Read the DDC Wiki. Write a 3-paragraph explainer for candidates with no blockchain background. Make it exciting but accurate.
```

### Step 3: Generate FAQs
```
Ask: Create 5 candidate FAQs from DDC Wiki:
1. What problem does DDC solve?
2. How is it different from AWS/GCP?
3. What tech stack is used?
4. What would I be building?
5. Why decentralized storage?
```

### Step 4: Refine and Use
- Ask for shorter/longer versions
- Ask for more/less technical language
- Copy output to candidate emails, job posts, Notion pages
- Share with Lynn/Quinn for candidate communications

---

## Quick Start (5 min setup)

### 1. Share Your Wiki Pages with Clawdbot

In Notion:
1. Open the wiki page you want to use
2. Click `...` → `Connect to` → Select the Clawdbot integration
3. Repeat for each wiki you want accessible

### 2. Ask Clawdbot to Read a Wiki

Just tell Clawdbot which wiki to read:

```
Read the DDC Wiki and summarize the main components
```

```
What does the Blockchain Wiki say about payment flows?
```

### 3. Generate FAQs

Ask Clawdbot to generate FAQs from any wiki:

```
Generate 10 FAQs from the DDC Core Wiki, aimed at candidates
```

```
Create an FAQ about "how data storage works" based on the DDC wiki
```

### 4. Generate Content

```
Write a 2-paragraph explanation of Cere's data layer for non-technical readers
```

```
Create a job description intro explaining what DDC is, using the DDC Wiki
```

---

## Available Wikis (from Directory)

| Wiki | Owner | Status |
|------|-------|--------|
| DDC | @Sergey Poluyan | 🟡 4/10 |
| DDC Core Wiki | @Ulad Palinski | 🟡 4/10 |
| DAC & Inspection Wiki | @Yahor Tsaryk | 🔴 3/10 |
| DDC Client JS SDK Wiki | @Ulad Palinski | 🟡 4/10 |
| DDC Utility Mission | @Krishna Singh | 🔴 3/10 |
| Blockchain Wiki | @Ayush Mishra | 🔴 2/10 |
| ITM Operating Algorithm | @Yahor Tsaryk | 🟡 4/10 |

---

## Example Prompts for Content Generation

### For Candidate Explanations
```
Using the DDC and Blockchain wikis, explain what Cere Network builds 
in 3 paragraphs suitable for a job candidate with no blockchain background.
```

### For Technical FAQs
```
Read the DDC Core Wiki and create 5 technical FAQs about:
1. Store data flow
2. Retrieve data flow  
3. Run compute job flow
4. Payment flow
5. Encrypted data access
```

### For Social/Marketing
```
Based on the DDC wiki, write 3 tweet-sized (280 char) descriptions 
of what makes Cere's data storage unique.
```

---

## Tips

1. **Be specific** — name the exact wiki you want to use
2. **Combine wikis** — "Using DDC Wiki and Blockchain Wiki, explain..."
3. **Specify audience** — "for non-technical candidates" vs "for engineers"
4. **Iterate** — "Make it shorter" / "Add more technical detail"

---

## Information Architecture Reference

Miro board: https://miro.com/app/board/uXjVIJA7Uo4=/?moveToWidget=3458764651586162892&cot=14

### Core FAQ Topics (from architecture)
1. Store data flow → DDC Wiki
2. Retrieve data flow → DDC Wiki
3. Run compute job flow → DDC Wiki
4. Run inference job flow → Inference Runtime Wiki
5. Run agent script flow → Agent Runtime Wiki
6. Payment flow → Blockchain Wiki
7. Agent retrieves encrypted user data → ADR Encrypted Data Access
8. Agent stores encrypted user data → ADR Encrypted Data Access

---

## Troubleshooting

**"I can't find that wiki"**
- Make sure you've shared the Notion page with the Clawdbot integration
- Use the exact wiki name or share the Notion link

**"The content seems outdated"**
- Check the wiki's "Last reviewed" date
- Ask the owner to update it

---

*Last updated: Jan 26, 2026*
