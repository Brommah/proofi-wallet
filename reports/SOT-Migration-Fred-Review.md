# Project SOT Migration — Executive Review

**For:** Fred  
**From:** Mart / Claudemart  
**Date:** Feb 6, 2026  
**Ask:** Validate technical approach & hackathon dependencies

---

## What We're Doing

Migrating "Project Source of Truth" (Bren's wiki Q&A system) from cloud to on-premise Mac Minis using CEF stack.

**Current state:** Supabase + Gemini + Cohere (~€175/month cloud costs)  
**Target state:** 3 Mac Minis @ office using Ollama + PostgreSQL + DDC (€30/month electricity)

---

## Why This Makes Sense

| Benefit | Explanation |
|---------|-------------|
| **Cost** | €175 → €30/month (85% reduction) |
| **Data sovereignty** | All Cere docs stay on-premise, not US cloud |
| **Dogfooding** | Using our own CEF/DDC/ROB stack |
| **Customization** | Can fine-tune models, adjust retrieval |

---

## Technical Approach

### Hardware (3 Mac Minis)

| Mini | Role | Key Services |
|------|------|--------------|
| #1 | API + Frontend | Express, Nginx, ROB, Redis |
| #2 | AI Inference | Ollama, Llama 3.3 70B, embeddings |
| #3 | Storage | PostgreSQL + pgvector, DDC Node |

**Critical:** Mini #2 needs **64GB RAM** for Llama 70B.

### Model Choices

| Task | Cloud (current) | Local (target) | Compatible? |
|------|-----------------|----------------|-------------|
| Generation | Gemini 2.5 Flash | Llama 3.3 70B | ✅ Similar quality |
| Embeddings | Gemini embedding-001 | nomic-embed-text | ✅ Both 768-dim |
| Reranking | Cohere rerank-v3.5 | mxbai-rerank-base | ⚠️ Needs testing |

### CEF Stack Usage

| Component | Status | Using? |
|-----------|--------|--------|
| ROB Rafts | Production | ✅ Yes — context containers |
| ROB Streams | Production | ✅ Yes — Notion webhooks |
| DDC SDK | Production | ✅ Yes — backup storage |
| Cubbies | Feature branch | ⏳ After hackathon |
| Encryption/KES | Not shipped | ⏳ After hackathon |

---

## Hackathon Blockers

**These must ship during hackathon for full migration:**

| Component | Current State | Why Needed |
|-----------|---------------|------------|
| **Cubbies** | `feat/cubbies-integration` branch | Encrypted agent state sharing |
| **KES** | Not shipped | Key management for encryption |
| **DAC Verification** | .proto files missing | Developer verification step |

### Hackathon Deliverables

```
□ Merge Cubbies to main
□ KES service deployed
□ Encrypted cubby read/write working
□ Agent-to-agent AuthToken delegation
□ E2E test: Agent A encrypts → Agent B decrypts
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Llama quality < Gemini | Medium | High | A/B test before cutover |
| Hackathon doesn't ship Cubbies | Medium | Medium | Proceed without encryption initially |
| Mac Mini hardware failure | Low | High | DDC replication, daily backups |
| Rerank quality difference | Medium | Low | Keep Cohere free tier as fallback |

---

## Timeline

| Week | Milestone |
|------|-----------|
| **Hackathon** | Cubbies + KES shipped |
| Week 1 | Mac Minis configured |
| Week 2 | Database migrated |
| Week 3 | API migrated |
| Week 4 | Frontend + ROB integration |
| Week 5 | Encrypted storage |
| Week 6 | Cutover |

---

## Questions for Fred

1. **Hardware:** Is Mini #2 confirmed 64GB RAM?
2. **Hackathon scope:** Is Cubbies + KES realistic for one hackathon?
3. **Fallback:** OK to launch without encryption and add later?
4. **Ownership:** Who owns Cubbies/KES during hackathon?

---

## Validation Checklist

Fred, please confirm:

- [ ] Technical approach is sound
- [ ] Model choices are reasonable
- [ ] Hackathon scope is realistic
- [ ] Timeline is achievable
- [ ] Risks are acceptable

---

**Bottom line:** Solid migration plan. Main dependency is hackathon delivering Cubbies + encryption. Can proceed with Phase 1-3 immediately, encryption integration in Phase 5.
