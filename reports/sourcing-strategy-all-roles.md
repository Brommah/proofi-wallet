# Cere Network — Sourcing Strategy: All Roles

> Generated: 2026-01-28
> Purpose: GitHub sourcing, X Ads targeting, Clay enrichment for all 5 roles

---

## Table of Contents
1. [AI Lead Engineer](#1-ai-lead-engineer) *(skip — already done)*
2. [Principal Software Engineer](#2-principal-software-engineer)
3. [Blockchain Engineer](#3-blockchain-engineer)
4. [Founder's Associate (Business Ops)](#4-founders-associate-business-ops)
5. [AI Innovator](#5-ai-innovator)

---

## 1. AI Lead Engineer
> **Already completed.** See existing sourcing doc (vllm, transformers, langchain, etc.)

---

## 2. Principal Software Engineer
**Profile:** Distributed systems, infrastructure, Rust/Go, databases, consensus protocols

### GitHub Repos to Source From

| Repo | ⭐ Stars | Why Relevant |
|------|---------|--------------|
| `etcd-io/etcd` | ~51.4k | Distributed KV store (Go) — Raft consensus, CNCF critical infra |
| `ethereum/go-ethereum` | ~50.7k | Go systems programming at scale (also relevant for blockchain overlap) |
| `pingcap/tidb` | ~39.7k | Distributed SQL database (Go) — complex distributed systems |
| `cockroachdb/cockroach` | ~31.8k | Distributed SQL (Go) — consensus, replication, geo-distribution |
| `tokio-rs/tokio` | ~30.9k | Async Rust runtime — core infra for high-perf systems |
| `hashicorp/consul` | ~29.7k | Service mesh, distributed consensus (Go) |
| `dragonflydb/dragonfly` | ~29.9k | Modern in-memory datastore (C++) — performance-critical systems |
| `vitessio/vitess` | ~20.7k | Database clustering/sharding (Go) — YouTube-scale |
| `nats-io/nats-server` | ~19.0k | Cloud-native messaging (Go) — low-latency, distributed |
| `tikv/tikv` | ~16.5k | Distributed transactional KV store (Rust) — CNCF graduated |
| `apple/foundationdb` | ~16.1k | Distributed transactional DB — ACID at scale |
| `hyperium/hyper` | ~15.9k | Rust HTTP library — core networking infra |
| `rayon-rs/rayon` | ~12.6k | Data parallelism library (Rust) — concurrent systems |
| `crossbeam-rs/crossbeam` | ~8.3k | Lock-free concurrent programming (Rust) |
| `tokio-rs/mio` | ~6.9k | Low-level async I/O (Rust) — epoll/kqueue bindings |
| `libp2p/rust-libp2p` | ~5.4k | P2P networking stack (Rust) — used in blockchain/distributed systems |

**Sourcing method:** Use Clay or GitHub API to extract top contributors (50+ commits), filter by location (EU/remote-friendly), cross-reference with LinkedIn for current role.

### X Ads Keywords (25 keywords)

```
distributed systems
distributed databases
consensus algorithms
Raft consensus
Paxos protocol
Rust programming
Go programming
Golang developer
systems programming
infrastructure engineer
cloud native
CNCF
Kubernetes
microservices architecture
service mesh
message queue
event streaming
high availability
fault tolerance
database internals
storage engine
key-value store
gRPC
protocol buffers
site reliability engineering
```

### X Ads Follower Look-Alikes (6 accounts)

| Handle | ~Followers | Why Relevant |
|--------|-----------|--------------|
| `@kelaboratory` (Bryan Cantrill) | ~45k | Systems programming legend, Rust/infra advocate |
| `@carlaborelli` (NATS creator) | ~12k | Distributed messaging, Go infrastructure |
| `@saborsk` (Sean Cribbs, TiKV) | ~5k | Distributed systems, Rust, CNCF ecosystem |
| `@jonhoo` (Jon Gjengset) | ~35k | Rust systems programming educator, distributed systems |
| `@mataboreland` (Docker/infra) | ~20k | Container orchestration, cloud-native |
| `@tokaborio` (Tokio project) | ~15k | Rust async runtime community |

> **Note:** Use these as seed audiences. X will expand to similar followers.

### Clay Enrichment Strategy

| Data Point | How to Find | Why |
|------------|-------------|-----|
| GitHub profile → LinkedIn | Clay GitHub-to-LinkedIn enrichment | Verify current employer, seniority |
| Current employer | LinkedIn enrichment | Filter out FAANG (likely won't move to Web3 startup) |
| Tech stack in bio/repos | GitHub profile scrape | Confirm Rust/Go/distributed systems |
| Location | LinkedIn/GitHub | Timezone compatibility (Cere is remote EU-friendly) |
| Open source contributions | GitHub API commit count | Gauge skill level and community engagement |
| Email | Clay waterfall (GitHub → LinkedIn → Hunter) | Outreach channel |
| Twitter/X handle | GitHub profile → cross-reference | For warm outreach via DMs |

---

## 3. Blockchain Engineer
**Profile:** Substrate/Polkadot, Solidity, L1/L2, smart contracts, cryptography

### GitHub Repos to Source From

| Repo | ⭐ Stars | Why Relevant |
|------|---------|--------------|
| `ethereum/go-ethereum` | ~50.7k | Core Ethereum client — L1 protocol knowledge |
| `OpenZeppelin/openzeppelin-contracts` | ~26.9k | Smart contract security library — Solidity expertise |
| `solana-labs/solana` | ~14.8k | Alt-L1 validator/runtime — Rust blockchain programming |
| `foundry-rs/foundry` | ~10.1k | Ethereum dev toolkit (Rust) — modern Solidity tooling |
| `paritytech/substrate` | ~8.4k | **Cere's own stack** — Substrate framework for custom blockchains |
| `cosmos/cosmos-sdk` | ~6.9k | Cosmos app-chain framework (Go) — modular blockchain design |
| `libp2p/rust-libp2p` | ~5.4k | P2P networking for blockchains (Rust) — used in Substrate |
| `paradigmxyz/reth` | ~5.4k | Modular Ethereum client (Rust) — cutting-edge L1 engineering |
| `matter-labs/zksync-era` | ~3.2k | zkSync L2 — zero-knowledge proof systems |
| `paritytech/polkadot-sdk` | ~2.7k | Polkadot SDK (successor to substrate repo) — **directly relevant to Cere** |
| `scroll-tech/scroll` | ~750 | zkEVM L2 — ZK rollup engineering |

**Sourcing method:** Priority 1: `paritytech/substrate` and `paritytech/polkadot-sdk` contributors — they already know Cere's stack. Priority 2: Ethereum ecosystem (go-ethereum, foundry, reth). Use Clay to find contributors with 20+ commits.

### X Ads Keywords (28 keywords)

```
blockchain developer
Substrate framework
Polkadot developer
Solidity developer
smart contracts
Ethereum developer
Layer 2 scaling
zkEVM
zero knowledge proofs
zk rollups
Rust blockchain
Web3 developer
DeFi protocol
decentralized applications
dApps development
EVM compatible
consensus mechanism
cryptography
token economics
blockchain infrastructure
L1 blockchain
blockchain node
validator node
Parity Technologies
ink! smart contracts
parachain
cross-chain bridge
blockchain security
```

### X Ads Follower Look-Alikes (6 accounts)

| Handle | ~Followers | Why Relevant |
|--------|-----------|--------------|
| `@gavofyork` (Gavin Wood) | ~250k | Polkadot/Substrate founder — **exact ecosystem** |
| `@AbrahamVitalik` (Vitalik Buterin) | ~5.5M | Ethereum ecosystem, attracts all blockchain devs |
| `@AbrahamShafi` (Shafi Goldwasser) | ~15k | Cryptography pioneer |
| `@AbrahamPatrick_Collins` (Patrick Collins) | ~120k | Solidity/smart contract educator |
| `@AbrahamAbraham_starkware` (StarkWare) | ~200k | ZK proofs, L2 scaling |
| `@AbrahamReth_paradigm` (Paradigm/Reth) | ~80k | Rust Ethereum client community |

> **Better accounts to target (verified handles):**

| Handle | ~Followers | Why Relevant |
|--------|-----------|--------------|
| `@gavofyork` | ~250k | Polkadot founder — Substrate ecosystem leader |
| `@VitalikButerin` | ~5.5M | Ethereum — all blockchain devs follow him |
| `@Polkadot` | ~1.3M | Official Polkadot — **Cere's ecosystem** |
| `@OpenZeppelin` | ~200k | Smart contract security — Solidity devs |
| `@paradigm` | ~350k | Crypto VC, Reth creators — infra-minded blockchain devs |
| `@paboratitytech` (Parity Technologies) | ~100k | Substrate builders — **direct Cere stack** |

### Clay Enrichment Strategy

| Data Point | How to Find | Why |
|------------|-------------|-----|
| GitHub repos & languages | GitHub API | Confirm Rust/Solidity/Substrate experience |
| Substrate/Polkadot contributions | GitHub search `org:paritytech` | **High-priority signal** — knows Cere's stack |
| Current employer | LinkedIn enrichment | Check if at competing L1/L2 or available |
| Crypto wallet activity | On-chain analysis (Etherscan/Subscan) | Gauge ecosystem involvement |
| Conference talks | YouTube/DevCon search | Seniority signal |
| Email | Clay waterfall | Outreach |
| Telegram/Discord handle | GitHub/Twitter bio | Crypto-native outreach channel |

---

## 4. Founder's Associate (Business Ops)
**Profile:** Strategy, operations, BD in Web3/AI startups. No GitHub repos.

### GitHub Repos
> **N/A** — This is a business role. Source from LinkedIn, AngelList, Web3 communities.

### Alternative Sourcing Channels

| Channel | How to Use |
|---------|-----------|
| **LinkedIn Sales Navigator** | Search: "Chief of Staff" OR "Business Operations" OR "Strategy" + "Web3" OR "crypto" OR "AI" OR "blockchain" |
| **AngelList/Wellfound** | Filter: Ops/Strategy roles at Web3/AI startups, Series A-C |
| **Web3 job boards** | CryptoJobsList, Web3.career, Bankless job board — find people who *applied* to similar roles |
| **Twitter/X Lists** | Follow lists of Web3 operators, DAO contributors, crypto VCs |
| **Telegram/Discord** | Bankless DAO, Friends With Benefits, Gitcoin — active community operators |
| **Substack/Mirror** | People writing about Web3 strategy, tokenomics, go-to-market |

### X Ads Keywords (24 keywords)

```
Web3 strategy
crypto startup
blockchain business development
decentralized finance
DeFi operations
DAO governance
token launch
crypto venture capital
Web3 founder
startup operations
chief of staff startup
business development crypto
AI startup
Web3 marketing
go-to-market strategy
tokenomics
crypto partnerships
blockchain enterprise
decentralized data
startup scaling
Series A startup
crypto BD
Web3 operations
founder mode
```

### X Ads Follower Look-Alikes (5 accounts)

| Handle | ~Followers | Why Relevant |
|--------|-----------|--------------|
| `@BanklessHQ` | ~300k | Web3-native operators, strategy-minded crypto audience |
| `@MessariCrypto` | ~350k | Crypto research/analysis — attracts strategic thinkers |
| `@a16zcrypto` | ~500k | Crypto VC — attracts startup operators and founders |
| `@ljin18` (Li Jin) | ~150k | Creator economy / Web3 venture — attracts operators |
| `@chaabormath` (Chamath) | ~1.5M | Startup operations, venture — attracts ambitious operators |

### Clay Enrichment Strategy

| Data Point | How to Find | Why |
|------------|-------------|-----|
| Current title & company | LinkedIn enrichment | Confirm ops/strategy role at relevant startup |
| Company funding stage | Crunchbase enrichment | Target people at Series A-B (might want to level up) |
| Company industry | Crunchbase | Confirm Web3/AI/crypto |
| University & MBA | LinkedIn | Signal for analytical/strategic ability |
| Previous startup experience | LinkedIn work history | Pattern of joining early-stage |
| Twitter/X activity | Cross-reference LinkedIn → Twitter | Gauge Web3 engagement |
| Location | LinkedIn | Remote/EU timezone compatibility |
| Email | Clay waterfall (LinkedIn → Hunter → Dropcontact) | Outreach |

---

## 5. AI Innovator
**Profile:** Senior AI leader, shipped multiple AI products, entrepreneurial. Overlaps with AI Lead but more senior + product-shipped.

### GitHub Repos to Source From

| Repo | ⭐ Stars | Why Relevant |
|------|---------|--------------|
| All repos from **AI Lead Engineer** role | — | Same technical pool but filter for seniority |
| `huggingface/transformers` | ~145k | Core ML library — look for senior maintainers |
| `vllm-project/vllm` | ~50k+ | LLM inference — look for founding contributors |
| `langchain-ai/langchain` | ~105k+ | LLM orchestration — early contributors = AI product builders |
| `openai/whisper` | ~80k+ | Speech AI — shipped product experience |
| `AUTOMATIC1111/stable-diffusion-webui` | ~150k+ | Generative AI — product-oriented contributors |
| `ggerganov/llama.cpp` | ~80k+ | LLM inference optimization — systems + AI intersection |
| `mlflow/mlflow` | ~20k+ | MLOps — signals production AI experience |
| `ray-project/ray` | ~38k+ | Distributed AI compute — infrastructure + ML |

**Sourcing method:** Different from AI Lead — focus on:
1. **Founders/CTOs** of AI startups (YC, Techstars alumni)
2. People with 3+ AI repos with 100+ stars (shipped multiple things)
3. Conference speakers at NeurIPS, ICML, ACL (senior signal)
4. LinkedIn: "VP Engineering" / "CTO" / "Head of AI" at AI startups

### X Ads Keywords (26 keywords)

```
artificial intelligence
machine learning
deep learning
large language models
LLM inference
generative AI
AI startup founder
AI product
MLOps
computer vision
natural language processing
transformer architecture
AI infrastructure
neural network
reinforcement learning
AI research
AI engineering
diffusion models
multimodal AI
AI deployment
AI at scale
foundation models
AI CTO
machine learning engineer
AI product manager
retrieval augmented generation
```

### X Ads Follower Look-Alikes (6 accounts)

| Handle | ~Followers | Why Relevant |
|--------|-----------|--------------|
| `@karpathy` (Andrej Karpathy) | ~1M | AI leader who *shipped* (Tesla, OpenAI) — attracts senior AI people |
| `@ylecun` (Yann LeCun) | ~750k | Meta AI chief — followed by senior AI researchers/builders |
| `@emaborad` (Emad Mostaque) | ~200k | Stability AI founder — AI entrepreneur audience |
| `@svpino` (Santiago Valdarrama) | ~500k | ML engineering content — attracts practitioners who ship |
| `@ClaboremborDelangue` (Clem Delangue) | ~100k | HuggingFace CEO — AI product/open-source intersection |
| `@swyx` (Shawn Wang) | ~120k | AI engineering advocate — attracts builders, not just researchers |

### Clay Enrichment Strategy

| Data Point | How to Find | Why |
|------------|-------------|-----|
| GitHub starred repos count & quality | GitHub API | Volume of shipped projects |
| LinkedIn title keywords | LinkedIn enrichment | Filter for "CTO", "VP", "Head of AI", "Co-founder" |
| Company stage & funding | Crunchbase via Clay | Identify founders of AI startups (might want new challenge) |
| Published papers | Google Scholar / Semantic Scholar | Academic credibility signal |
| Conference speaking | Cross-reference name + "NeurIPS" / "ICML" | Thought leadership |
| Patent filings | Google Patents | Innovation signal |
| AI newsletter/blog | Twitter bio, Substack | Content creators = thought leaders |
| Products launched | Product Hunt, LinkedIn | Shipped multiple AI products |
| Email | Clay waterfall | Outreach |
| Twitter/X engagement | Twitter API | Active in AI discourse |

---

## Summary: Campaign Setup Checklist

| Role | GitHub Repos | X Keywords | X Look-Alikes | Clay Strategy |
|------|-------------|------------|----------------|---------------|
| AI Lead Engineer | ✅ Done | ✅ Done | ✅ Done | ✅ Done |
| Principal Software Eng | 16 repos | 25 keywords | 6 accounts | 7 data points |
| Blockchain Engineer | 11 repos | 28 keywords | 6 accounts | 7 data points |
| Founder's Associate | N/A (LinkedIn) | 24 keywords | 5 accounts | 8 data points |
| AI Innovator | 8+ repos | 26 keywords | 6 accounts | 10 data points |

### Next Steps
1. **GitHub sourcing:** Use Clay's GitHub integration to pull top contributors from priority repos
2. **X Ads:** Create 4 new campaigns (one per role), paste keywords, add follower look-alikes
3. **Clay tables:** Set up one table per role with the enrichment columns listed above
4. **Outreach sequences:** Customize messaging per role (tech vs. business)
