# Cere DDC SDK & Documentation — Changes Needed for Production Apps

**Report date:** 2026-02-03  
**Based on:** Proofi Wallet integration (`@cere-ddc-sdk/ddc-client@2.16.1`)  
**Repo:** `Cerebellum-Network/cere-ddc-sdk-js`  
**Docs:** `Cerebellum-Network/docs.cere.network`

---

## Executive Summary

During Proofi Wallet development — a fully decentralized credential wallet using Cere DDC for storage and CNS for indexing — we encountered **critical bugs, documentation gaps, and missing features** that block or severely hinder production-grade applications. This report catalogs every issue with recommended fixes.

---

## 1. SDK Bugs Encountered

### 1.1 RPC WebSocket Endpoint Instability (CRITICAL)

**What happened:** The MAINNET preset in the SDK uses `wss://rpc.mainnet.cere.network/ws`, which **consistently fails** with WebSocket 1006 Abnormal Closure errors. This makes the DdcClient initialization unreliable in production.

**Reproduction:**
```typescript
import { DdcClient, MAINNET, JsonSigner } from '@cere-ddc-sdk/ddc-client';
const client = await DdcClient.create(signer, MAINNET);
// → WebSocket 1006 errors, connection timeouts, state_getMetadata failures
```

**Root cause:** The standard RPC node (`rpc.mainnet.cere.network`) is frequently unresponsive. The archive node (`archive.mainnet.cere.network`) is more stable but is not listed as a fallback.

**Workaround applied in Proofi:**
```typescript
// packages/ui/src/lib/cere.ts — manual fallback chain
const CERE_RPC_ENDPOINTS = [
  'wss://archive.mainnet.cere.network/ws',  // Primary (more stable)
  'wss://rpc.mainnet.cere.network/ws',       // Fallback
];
// + 12 second timeout + retry logic
```

**Recommended fix:**
1. **SDK should include fallback endpoints** in MAINNET/TESTNET presets
2. **Add connection timeout** (currently none — hangs indefinitely)
3. **Add automatic reconnection** with exponential backoff
4. Consider making `archive.mainnet.cere.network` the primary MAINNET endpoint

**SDK preset (current, from `@cere-ddc-sdk/ddc` v2.16.1):**
```javascript
const MAINNET = {
  blockchain: 'wss://rpc.mainnet.cere.network/ws'
};
```

**SDK preset (proposed):**
```javascript
const MAINNET = {
  blockchain: [
    'wss://archive.mainnet.cere.network/ws',
    'wss://rpc.mainnet.cere.network/ws',
  ],
  connectionTimeout: 15000,
  retryAttempts: 3,
};
```

### 1.2 Missing `/ws` Suffix Not Documented (HIGH)

**What happened:** The SDK preset correctly includes `/ws` in the RPC URL, but **nowhere in the documentation** is the `/ws` suffix mentioned as required. Developers using the raw polkadot.js API or custom configurations omit it, causing silent connection failures.

**The issue:** `wss://rpc.mainnet.cere.network` (no `/ws`) → fails silently. `wss://rpc.mainnet.cere.network/ws` → works. This is not standard for Substrate chains and must be documented.

**Affected docs:**
- Developer guide quickstart (mentions `wss://rpc.mainnet.cere.network/ws` in config example but doesn't call out the `/ws` requirement)
- No mention in troubleshooting section

**Recommended fix:** Add explicit callout in all documentation that mentions RPC endpoints:
> ⚠️ All Cere RPC WebSocket endpoints require the `/ws` suffix. Using `wss://rpc.mainnet.cere.network` without `/ws` will fail silently.

### 1.3 DdcClient Has No Connection Timeout (HIGH)

**What happened:** `DdcClient.create()` can hang indefinitely when the RPC node is unresponsive. No timeout parameter exists.

**Impact in Proofi:** Users on Vercel deployment saw infinite loading spinners. We had to wrap every connection in a manual `Promise.race()` with timeout:

```typescript
const timeoutPromise = new Promise<never>((_, reject) => 
  setTimeout(() => reject(new Error('Timeout')), 12000)
);
api = await Promise.race([
  ApiPromise.create({ provider }),
  timeoutPromise
]);
```

**Recommended fix:** Add `timeout` option to `DdcClient.create()`:
```typescript
const client = await DdcClient.create(signer, { 
  ...MAINNET, 
  connectionTimeout: 15000 
});
```

### 1.4 `store()` with `name` Option Types Are Wrong (MEDIUM)

**What happened:** The `store()` method accepts a `name` option for CNS (Content Name System) registration, but the TypeScript types don't include it in `FileStoreOptions`. Required casting to `any`:

```typescript
// Proofi had to cast to any:
const result = await ddcClient.store(BUCKET_ID, file, { name: indexName } as any);
```

**Recommended fix:** Add `name?: string` to `FileStoreOptions` type definition.

### 1.5 Tag Value Length Limit Undocumented (MEDIUM)

**What happened:** DDC tags have a maximum value length of 32 characters. This is enforced silently — values over 32 chars cause storage failures with unhelpful error messages.

**Workaround in Proofi:**
```typescript
function truncateTag(value: string, maxLen = 32): string {
  if (value.length <= maxLen) return value;
  if (value.length > 40) {
    const half = Math.floor((maxLen - 2) / 2);
    return value.slice(0, half) + '..' + value.slice(-half);
  }
  return value.slice(0, maxLen);
}
```

**Recommended fix:**
1. Document the 32-char tag value limit in the `Tag` class docs
2. Have the SDK truncate automatically or throw a descriptive error
3. Consider increasing the limit or supporting longer tag values

### 1.6 FileResponse Body Stream Typing Issues (LOW)

**What happened:** Reading file content requires iterating over `fileResponse.body` chunks, but the type system doesn't properly expose this. We had to cast to `any`:

```typescript
const fileResponse = await ddcClient.read(fileUri);
const chunks: Buffer[] = [];
for await (const chunk of (fileResponse as any).body) chunks.push(chunk as Buffer);
```

**The docs show `fileResponse.text()` and `fileResponse.arrayBuffer()`** but in practice, the stream-based API is what works in Node.js server environments.

**Recommended fix:** Improve FileResponse types and add Node.js server-side examples (not just browser).

---

## 2. CDN Gateway Documentation Issues

### 2.1 Three Different CDN URLs, Zero Central Documentation (CRITICAL)

There are **at least three different CDN gateway URLs** mentioned across various Cere properties, and none of them are documented in one place:

| URL | Where mentioned | Network |
|-----|----------------|---------|
| `https://cdn.testnet.cere.network/{bucket}/{cid}` | Official quickstart docs | Testnet |
| `https://cdn.dragon.cere.network/{bucket}/{cid}` | Stream video guide (developer.cere.network) | Mainnet (Dragon 1) |
| `https://cdn.ddc-dragon.com/{bucket}/{cid}` | Used in Proofi (discovered empirically) | Mainnet |
| `https://storage.testnet.cere.network/{bucket}/{cid}` | SDK README example | Testnet |

**Problems:**
- The SDK README says `https://storage.testnet.cere.network/` (file-storage gateway)
- The quickstart docs say `https://cdn.testnet.cere.network/` (CDN gateway)
- The streaming guide says `https://cdn.dragon.cere.network/` (mainnet CDN)
- Proofi uses `https://cdn.ddc-dragon.com/` (another mainnet CDN — works but undocumented)
- **No official mainnet CDN URL is documented in the SDK or primary developer docs**
- The `MAINNET` preset in the SDK contains **only the blockchain RPC URL**, no CDN/storage URL

**Recommended fix:**
1. Add CDN gateway URLs to the MAINNET/TESTNET presets:
```javascript
const MAINNET = {
  blockchain: 'wss://rpc.mainnet.cere.network/ws',
  cdn: 'https://cdn.dragon.cere.network',     // or whatever is canonical
  storage: 'https://storage.mainnet.cere.network',
};
```
2. Create a single "Network Endpoints" reference page listing ALL URLs
3. Deprecate or redirect any non-canonical domains
4. Add a `DdcClient.getCdnUrl(bucketId, cid)` helper method

### 2.2 No Programmatic Way to Get CDN URL From SDK (HIGH)

After storing a file, the SDK returns a `FileUri` with a CID, but there's no method to generate the CDN URL. Every developer has to hardcode it:

```typescript
const result = await ddcClient.store(BUCKET_ID, file);
// How do I get the CDN URL? SDK doesn't help.
const cdnUrl = `https://cdn.ddc-dragon.com/${BUCKET_ID}/${result.cid}`; // Guesswork
```

**Recommended fix:** Add `DdcClient.getCdnUrl()` or `FileUri.toCdnUrl()`.

---

## 3. RPC Endpoint Issues

### 3.1 Endpoint Inventory (Discovery Required)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `wss://rpc.mainnet.cere.network/ws` | **Unreliable** | SDK default. Frequent 1006 closures. `state_getMetadata` timeouts. |
| `wss://archive.mainnet.cere.network/ws` | **Stable** | Works consistently. Used by polkadot.js apps. Better for production. |
| `wss://rpc.testnet.cere.network/ws` | Unknown | SDK testnet default |
| `wss://archive.testnet.cere.network/ws` | Unknown | Used in streaming guide config |
| `wss://archive.devnet.cere.network/ws` | Unknown | SDK devnet default |

### 3.2 No RPC Health/Status Page (HIGH)

There is no public status page showing RPC node health. Developers have no way to know if `rpc.mainnet.cere.network` is down vs. their code being broken.

**Recommended fix:** 
- Publish a status page (e.g., status.cere.network)
- Add health check endpoints to RPC nodes
- Document expected uptime guarantees

### 3.3 Archive vs Standard Node — When to Use Which? (MEDIUM)

The docs never explain the difference between `rpc.mainnet` and `archive.mainnet`. For most SDK operations (including DDC), the archive node works better. But this is nowhere documented.

**Recommended fix:** Add a section to docs explaining:
- Archive nodes retain full chain history
- Standard RPC nodes may prune old state
- For DDC operations, archive nodes are recommended
- For light reads (balance checks), either works

---

## 4. CNS (Content Name System) Eventual Consistency Issues

### 4.1 CNS Updates Are NOT Immediately Consistent (CRITICAL)

**What happened:** When storing a file with a CNS name and then immediately reading it back via `resolveName()`, the old CID is returned. This caused **data loss** in Proofi's decentralized index system.

**Scenario:**
1. Store index v1 with CNS name `pi-abcdef1234567890` → CID_1
2. Immediately read index to add item → `resolveName()` returns CID_1 ✅
3. Store index v2 with same CNS name → CID_2
4. Immediately read index → `resolveName()` returns CID_1 ❌ (stale!)
5. Store index v3 based on stale read → **item from step 3 is lost**

**This is a fundamental consistency issue** for any application that uses CNS as a mutable pointer (which is its documented purpose).

**Workaround in Proofi:**
```typescript
// In-memory cache + write locks to prevent concurrent modifications
const indexCache = new Map<string, WalletIndex>();
const indexLocks = new Map<string, Promise<void>>();

async function withIndexLock(walletAddress: string, fn: () => Promise<void>): Promise<void> {
  const existing = indexLocks.get(walletAddress);
  if (existing) await existing;
  // ... lock/unlock pattern
}
```

**Recommended fix:**
1. **Document the eventual consistency behavior** prominently in CNS docs
2. Add a `consistency` option to `resolveName()`:
   ```typescript
   const cid = await ddcClient.resolveName(bucketId, name, { 
     consistency: 'strong' // Wait for propagation
   });
   ```
3. Consider returning the new CID from `store()` when a name option is provided, so the caller doesn't need to resolve
4. Add a `waitForName()` utility that polls until the name resolves to the expected CID

### 4.2 CNS Name Length Limit Undocumented (MEDIUM)

CNS names appear to have a maximum length (discovered empirically — ~32 characters). This is not documented.

**Workaround in Proofi:**
```typescript
function getIndexName(walletAddress: string): string {
  const hash = walletAddress.slice(-16); // Last 16 chars
  return `pi-${hash}`; // 19 chars total, under limit
}
```

**Recommended fix:** Document CNS name constraints (max length, allowed characters, etc.)

### 4.3 `resolveName()` Error Handling Is Poor (MEDIUM)

When a CNS name doesn't exist, the behavior varies:
- Sometimes returns `null`/`undefined`
- Sometimes throws with unhelpful `"no result"` error message
- No typed error code (the SDK source has a TODO about this)

**From SDK source:**
```javascript
// TODO: replace error.message === 'no result' with 
// error.code === GrpcStatus[GrpcStatus.NOT_FOUND] 
// when the status is fixed on storage node side
```

**Recommended fix:**
1. Fix the storage node to return proper gRPC NOT_FOUND status
2. Have the SDK throw a typed `CnsNameNotFoundError`
3. Or return `null` consistently (not sometimes null, sometimes throw)

---

## 5. Missing Features Needed for Production Apps

### 5.1 No Built-in Retry/Reconnection Logic (CRITICAL)

The DdcClient has no automatic retry or reconnection. If the RPC connection drops (which happens frequently on mainnet), the client becomes useless. Every production app needs to build its own retry logic.

**Recommended:** Built-in configurable retry with exponential backoff.

### 5.2 No Connection Health Monitoring (HIGH)

No way to check if the DdcClient is still connected, subscribe to connection state changes, or get notified of disconnections.

**Recommended API:**
```typescript
client.on('connected', () => { ... });
client.on('disconnected', () => { ... });
client.on('reconnecting', (attempt) => { ... });
client.isConnected // boolean
```

### 5.3 No Batch Operations (HIGH)

Storing multiple files or updating an index requires sequential calls. For Proofi's index system (store file + update index = 2 sequential DDC writes per operation), this doubles latency.

**Recommended:** `client.storeBatch(bucketId, files[])` that stores multiple files in a single round-trip.

### 5.4 No Query/Search by Tags (HIGH)

Tags can be attached to stored files, but there's **no API to query files by tag**. The SDK only supports reading by CID. This makes tags almost useless for discovery.

**Impact on Proofi:** We built an entire index system on CNS because we can't query by tags. If we could query `type:proofi-index AND wallet:5ABC...`, we wouldn't need CNS at all.

**Recommended:** Add a `search()` or `query()` method:
```typescript
const results = await client.search(bucketId, {
  tags: { type: 'proofi-index', wallet: '5ABC...' },
  limit: 10,
});
```

### 5.5 No Pagination for Bucket Listing (MEDIUM)

`getBucketList()` returns all buckets with no pagination. Fine for testing, dangerous for production accounts with many buckets.

### 5.6 No File Metadata (Size, Content Type, Created Date) (MEDIUM)

When reading a file from DDC, there's no metadata about the file (size, mime type, creation date). The developer has to encode all metadata into the file content or tags.

**Recommended:** Store and return basic metadata with each file.

### 5.7 No `disconnect()` / `close()` Method (MEDIUM)

The DdcClient has no way to cleanly disconnect. In server environments (like Proofi's Hono API), this causes dangling WebSocket connections.

**Recommended:** Add `client.disconnect()` that closes the blockchain connection.

### 5.8 No Delete/Overwrite Capability (LOW)

Once stored, content cannot be deleted or updated. Only CNS pointers can be changed (via re-storing with the same name). For GDPR compliance or user-requested deletion, this is a blocker.

**Recommended:** At minimum, document this limitation clearly. Ideally, add bucket-owner deletion capability.

---

## 6. Recommended API Changes

### 6.1 DdcClient.create() Configuration

**Current:**
```typescript
const client = await DdcClient.create(signer, MAINNET);
```

**Proposed:**
```typescript
const client = await DdcClient.create(signer, {
  ...MAINNET,
  connectionTimeout: 15000,
  retryAttempts: 3,
  retryDelay: 1000,
  autoReconnect: true,
  logLevel: 'warn',
});
```

### 6.2 Store with Name Should Return Updated URI

**Current:**
```typescript
const uri = await client.store(bucketId, file, { name: 'my-index' });
// uri.cid is the content CID — but does the CNS name point to it yet? Unknown.
```

**Proposed:**
```typescript
const uri = await client.store(bucketId, file, { name: 'my-index' });
// uri.cid — content CID
// uri.name — 'my-index'
// uri.nameConfirmed — boolean, whether CNS update propagated
```

### 6.3 Add CDN URL Generation

```typescript
const cdnUrl = client.getCdnUrl(bucketId, cid);
// or
const cdnUrl = uri.toCdnUrl();
```

### 6.4 Add Connection Events

```typescript
client.on('error', (err) => { ... });
client.on('reconnect', () => { ... });
client.on('close', () => { ... });
```

### 6.5 Typed Errors

Replace generic `Error` throws with typed errors:
- `CnsNameNotFoundError`
- `ConnectionTimeoutError`
- `InsufficientBalanceError`
- `BucketNotFoundError`
- `StorageQuotaExceededError`

---

## 7. Documentation Gaps

### 7.1 Missing Pages / Sections

| Gap | Priority | Details |
|-----|----------|---------|
| **Network Endpoints Reference** | CRITICAL | One page listing ALL RPC, CDN, storage, and faucet URLs for mainnet/testnet/devnet |
| **CNS (Content Name System) Guide** | CRITICAL | How CNS works, consistency model, name constraints, use cases, pitfalls |
| **Production Deployment Guide** | HIGH | RPC failover, connection handling, error recovery, monitoring |
| **Server-Side (Node.js) Examples** | HIGH | All examples are browser-focused. No server/backend examples |
| **Error Reference** | HIGH | What errors can be thrown, what they mean, how to handle them |
| **Tag System Documentation** | MEDIUM | Value length limits, allowed characters, querying (or lack thereof) |
| **Migration Guide (version upgrades)** | MEDIUM | How to upgrade between SDK versions |
| **Billing/Deposit Model** | MEDIUM | How DDC deposits work, how to estimate costs, what happens when deposit runs out |
| **Activity Report System** | LOW | The SDK exports ActivityRequest/ActivityAcknowledgment but docs are empty |

### 7.2 Incorrect / Outdated Information

| Item | Where | Issue |
|------|-------|-------|
| CDN URL `storage.testnet.cere.network` | SDK README | Should be `cdn.testnet.cere.network` |
| No mainnet CDN URL anywhere | SDK README, docs | Only testnet URLs documented |
| Default preset is TESTNET | SDK source | Not mentioned in docs — dangerous if devs don't pass config |
| `DdcClient.create()` default config | API docs | Says "Defaults to TESTNET" but this is buried |
| `FileStoreOptions` missing `name` | TypeScript types | `name` option exists at runtime but not in types |
| `resolveName` error behavior | API docs | Says returns CID but sometimes throws, sometimes returns null |

### 7.3 Missing Troubleshooting Guide

A troubleshooting page should cover:
- WebSocket 1006 errors → use `/ws` suffix, try archive node
- `state_getMetadata` timeout → RPC node may be down, use fallback
- CNS name not resolving → eventual consistency, wait and retry
- Tag value too long → 32 char limit
- Infinite hang on `DdcClient.create()` → no built-in timeout, wrap in Promise.race
- `Insufficient balance` → need DDC deposit, not just CERE balance
- Browser vs Node.js differences → FileResponse API differs

### 7.4 Developer Console vs SDK Disconnect

The Developer Console (developer.console.cere.network) creates buckets and wallets, but:
- The console uses **Cere Wallet** (embed wallet) while the SDK uses **JsonSigner/KeyringSigner/UriSigner**
- No docs explain how to export from Cere Wallet to a format the SDK accepts
- The Proofi approach (JsonSigner with wallet JSON + passphrase) is not documented as a pattern

---

## 8. Proofi-Specific Integration Notes

### What Proofi Uses from the SDK

| Feature | SDK Component | Status |
|---------|--------------|--------|
| File storage | `DdcClient.store()` | ✅ Works |
| File reading | `DdcClient.read()` | ✅ Works |
| CNS names (mutable pointers) | `store({ name })` + `resolveName()` | ⚠️ Eventual consistency issues |
| JsonSigner (wallet JSON auth) | `JsonSigner` | ✅ Works |
| Tags | `Tag` class | ⚠️ 32-char limit undocumented |
| MAINNET preset | `MAINNET` config | ❌ RPC node unreliable |
| CDN URLs | N/A — hardcoded | ❌ Not in SDK |

### What Proofi Had to Build Itself

1. **RPC fallback chain** with timeout (should be in SDK)
2. **In-memory index cache** to work around CNS eventual consistency
3. **Write locks** to prevent concurrent index modifications
4. **Tag truncation** function for the 32-char limit
5. **CDN URL construction** (hardcoded `cdn.ddc-dragon.com`)
6. **Connection timeout** wrapper around DdcClient.create()
7. **Manual FileResponse body parsing** (stream typing issues)

### SDK Version Used

```json
"@cere-ddc-sdk/ddc-client": "^2.16.1"
```

---

## 9. Priority Matrix

| # | Issue | Severity | Effort | Impact |
|---|-------|----------|--------|--------|
| 1 | RPC endpoint instability + no fallback | 🔴 Critical | Medium | Every mainnet app affected |
| 2 | CNS eventual consistency undocumented | 🔴 Critical | Low (docs) | Data loss in write-heavy apps |
| 3 | No CDN URL documentation for mainnet | 🔴 Critical | Low (docs) | Every mainnet app needs this |
| 4 | No connection timeout | 🟠 High | Low | Infinite hangs in production |
| 5 | No query-by-tags API | 🟠 High | High | Forces complex index workarounds |
| 6 | No retry/reconnection | 🟠 High | Medium | Every production app needs this |
| 7 | Missing `/ws` suffix docs | 🟠 High | Low (docs) | Silent failures for new devs |
| 8 | `store({ name })` types wrong | 🟡 Medium | Low | TypeScript DX broken |
| 9 | Tag limit undocumented | 🟡 Medium | Low (docs) | Cryptic errors at runtime |
| 10 | No disconnect/close method | 🟡 Medium | Low | Resource leaks in servers |
| 11 | FileResponse typing issues | 🟡 Medium | Low | Bad DX for Node.js usage |
| 12 | resolveName error handling | 🟡 Medium | Medium | Inconsistent behavior |
| 13 | No server-side examples | 🟡 Medium | Medium (docs) | All examples browser-only |
| 14 | No delete capability docs | 🟢 Low | Low (docs) | GDPR/compliance concern |

---

## 10. Recommended Next Steps

1. **Immediate (this week):** File issues on `cere-ddc-sdk-js` for items #1, #2, #3, #4, #7
2. **Short-term (2 weeks):** PR for connection timeout, fallback endpoints, typed errors
3. **Medium-term (1 month):** CNS consistency improvements, CDN URL helper, retry logic
4. **Long-term:** Tag query API, batch operations, Activity SDK documentation

---

*Report generated from Proofi Wallet codebase analysis at `~/clawd/proofi-wallet/` and Cere DDC SDK v2.16.1.*
