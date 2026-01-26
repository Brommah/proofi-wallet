# Clawdbot × CEF Technical Specification

**Version:** 0.1.0  
**Last Updated:** 2026-01-25  
**Status:** Draft

---

## 1. System Overview

This document specifies the technical implementation of Clawdbot's integration with CEF (Cere Edge Framework) infrastructure, specifically:

1. **DDC Storage Adapter** — Encrypted memory persistence on Decentralized Data Clusters
2. **Cross-Device Sync** — Real-time synchronization across user's devices
3. **EDEK Integration** — Key delegation for sub-agent data access

---

## 2. Component Architecture

### 2.1 Plugin Structure

```
@clawdbot/storage-cef/
├── src/
│   ├── index.ts              # Plugin entry point
│   ├── adapter.ts            # CEFStorageAdapter class
│   ├── encryption.ts         # Crypto operations
│   ├── sync.ts               # Sync state machine
│   ├── grants.ts             # EDEK grant management
│   └── types.ts              # TypeScript interfaces
├── test/
│   ├── adapter.test.ts
│   ├── encryption.test.ts
│   └── sync.test.ts
├── package.json
└── README.md
```

### 2.2 Dependencies

```json
{
  "dependencies": {
    "@cere-ddc-sdk/ddc-client": "^2.x",
    "@cere-ddc-sdk/content-addressable-storage": "^2.x",
    "@noble/ciphers": "^0.5.0",
    "@noble/hashes": "^1.3.0",
    "@noble/curves": "^1.3.0"
  },
  "peerDependencies": {
    "clawdbot": "^2026.x"
  }
}
```

---

## 3. DDC Storage Adapter

### 3.1 Interface Definition

```typescript
// types.ts

export interface CEFStorageConfig {
  /** DDC cluster URL */
  clusterUrl: string;
  
  /** User's bucket ID */
  bucketId: bigint;
  
  /** User's private key (Ed25519) for signing */
  privateKey: Uint8Array;
  
  /** Encryption key (AES-256) for data */
  encryptionKey?: Uint8Array;
  
  /** Sync interval in milliseconds (default: 30000) */
  syncIntervalMs?: number;
  
  /** Device identifier for conflict resolution */
  deviceId?: string;
}

export interface SyncStatus {
  lastSyncAt: number;
  pendingUploads: number;
  pendingDownloads: number;
  conflicts: ConflictInfo[];
  isOnline: boolean;
}

export interface ConflictInfo {
  path: string;
  localVersion: number;
  remoteVersion: number;
  localModifiedAt: number;
  remoteModifiedAt: number;
}

export interface FileMetadata {
  version: number;
  modifiedAt: number;
  deviceId: string;
  checksum: string;
  size: number;
}

export type ConflictResolution = 'local' | 'remote' | 'manual';
```

### 3.2 Adapter Implementation

```typescript
// adapter.ts

import { DdcClient, File, Piece } from '@cere-ddc-sdk/ddc-client';
import { encrypt, decrypt, generateKey } from './encryption';
import { SyncStateMachine } from './sync';
import type { CEFStorageConfig, SyncStatus, FileMetadata } from './types';

export class CEFStorageAdapter {
  private client: DdcClient;
  private config: CEFStorageConfig;
  private syncState: SyncStateMachine;
  private encryptionKey: Uint8Array;
  
  constructor(config: CEFStorageConfig) {
    this.config = config;
    this.encryptionKey = config.encryptionKey || generateKey();
  }
  
  async init(): Promise<void> {
    // Initialize DDC client
    this.client = await DdcClient.create(this.config.privateKey, {
      clusterAddress: this.config.clusterUrl,
    });
    
    // Initialize sync state machine
    this.syncState = new SyncStateMachine({
      client: this.client,
      bucketId: this.config.bucketId,
      deviceId: this.config.deviceId || this.generateDeviceId(),
      syncIntervalMs: this.config.syncIntervalMs || 30_000,
    });
    
    // Start background sync
    this.syncState.start();
  }
  
  /**
   * Save a file to DDC (encrypted)
   */
  async saveFile(path: string, content: Buffer): Promise<string> {
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt content
    const encrypted = await encrypt(content, this.encryptionKey, iv);
    
    // Create metadata
    const metadata: FileMetadata = {
      version: await this.getNextVersion(path),
      modifiedAt: Date.now(),
      deviceId: this.config.deviceId!,
      checksum: await this.computeChecksum(content),
      size: content.length,
    };
    
    // Package as DDC File
    const file = new File(
      Buffer.concat([iv, encrypted]),
      { 
        path,
        metadata: JSON.stringify(metadata),
      }
    );
    
    // Upload to DDC
    const cid = await this.client.store(this.config.bucketId, file);
    
    // Update sync state
    this.syncState.recordUpload(path, cid.toString(), metadata);
    
    return cid.toString();
  }
  
  /**
   * Load a file from DDC (decrypted)
   */
  async loadFile(path: string): Promise<Buffer> {
    // Get latest CID for path
    const cid = await this.syncState.getLatestCid(path);
    if (!cid) {
      throw new Error(`File not found: ${path}`);
    }
    
    // Download from DDC
    const file = await this.client.read(cid);
    const data = await file.arrayBuffer();
    const bytes = new Uint8Array(data);
    
    // Extract IV (first 12 bytes)
    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);
    
    // Decrypt
    const plaintext = await decrypt(ciphertext, this.encryptionKey, iv);
    
    return Buffer.from(plaintext);
  }
  
  /**
   * Sync entire workspace directory
   */
  async syncWorkspace(localPath: string): Promise<SyncResult> {
    return this.syncState.syncDirectory(localPath);
  }
  
  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return this.syncState.getStatus();
  }
  
  /**
   * Resolve a sync conflict
   */
  async resolveConflict(
    path: string, 
    resolution: ConflictResolution
  ): Promise<void> {
    return this.syncState.resolveConflict(path, resolution);
  }
  
  /**
   * Stop sync and cleanup
   */
  async dispose(): Promise<void> {
    this.syncState.stop();
    await this.client.disconnect();
  }
  
  private generateDeviceId(): string {
    return `device_${crypto.randomUUID().slice(0, 8)}`;
  }
  
  private async getNextVersion(path: string): Promise<number> {
    const current = await this.syncState.getCurrentVersion(path);
    return current + 1;
  }
  
  private async computeChecksum(data: Buffer): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Buffer.from(hash).toString('hex').slice(0, 16);
  }
}
```

### 3.3 Encryption Module

```typescript
// encryption.ts

import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from '@noble/ciphers/webcrypto';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { x25519 } from '@noble/curves/ed25519';

/**
 * Generate a random 256-bit encryption key
 */
export function generateKey(): Uint8Array {
  return randomBytes(32);
}

/**
 * Encrypt data with AES-256-GCM
 */
export async function encrypt(
  plaintext: Uint8Array | Buffer,
  key: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  const cipher = gcm(key, iv);
  return cipher.encrypt(new Uint8Array(plaintext));
}

/**
 * Decrypt data with AES-256-GCM
 */
export async function decrypt(
  ciphertext: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  const cipher = gcm(key, iv);
  return cipher.decrypt(ciphertext);
}

/**
 * Derive a scoped key for sub-agent using HKDF
 * 
 * This implements the EDEK key derivation pattern from:
 * https://notion.so/2f0d8000-83d6-804b-a77f-e09e9d0beb2f
 */
export function deriveSubAgentKey(
  masterKey: Uint8Array,
  agentId: string,
  scope: string[]
): Uint8Array {
  const info = `clawdbot:agent:${agentId}:${scope.join(',')}`;
  return hkdf(sha256, masterKey, undefined, info, 32);
}

/**
 * Wrap a DEK for a recipient using X25519 ECDH
 */
export async function wrapKey(
  dek: Uint8Array,
  recipientPubKey: Uint8Array
): Promise<{ ephemeralPubKey: Uint8Array; wrappedKey: Uint8Array }> {
  // Generate ephemeral keypair
  const ephemeralPrivate = randomBytes(32);
  const ephemeralPubKey = x25519.getPublicKey(ephemeralPrivate);
  
  // ECDH shared secret
  const sharedSecret = x25519.getSharedSecret(ephemeralPrivate, recipientPubKey);
  
  // Derive wrapping key
  const wrapKey = hkdf(sha256, sharedSecret, undefined, 'clawdbot:wrap', 32);
  
  // Wrap the DEK
  const iv = randomBytes(12);
  const cipher = gcm(wrapKey, iv);
  const wrapped = cipher.encrypt(dek);
  
  return {
    ephemeralPubKey,
    wrappedKey: new Uint8Array([...iv, ...wrapped]),
  };
}

/**
 * Unwrap a DEK using recipient's private key
 */
export async function unwrapKey(
  wrappedKey: Uint8Array,
  ephemeralPubKey: Uint8Array,
  recipientPrivateKey: Uint8Array
): Promise<Uint8Array> {
  // ECDH shared secret
  const sharedSecret = x25519.getSharedSecret(recipientPrivateKey, ephemeralPubKey);
  
  // Derive wrapping key
  const wrapKey = hkdf(sha256, sharedSecret, undefined, 'clawdbot:wrap', 32);
  
  // Extract IV and ciphertext
  const iv = wrappedKey.slice(0, 12);
  const ciphertext = wrappedKey.slice(12);
  
  // Unwrap
  const cipher = gcm(wrapKey, iv);
  return cipher.decrypt(ciphertext);
}
```

---

## 4. Cross-Device Sync

### 4.1 Sync State Machine

```typescript
// sync.ts

import { EventEmitter } from 'events';
import type { DdcClient } from '@cere-ddc-sdk/ddc-client';
import type { FileMetadata, SyncStatus, ConflictInfo, ConflictResolution } from './types';

interface SyncStateConfig {
  client: DdcClient;
  bucketId: bigint;
  deviceId: string;
  syncIntervalMs: number;
}

interface FileState {
  cid: string;
  metadata: FileMetadata;
  localPath?: string;
}

export class SyncStateMachine extends EventEmitter {
  private config: SyncStateConfig;
  private fileIndex: Map<string, FileState> = new Map();
  private pendingUploads: Map<string, Buffer> = new Map();
  private conflicts: Map<string, ConflictInfo> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline = true;
  private lastSyncAt = 0;
  
  constructor(config: SyncStateConfig) {
    super();
    this.config = config;
  }
  
  start(): void {
    // Initial sync
    this.sync();
    
    // Periodic sync
    this.syncInterval = setInterval(
      () => this.sync(),
      this.config.syncIntervalMs
    );
  }
  
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  async sync(): Promise<void> {
    try {
      // 1. Fetch remote file index
      const remoteIndex = await this.fetchRemoteIndex();
      
      // 2. Compare with local index
      for (const [path, remoteState] of remoteIndex) {
        const localState = this.fileIndex.get(path);
        
        if (!localState) {
          // New remote file → download
          this.emit('download', { path, cid: remoteState.cid });
        } else if (remoteState.metadata.version > localState.metadata.version) {
          // Remote is newer
          if (localState.metadata.deviceId !== this.config.deviceId) {
            // Different device updated → download
            this.emit('download', { path, cid: remoteState.cid });
          } else {
            // Same device but remote is newer (shouldn't happen) → conflict
            this.recordConflict(path, localState.metadata, remoteState.metadata);
          }
        } else if (remoteState.metadata.version < localState.metadata.version) {
          // Local is newer → upload
          this.emit('upload', { path });
        } else if (remoteState.metadata.checksum !== localState.metadata.checksum) {
          // Same version but different content → conflict
          this.recordConflict(path, localState.metadata, remoteState.metadata);
        }
      }
      
      // 3. Upload pending changes
      await this.flushPendingUploads();
      
      this.lastSyncAt = Date.now();
      this.isOnline = true;
      
    } catch (error) {
      this.isOnline = false;
      this.emit('error', error);
    }
  }
  
  recordUpload(path: string, cid: string, metadata: FileMetadata): void {
    this.fileIndex.set(path, { cid, metadata });
  }
  
  async getLatestCid(path: string): Promise<string | null> {
    const state = this.fileIndex.get(path);
    return state?.cid || null;
  }
  
  async getCurrentVersion(path: string): Promise<number> {
    const state = this.fileIndex.get(path);
    return state?.metadata.version || 0;
  }
  
  getStatus(): SyncStatus {
    return {
      lastSyncAt: this.lastSyncAt,
      pendingUploads: this.pendingUploads.size,
      pendingDownloads: 0, // Calculated during sync
      conflicts: Array.from(this.conflicts.values()),
      isOnline: this.isOnline,
    };
  }
  
  async resolveConflict(path: string, resolution: ConflictResolution): Promise<void> {
    const conflict = this.conflicts.get(path);
    if (!conflict) return;
    
    switch (resolution) {
      case 'local':
        // Keep local version, force upload
        this.emit('forceUpload', { path });
        break;
      case 'remote':
        // Download remote version
        const remoteState = await this.fetchFileState(path);
        if (remoteState) {
          this.emit('download', { path, cid: remoteState.cid });
        }
        break;
      case 'manual':
        // Emit event for manual resolution
        this.emit('manualResolve', { path, conflict });
        break;
    }
    
    this.conflicts.delete(path);
  }
  
  private recordConflict(
    path: string,
    local: FileMetadata,
    remote: FileMetadata
  ): void {
    const conflict: ConflictInfo = {
      path,
      localVersion: local.version,
      remoteVersion: remote.version,
      localModifiedAt: local.modifiedAt,
      remoteModifiedAt: remote.modifiedAt,
    };
    this.conflicts.set(path, conflict);
    this.emit('conflict', conflict);
  }
  
  private async fetchRemoteIndex(): Promise<Map<string, FileState>> {
    // Implementation: Query DDC for all files in bucket with metadata
    // Returns Map<path, FileState>
    const index = new Map<string, FileState>();
    
    // TODO: Use DDC listing API
    // const files = await this.config.client.list(this.config.bucketId);
    // for (const file of files) {
    //   index.set(file.path, { cid: file.cid, metadata: JSON.parse(file.metadata) });
    // }
    
    return index;
  }
  
  private async fetchFileState(path: string): Promise<FileState | null> {
    // Implementation: Fetch specific file metadata from DDC
    return null;
  }
  
  private async flushPendingUploads(): Promise<void> {
    // Implementation: Upload all pending changes
    for (const [path, content] of this.pendingUploads) {
      this.emit('upload', { path, content });
    }
    this.pendingUploads.clear();
  }
}
```

---

## 5. EDEK Grant Management

### 5.1 Grant Interface

```typescript
// grants.ts

import { deriveSubAgentKey, wrapKey, unwrapKey } from './encryption';

export interface EncryptionGrant {
  /** Grant ID */
  id: string;
  
  /** Recipient's public key */
  recipientPubKey: Uint8Array;
  
  /** Wrapped DEK for recipient */
  wrappedDEK: Uint8Array;
  
  /** Ephemeral public key used for wrapping */
  ephemeralPubKey: Uint8Array;
  
  /** Allowed file paths (glob patterns) */
  scope: string[];
  
  /** Grant expiration timestamp */
  expiresAt: number;
  
  /** Can recipient further delegate? */
  canDelegate: boolean;
  
  /** Creation timestamp */
  createdAt: number;
  
  /** Issuer device ID */
  issuedBy: string;
}

export interface GrantManager {
  /** Create a new grant for a sub-agent */
  createGrant(params: CreateGrantParams): Promise<EncryptionGrant>;
  
  /** Revoke an existing grant */
  revokeGrant(grantId: string): Promise<void>;
  
  /** List active grants */
  listGrants(): Promise<EncryptionGrant[]>;
  
  /** Validate a grant (check expiration, scope) */
  validateGrant(grant: EncryptionGrant, path: string): boolean;
}

export interface CreateGrantParams {
  recipientPubKey: Uint8Array;
  scope: string[];
  expiresAt?: number;
  canDelegate?: boolean;
}

export class GrantManagerImpl implements GrantManager {
  private masterDEK: Uint8Array;
  private grants: Map<string, EncryptionGrant> = new Map();
  private deviceId: string;
  
  constructor(masterDEK: Uint8Array, deviceId: string) {
    this.masterDEK = masterDEK;
    this.deviceId = deviceId;
  }
  
  async createGrant(params: CreateGrantParams): Promise<EncryptionGrant> {
    const grantId = crypto.randomUUID();
    
    // Derive scoped key for this grant
    const scopedKey = deriveSubAgentKey(
      this.masterDEK,
      grantId,
      params.scope
    );
    
    // Wrap the scoped key for recipient
    const { ephemeralPubKey, wrappedKey } = await wrapKey(
      scopedKey,
      params.recipientPubKey
    );
    
    const grant: EncryptionGrant = {
      id: grantId,
      recipientPubKey: params.recipientPubKey,
      wrappedDEK: wrappedKey,
      ephemeralPubKey,
      scope: params.scope,
      expiresAt: params.expiresAt || Date.now() + 3600_000, // Default 1 hour
      canDelegate: params.canDelegate || false,
      createdAt: Date.now(),
      issuedBy: this.deviceId,
    };
    
    this.grants.set(grantId, grant);
    
    return grant;
  }
  
  async revokeGrant(grantId: string): Promise<void> {
    this.grants.delete(grantId);
    // TODO: Broadcast revocation to DDC for distributed enforcement
  }
  
  async listGrants(): Promise<EncryptionGrant[]> {
    const now = Date.now();
    // Filter out expired grants
    return Array.from(this.grants.values()).filter(
      g => g.expiresAt > now
    );
  }
  
  validateGrant(grant: EncryptionGrant, path: string): boolean {
    // Check expiration
    if (grant.expiresAt <= Date.now()) {
      return false;
    }
    
    // Check scope
    return grant.scope.some(pattern => this.matchesPattern(path, pattern));
  }
  
  private matchesPattern(path: string, pattern: string): boolean {
    // Simple glob matching
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    return regex.test(path);
  }
}
```

---

## 6. Clawdbot Plugin Integration

### 6.1 Plugin Registration

```typescript
// index.ts

import type { ClawdbotPlugin, PluginContext } from 'clawdbot';
import { CEFStorageAdapter } from './adapter';
import { GrantManagerImpl } from './grants';

export interface CEFPluginConfig {
  /** Enable CEF storage (default: false) */
  enabled: boolean;
  
  /** DDC cluster URL */
  clusterUrl: string;
  
  /** User's bucket ID */
  bucketId: string;
  
  /** Path to private key file */
  privateKeyPath?: string;
  
  /** Sync interval in seconds */
  syncIntervalSec?: number;
}

export const cefStoragePlugin: ClawdbotPlugin<CEFPluginConfig> = {
  name: '@clawdbot/storage-cef',
  version: '0.1.0',
  
  async onLoad(ctx: PluginContext, config: CEFPluginConfig) {
    if (!config.enabled) {
      ctx.log.info('CEF storage plugin disabled');
      return;
    }
    
    // Load or generate encryption key
    const encryptionKey = await loadOrGenerateKey(ctx);
    
    // Load private key
    const privateKey = await loadPrivateKey(config.privateKeyPath, ctx);
    
    // Initialize adapter
    const adapter = new CEFStorageAdapter({
      clusterUrl: config.clusterUrl,
      bucketId: BigInt(config.bucketId),
      privateKey,
      encryptionKey,
      syncIntervalMs: (config.syncIntervalSec || 30) * 1000,
    });
    
    await adapter.init();
    
    // Register as storage backend
    ctx.storage.registerBackend('cef', adapter);
    
    // Initialize grant manager
    const grantManager = new GrantManagerImpl(
      encryptionKey,
      ctx.deviceId
    );
    
    // Expose to other plugins
    ctx.expose('cef.grants', grantManager);
    
    ctx.log.info('CEF storage plugin initialized', {
      clusterUrl: config.clusterUrl,
      bucketId: config.bucketId,
    });
  },
  
  async onUnload(ctx: PluginContext) {
    const adapter = ctx.storage.getBackend('cef') as CEFStorageAdapter;
    if (adapter) {
      await adapter.dispose();
    }
  },
};

async function loadOrGenerateKey(ctx: PluginContext): Promise<Uint8Array> {
  const keyPath = ctx.dataPath('encryption.key');
  
  try {
    const keyData = await ctx.fs.readFile(keyPath);
    return new Uint8Array(keyData);
  } catch {
    // Generate new key
    const key = crypto.getRandomValues(new Uint8Array(32));
    await ctx.fs.writeFile(keyPath, Buffer.from(key));
    ctx.log.info('Generated new encryption key');
    return key;
  }
}

async function loadPrivateKey(
  path: string | undefined,
  ctx: PluginContext
): Promise<Uint8Array> {
  if (path) {
    const keyData = await ctx.fs.readFile(path);
    return new Uint8Array(keyData);
  }
  
  // Use Clawdbot's default key
  return ctx.identity.privateKey;
}

export default cefStoragePlugin;
```

### 6.2 Configuration Example

```yaml
# clawdbot.yaml

plugins:
  storage-cef:
    enabled: true
    clusterUrl: "https://ddc.cere.network"
    bucketId: "123456789"
    syncIntervalSec: 30
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

```typescript
// test/encryption.test.ts

import { describe, it, expect } from 'vitest';
import { 
  generateKey, 
  encrypt, 
  decrypt, 
  deriveSubAgentKey,
  wrapKey,
  unwrapKey 
} from '../src/encryption';

describe('Encryption', () => {
  it('should encrypt and decrypt data', async () => {
    const key = generateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode('Hello, CEF!');
    
    const ciphertext = await encrypt(plaintext, key, iv);
    const decrypted = await decrypt(ciphertext, key, iv);
    
    expect(new TextDecoder().decode(decrypted)).toBe('Hello, CEF!');
  });
  
  it('should derive consistent sub-agent keys', () => {
    const master = generateKey();
    const agentId = 'agent-123';
    const scope = ['memory/*.md'];
    
    const key1 = deriveSubAgentKey(master, agentId, scope);
    const key2 = deriveSubAgentKey(master, agentId, scope);
    
    expect(key1).toEqual(key2);
  });
  
  it('should wrap and unwrap keys correctly', async () => {
    const dek = generateKey();
    const recipientPrivate = crypto.getRandomValues(new Uint8Array(32));
    const recipientPublic = x25519.getPublicKey(recipientPrivate);
    
    const { ephemeralPubKey, wrappedKey } = await wrapKey(dek, recipientPublic);
    const unwrapped = await unwrapKey(wrappedKey, ephemeralPubKey, recipientPrivate);
    
    expect(unwrapped).toEqual(dek);
  });
});
```

### 7.2 Integration Tests

```typescript
// test/adapter.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CEFStorageAdapter } from '../src/adapter';

describe('CEFStorageAdapter', () => {
  let adapter: CEFStorageAdapter;
  
  beforeAll(async () => {
    adapter = new CEFStorageAdapter({
      clusterUrl: process.env.DDC_CLUSTER_URL || 'https://ddc-testnet.cere.network',
      bucketId: BigInt(process.env.DDC_BUCKET_ID || '1'),
      privateKey: new Uint8Array(32), // Test key
    });
    await adapter.init();
  });
  
  afterAll(async () => {
    await adapter.dispose();
  });
  
  it('should save and load a file', async () => {
    const content = Buffer.from('Test content');
    const path = 'test/file.txt';
    
    const cid = await adapter.saveFile(path, content);
    expect(cid).toBeTruthy();
    
    const loaded = await adapter.loadFile(path);
    expect(loaded.toString()).toBe('Test content');
  });
});
```

---

## 8. Deployment Checklist

### Phase 1 Launch

- [ ] Plugin published to npm
- [ ] DDC testnet bucket provisioned
- [ ] Documentation written
- [ ] Example configuration in Clawdbot docs
- [ ] 10 beta users onboarded
- [ ] Monitoring dashboard for sync errors

### Phase 2 Launch

- [ ] Cross-device sync tested
- [ ] Conflict resolution UI in Telegram
- [ ] Offline queue working
- [ ] 50 users on testnet

### Phase 3 Launch

- [ ] EDEK grants working
- [ ] Sub-agent spawning tested
- [ ] Grant revocation verified
- [ ] Security audit completed

---

## 9. References

### CEF Documentation
- [Agent Runtime Wiki (A9)](https://notion.so/276d8000-83d6-8043-aa86-cebbe8d34ad9)
- [ROB Wiki (A2)](https://notion.so/1c6d8000-83d6-80b0-b8ef-d23e5efb1852)
- [ADR: EDEK](https://notion.so/2f0d8000-83d6-804b-a77f-e09e9d0beb2f)
- [DDC Core Wiki](https://notion.so/1792e3b4-b89e-4138-bbd8-2d67a9eb44e5)

### GitHub Repositories
- [DDC SDK (JS)](https://github.com/Cerebellum-Network/cere-ddc-sdk-js)
- [Clawdbot](https://github.com/clawdbot/clawdbot)

### Cryptography Standards
- [RFC 5869 - HKDF](https://datatracker.ietf.org/doc/html/rfc5869)
- [NIST SP 800-38D - GCM](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- [RFC 7748 - X25519](https://datatracker.ietf.org/doc/html/rfc7748)

---

*Technical Specification v0.1.0 — 2026-01-25*
