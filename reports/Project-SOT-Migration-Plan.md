# Project SOT → CEF Infrastructure Migration Plan

**Date:** 2025-02-06  
**Author:** Claudemart  
**Target:** 3x Mac Mini @ Cere Office

---

## Executive Summary

Migrate Project Source of Truth from Supabase/Lovable cloud to self-hosted CEF infrastructure using 3 Mac Minis. This enables:
- **Cost reduction**: No Supabase/Cohere/Gemini API costs
- **Data sovereignty**: All Cere documentation stays on-premise
- **Customization**: Fine-tuned models, custom retrieval strategies
- **Integration**: Native DDC storage, ROB observability

---

## Current vs Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CURRENT (Cloud)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Lovable (Frontend)  →  Supabase Edge Functions  →  Supabase PostgreSQL    │
│                              ↓                           ↓                   │
│                    Lovable AI Gateway           pgvector (768-dim)          │
│                         ↓      ↓                                            │
│                    Gemini   Cohere                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
                              MIGRATION
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TARGET (Mac Mini Cluster)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                    │
│   │  MAC MINI 1 │    │  MAC MINI 2 │    │  MAC MINI 3 │                    │
│   │   "Brain"   │    │   "Muscle"  │    │  "Storage"  │                    │
│   ├─────────────┤    ├─────────────┤    ├─────────────┤                    │
│   │             │    │             │    │             │                    │
│   │ • API Server│    │ • Ollama    │    │ • PostgreSQL│                    │
│   │ • Frontend  │    │   Primary   │    │   + pgvector│                    │
│   │ • ROB Agent │    │ • Embeddings│    │ • DDC Node  │                    │
│   │ • Nginx     │    │ • Reranking │    │ • Backups   │                    │
│   │             │    │             │    │             │                    │
│   │ Ollama      │    │ Llama 3.3   │    │ Postgres 16 │                    │
│   │ (fallback)  │    │ 70B Q4      │    │ pgvector    │                    │
│   │             │    │ + nomic-    │    │ 0.7.0       │                    │
│   │             │    │   embed     │    │             │                    │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                    │
│          │                  │                  │                            │
│          └──────────────────┼──────────────────┘                            │
│                             │                                               │
│                    Internal Network (10Gbe)                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Hardware Allocation

### Mac Mini 1: "Brain" (API + Orchestration)
| Component | Spec | Purpose |
|-----------|------|---------|
| RAM | 16-24GB | API server, light inference |
| Storage | 512GB SSD | App code, caches |
| Role | Primary | API Gateway, Frontend hosting |

**Services:**
- Express/Hono API server (migrated Edge Functions)
- React frontend (static build via Nginx)
- ROB observability agent
- Ollama (small models for fallback)
- Redis (caching, rate limiting)

### Mac Mini 2: "Muscle" (LLM Inference)
| Component | Spec | Purpose |
|-----------|------|---------|
| RAM | 64GB+ | Large model inference |
| Storage | 1TB SSD | Model weights |
| Role | Primary | All LLM + embedding workloads |

**Services:**
- Ollama primary instance
  - `llama3.3:70b-instruct-q4_K_M` (generation)
  - `qwen2.5:32b-instruct-q4_K_M` (backup)
  - `nomic-embed-text` (embeddings, 768-dim compatible)
  - `mxbai-rerank-base-v1` (local reranking)
- vLLM (optional, for higher throughput)

### Mac Mini 3: "Storage" (Database + DDC)
| Component | Spec | Purpose |
|-----------|------|---------|
| RAM | 32GB+ | PostgreSQL buffers |
| Storage | 2TB SSD | Database + DDC storage |
| Role | Primary | All persistent data |

**Services:**
- PostgreSQL 16 with pgvector 0.7.0
- DDC Node (Cere storage layer)
- Automated backups to DDC
- Prometheus + Grafana (metrics)

---

## Migration Phases

### Phase 1: Infrastructure Setup (Week 1)
```bash
# Mac Mini 3 - Database
brew install postgresql@16
# Build pgvector from source for ARM64
git clone https://github.com/pgvector/pgvector.git
cd pgvector && make && make install

# Create database
createdb projectsot
psql projectsot -c "CREATE EXTENSION vector;"

# Mac Mini 2 - Ollama
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.3:70b-instruct-q4_K_M
ollama pull nomic-embed-text
ollama pull mxbai-rerank-base-v1

# Mac Mini 1 - API Server
brew install nginx redis node
```

### Phase 2: Database Migration (Week 1-2)
```sql
-- Export from Supabase
pg_dump -h db.xxx.supabase.co -U postgres -d postgres \
  --table=wiki_sources \
  --table=wiki_chunks \
  --table=questions \
  --table=evaluations \
  > sot_export.sql

-- Import to local PostgreSQL
psql -h mac-mini-3 -U postgres -d projectsot < sot_export.sql

-- Verify vector dimensions match (768)
SELECT vector_dims(embedding) FROM wiki_chunks LIMIT 1;
```

### Phase 3: Edge Function Migration (Week 2-3)

Convert Supabase Edge Functions (Deno) → Express/Hono (Node.js):

| Edge Function | New Location | Changes Required |
|---------------|--------------|------------------|
| `evaluate/index.ts` | `src/api/evaluate.ts` | Replace Supabase client → pg, Lovable gateway → Ollama |
| `output-evaluate/index.ts` | `src/api/output-evaluate.ts` | Same LLM swap |
| `notion-import/index.ts` | `src/api/notion-import.ts` | Replace Gemini embeddings → nomic-embed |

**Key Code Changes:**

```typescript
// BEFORE: Lovable AI Gateway
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
  body: JSON.stringify({ model: "google/gemini-2.5-flash", ... })
});

// AFTER: Local Ollama
const response = await fetch("http://mac-mini-2:11434/v1/chat/completions", {
  body: JSON.stringify({ model: "llama3.3:70b-instruct-q4_K_M", ... })
});
```

```typescript
// BEFORE: Gemini Embeddings
const embedding = await generateEmbedding(text, GEMINI_API_KEY);

// AFTER: Local Ollama nomic-embed
async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch("http://mac-mini-2:11434/api/embeddings", {
    method: "POST",
    body: JSON.stringify({ model: "nomic-embed-text", prompt: text })
  });
  const data = await res.json();
  return data.embedding; // 768-dim, compatible with existing vectors
}
```

```typescript
// BEFORE: Cohere Rerank
const response = await fetch("https://api.cohere.com/v1/rerank", ...);

// AFTER: Local mxbai-rerank OR keep Cohere (10 req/min free)
// Option A: Local rerank model
const response = await fetch("http://mac-mini-2:11434/api/rerank", {
  body: JSON.stringify({ model: "mxbai-rerank-base-v1", query, documents })
});

// Option B: Continue using Cohere free tier (simpler)
```

### Phase 4: Frontend Migration (Week 3)

```bash
# Clone and build frontend
cd /opt/projectsot
git clone https://github.com/bren-cere/projectsot.git frontend
cd frontend

# Update API endpoints
sed -i 's|https://xxx.supabase.co/functions/v1|http://mac-mini-1:3000/api|g' src/**/*.ts

# Build static assets
npm run build

# Deploy to Nginx
cp -r dist/* /var/www/projectsot/
```

**Nginx config (Mac Mini 1):**
```nginx
server {
    listen 80;
    server_name sot.cere.local;
    
    root /var/www/projectsot;
    index index.html;
    
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
    }
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Phase 5: DDC Integration (Week 4)

Store document chunks in DDC for redundancy:

```typescript
import { DdcClient, TESTNET } from '@cere-ddc-sdk/ddc-client';

const ddcClient = await DdcClient.create(WALLET_SECRET, TESTNET);

// Store chunk with embedding
async function storeChunkInDDC(chunk: WikiChunk) {
  const data = JSON.stringify({
    id: chunk.id,
    content: chunk.raw_text,
    embedding: chunk.embedding,
    metadata: {
      page_id: chunk.page_id,
      page_title: chunk.page_title,
      depth: chunk.depth
    }
  });
  
  const cid = await ddcClient.store(BUCKET_ID, new TextEncoder().encode(data));
  return cid;
}

// Sync PostgreSQL → DDC on import
async function syncToDDC() {
  const chunks = await db.query('SELECT * FROM wiki_chunks WHERE ddc_cid IS NULL');
  for (const chunk of chunks) {
    const cid = await storeChunkInDDC(chunk);
    await db.query('UPDATE wiki_chunks SET ddc_cid = $1 WHERE id = $2', [cid, chunk.id]);
  }
}
```

### Phase 6: ROB Observability (Week 4)

```yaml
# rob-config.yaml
observability:
  traces:
    endpoint: http://mac-mini-3:4317
    sample_rate: 1.0
  
  metrics:
    - name: sot_query_latency
      type: histogram
      labels: [intent, strategy]
    
    - name: sot_rerank_score
      type: gauge
      labels: [source]
    
    - name: sot_hallucination_score
      type: gauge
      labels: [question_level]

alerts:
  - name: high_latency
    condition: sot_query_latency_p95 > 5000
    action: slack_notify
  
  - name: low_quality
    condition: avg(sot_hallucination_score) < 3
    action: slack_urgent
```

---

## Model Selection Rationale

| Task | Model | Why |
|------|-------|-----|
| **Generation** | Llama 3.3 70B Q4 | Best open model for reasoning, fits in 64GB RAM |
| **Embeddings** | nomic-embed-text | 768-dim (matches existing), 8K context, fast |
| **Reranking** | mxbai-rerank-base | Lightweight, accurate, runs on CPU |
| **Backup Gen** | Qwen 2.5 32B | Different architecture, good for diversity |

**Memory Requirements:**
- Llama 3.3 70B Q4: ~40GB VRAM/RAM
- Qwen 2.5 32B Q4: ~20GB
- nomic-embed-text: ~500MB
- mxbai-rerank: ~300MB

Mac Mini 2 with 64GB can run Llama 70B + embeddings concurrently.

---

## Rollout Strategy

```
Week 1: Infrastructure setup, database migration
        ├── Mac Minis configured
        ├── PostgreSQL + pgvector running
        └── Ollama models downloaded

Week 2: API migration (evaluate function)
        ├── Port evaluate/index.ts to Express
        ├── Test with Ollama backend
        └── Validate output quality vs Gemini

Week 3: Complete API + Frontend
        ├── Port remaining edge functions
        ├── Deploy frontend to Nginx
        └── Internal testing

Week 4: DDC + Observability
        ├── DDC sync implemented
        ├── ROB dashboards configured
        └── Alerting setup

Week 5: Cutover
        ├── DNS switch (sot.cere.network → Mac Mini cluster)
        ├── Supabase read-only mode
        └── Monitor for issues

Week 6: Cleanup
        ├── Supabase decommission
        ├── Documentation update
        └── Team training
```

---

## Cost Comparison

| Item | Current (Monthly) | After Migration |
|------|-------------------|-----------------|
| Supabase Pro | $25 | $0 |
| Cohere API | ~$50 (if over free tier) | $0 (local) or $0 (free tier) |
| Gemini API | ~$100 | $0 |
| Lovable hosting | $0 (included) | $0 (self-hosted) |
| **Total** | **~$175/mo** | **$0** |

Plus: Mac Minis are already purchased, electricity ~$30/mo for 3 units.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Llama quality < Gemini | Medium | High | A/B test, fine-tune if needed |
| Mac Mini hardware failure | Low | High | DDC replication, daily backups |
| Network latency to office | Medium | Medium | Cloudflare Tunnel for remote access |
| Embedding dimension mismatch | Low | High | Verify nomic-embed produces 768-dim |

---

## Success Metrics

1. **Latency**: Query P95 < 5s (currently ~3s with Gemini)
2. **Quality**: Hallucination score ≥ 4.0 average
3. **Availability**: 99.5% uptime
4. **Cost**: $0 cloud spend (excluding office electricity)

---

## Next Steps

1. [ ] Confirm Mac Mini specs (RAM especially for Mini 2)
2. [ ] Set up internal DNS (sot.cere.local)
3. [ ] Export Supabase schema + data
4. [ ] Begin Phase 1 infrastructure setup

---

*Generated by Claudemart • Ready for review*
