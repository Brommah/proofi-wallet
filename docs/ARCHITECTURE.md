# Proofi Architecture

> Technical architecture overview of the Proofi self-custodial data wallet platform.

---

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PROOFI ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────────────────────┐  │
│   │   Chrome    │     │   Proofi    │     │      AI Agents              │  │
│   │  Extension  │     │   Web App   │     │   (Third-party)             │  │
│   └──────┬──────┘     └──────┬──────┘     └──────────────┬──────────────┘  │
│          │                   │                           │                 │
│          └─────────┬─────────┴───────────────────────────┘                 │
│                    │                                                        │
│                    ▼                                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                         Proofi API                                  │  │
│   │                      (Railway/Node.js)                              │  │
│   └──────────────────────────────┬──────────────────────────────────────┘  │
│                    ┌─────────────┼─────────────┐                           │
│                    ▼             ▼             ▼                           │
│   ┌──────────────────┐ ┌──────────────┐ ┌──────────────────────────────┐  │
│   │   PostgreSQL     │ │    Redis     │ │      Cere Network DDC        │  │
│   │   (Metadata)     │ │   (Cache)    │ │    (Encrypted Data)          │  │
│   └──────────────────┘ └──────────────┘ └──────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Components

### 1. Chrome Extension (Client)

**Location:** `/extension/`

**Purpose:** Self-custodial wallet for key management and data signing.

**Key Features:**
- Seed phrase generation (12 words, BIP39)
- Local key storage (encrypted)
- Transaction signing
- Web page integration via content scripts

**Technology:**
- Manifest V3
- Service Worker (background.js)
- Content Scripts for proofi.ai integration
- @polkadot/keyring for Cere-compatible keys

**Data Flow:**
```
User Action → Extension Popup → Sign with Private Key → Send to API
```

**Security Model:**
- Private keys NEVER leave the extension
- User must approve every signature
- Password protection for wallet access

---

### 2. Web Application (Frontend)

**Location:** `/proofi/`

**Purpose:** User interface for data management and earning dashboard.

**Key Pages:**
| Path | Purpose |
|------|---------|
| `/` | Landing page (marketing) |
| `/earn.html` | Earning dashboard |
| `/verify.html` | Data verification |
| `/portal.html` | User portal |
| `/ecosystem.html` | App ecosystem |

**Technology:**
- Static HTML/CSS/JavaScript
- Deployed on Vercel
- Progressive Web App (PWA) support
- Tailwind CSS styling

**Integration Points:**
- Communicates with extension via `window.postMessage`
- Calls Proofi API for data operations
- Displays user's encrypted data and earnings

---

### 3. Proofi API (Backend)

**Location:** Deployed on Railway

**Purpose:** Handle business logic, store metadata, orchestrate DDC operations.

**Endpoints:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/wallet/create` | POST | Register new wallet |
| `/data/upload` | POST | Store encrypted data |
| `/data/query` | POST | Agent data requests |
| `/earnings` | GET | User earnings info |

**Technology:**
- Node.js runtime
- Express.js (or similar)
- PostgreSQL for metadata
- Redis for caching/sessions

**Security:**
- JWT authentication
- Rate limiting
- Input validation
- CORS whitelist

---

### 4. Cere Network DDC (Storage)

**Purpose:** Decentralized storage for user's encrypted personal data.

**Why Cere DDC:**
- Decentralized (no single point of failure)
- Content-addressed (immutable references)
- Optimized for AI/data workloads
- CERE token integration

**Data Structure:**
```javascript
{
  bucketId: "proofi-user-data",
  cid: "baf...",  // Content identifier
  metadata: {
    owner: "5Gx...",  // User's public key
    category: "preferences",
    encrypted: true,
    createdAt: 1707350400
  }
}
```

**Encryption Flow:**
```
User Data → Encrypt (User's Key) → Upload to DDC → Store CID in PostgreSQL
```

---

### 5. SDK (proofi-sdk.js)

**Location:** `/proofi/proofi-sdk.js`

**Purpose:** JavaScript SDK for AI agents to integrate with Proofi.

**Usage:**
```javascript
import { ProofiSDK } from 'proofi-sdk';

const proofi = new ProofiSDK({
  apiKey: 'agent_xxx',
  environment: 'production'
});

// Request user data
const preferences = await proofi.query({
  userId: 'user_xxx',
  categories: ['food_preferences', 'allergies'],
  purpose: 'restaurant_recommendation'
});

// Pay for data access
await proofi.pay({
  queryId: preferences.queryId,
  amount: 0.05  // CERE
});
```

**Features:**
- Simple query interface
- Automatic payment handling
- User consent verification
- Rate limiting support

---

## 🔐 Data Flow

### User Uploads Data

```
┌──────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│ Extension │────▶│  API     │────▶│   DDC    │
│  Input   │     │ Encrypt   │     │ Store    │     │  Store   │
│          │     │ + Sign    │     │ Metadata │     │  Data    │
└──────────┘     └───────────┘     └──────────┘     └──────────┘

1. User enters data in web app
2. Extension encrypts with user's key
3. Extension signs the encrypted blob
4. API receives and validates signature
5. API uploads to DDC, stores CID in PostgreSQL
```

### Agent Queries Data

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌───────────┐
│  Agent   │────▶│   API    │────▶│   DDC    │────▶│ Extension │
│  Query   │     │  Check   │     │  Fetch   │     │  Decrypt  │
│          │     │  Access  │     │  Data    │     │  + Return │
└──────────┘     └──────────┘     └──────────┘     └───────────┘

1. Agent requests data category from API
2. API checks user's consent settings
3. API fetches encrypted data from DDC
4. User's extension decrypts (if online)
   OR: Pre-authorized decrypt key used
5. Decrypted data returned to agent
6. Payment processed (CERE tokens)
```

---

## 💾 Database Schema

### PostgreSQL Tables

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  public_key VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Data references (not the actual data)
CREATE TABLE data_refs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  category VARCHAR(50) NOT NULL,
  cid VARCHAR(100) NOT NULL,  -- DDC content ID
  encrypted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agent access permissions
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  agent_id UUID NOT NULL,
  category VARCHAR(50) NOT NULL,
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Query log (for earnings)
CREATE TABLE queries (
  id UUID PRIMARY KEY,
  agent_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  category VARCHAR(50) NOT NULL,
  amount_cere DECIMAL(18,8),
  queried_at TIMESTAMP DEFAULT NOW()
);

-- Earnings (aggregated)
CREATE TABLE earnings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_cere DECIMAL(18,8),
  query_count INT
);
```

---

## 🔑 Authentication & Authorization

### User Authentication

```
┌─────────────────────────────────────────────────────────────┐
│                   AUTH FLOW                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Extension generates challenge                            │
│  2. User signs challenge with private key                    │
│  3. Signature sent to API                                    │
│  4. API verifies signature matches public key                │
│  5. API issues JWT token                                     │
│  6. JWT used for subsequent requests                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Agent Authentication

```javascript
// Agents use API keys
const agent = await Agent.authenticate({
  apiKey: 'agent_xxx_secret'
});

// API key has associated permissions:
{
  agentId: 'agent_xxx',
  name: 'FoodBot',
  categories: ['food_preferences', 'allergies'],
  rateLimit: 1000,  // queries per hour
  status: 'verified'
}
```

---

## 🌐 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Vercel (Frontend)                                             │
│   ├── proofi.ai (apex)                                          │
│   ├── www.proofi.ai (redirect)                                  │
│   └── CDN + Edge caching                                        │
│                                                                  │
│   Railway (Backend)                                              │
│   ├── proofi-api (Node.js)                                      │
│   ├── PostgreSQL (managed)                                       │
│   └── Redis (managed)                                            │
│                                                                  │
│   Cere Network (Storage)                                         │
│   ├── DDC Cluster (decentralized)                               │
│   └── Multiple node redundancy                                   │
│                                                                  │
│   Chrome Web Store (Extension)                                   │
│   └── proofi-wallet extension                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Performance Considerations

### Caching Strategy

| Layer | What | TTL |
|-------|------|-----|
| CDN (Vercel) | Static assets | 1 year |
| Redis | User sessions | 24 hours |
| Redis | Query results | 5 minutes |
| Browser | Extension data | Until updated |

### Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/data/upload` | 10 | 1 minute |
| `/data/query` | 100 | 1 minute |
| `/earnings` | 60 | 1 minute |

### Database Indexes

```sql
CREATE INDEX idx_data_refs_user ON data_refs(user_id);
CREATE INDEX idx_data_refs_category ON data_refs(category);
CREATE INDEX idx_queries_user ON queries(user_id, queried_at);
CREATE INDEX idx_queries_agent ON queries(agent_id, queried_at);
```

---

## 🔮 Future Architecture

### Phase 2: Smart Contracts

```
User → Extension → Sign Tx → Cere Blockchain
                              ├── Payment Contract
                              ├── Consent Registry
                              └── Earnings Distribution
```

### Phase 3: Zero-Knowledge Proofs

```
Agent Query: "Is user over 21?"
Response: ZK Proof (yes/no) without revealing birthday
```

### Phase 4: Cross-Chain

```
Earnings → Bridge → Ethereum/Polygon → DeFi integrations
```

---

## 📚 Related Documentation

- [DEPLOY.md](../runbooks/DEPLOY.md) - Deployment procedures
- [SECURITY.md](../runbooks/SECURITY.md) - Security practices
- [TOKENOMICS.md](./TOKENOMICS.md) - Token economics
- [MONITORING.md](../runbooks/MONITORING.md) - Observability

---

*Last Updated: February 2025*
