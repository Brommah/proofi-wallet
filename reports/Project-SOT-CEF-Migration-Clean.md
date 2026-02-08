# Project SOT → CEF Migration Plan

**Version 2.0** | Feb 2026 | 3x Mac Mini @ Office

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

## Hardware Setup

### Mac Mini 1 — "Control" (32GB RAM)

**Role:** API Gateway + Frontend + Orchestration

| Service | Port | Purpose |
|---------|------|---------|
| Nginx | 80/443 | Reverse proxy + static frontend |
| Express API | 3000 | Migrated Edge Functions |
| ROB API | 3001 | Agent management (optional) |
| Redis | 6379 | Cache + rate limiting |
| Loki | 3100 | Log aggregation |

### Mac Mini 2 — "Inference" (64GB RAM) ⚡

**Role:** All AI workloads

| Service | Port | Model | RAM |
|---------|------|-------|-----|
| Ollama | 11434 | Llama 3.3 70B Q4 | ~45GB |
| Ollama | 11434 | nomic-embed-text | ~1GB |
| Ollama | 11434 | mxbai-rerank-base | ~500MB |
| Ollama | 11434 | Qwen 2.5 32B (backup) | ~24GB |

**Note:** Llama 70B + embeddings run concurrently. Qwen as fallback.

### Mac Mini 3 — "Storage" (32GB RAM)

**Role:** All persistent data

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL 16 | 5432 | Primary database |
| pgvector 0.7 | - | Vector similarity search |
| DDC Node | 9090 | Decentralized backup |
| Prometheus | 9090 | Metrics collection |
| Grafana | 3000 | Dashboards |

---

## CEF Components Used

### ✅ Using (Production-Ready)

| Component | What it does | How we use it |
|-----------|--------------|---------------|
| **ROB Rafts** | Context containers with indexing scripts | Store wiki knowledge structure |
| **ROB Streams** | Event pipelines with triggers | Handle Notion webhooks |
| **ROB DataSources** | Database connectors | Link to PostgreSQL |
| **DDC SDK** | Decentralized storage | Backup chunks to DDC |
| **DDC Buckets** | Storage containers | One bucket per wiki source |

### ❌ Not Using (Not Ready)

| Component | Status | Alternative |
|-----------|--------|-------------|
| **Cubbies** | Feature branch, not merged | Use DDC `isPublic: false` + `grantAccess()` |
| **DDC Vector Search** | Not implemented | Keep pgvector as primary |

---

## API Migration

### Edge Function → Express Mapping

| Supabase Function | New Endpoint | Changes |
|-------------------|--------------|---------|
| `evaluate/index.ts` | `POST /api/evaluate` | Gemini → Ollama |
| `output-evaluate/index.ts` | `POST /api/evaluate/score` | Same logic |
| `notion-import/index.ts` | `POST /api/import` | Gemini embed → nomic |

### Key Code Changes

**LLM Generation:**
```typescript
// Before: Lovable Gateway
fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
  body: JSON.stringify({ model: "google/gemini-2.5-flash", ... })
});

// After: Local Ollama
fetch("http://mac-mini-2:11434/v1/chat/completions", {
  body: JSON.stringify({ model: "llama3.3:70b-instruct-q4_K_M", ... })
});
```

**Embeddings:**
```typescript
// Before: Gemini
const embedding = await geminiEmbed(text);

// After: Ollama nomic-embed
const res = await fetch("http://mac-mini-2:11434/api/embeddings", {
  method: "POST",
  body: JSON.stringify({ model: "nomic-embed-text", prompt: text })
});
const { embedding } = await res.json(); // 768-dim ✓
```

---

## Data Flow

### Query Flow (simplified)

```
User Question
     ↓
[Mac Mini 1: API]
     ↓
Query Analysis (intent, keywords)
     ↓
[Mac Mini 3: PostgreSQL]
     ↓
Vector Search (pgvector)
     ↓
[Mac Mini 2: Ollama]
     ↓
Rerank (mxbai) → Generate (Llama 70B)
     ↓
[Mac Mini 1: API]
     ↓
Evaluate Answer (anti-hallucination)
     ↓
Response + Citations
```

### Import Flow

```
Notion Webhook
     ↓
[Mac Mini 1: ROB Stream]
     ↓
Trigger: "page.updated"
     ↓
[Mac Mini 1: API]
     ↓
Fetch Notion Content
     ↓
[Mac Mini 2: Ollama]
     ↓
Generate Embeddings (nomic)
     ↓
[Mac Mini 3: PostgreSQL + DDC]
     ↓
Store Chunks (pgvector + DDC backup)
```

---

## ROB Integration

### Raft Configuration

```typescript
const wikiRaft = {
  name: "cere-wiki-knowledge",
  streamId: "wiki-updates",
  dataSourcesIds: ["postgres-wiki"],
  
  indexingScript: {
    tsCode: `
      async function index(page) {
        const chunks = chunkDocument(page.content);
        for (const chunk of chunks) {
          const embedding = await ollama.embed(chunk.text);
          await db.insert({ ...chunk, embedding });
          await ddc.store(bucketId, chunk);
        }
      }
    `
  },
  
  queryOperations: [{
    name: "search",
    script: {
      tsCode: `
        async function search({ query, topK }) {
          const embedding = await ollama.embed(query);
          return await db.vectorSearch(embedding, topK);
        }
      `
    }
  }]
};
```

### Stream Configuration

```typescript
const wikiStream = {
  name: "wiki-updates",
  triggers: [{
    eventPattern: "notion.page.*",
    conditions: [
      { field: "type", operator: "in", value: "created,updated" }
    ]
  }]
};
```

---

## Timeline

| Week | Tasks |
|------|-------|
| **1** | Mac Mini setup, PostgreSQL + pgvector, Ollama models |
| **2** | Database migration (pg_dump → local), DDC sync |
| **3** | API migration (Edge Functions → Express) |
| **4** | Frontend deploy, ROB Rafts/Streams setup |
| **5** | Testing, Grafana dashboards, alerts |
| **6** | DNS cutover, Supabase decommission |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Query P95 latency | ~3s | < 5s |
| Hallucination score | 4.2 avg | ≥ 4.0 avg |
| Monthly cost | €175 | €30 |
| Data location | US (Supabase) | On-premise |

---

## Commands Cheat Sheet

```bash
# Mac Mini 2: Install models
ollama pull llama3.3:70b-instruct-q4_K_M
ollama pull nomic-embed-text
ollama pull mxbai-rerank-base-v1

# Mac Mini 3: Setup database
createdb projectsot
psql projectsot -c "CREATE EXTENSION vector;"

# Export from Supabase
pg_dump -h db.xxx.supabase.co -d postgres \
  --table=wiki_chunks --table=wiki_sources \
  > export.sql

# Import locally
psql -h mac-mini-3 -d projectsot < export.sql

# Test embedding
curl http://mac-mini-2:11434/api/embeddings \
  -d '{"model":"nomic-embed-text","prompt":"test"}'

# Test generation
curl http://mac-mini-2:11434/v1/chat/completions \
  -d '{"model":"llama3.3:70b-instruct-q4_K_M","messages":[{"role":"user","content":"hi"}]}'
```

---

*Claudemart | Feb 2026*
