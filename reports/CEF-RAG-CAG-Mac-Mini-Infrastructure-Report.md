# CEF AI Infrastructure: RAG/CAG with Local LLMs on Mac Mini Cluster

## Executive Summary

This report provides a comprehensive analysis of deploying Cere's AI intelligence layer ("Project Source of Truth") on CEF infrastructure using locally hosted models on Mac Mini M4 clusters. The architecture leverages:

- **ROB (Real-time Orchestration Backend)** for agent management and observability
- **DDC (Decentralized Data Cloud)** with Rafts and Cubbies for secure context storage
- **Ollama/MLX** for local LLM inference on Apple Silicon
- **K3s/KubeBlocks** for container orchestration

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Mac Mini Infrastructure Design](#2-mac-mini-infrastructure-design)
3. [RAG/CAG Implementation on CEF](#3-ragcag-implementation-on-cef)
4. [Permissioned Agent Access Control](#4-permissioned-agent-access-control)
5. [ROB Observability Integration](#5-rob-observability-integration)
6. [Use Cases & Applications](#6-use-cases--applications)
7. [Implementation Roadmap](#7-implementation-roadmap)
8. [Technical Specifications](#8-technical-specifications)

---

## 1. Current Architecture Analysis

### 1.1 Core Components (cere-io repositories)

#### ROB API (`cere-io/rob-api`)
The Real-time Orchestration Backend is the central nervous system:

```
rob-api/
├── backend/           # NestJS REST API
│   ├── modules/
│   │   ├── rafts/          # Context containers with indexing scripts
│   │   ├── data-source/    # PostgreSQL, MongoDB, Redis, Elasticsearch connectors
│   │   ├── streams/        # Event pipelines with triggers
│   │   ├── engagement/     # Integration points with custom scripts
│   │   ├── observability/  # Loki-based logging & metrics
│   │   └── agent-registry/ # Agent management & permissions
│   └── db/entities/
│       ├── Raft.entity.ts    # Core context unit
│       ├── Stream.entity.ts  # Data flow pipelines
│       └── DataSource.entity.ts
└── cli/               # Management interface
```

**Key Abstractions:**

| Component | Purpose | RAG/CAG Role |
|-----------|---------|--------------|
| **Raft** | Context container with indexing/query scripts | Stores vectorized knowledge chunks |
| **Stream** | Data flow pipeline with triggers | Real-time context updates |
| **Data Source** | External data connectors | Source truth ingestion |
| **Engagement** | Integration scripts | Agent interaction points |

#### Raft Entity Structure (Context Container)
```typescript
interface Raft {
  id: string;
  name: string;
  streamId: string;              // Parent data stream
  dataSourcesIds: string[];      // Connected knowledge sources
  indexingScript: Script;        // How to vectorize/index content
  queryOperations: QueryOperation[]; // How agents retrieve context
}

interface QueryOperation {
  id: string;
  name: string;
  script: Script;      // TypeScript query logic
  parameters: any;     // Query parameters schema
  returns: any;        // Return type schema
}
```

#### DDC SDK (`Cerebellum-Network/cere-ddc-sdk-js`)
Decentralized storage layer:

```typescript
// Creating a knowledge bucket
const bucketId = await ddcClient.createBucket(clusterId, { 
  isPublic: false,  // Permissioned access
  replication: 3    // Redundancy across nodes
});

// Storing context chunks
const piece = new Piece(vectorizedContent, {
  metadata: { 
    sourceDoc: 'wiki/ddc-overview.md',
    chunkIndex: 42,
    embedding: Float32Array 
  }
});
const cid = await storageNode.storePiece(bucketId, piece);
```

### 1.2 CEF AI Ansible Deployment (`cere-io/cef-ai-ansible`)

The existing deployment automation covers:

| Playbook | Purpose |
|----------|---------|
| `bootstrap.yml` | Base OS + ansible user setup |
| `k3s.yml` | K3s cluster + KubeBlocks |
| `mysql.yml` | MySQL cluster via KubeBlocks |
| `redis.yml` | Sharded Redis cluster |
| `deploy_core.yml` | Full CEF stack deployment |

**Current Stack Components:**
- Orchestrator
- Agent Runtime
- Event Runtime
- Function Runtime
- Inference Runtime
- ROB API + Frontend

---

## 2. Mac Mini Infrastructure Design

### 2.1 Hardware Specifications

**Recommended Mac Mini M4 Pro Configuration:**

| Spec | Minimum | Recommended | Maximum |
|------|---------|-------------|---------|
| **CPU** | M4 (10-core) | M4 Pro (14-core) | M4 Max (16-core) |
| **RAM** | 32GB | 64GB | 128GB |
| **Storage** | 512GB | 1TB | 2TB |
| **Network** | 1Gb | 10Gb | 10Gb |

**Cluster Size Recommendations:**

| Use Case | Nodes | Total RAM | LLM Capacity |
|----------|-------|-----------|--------------|
| Development | 1 | 64GB | 70B params |
| Small Production | 3 | 192GB | 3x 70B concurrent |
| Enterprise | 5-8 | 320-512GB | Distributed 405B |

### 2.2 Network Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CERE EDGE FABRIC (CEF)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Mac Mini 1  │    │  Mac Mini 2  │    │  Mac Mini 3  │       │
│  │  (Control)   │    │  (Worker)    │    │  (Worker)    │       │
│  ├──────────────┤    ├──────────────┤    ├──────────────┤       │
│  │ K3s Server   │    │ K3s Agent    │    │ K3s Agent    │       │
│  │ ROB API      │    │ Ollama       │    │ Ollama       │       │
│  │ MySQL        │    │ LLM: Llama3  │    │ LLM: Qwen2   │       │
│  │ Redis        │    │ Embedding    │    │ Embedding    │       │
│  │ Loki         │    │ Vector Store │    │ Vector Store │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         └───────────────────┴───────────────────┘                │
│                             │                                    │
│                    ┌────────┴────────┐                          │
│                    │   DDC Cluster   │                          │
│                    │   (Raft Store)  │                          │
│                    └─────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Software Stack

**Per-Node Installation:**

```bash
# 1. Ollama for LLM inference
curl -fsSL https://ollama.com/install.sh | sh

# 2. Pull models (M4 Pro 64GB can run these concurrently)
ollama pull llama3.3:70b-instruct-q4_K_M   # ~40GB VRAM
ollama pull nomic-embed-text               # Embeddings
ollama pull qwen2.5:32b-instruct-q4_K_M    # Alternative

# 3. Apple MLX for optimized inference (optional)
pip install mlx-lm

# 4. Vector database (Qdrant or Milvus)
docker run -p 6333:6333 qdrant/qdrant
```

**Ansible Extension for Mac Mini:**

```yaml
# playbooks/mac-mini-inference.yml
- name: Deploy Local LLM Infrastructure
  hosts: mac_mini_workers
  tasks:
    - name: Install Ollama
      homebrew:
        name: ollama
        state: present
        
    - name: Configure Ollama service
      template:
        src: templates/ollama.plist.j2
        dest: ~/Library/LaunchAgents/ollama.plist
        
    - name: Pull required models
      shell: |
        ollama pull {{ item }}
      loop: "{{ llm_models }}"
      vars:
        llm_models:
          - llama3.3:70b-instruct-q4_K_M
          - nomic-embed-text
          
    - name: Deploy vector store
      kubernetes.core.helm:
        name: qdrant
        chart_ref: qdrant/qdrant
        namespace: "{{ namespaces.cef }}"
        values:
          persistence:
            size: 100Gi
```

---

## 3. RAG/CAG Implementation on CEF

### 3.1 RAG vs CAG: Architectural Decision

| Aspect | RAG (Retrieval-Augmented) | CAG (Context-Augmented) |
|--------|---------------------------|-------------------------|
| **Context Source** | Vector similarity search | Pre-loaded full context |
| **Latency** | Higher (retrieval + inference) | Lower (direct inference) |
| **Context Window** | Limited by chunks | Full document access |
| **Best For** | Large knowledge bases | Focused domain expertise |
| **CEF Implementation** | Raft query operations | Raft indexing scripts |

**Hybrid Approach for Cere:**
```
┌─────────────────────────────────────────────────────────────┐
│                    HYBRID RAG/CAG FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Query: "What problem does DAC solve for builders?"    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────┐                │
│  │         STREAM ROUTER (ROB)             │                │
│  │  - Analyze query intent                 │                │
│  │  - Select appropriate Raft(s)           │                │
│  │  - Determine RAG vs CAG strategy        │                │
│  └───────────────┬─────────────────────────┘                │
│                  │                                           │
│     ┌────────────┴────────────┐                             │
│     │                         │                              │
│     ▼                         ▼                              │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │  RAG PATH    │      │  CAG PATH    │                     │
│  │  (DDC Query) │      │  (Full Ctx)  │                     │
│  ├──────────────┤      ├──────────────┤                     │
│  │ 1. Embed Q   │      │ 1. Load Raft │                     │
│  │ 2. Vec Search│      │    Context   │                     │
│  │ 3. Top-K     │      │ 2. Inject    │                     │
│  │    Chunks    │      │    Full Doc  │                     │
│  └──────┬───────┘      └──────┬───────┘                     │
│         │                     │                              │
│         └──────────┬──────────┘                             │
│                    │                                         │
│                    ▼                                         │
│  ┌─────────────────────────────────────────┐                │
│  │        LOCAL LLM (Ollama/MLX)           │                │
│  │  - Llama 3.3 70B / Qwen 2.5 32B        │                │
│  │  - Context: Retrieved + Cached          │                │
│  └───────────────┬─────────────────────────┘                │
│                  │                                           │
│                  ▼                                           │
│  ┌─────────────────────────────────────────┐                │
│  │         RESPONSE + CITATIONS            │                │
│  │  + ROB Observability Logging            │                │
│  └─────────────────────────────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Raft Configuration for Wiki Intelligence

**Example: DDC Documentation Raft**

```typescript
// Raft definition for Cere wiki knowledge
const ddcDocsRaft: CreateRaftDto = {
  name: "ddc-documentation-raft",
  description: "Vectorized Cere DDC documentation for RAG queries",
  streamId: "wiki-update-stream",
  dataSourcesIds: ["gitbook-source", "github-docs-source"],
  
  indexingScript: {
    name: "ddc-docs-indexer",
    tsCode: `
      import { DdcClient, Piece } from '@cere-ddc-sdk/ddc-client';
      import { embed } from './embedding-service';
      
      export async function indexDocument(doc: Document): Promise<void> {
        // Chunk document into semantic units
        const chunks = chunkBySection(doc, { maxTokens: 512 });
        
        for (const chunk of chunks) {
          // Generate embedding
          const embedding = await embed(chunk.text);
          
          // Store in DDC with metadata
          const piece = new Piece(JSON.stringify({
            text: chunk.text,
            embedding: Array.from(embedding),
            source: doc.path,
            section: chunk.section,
            audience: detectAudience(chunk.text), // developer/operator/data-customer
          }));
          
          await ddcClient.store(bucketId, piece, {
            tags: [doc.category, chunk.section]
          });
        }
      }
    `
  },
  
  queryOperations: [
    {
      name: "semantic-search",
      alias: "search",
      description: "Find relevant documentation chunks via semantic similarity",
      script: {
        name: "semantic-search-query",
        tsCode: `
          export async function semanticSearch(
            query: string,
            options: { 
              topK?: number;
              audience?: 'developer' | 'operator' | 'data-customer';
              minScore?: number;
            }
          ): Promise<SearchResult[]> {
            const queryEmbedding = await embed(query);
            
            // Query vector store (Qdrant)
            const results = await vectorDb.search({
              vector: queryEmbedding,
              limit: options.topK ?? 5,
              filter: options.audience 
                ? { audience: options.audience }
                : undefined,
              scoreThreshold: options.minScore ?? 0.7
            });
            
            return results.map(r => ({
              text: r.payload.text,
              source: r.payload.source,
              section: r.payload.section,
              score: r.score
            }));
          }
        `
      },
      parameters: {
        query: { type: 'string', required: true },
        topK: { type: 'number', default: 5 },
        audience: { type: 'string', enum: ['developer', 'operator', 'data-customer'] }
      },
      returns: {
        type: 'array',
        items: {
          text: 'string',
          source: 'string', 
          score: 'number'
        }
      }
    },
    {
      name: "full-context-load",
      alias: "context",
      description: "Load full document context for CAG approach",
      script: {
        name: "context-loader",
        tsCode: `
          export async function loadFullContext(
            documentPath: string
          ): Promise<FullContext> {
            const doc = await ddcClient.read(
              new FileUri(bucketId, documentPath)
            );
            
            return {
              content: await doc.text(),
              metadata: doc.metadata,
              lastUpdated: doc.timestamp
            };
          }
        `
      }
    }
  ]
};
```

### 3.3 Stream Configuration for Real-time Updates

```typescript
const wikiUpdateStream: Stream = {
  name: "wiki-content-updates",
  description: "Real-time wiki content change stream",
  triggers: [
    {
      type: "webhook",
      source: "gitbook",
      events: ["page.updated", "page.created"],
      filter: { space: "cere-ddc" }
    },
    {
      type: "schedule",
      cron: "0 */6 * * *",  // Every 6 hours
      action: "full-reindex"
    }
  ]
};
```

---

## 4. Permissioned Agent Access Control

### 4.1 Agent Permission Model

The ROB API provides granular access control through the agent-registry module:

```typescript
interface AgentPermission {
  agentId: string;
  organizationId: string;
  
  // Raft-level permissions
  raftAccess: {
    raftId: string;
    operations: ('read' | 'write' | 'query' | 'index')[];
    queryOperations: string[];  // Specific allowed queries
  }[];
  
  // Data source restrictions
  dataSourceAccess: {
    dataSourceId: string;
    tables?: string[];      // SQL tables
    collections?: string[]; // MongoDB collections
  }[];
  
  // Rate limiting
  quotas: {
    queriesPerMinute: number;
    tokensPerDay: number;
    maxContextSize: number;
  };
}
```

### 4.2 Secure Context Retrieval Flow

```
┌─────────────────────────────────────────────────────────────────┐
│               PERMISSIONED CONTEXT ACCESS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Agent Request: { agentId, query, raftId }                      │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────┐                    │
│  │         COMBINED AUTH GUARD             │                    │
│  │  php-auth / basic / s2s / wallet        │                    │
│  └───────────────┬─────────────────────────┘                    │
│                  │ ✓ Authenticated                               │
│                  ▼                                               │
│  ┌─────────────────────────────────────────┐                    │
│  │         COMBINED DATA GUARD             │                    │
│  │  - Check agentId → organizationId       │                    │
│  │  - Verify raft access permission        │                    │
│  │  - Validate query operation allowed     │                    │
│  │  - Check quota limits                   │                    │
│  └───────────────┬─────────────────────────┘                    │
│                  │ ✓ Authorized                                  │
│                  ▼                                               │
│  ┌─────────────────────────────────────────┐                    │
│  │         RAFT SERVICE                    │                    │
│  │  - Execute query operation              │                    │
│  │  - Apply row-level security filters     │                    │
│  │  - Log to observability                 │                    │
│  └───────────────┬─────────────────────────┘                    │
│                  │                                               │
│                  ▼                                               │
│  ┌─────────────────────────────────────────┐                    │
│  │         RESPONSE                        │                    │
│  │  - Filtered context chunks              │                    │
│  │  - Audit trail in Loki                  │                    │
│  │  - Usage metrics updated                │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Multi-Tenant Isolation

```typescript
// Organization-scoped raft access
const orgRaftAccess = await engagementService.findByOrganizationId(orgId);

// Engagement with organization-level filtering
const engagements = await engagementService.findAll(
  dataServiceId,
  true,  // includePlacements
  organizationId  // Filter to org-specific + global engagements
);
```

---

## 5. ROB Observability Integration

### 5.1 Loki-Based Logging Architecture

The `LokiService` provides comprehensive observability:

```typescript
interface ObservabilityMetrics {
  // Script execution tracking
  scriptLogs: {
    scriptId: string;
    traceId: string;
    executionId: string;
    duration: number;
    status: 'success' | 'failure';
    errorMessage?: string;
  };
  
  // Stream event tracking
  streamLogs: {
    streamId: string;
    eventType: string;
    event: any;
  };
  
  // Aggregated metrics
  metrics: {
    avgDuration: number;
    successRate: number;
    executionCount: { success: number; failure: number };
  };
}
```

### 5.2 Agent Efficacy Dashboard

**Key Metrics for RAG/CAG Quality:**

| Metric | Description | Loki Query |
|--------|-------------|------------|
| **Retrieval Precision** | % of retrieved chunks used | `rate({scriptId="..."} \| json \| chunksUsed/chunksRetrieved)` |
| **Context Relevance** | Avg similarity score | `avg_over_time({...} \| json \| unwrap avgScore)` |
| **Response Latency** | E2E query time | `quantile_over_time(0.95, {...} \| unwrap duration)` |
| **Hallucination Rate** | Answers without citations | Custom post-processing |
| **User Satisfaction** | Feedback scores | Integration with feedback loop |

### 5.3 Real-time Monitoring Setup

```typescript
// script-observability.controller.ts endpoints
const endpoints = {
  // Get execution logs
  "GET /scripts/:scriptId/logs": {
    params: { status, startTime, endTime, traceId }
  },
  
  // Get performance metrics
  "GET /scripts/:scriptId/avg-duration": {},
  "GET /scripts/:scriptId/execution-counts": {},
  
  // Time series for dashboards
  "GET /scripts/:scriptId/timeseries/:metric": {
    metrics: ['successRate', 'failureRate', 'durationMin', 'durationMax', 'durationAvg']
  }
};
```

**Grafana Dashboard Configuration:**

```yaml
# grafana-rag-dashboard.yaml
panels:
  - title: "RAG Query Latency (P95)"
    query: |
      quantile_over_time(0.95, 
        {app=~"ai-script-runner-.*"} 
        | json 
        | unwrap duration [$__interval]
      ) by (scriptId)
      
  - title: "Context Retrieval Success Rate"
    query: |
      sum(rate({...,message="Indexing script execution succeed"}[5m])) 
      / 
      sum(rate({...,message=~".*execution.*"}[5m])) 
      * 100
      
  - title: "Active Agents"
    query: |
      count(count_over_time({app=~"ai-script-runner-.*"}[1h])) by (agentId)
```

---

## 6. Use Cases & Applications

### 6.1 Wiki Intelligence Layer (Project Source of Truth)

**Problem Solved:**
> "What problem does DAC solve for builders?" is not answerable from current wiki structure.

**Solution Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                WIKI INTELLIGENCE SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │   GitBook   │     │   GitHub    │     │   Notion    │        │
│  │   (Wiki)    │     │   (Code)    │     │  (Internal) │        │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘        │
│         │                   │                   │                │
│         └───────────────────┴───────────────────┘                │
│                             │                                    │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              INDEXING STREAM                         │        │
│  │  - Chunk by semantic sections                       │        │
│  │  - Detect audience (dev/operator/customer)          │        │
│  │  - Extract concepts & relationships                 │        │
│  │  - Generate embeddings (nomic-embed-text)           │        │
│  └───────────────────────┬─────────────────────────────┘        │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────┐        │
│  │           DDC KNOWLEDGE RAFTS                        │        │
│  │                                                      │        │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐       │        │
│  │  │  DDC Core  │ │ Developer  │ │  Operator  │       │        │
│  │  │  Concepts  │ │   Guide    │ │   Guide    │       │        │
│  │  └────────────┘ └────────────┘ └────────────┘       │        │
│  │                                                      │        │
│  └───────────────────────┬─────────────────────────────┘        │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────┐        │
│  │           QUERY AGENTS                               │        │
│  │                                                      │        │
│  │  [FAQ Generator] [Gap Detector] [Quality Scorer]    │        │
│  │  [Content Recommender] [Consistency Checker]        │        │
│  │                                                      │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Agent Implementations:**

```typescript
// 1. FAQ Generator Agent
const faqGeneratorAgent = {
  name: "wiki-faq-generator",
  raftAccess: ["ddc-docs-raft", "developer-guide-raft"],
  
  async generateFAQ(audience: string): Promise<FAQ[]> {
    // Query most-accessed sections
    const popularSections = await raft.query("get-popular-sections", { audience });
    
    // Generate Q&A pairs using local LLM
    const faqs = await llm.generate({
      prompt: `Generate 10 FAQs for ${audience} based on: ${popularSections}`,
      model: "llama3.3:70b"
    });
    
    return faqs;
  }
};

// 2. Content Gap Detector Agent
const gapDetectorAgent = {
  name: "wiki-gap-detector",
  
  async detectGaps(): Promise<ContentGap[]> {
    // Find questions without good answers
    const unansweredQueries = await raft.query("get-low-confidence-queries");
    
    // Identify missing concept connections
    const orphanConcepts = await raft.query("find-orphan-concepts");
    
    return [...unansweredQueries, ...orphanConcepts];
  }
};

// 3. Quality Scorer Agent
const qualityScorerAgent = {
  name: "wiki-quality-scorer",
  
  async scoreDocument(docPath: string): Promise<QualityReport> {
    const doc = await raft.query("full-context-load", { documentPath: docPath });
    
    const scores = await llm.evaluate({
      prompt: `Score this documentation on:
        - Clarity (1-10)
        - Completeness (1-10)
        - Actionability (1-10)
        - Audience Fit (1-10)
        
        Document: ${doc.content}`,
      model: "llama3.3:70b"
    });
    
    return { docPath, scores, recommendations: scores.improvements };
  }
};
```

### 6.2 Customer Data Intelligence

**Use Case:** Secure, permissioned access to customer-specific data analytics.

```typescript
const customerDataRaft = {
  name: "customer-analytics-raft",
  dataSourcesIds: ["customer-postgres", "event-stream"],
  
  queryOperations: [
    {
      name: "customer-insights",
      script: {
        tsCode: `
          // Row-level security enforced
          export async function getCustomerInsights(
            customerId: string,
            metrics: string[]
          ) {
            // Agent can only access data for authorized customers
            const data = await dataSource.query(\`
              SELECT * FROM analytics 
              WHERE customer_id = $1 
              AND metric_name = ANY($2)
            \`, [customerId, metrics]);
            
            return summarizeWithLLM(data);
          }
        `
      }
    }
  ]
};
```

### 6.3 Code Intelligence for Cere Repositories

**Use Case:** AI-powered code understanding and documentation generation.

```typescript
const codeIntelligenceRaft = {
  name: "cere-codebase-raft",
  dataSourcesIds: ["github-cerebellum-network", "github-cere-io"],
  
  queryOperations: [
    {
      name: "explain-code",
      description: "Explain code functionality with context",
    },
    {
      name: "find-similar-patterns",
      description: "Find similar code patterns across repos",
    },
    {
      name: "generate-tests",
      description: "Generate unit tests for code",
    },
    {
      name: "review-pr",
      description: "AI-powered PR review with context",
    }
  ]
};
```

### 6.4 Real-time Event Processing

**Use Case:** Gaming analytics with immediate feedback.

```typescript
const gamingAnalyticsStream = {
  name: "ceregames-events",
  triggers: [
    {
      type: "kafka",
      topic: "game-events",
      filter: { eventType: ["session_start", "achievement", "purchase"] }
    }
  ],
  
  derivedRafts: ["player-behavior-raft", "engagement-patterns-raft"]
};
```

---

## 7. Implementation Roadmap

### Phase 1: Infrastructure Setup (Weeks 1-2)

| Task | Owner | Duration |
|------|-------|----------|
| Provision Mac Mini cluster | DevOps | 2 days |
| Install K3s + KubeBlocks | DevOps | 1 day |
| Deploy Ollama + models | ML Eng | 2 days |
| Set up Qdrant vector store | ML Eng | 1 day |
| Configure networking | DevOps | 1 day |
| Deploy ROB API | Backend | 1 day |

### Phase 2: RAG/CAG Core (Weeks 3-4)

| Task | Owner | Duration |
|------|-------|----------|
| Implement embedding pipeline | ML Eng | 3 days |
| Create wiki indexing Raft | Backend | 2 days |
| Build query operations | Backend | 3 days |
| Integrate with Ollama | ML Eng | 2 days |
| Set up observability | DevOps | 2 days |

### Phase 3: Agent Development (Weeks 5-6)

| Task | Owner | Duration |
|------|-------|----------|
| FAQ Generator agent | ML Eng | 2 days |
| Gap Detector agent | ML Eng | 2 days |
| Quality Scorer agent | ML Eng | 2 days |
| Permission model implementation | Backend | 3 days |
| Testing & validation | QA | 3 days |

### Phase 4: Production Rollout (Weeks 7-8)

| Task | Owner | Duration |
|------|-------|----------|
| Performance optimization | All | 3 days |
| Security audit | Security | 2 days |
| Documentation | Tech Writer | 2 days |
| Training & handoff | All | 3 days |

---

## 8. Technical Specifications

### 8.1 Model Selection Matrix

| Model | Size | Use Case | Mac Mini Req | Tokens/sec |
|-------|------|----------|--------------|------------|
| **llama3.3:70b-q4** | ~40GB | Complex reasoning | 64GB RAM | 15-20 |
| **qwen2.5:32b-q4** | ~20GB | Balanced perf/quality | 32GB RAM | 30-40 |
| **mistral:7b-q8** | ~8GB | Fast queries | 16GB RAM | 60-80 |
| **nomic-embed-text** | ~300MB | Embeddings | Any | 1000+ |

### 8.2 API Endpoints Summary

**ROB API Endpoints for RAG/CAG:**

```
# Raft Management
POST   /rafts                           # Create raft
GET    /rafts?dataServiceId=...         # List rafts
GET    /rafts/:id                       # Get raft details
PUT    /rafts/:id                       # Update raft
DELETE /rafts/:id                       # Delete raft

# Query Operations
POST   /rafts/:id/query/:operationName  # Execute query

# Data Sources
POST   /data-sources                    # Create data source
POST   /data-sources/check-connection   # Test connection

# Streams
POST   /streams                         # Create stream
GET    /streams/:id/events              # Get stream events

# Observability
GET    /script-observability/scripts/:id/logs
GET    /script-observability/scripts/:id/avg-duration
GET    /script-observability/scripts/:id/execution-counts
GET    /script-observability/scripts/:id/timeseries/:metric

# Engagements (Agent Triggers)
POST   /data-services/:id/engagements
GET    /organization/:orgId/engagements
```

### 8.3 Security Considerations

| Layer | Mechanism | Implementation |
|-------|-----------|----------------|
| **Transport** | TLS 1.3 | K3s ingress with cert-manager |
| **Authentication** | Multi-method | PHP session / Basic / S2S / Wallet |
| **Authorization** | RBAC | Combined data guard per raft |
| **Data Isolation** | Tenant separation | Organization-scoped queries |
| **Audit** | Full logging | Loki with retention policy |
| **Encryption** | At-rest | DDC bucket encryption |

### 8.4 Estimated Costs

**Hardware (One-time):**

| Item | Quantity | Unit Price | Total |
|------|----------|------------|-------|
| Mac Mini M4 Pro 64GB | 3 | €2,500 | €7,500 |
| 10Gb Network Switch | 1 | €500 | €500 |
| UPS | 1 | €400 | €400 |
| **Total** | | | **€8,400** |

**Operational (Monthly):**

| Item | Cost |
|------|------|
| Electricity (~150W × 3 × 24/7) | €30 |
| Colocation (if applicable) | €100-200 |
| Maintenance buffer | €50 |
| **Total** | **€180-280/month** |

---

## Conclusion

The combination of:
- **ROB API** for orchestration and observability
- **DDC/Rafts** for secure, distributed context storage
- **Local LLMs on Mac Mini** for privacy-preserving inference
- **CEF AI Ansible** for reproducible deployment

Creates a powerful, cost-effective, and secure foundation for deploying RAG/CAG-powered AI agents that can transform Cere's documentation from fragmented technical pages into an intelligent, queryable knowledge system.

The architecture supports:
1. **Granular permissions** - Agents access only authorized context
2. **Full observability** - Every query tracked through ROB/Loki
3. **Horizontal scaling** - Add Mac Minis for more capacity
4. **Data sovereignty** - All inference happens on-premise

---

**Document Version:** 1.0  
**Date:** February 6, 2026  
**Author:** Claudemart (AI Assistant)  
**Review Status:** Draft - Pending Mart Review
