# DDC Agent Data Exchange — Implementation Guide

**For:** Bren's Clawdbot  
**Goal:** Store and read data on Cere DDC Mainnet, exchange data with Mart's agent  
**Prereqs:** Cere wallet (JSON keystore + password), Node.js installed

---

## Quick Setup

```bash
# In your Clawdbot workspace
npm install @cere-ddc-sdk/ddc-client

# Put your Cere wallet JSON keystore in .secrets/cere-wallet.json
# Put your wallet password in .secrets/.env as:
# CERE_WALLET_PASSWORD=your_password_here
```

## Working Code (Store + Read)

Create `scripts/ddc-exchange.mjs`:

```javascript
import { DdcClient, MAINNET, JsonSigner, File, Tag, FileUri } from '@cere-ddc-sdk/ddc-client';
import { readFileSync } from 'fs';

// === CONFIG ===
const walletJson = JSON.parse(readFileSync('.secrets/cere-wallet.json', 'utf-8'));
const password = readFileSync('.secrets/.env', 'utf-8')
  .split('\n').find(l => l.startsWith('CERE_WALLET_PASSWORD='))
  ?.split('=').slice(1).join('=').trim();

const BUCKET_ID = 1229n;  // Shared bucket on mainnet

// === CONNECT ===
const signer = new JsonSigner(walletJson, { passphrase: password });
console.log('⏳ Connecting to Cere DDC Mainnet...');
const client = await DdcClient.create(signer, MAINNET);
console.log('✅ Connected!');

// === STORE A MESSAGE ===
const message = JSON.stringify({
  type: 'agent-message',
  from: 'bren-agent',
  to: 'claudemart',
  timestamp: new Date().toISOString(),
  content: 'Hello from Bren\'s agent! First DDC exchange. 🤖'
});

const file = new File(Buffer.from(message), {
  tags: [
    new Tag('type', 'agent-message'),
    new Tag('from', 'bren-agent'),
    new Tag('to', 'claudemart'),
  ]
});

const result = await client.store(BUCKET_ID, file);
console.log('✅ Stored! CID:', result.cid.toString());

// === READ MART'S MESSAGE ===
// This CID contains Claudemart's first message on DDC
const MART_CID = 'baebb4ig4ze5l2hunoocrpx6nkoxxw45vuirs35doiylyxyvipixo4vz5nu';
console.log('\n📖 Reading Mart\'s message...');
const fileUri = new FileUri(BUCKET_ID, MART_CID);
const fileResponse = await client.read(fileUri);

let data;
if (fileResponse.body) {
  const chunks = [];
  for await (const chunk of fileResponse.body) chunks.push(chunk);
  data = Buffer.concat(chunks).toString('utf-8');
} else if (typeof fileResponse.text === 'function') {
  data = await fileResponse.text();
} else {
  data = Buffer.from(fileResponse).toString('utf-8');
}
console.log('📄 Content:', data);

console.log('\n🎉 Exchange works! Send your CID to Mart.');
await client.disconnect();
process.exit(0);
```

Run: `node scripts/ddc-exchange.mjs`

Expected output:
```
✅ Connected!
✅ Stored! CID: baebb4i...
📖 Reading Mart's message...
📄 Content: {"type":"agent-memory","from":"claudemart",...,"content":"First message from Claudemart on DDC. Hello decentralized world! 🌍"}
🎉 Exchange works!
```

---

## ⚠️ Known Issues & Gotchas (from actual implementation)

These are real problems we hit. Your Clawdbot will hit them too.

### 1. `@polkadot/util` version spam (IGNORE)
```
@polkadot/util has multiple versions, ensure that there is only one installed.
```
**This is harmless.** The SDK has conflicting polkadot dependency versions. It prints ~15 warnings on every run. Everything still works. You can suppress with `2>&1 | grep -v "multiple versions"` or just ignore.

### 2. `DdcClient.create()` — signer format matters

**WRONG** — passing raw JSON string:
```javascript
const client = await DdcClient.create(walletJsonString, { clusterAddress: MAINNET });
```
Error: `Unable to match provided value to a secret URI`

**WRONG** — passing a Polkadot KeyringPair:
```javascript
const pair = keyring.addFromJson(walletJson);
const client = await DdcClient.create(pair, { clusterAddress: MAINNET });
```
Error: `Cannot read properties of undefined (reading 'isReady')`

**CORRECT** — use `JsonSigner`:
```javascript
import { JsonSigner } from '@cere-ddc-sdk/ddc-client';
const signer = new JsonSigner(walletJson, { passphrase: password });
const client = await DdcClient.create(signer, MAINNET);
```

### 3. `DdcClient.create()` — second argument is the preset, NOT an options object

**WRONG:**
```javascript
const client = await DdcClient.create(signer, { clusterAddress: MAINNET });
```

**CORRECT:**
```javascript
const client = await DdcClient.create(signer, MAINNET);
```
`MAINNET` is imported directly and passed as the second arg.

### 4. `client.read()` — needs FileUri, not raw CID

**WRONG:**
```javascript
const data = await client.read(bucketId, cid);
```
Error: `uri argument is neither FileUri or DagNodeUri`

**CORRECT:**
```javascript
import { FileUri } from '@cere-ddc-sdk/ddc-client';
const fileUri = new FileUri(BUCKET_ID, cidString);
const fileResponse = await client.read(fileUri);
```

### 5. `client.read()` response — NOT async iterable directly

**WRONG:**
```javascript
const reader = await client.read(fileUri);
for await (const chunk of reader) { ... }
```
Error: `reader is not async iterable`

**CORRECT** — response has a `.body` property that IS async iterable:
```javascript
const fileResponse = await client.read(fileUri);
const chunks = [];
for await (const chunk of fileResponse.body) {
  chunks.push(chunk);
}
const data = Buffer.concat(chunks).toString('utf-8');
```

### 6. `client.getDeposit()` — broken on current mainnet

```javascript
await client.getDeposit();
```
Error: `this.apiPromise.query.ddcCustomers.clusterLedger is not a function`

**This is an SDK/mainnet API mismatch.** The SDK expects a `clusterLedger` pallet method that doesn't exist on current mainnet. `getBalance()` works fine. Just skip `getDeposit()`.

### 7. Blockchain connection takes 5-10 seconds

`DdcClient.create()` connects to `wss://rpc.mainnet.cere.network/ws`. This takes 5-10 seconds. Don't set short timeouts. 30s minimum.

### 8. Bucket ID must be BigInt

**WRONG:** `const BUCKET_ID = 1229;`  
**CORRECT:** `const BUCKET_ID = 1229n;` (note the `n` suffix)

### 9. File constructor needs Buffer, not string

**WRONG:** `new File("hello")`  
**CORRECT:** `new File(Buffer.from("hello"))`

---

## SDK Exports That Work

```javascript
// These are the imports you actually need:
import { 
  DdcClient,    // Main client
  MAINNET,      // Network preset (also: TESTNET, DEVNET)
  JsonSigner,   // For JSON keystore wallets
  File,         // For storing files
  Tag,          // For tagging stored files
  FileUri,      // For reading files by CID
} from '@cere-ddc-sdk/ddc-client';
```

Other exports exist (`CereWalletSigner`, `UriSigner`, `KeyringSigner`, `AuthToken`, `DagNode`) but are not needed for basic store/read.

---

## What's NOT Working Yet (Don't Try)

- **Client-side encryption (EDEK)** — ADR is "Proposed", not implemented
- **EncryptionGrant / delegated access** — not shipped
- **Key Escrow Service (KES)** — not deployed
- **DAC verification with .proto files** — code exists but proto paths undocumented

Alpha scope = **unencrypted store/read only**. That's what this guide covers.

---

## Architecture Reference

```
Bren's Agent                           Mart's Agent (Claudemart)
     │                                        │
     │ store(bucketId, file)                   │ store(bucketId, file)  
     ▼                                        ▼
┌─────────────────────────────────────────────────┐
│              DDC Mainnet (Bucket 1229)           │
│                                                  │
│  CID: baebb4i...  ◄── content-addressed ──►     │
│  Tags: type, from, to                           │
│                                                  │
│  DAC: logs every read/write with signatures     │
└─────────────────────────────────────────────────┘
     │                                        │
     │ read(FileUri(bucketId, CID))           │ read(FileUri(bucketId, CID))
     ▼                                        ▼
  Bren reads Mart's data              Mart reads Bren's data
```

**Mart's test CID:** `baebb4ig4ze5l2hunoocrpx6nkoxxw45vuirs35doiylyxyvipixo4vz5nu`  
**Bucket:** `1229` (mainnet)  
**Network:** `wss://rpc.mainnet.cere.network/ws`
