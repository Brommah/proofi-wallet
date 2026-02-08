# HR Candidate Scoring Skill

Score candidates for Cere/CEF roles using Fred's hiring philosophy and role-specific evaluation criteria.

## Overview

This skill replaces the external GPT-4o scoring pipeline. Clawdbot reads CVs directly, scores against role-specific prompts + Fred's meta-criteria, and updates Notion.

## Infrastructure

- **Candidate DB:** `bc66a818-be72-4ce3-b205-01f35df214c8` (Notion data_source)
- **Job Roles DB:** `24cd8000-83d6-8014-94aa-000b9fdabd81` (Notion data_source — contains role prompts)
- **Key fields:** Name (title), Role (select), AI Score (number), AI Status (rich_text), Resume (files), Human Score (number), AI vs Human Δ (formula), Run AI (checkbox), Passed AI Filter (checkbox)

## Role → Prompt Mapping

| Candidate Role | Job Roles DB Code | Active |
|---|---|---|
| Principal Fullstack Engineer | `principal_software_engineer` | ✅ |
| AI Innovator | `ai_innovator` | ✅ |
| AI Engineer | `ai_engineer` (V6, inactive — use ai_innovator) | ⚠️ |
| Blockchain Engineer | `blockchain_engineer` | ✅ |
| Founder's Associate (Business Ops) | `founders_associate_business_ops` | ✅ |
| Founder's Associate | `founders_associate` (generic, inactive) | ⚠️ |

## Fred's Meta-Scoring Layer

**Apply ON TOP of role-specific scoring.** This is Fred's pyramid filter — the role prompt gives technical fit, but Fred cares about these traits across ALL roles:

### Must-Haves (boost +1 if strong evidence, penalize -1 if absent)
1. **Mission-driven motivation** — genuinely excited about building, not just job-seeking. Look for: side projects, open source, passion signals, startup experience
2. **Resourcefulness / hustle** — evidence of figuring things out, workarounds, self-teaching, building with constraints
3. **High ceiling** — intellectual depth, complex problem-solving, not just running playbooks
4. **End-to-end builder** — can they build a complete thing, not just a component?

### Red Flags (penalize -1 to -2)
- Pure job-hopper with no depth anywhere
- Only big-corp experience with no ownership signals
- Academic/research with zero production impact
- "Mid-range pyramid" — competent but not exceptional
- Buzzword-heavy CV with no concrete outcomes

### Hot Candidate Threshold
- Score ≥ 7 → Set "Passed AI Filter" checkbox
- Score ≥ 8 → Flag as hot candidate

### Scoring Scale (calibrated to human alignment)
- **1-3:** Clear no — wrong level, wrong domain, or red flags
- **4-5:** Below bar — some relevant experience but not competitive
- **6:** Borderline — worth a second look but not exciting
- **7:** Strong — definitely interview
- **8-9:** Exceptional — prioritize immediately
- **10:** Unicorn — drop everything

## How to Score

1. **Read the CV** (extract text from PDF via Resume files field)
2. **Identify the role** from the Role select field
3. **Fetch the role prompt** from Job Roles DB (or use the cached version below)
4. **Evaluate against role prompt** — this gives technical/domain fit
5. **Apply Fred's meta-layer** — motivation, resourcefulness, ceiling, builder signals
6. **Output format:**
```
Score: X/10
Strengths: [bullet list]
Concerns: [bullet list]
Fred-fit: [one line on mission/hustle/ceiling signals]
Recommendation: [Interview / Maybe / Pass]
```
7. **Update Notion:** Set AI Score, AI Status (with summary), Passed AI Filter checkbox

## Batch Scoring

When asked to score multiple candidates:
1. Query Notion for candidates with `Run AI = true` OR candidates without AI Score
2. Download and extract CVs
3. Score each one
4. Update Notion
5. Report summary table

## Notion Update

```bash
NOTION_KEY=$(cat ~/.config/notion/api_key)
curl -X PATCH "https://api.notion.com/v1/pages/{page_id}" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{
    "properties": {
      "AI Score": {"number": X},
      "AI Status": {"rich_text": [{"text": {"content": "SUMMARY"}}]},
      "Passed AI Filter": {"checkbox": true/false}
    }
  }'
```

## Calibration Notes
- V8/V9 prompts are already calibrated for conservative scoring
- Target MAE vs human: < 1.5
- Last measured (Jan 27): Overall MAE 1.34 across 103 candidates
- When in doubt, score LOWER — Fred prefers false negatives over false positives
