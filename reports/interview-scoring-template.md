# Interview Scoring Template
## GameMakers / CEF.ai — HR Pipeline v4

---

## Overview

This template standardizes interview evaluation across all roles. Interviewers submit recordings → transcripts are extracted via Gemini → AI scores using role-specific criteria → results flow to Notion → visible on v4 dashboard.

---

## Scoring Scale (1-10)

| Score | Meaning | Action |
|-------|---------|--------|
| **9-10** | Exceptional — Top 5%, immediate strong hire signal | Fast-track |
| **8** | Strong — Clear yes, should advance quickly | Advance |
| **7** | Good — Solid candidate, worth pursuing | Advance |
| **6** | Borderline — Some concerns, needs team discussion | Hold/Discuss |
| **5** | Below bar — Notable gaps for this role | Likely reject |
| **1-4** | Clear no — Major misalignment | Reject |

**Calibration:** A score of 8+ should be reserved for genuinely impressive candidates who would be strong hires at top tech companies. Don't inflate scores.

---

## Role-Specific Criteria

### AI Innovator
| Dimension | Weight | What to Look For |
|-----------|--------|------------------|
| **Technical Depth** | 40% | Understanding of ML/AI concepts, hands-on experience with models |
| **Problem Solving** | 25% | How they approach ambiguous, open-ended problems |
| **Communication** | 20% | Can they explain complex technical concepts clearly? |
| **Culture Fit** | 15% | Curiosity, ownership mentality, startup adaptability |

### AI Engineer
| Dimension | Weight | What to Look For |
|-----------|--------|------------------|
| **Technical Depth** | 40% | Practical ML engineering, deployment experience, system design |
| **Problem Solving** | 25% | Debugging approach, handling production issues |
| **Communication** | 20% | Technical documentation, cross-team collaboration |
| **Culture Fit** | 15% | Self-driven, comfortable with ambiguity |

### Principal Fullstack Engineer
| Dimension | Weight | What to Look For |
|-----------|--------|------------------|
| **Architecture** | 40% | System design, scalability, tech decisions |
| **Technical Leadership** | 25% | Mentoring, code review, setting standards |
| **Communication** | 20% | Translating tech to business, stakeholder management |
| **Culture Fit** | 15% | Collaborative, ego-free, startup pace |

### Founder's Associate (Business Ops)
| Dimension | Weight | What to Look For |
|-----------|--------|------------------|
| **Strategic Thinking** | 35% | Business acumen, market understanding |
| **Execution** | 30% | Track record of getting things done, project management |
| **Communication** | 20% | Clear, concise, persuasive |
| **Culture Fit** | 15% | Proactive, adaptable, high ownership |

---

## Interview Structure

### 15-Minute Filter Call (Lynn/Val)
**Goal:** Quick disqualification of misaligned candidates

1. **Intro (2 min)** — Brief intro, set expectations
2. **Motivation (3 min)** — Why this role? Why GameMakers?
3. **Experience Snapshot (5 min)** — Key achievements, relevant skills
4. **Role Fit (3 min)** — Availability, expectations, logistics
5. **Q&A (2 min)** — Candidate questions

**Pass criteria:** Clear communication, genuine interest, no red flags

### 30-40 Minute Deep Interview (Bren/Fred)
**Goal:** Thorough evaluation against role criteria

1. **Warm-up (5 min)** — Background, career journey
2. **Technical/Domain Deep Dive (15 min)** — Role-specific questions
3. **Problem Solving (10 min)** — Case study or scenario
4. **Culture & Values (5 min)** — Work style, collaboration
5. **Candidate Q&A (5 min)** — Their questions about the role/company

---

## Anchor Questions by Section

### Technical Depth
- "Walk me through the most technically challenging project you've worked on."
- "How would you approach [role-specific scenario]?"
- "What's your debugging process when something fails in production?"

### Problem Solving
- "Tell me about a time you had to solve a problem with incomplete information."
- "How do you prioritize when everything seems urgent?"

### Communication
- "Explain [complex concept from their background] to me as if I'm non-technical."
- "How do you handle disagreements with teammates?"

### Culture Fit
- "What does ownership mean to you?"
- "Describe your ideal work environment."
- "How do you handle feedback?"

---

## Output Format

After each interview, the scoring API expects:

```json
{
  "score": 8,
  "highlights": [
    "Strong system design experience",
    "Clear communication style"
  ],
  "concerns": [
    "Limited startup experience"
  ],
  "reasoning": "Solid technical candidate with proven architecture skills. Minor concern about pace adaptation.",
  "recommendation": "advance",
  "confidence": "high"
}
```

---

## Feedback Loop

```
Interview Recording
       ↓
Transcript (Gemini)
       ↓
POST /api/score-interview
       ↓
Notion "Interview Score" field
       ↓
V4 Dashboard visibility
       ↓
Fred review queue
```

**Dashboard URL:** https://hr-funnel-monitor-production.up.railway.app/v4

---

## API Usage

```bash
curl -X POST https://cere-hr-service.up.railway.app/api/score-interview \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "notion-page-id",
    "transcript": "Interviewer: Tell me about... Candidate: ...",
    "role": "AI Innovator",
    "interviewType": "technical"
  }'
```

---

*Last updated: 2026-02-03*
*Owner: Mart / HR Pipeline Team*
