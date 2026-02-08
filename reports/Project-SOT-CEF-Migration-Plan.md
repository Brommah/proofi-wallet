# Project SOT → CEF Migration Plan

**Version 3.0** | Feb 2026 | 3x Mac Mini @ Office

---

## TL;DR

| What | From | To |
|------|------|-----|
| **Frontend** | Lovable hosted | Nginx on Mac Mini 1 |
| **API** | Supabase Edge Functions | Express/Hono on Mac Mini 1 |
| **Database** | Supabase PostgreSQL | Local PostgreSQL on Mac Mini 3 |
| **Vectors** | pgvector (cloud) | pgvector (local) |
| **LLM** | Gemini via Lovable | Llama 3.3 70B via Ollama |
| **Embeddings** | Gemini embedding-001 | nomic-embed-text (768-dim) |
| **Reranking** | Cohere API | Local mxbai-rerank |
| **Storage** | Supabase only | PostgreSQL + DDC backup |
| **Cost** | ~€175/month | ~€30/month (electricity) |

---

## 🚨 Hackathon Dependencies (Next Week)

**These must be completed during hackathon before full migration:**

### Must Ship

| Component | Current State | Required for Migration | Owner |
|-----------|---------------|----------------------|-------|
| **Cubbies** | Feature branch `feat/cubbies-integration` | Agent-to-agent encrypted data sharing | TBD |
| **Encryption/KES** | Not shipped | Trustless delegation, encrypted storage | TBD |
| **DAC Verification** | .proto files missing | Devs stuck at verification step | TBD |

### Cubbies — What We Need

Cubbies = encrypted shared memory spaces for agents

**Required functionality:**
- [ ] Create Cubby with encryption key
- [ ] Store encrypted state between agent executions
- [ ] Share Cubby access with other agents (delegated AuthToken)
- [ ] Read/write with automatic encrypt/decrypt
- [ ] Revoke access

**API we expect:**
```typescript
// Create encrypted cubby
const cubby = await rob.createCubby({
  name: "wiki-agent-state",
  encryptionKey: await generateKey(),
  allowedAgents: ["agent-123", "agent-456"]
});

// Store encrypted data
await cubby.set("lastSync", { timestamp: Date.now(), pageCount: 42 });

// Read (auto-decrypts)
const state = await cubby.get("lastSync");

// Grant access to another agent
await cubby.grantAccess("agent-789", { 
  operations: ["read"],
  expiresAt: Date.now() + 86400000 
});
```

### Encryption/KES — What We Need

**Required functionality:**
- [ ] Key Encryption Service (KES) running
- [ ] Generate encryption keys per bucket/cubby
- [ ] Delegated decryption (agent A grants agent B temporary access)
- [ ] Key rotation support

**For Project SOT specifically:**
```typescript
// Encrypt wiki chunks before DDC storage
const encryptedChunk = await kes.encrypt(chunk, {
  keyId: "wiki-knowledge-key",
  allowedReaders: ["sot-query-agent", "sot-eval-agent"]
});

await ddc.store(bucketId, encryptedChunk);

// Query agent can decrypt
const decrypted = await kes.decrypt(encryptedChunk, {
  agentId: "sot-query-agent"
});
```

### Hackathon Checklist

```
Day 1-2: Core Infrastructure
├─ [ ] Merge feat/cubbies-integration to main
├─ [ ] KES service deployed
├─ [ ] Encryption key generation working
└─ [ ] Basic cubby CRUD operations

Day 3-4: Agent Integration  
├─ [ ] Agent-to-agent AuthToken delegation
├─ [ ] Encrypted cubby read/write
├─ [ ] grantAccess() with encryption
└─ [ ] DAC verification .proto files accessible

Day 5: Testing
├─ [ ] End-to-end: Agent A stores encrypted → Agent B reads
├─ [ ] Key rotation test
├─ [ ] Access revocation test
└─ [ ] Performance benchmarks
```

---

## Hardware Setup

### Mac Mini 1 — "Control" (32GB RAM)

| Service | Port | Purpose |
|---------|------|---------|
| Nginx | 80/443 | Reverse proxy + static frontend |
| Express API | 3000 | Migrated Edge Functions |
| ROB API | 3001 | Agent management |
| Redis | 6379 | Cache + rate limiting |
| Loki | 3100 | Log aggregation |

### Mac Mini 2 — "Inference" (64GB RAM)

| Model | RAM | Purpose |
|-------|-----|---------|
| Llama 3.3 70B Q4 | ~45GB | Primary generation |
| nomic-embed-text | ~1GB | Embeddings (768-dim) |
| mxbai-rerank-base | ~500MB | Local reranking |
| Qwen 2.5 32B (backup) | ~24GB | Fallback |

### Mac Mini 3 — "Storage" (32GB RAM)

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL 16 + pgvector | 5432 | Primary database + vectors |
| DDC Node | 9090 | Decentralized backup |
| KES | 8080 | Key Encryption Service |
| Prometheus + Grafana | 9090/3000 | Metrics |

---

## CEF Components

### Using Now (Production-Ready)

| Component | Purpose |
|-----------|---------|
| **ROB Rafts** | Context containers with indexing scripts |
| **ROB Streams** | Event pipelines (Notion webhooks) |
| **ROB DataSources** | PostgreSQL/Redis connectors |
| **ROB Agents** | LLM + Programmable agents |
| **DDC SDK** | Decentralized storage |
| **DDC Buckets** | Storage containers |

### Using After Hackathon

| Component | Purpose | Hackathon Deliverable |
|-----------|---------|----------------------|
| **Cubbies** | Encrypted agent memory | Merge + test |
| **KES** | Key management | Deploy + integrate |
| **Encrypted DDC** | Secure chunk storage | E2E working |

---

## API Migration

| Supabase Function | New Endpoint | Changes |
|-------------------|--------------|---------|
| `evaluate/index.ts` | `POST /api/evaluate` | Gemini → Ollama |
| `output-evaluate/index.ts` | `POST /api/evaluate/score` | Same logic |
| `notion-import/index.ts` | `POST /api/import` | Gemini embed → nomic |

**LLM call change:**
```typescript
// Before
fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  body: JSON.stringify({ model: "google/gemini-2.5-flash", ... })
});

// After  
fetch("http://mac-mini-2:11434/v1/chat/completions", {
  body: JSON.stringify({ model: "llama3.3:70b-instruct-q4_K_M", ... })
});
```

---

## Timeline

| Week | Focus | Dependency |
|------|-------|------------|
| **Hackathon** | Cubbies + KES + Encryption | ⚠️ Blocking |
| **1** | Mac Mini setup, PostgreSQL, Ollama | - |
| **2** | Database migration, DDC sync | - |
| **3** | API migration (Edge → Express) | - |
| **4** | Frontend, ROB Rafts/Streams | Hackathon done |
| **5** | Encrypted storage integration | Hackathon done |
| **6** | Testing, cutover | All done |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Query P95 latency | ~3s | < 5s |
| Hallucination score | 4.2 avg | ≥ 4.0 |
| Monthly cost | €175 | €30 |
| Data encryption | None | E2E encrypted |
| Agent isolation | None | Cryptographic |

---

## Quick Commands

```bash
# Models
ollama pull llama3.3:70b-instruct-q4_K_M
ollama pull nomic-embed-text

# Database
createdb projectsot
psql projectsot -c "CREATE EXTENSION vector;"

# Export/Import
pg_dump -h db.xxx.supabase.co --table=wiki_chunks > export.sql
psql -h mac-mini-3 -d projectsot < export.sql

# Test
curl http://mac-mini-2:11434/api/embeddings \
  -d '{"model":"nomic-embed-text","prompt":"test"}'
```

---

*Claudemart | Feb 2026*
