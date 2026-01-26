# Clawdbot × CEF Integration PRD

**Document Status:** Draft  
**Last Updated:** 2026-01-25  
**Authors:** Mart (Martijn Broersma)  
**Stakeholders:** Fred Jin (CEO), Sergey Poluyan (Tech Lead)

---

## Executive Summary

Integrate Clawdbot (open source AI assistant) with CEF infrastructure to create the first consumer-facing demonstration of CEF's "Context Memory" capabilities. Users get a private AI assistant that stores their data encrypted on DDC, while CEF gets a real product showcasing their tech stack.

**Tagline:** *"Your AI That Never Forgets — And Never Shares"*

---

## 1. Problem Statement

### CEF's Problem
- **Context Memory has no demo** — The vision exists but no consumer product demonstrates it
- **EDEK (Encrypted Data Access) has no showcase** — ADR completed but no real-world usage
- **Need token utility** — Storage and compute should burn CERE tokens
- **Need developer adoption** — SDK needs real integrations beyond internal projects

### User Problem
- ChatGPT/Claude don't remember across sessions (without paid plans)
- When they do remember, users don't own or control that data
- No cross-device sync for AI assistant context
- Can't selectively share AI memory with sub-agents

---

## 2. Proposed Solution

### Product Vision
A Clawdbot deployment mode where:
1. All memory files (MEMORY.md, daily logs, workspace) sync to user's personal DDC bucket
2. Data is encrypted client-side before upload (user holds keys)
3. Cross-device sync via DDC polling
4. Sub-agents receive scoped key access via EDEK

### Why This Works

| CEF Capability | Clawdbot Integration |
|----------------|---------------------|
| DDC Storage | Memory persistence layer |
| EDEK (Key Delegation) | Sub-agent scoped access |
| Agent Runtime (V8) | Future: Clawdbot agents in CEF infra |
| DAC (Metering) | Track storage/compute usage → CERE burns |
| Context Memory vision | First real implementation |

---

## 3. Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLAWDBOT CLIENT                             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  MEMORY.md   │  │  daily/*.md  │  │  workspace/* │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│           │                │                │                      │
│           └────────────────┼────────────────┘                      │
│                            ▼                                       │
│              ┌─────────────────────────┐                          │
│              │   CEF Storage Adapter   │                          │
│              │   (Clawdbot Plugin)     │                          │
│              │                         │                          │
│              │  • Encrypt with DEK     │                          │
│              │  • Manage sync state    │                          │
│              │  • Handle conflicts     │                          │
│              └─────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS (encrypted payload)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CEF DDC CLUSTER                             │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    User's Bucket                               │ │
│  │                                                                │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │ │
│  │  │ memory.enc  │  │ daily.enc   │  │ config.enc  │           │ │
│  │  │ (AES-256)   │  │ (AES-256)   │  │ (AES-256)   │           │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘           │ │
│  │                                                                │ │
│  │  Metadata: { version, lastSync, deviceId, checksum }          │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  DAC: Track puts/gets → billing → CERE utility                    │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ EDEK Key Delegation
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CEF AGENT RUNTIME (V8)                         │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Sub-Agent Isolate                         │   │
│  │                                                              │   │
│  │  • Receives scoped DEK via EncryptionGrant                  │   │
│  │  • Can only decrypt delegated files                         │   │
│  │  • context.encryption.decrypt(ciphertext, scopedDEK)        │   │
│  │  • Metered: CPU, RAM, duration                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Phases

### Phase 1: DDC Storage Adapter (3 weeks)
**Goal:** Clawdbot memory syncs to DDC

**Deliverables:**
- [ ] Clawdbot plugin: `@clawdbot/storage-cef`
- [ ] Encryption layer (AES-256-GCM)
- [ ] DDC SDK integration
- [ ] Sync state management
- [ ] Conflict resolution (last-write-wins + manual merge)

**Technical Details:**
```typescript
// Plugin interface
interface CEFStorageAdapter {
  // Initialize with user's DDC credentials
  init(config: {
    bucketId: string;
    privateKey: string;
    clusterUrl: string;
  }): Promise<void>;

  // Encrypt and upload
  saveFile(path: string, content: Buffer): Promise<CID>;

  // Download and decrypt
  loadFile(path: string): Promise<Buffer>;

  // Sync all workspace files
  syncWorkspace(localPath: string): Promise<SyncResult>;

  // Get sync status
  getStatus(): SyncStatus;
}
```

**Dependencies:**
- `@cere-ddc-sdk/ddc-client` — DDC operations
- `@cere-ddc-sdk/content-addressable-storage` — CID handling
- Node.js crypto (AES-256-GCM)

### Phase 2: Cross-Device Sync (2 weeks)
**Goal:** Same Clawdbot memory on all devices

**Deliverables:**
- [ ] Device registration system
- [ ] Polling-based sync (configurable interval)
- [ ] Sync conflict UI (Telegram inline buttons)
- [ ] Offline queue (sync when back online)

**Sync Protocol:**
```
1. Device A writes memory change
2. A uploads encrypted + version metadata to DDC
3. Device B polls DDC (every 30s default)
4. B sees newer version → downloads + decrypts
5. If conflict (both wrote): prompt user or auto-merge
```

### Phase 3: Sub-Agent Key Delegation (4 weeks)
**Goal:** Spawn sub-agents with scoped data access

**Deliverables:**
- [ ] EDEK integration for key wrapping
- [ ] Scoped grants (file-level, folder-level)
- [ ] Grant lifecycle management (create, revoke, expire)
- [ ] Sub-agent spawning with grants

**EDEK Flow:**
```typescript
// Main Clawdbot creates grant for sub-agent
const grant = await createEncryptionGrant({
  recipientPubKey: subAgentPubKey,
  scope: ['memory/calendar.md', 'memory/contacts.md'],
  expiresAt: Date.now() + 3600_000, // 1 hour
  canDelegate: false,
});

// Sub-agent receives grant and can decrypt only scoped files
const calendar = await context.encryption.decrypt(
  encryptedCalendar,
  grant
);
```

### Phase 4: CEF Agent Runtime (6 weeks) — Future
**Goal:** Run Clawdbot agents natively in CEF infrastructure

**Deliverables:**
- [ ] Clawdbot agent compiled for V8 isolate
- [ ] Context API integration (storage, models, logging)
- [ ] One-click deployment via ROB
- [ ] Usage metering and billing

---

## 5. Technical References

### CEF Documentation (Notion)

| Component | Wiki | Description |
|-----------|------|-------------|
| Agent Runtime | [Agent Runtime Wiki (A9)](https://notion.so/276d8000-83d6-8043-aa86-cebbe8d34ad9) | V8 isolate execution environment |
| ROB (Orchestration) | [ROB Wiki (A2)](https://notion.so/1c6d8000-83d6-80b0-b8ef-d23e5efb1852) | Workflow orchestration, agent invocation |
| Inference Runtime | [Inference Runtime Wiki (A8)](https://notion.so/276d8000-83d6-80dd-8619-e65dd616026e) | NVIDIA Triton + model serving |
| DDC Core | [DDC Core Wiki](https://notion.so/1792e3b4-b89e-4138-bbd8-2d67a9eb44e5) | Storage layer architecture |
| Encrypted Data Access | [ADR: EDEK](https://notion.so/2f0d8000-83d6-804b-a77f-e09e9d0beb2f) | Key delegation for AI agents |
| Router | [ADR: Router](https://notion.so/2d2d8000-83d6-8023-9a75-d949edd92492) | Unified routing for DDC layers |
| Type-1 Inspection | [ADR: Type-1](https://notion.so/2f0d8000-83d6-806a-9eaf-f58fd656a26a) | ActivityRecord validation |
| Type-2 Inspection | [ADR: Type-2](https://notion.so/2f1d8000-83d6-801a-80db-f0b065679a66) | TCA Tree validation |

### GitHub Repositories

| Repo | URL | Purpose |
|------|-----|---------|
| DDC SDK (JS) | https://github.com/Cerebellum-Network/cere-ddc-sdk-js | Client SDK for DDC |
| Blockchain Node | https://github.com/Cerebellum-Network/blockchain-node | Cere L1 blockchain |
| Cluster Apps | https://github.com/Cerebellum-Network/cluster-apps | DDC node applications |
| ROB Backend | https://github.com/cere-io/rob-api | Orchestration backend |
| ROB Frontend | https://github.com/cere-io/dynamic-indexer-client | Orchestration UI |
| Clawdbot | https://github.com/clawdbot/clawdbot | AI assistant (our side) |

### Clawdbot Documentation

| Resource | URL |
|----------|-----|
| Docs | https://docs.clawd.bot |
| Source | https://github.com/clawdbot/clawdbot |
| Skills Hub | https://clawdhub.com |

---

## 6. Security Considerations

### Encryption
- **Algorithm:** AES-256-GCM (authenticated encryption)
- **Key derivation:** HKDF-SHA256 for sub-agent keys
- **Key exchange:** X25519 ECDH for grant wrapping

### Key Management
- User's master key never leaves device
- DEK (Data Encryption Key) generated per-bucket
- Sub-agents receive wrapped DEK with scope limits
- Keys can be rotated without re-uploading data (re-wrap DEK)

### Threat Model
| Threat | Mitigation |
|--------|------------|
| DDC node reads data | Client-side encryption; nodes see only ciphertext |
| Key theft | Keys stored in OS keychain; optional hardware key |
| Malicious sub-agent | Scoped grants limit access; expiration enforced |
| MITM | TLS for all network calls; content addressed (CID) |

---

## 7. Success Metrics

### Phase 1 Success
- [ ] 100 users syncing memory to DDC
- [ ] <500ms average sync latency
- [ ] Zero data loss incidents
- [ ] DDC SDK integration documented

### Phase 2 Success
- [ ] Cross-device sync working for 50 users
- [ ] <5s sync propagation time
- [ ] Conflict resolution tested

### Phase 3 Success
- [ ] Sub-agents successfully accessing scoped data
- [ ] Key delegation working end-to-end
- [ ] Grant revocation tested

### Overall Success
- [ ] Featured in CEF marketing materials
- [ ] Developer blog post published
- [ ] Community adoption (GitHub stars, Discord discussion)
- [ ] Measurable CERE token utility from storage/compute

---

## 8. Open Questions

1. **Billing model:** How do we handle DDC costs for free Clawdbot users?
   - Option A: CEF sponsors initial bucket (marketing budget)
   - Option B: User brings own CERE tokens
   - Option C: Freemium (limited storage free, pay for more)

2. **Sync frequency:** What's the right polling interval?
   - Too frequent = DDC load + battery drain
   - Too slow = stale data across devices

3. **Agent Runtime priority:** Should Phase 4 be higher priority?
   - Running Clawdbot in CEF infra is bigger showcase
   - But requires more eng effort

4. **Branding:** "Clawdbot powered by CEF" or co-branded?

---

## 9. Timeline

```
Week 1-3:   Phase 1 (DDC Storage Adapter)
Week 4-5:   Phase 2 (Cross-Device Sync)
Week 6-9:   Phase 3 (Sub-Agent Key Delegation)
Week 10+:   Phase 4 (CEF Agent Runtime) — if approved

Total MVP (Phase 1-2): 5 weeks
Full Integration (Phase 1-3): 9 weeks
```

---

## 10. Next Steps

1. **Mart → Sergey:** DM to align on EDEK integration details
2. **Mart → Fred:** Short pitch (see Appendix A)
3. **Mart → Engineering:** Identify owner for Phase 1
4. **Create Notion execution page** for tracking

---

## Appendix A: Elevator Pitch for Fred

> "We have a chance to ship the first real demo of Context Memory. Clawdbot is an open source AI assistant that's trending right now. We integrate their memory system with DDC — users get a private AI that stores their data encrypted, we get a consumer product that showcases DDC + EDEK + token utility.
>
> Phase 1 ships in 3 weeks. Zero new hiring. Sergey's EDEK work plugs in directly.
>
> The pitch writes itself: 'Your AI that never forgets — and never shares.'"

---

## Appendix B: Competitive Positioning

| Feature | ChatGPT | Claude | Clawdbot + CEF |
|---------|---------|--------|----------------|
| Memory | Limited (paid) | Limited | ✅ Unlimited |
| Data ownership | OpenAI owns | Anthropic owns | ✅ User owns |
| Cross-device | Yes (cloud) | Yes (cloud) | ✅ Yes (DDC) |
| Encryption | Server-side | Server-side | ✅ Client-side E2E |
| Open source | ❌ | ❌ | ✅ |
| Self-hostable | ❌ | ❌ | ✅ |
| Sub-agent delegation | ❌ | ❌ | ✅ (EDEK) |

---

*Document created by Claudemart for Mart — 2026-01-25*
