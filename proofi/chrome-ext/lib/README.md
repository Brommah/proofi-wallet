# Proofi Capability Token Engine

The core innovation that differentiates Proofi from CEF.AI: **user-controlled, cryptographically-secured access tokens for AI agent data access**.

## Overview

The Capability Token Engine enables users to:
1. **Grant scoped access** to their encrypted data on DDC
2. **Set time-bound permissions** (1h to 1 year)
3. **Control permissions** (read/write/append)
4. **Revoke access** at any time
5. **Export tokens** for agents to use

## Token Structure

```typescript
interface CapabilityToken {
  version: number;           // Token format version
  tokenId: string;           // Unique identifier (tok_...)
  issuer: string;            // User's wallet address
  grantee: string;           // Agent's X25519 public key
  granteeName: string;       // Human-readable agent name
  scope: string[];           // ["health/*", "prefs/theme"]
  permissions: Permission[]; // ["read", "write", "append"]
  expiry: number;            // Unix timestamp
  wrappedDEKs: Record<string, string>; // Scope → wrapped DEK
  signature: string;         // Ed25519 signature
  createdAt: number;
}
```

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Chrome Extension                              │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │   crypto-utils  │  │   key-manager   │  │capability-token │   │
│  │                 │  │                 │  │                 │   │
│  │ • X25519        │  │ • Master key    │  │ • Token CRUD    │   │
│  │ • Ed25519       │  │ • Key pairs     │  │ • Revocation    │   │
│  │ • AES-GCM       │  │ • DEK derivation│  │ • Verification  │   │
│  │ • HKDF          │  │ • Key export    │  │ • Export/Import │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                              ▲                     ▲              │
│                              │                     │              │
│  ┌───────────────────────────┴─────────────────────┴───────────┐ │
│  │                        token-ui                              │ │
│  │                                                              │ │
│  │  • Grant access modal (scope selector, duration picker)     │ │
│  │  • Active token list with status                            │ │
│  │  • Revoke confirmation dialog                               │ │
│  │  • Token export for agents                                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Cryptographic Flow

### 1. Key Hierarchy

```
Master Key (256-bit, stored encrypted)
    │
    ├── HKDF ──> DEK for "health/*"
    ├── HKDF ──> DEK for "prefs/*"
    └── HKDF ──> DEK for "credentials/*"
```

### 2. Token Creation

```
1. User selects scope + permissions + duration
2. Derive DEK for each scope using HKDF(masterKey, scope)
3. Generate ephemeral X25519 keypair
4. Derive shared secret: ECDH(ephemeral.private, agent.public)
5. Derive wrapping key from shared secret
6. Encrypt DEK with wrapping key (AES-GCM)
7. Sign token payload with Ed25519
8. Return: token with wrapped DEKs + ephemeral public key
```

### 3. Token Usage (Agent Side)

```
1. Agent receives token (base64 encoded)
2. Parse and verify signature
3. Check expiry and permissions
4. Derive shared secret: ECDH(agent.private, ephemeral.public)
5. Derive unwrapping key
6. Decrypt DEK
7. Use DEK to decrypt data from DDC
```

## Scope Presets

| Scope | Label | Data Types |
|-------|-------|------------|
| `health/*` | Health Data | Heart rate, steps, sleep, workouts |
| `prefs/*` | Preferences | Theme, language, notifications |
| `identity/basic` | Identity | Name, email (not keys) |
| `credentials/*` | Credentials | VCs, badges, achievements |
| `social/*` | Social | Connections, reputation |
| `financial/summary` | Financial | Balances (not transactions) |

## Duration Presets

- 1 hour
- 24 hours
- 7 days
- 30 days
- 90 days
- 1 year

## API Reference

### CryptoUtils

```javascript
// Key generation
await CryptoUtils.generateX25519KeyPair();
await CryptoUtils.generateSigningKeyPair();

// DEK operations
await CryptoUtils.deriveDEK(masterKeyHex, resourcePath);
await CryptoUtils.wrapDEK(dekHex, granteePublicKeyHex);
await CryptoUtils.unwrapDEK(wrappedDEK, privateKeyBase64);

// Signing
await CryptoUtils.sign(message, privateKey);
await CryptoUtils.verify(message, signatureHex, publicKey);

// Encryption
await CryptoUtils.encrypt(plaintext, keyHex);
await CryptoUtils.decrypt(ciphertextBase64, keyHex);
```

### KeyManager

```javascript
// Initialization
await KeyManager.initialize();
await KeyManager.hasKeys();

// Key access
await KeyManager.getPublicKeys();
await KeyManager.getWalletAddress();

// DEK operations
await KeyManager.deriveDEKForResource(resourcePath);
await KeyManager.wrapDEKForGrantee(dekHex, granteePublicKey);

// Signing
await KeyManager.signMessage(message);

// Key management
await KeyManager.regenerateMasterKey(); // For revocation
await KeyManager.exportKeys(includePrivate);
await KeyManager.importKeys(backupBase64);
```

### CapabilityTokenEngine

```javascript
// Token creation
const token = await CapabilityTokenEngine.createToken({
  granteePublicKey: '...',
  granteeName: 'Health Coach AI',
  scope: ['health/*'],
  permissions: ['read'],
  duration: '24h', // or expiryTimestamp
});

// Token queries
await CapabilityTokenEngine.getActiveTokens();
await CapabilityTokenEngine.getAllTokens();
await CapabilityTokenEngine.getToken(tokenId);
await CapabilityTokenEngine.getTokensForGrantee(publicKey);

// Revocation
await CapabilityTokenEngine.revokeToken(tokenId, regenerateDEKs);
await CapabilityTokenEngine.revokeAllForGrantee(publicKey, regenerateDEKs);

// Export
const base64Token = await CapabilityTokenEngine.exportToken(tokenId);
const parsed = CapabilityTokenEngine.parseToken(base64Token);

// Verification
await CapabilityTokenEngine.verifyToken(token, issuerPublicKeyHex);
CapabilityTokenEngine.checkPermission(token, scope, permission);

// Maintenance
await CapabilityTokenEngine.cleanupExpired();
await CapabilityTokenEngine.getStats();
```

### TokenUI

```javascript
// Initialize UI
await TokenUI.init();

// Render token panel
await TokenUI.renderTokenPanel('containerId');

// Show modals
TokenUI.showGrantModal();
TokenUI.showRevokeModal(tokenId);
await TokenUI.exportToken(tokenId);
TokenUI.closeModal();
```

## Security Considerations

1. **Master Key Protection**: Stored in chrome.storage.local, accessible only to extension
2. **DEK Derivation**: Deterministic but scoped - each resource path gets unique DEK
3. **Key Wrapping**: ECIES-style using X25519 + AES-GCM
4. **Signature Verification**: Ed25519 ensures token authenticity
5. **Revocation**: Can invalidate individual tokens or regenerate master key

## Files

- `crypto-utils.js` - Low-level cryptographic primitives
- `key-manager.js` - User key management and storage
- `capability-token.js` - Token generation, storage, verification
- `token-ui.js` - UI components for grant/revoke
- `token-ui.css` - Styles for token UI

## Future Enhancements

- [ ] Hardware key support (YubiKey, Ledger)
- [ ] Multi-signature tokens
- [ ] Delegation chains
- [ ] Audit logging
- [ ] Token renewal without full re-grant
