# @proofi/agent-sdk

SDK for AI agents to consume Proofi capability tokens and securely access user data stored in the Cere DDC (Decentralized Data Cloud).

## Overview

Proofi enables users to grant agents controlled access to their encrypted data through **capability tokens**. These tokens contain:

- **Scopes**: Which data paths the agent can access
- **Permissions**: What operations are allowed (read/write/delete)
- **Expiry**: When access expires
- **Wrapped DEK**: Data Encryption Key wrapped for the agent's public key

This SDK handles token validation, key unwrapping, and transparent encryption/decryption.

## Installation

```bash
npm install @proofi/agent-sdk
# or
yarn add @proofi/agent-sdk
# or
pnpm add @proofi/agent-sdk
```

## Quick Start

```typescript
import { ProofiAgent } from '@proofi/agent-sdk';

// Initialize with token received from user
const agent = new ProofiAgent({
  token: capabilityToken,     // Token from user/extension
  privateKey: agentPrivateKey, // Your agent's X25519 private key
  ddcEndpoint: 'https://ddc.cere.network'
});

// Validate the token
const validation = await agent.validateToken();
if (!validation.valid) {
  console.error('Token invalid:', validation.reason);
  return;
}

// Read user's encrypted data (auto-decrypts)
const healthData = await agent.read('health/metrics');
console.log('User health metrics:', healthData);

// Write insights back (if permitted)
await agent.write('health/insights', {
  analysis: 'Your sleep patterns indicate...',
  timestamp: Date.now()
});

// List accessible resources
const scopes = agent.listScope();
console.log('Accessible paths:', scopes);
```

## API Reference

### `ProofiAgent`

Main class for interacting with user data.

#### Constructor

```typescript
new ProofiAgent({
  token: string | CapabilityToken,  // Capability token
  privateKey: string | Uint8Array,   // Agent's X25519 private key (base64 or bytes)
  ddcEndpoint?: string,              // DDC endpoint (default: https://ddc.cere.network)
  timeout?: number                   // Request timeout in ms (default: 30000)
})
```

#### Methods

| Method | Description |
|--------|-------------|
| `validateToken()` | Validate token expiry and signature |
| `isValid()` | Quick check if token is valid |
| `getExpiresIn()` | Time until expiry (ms) |
| `read<T>(path, options?)` | Read and decrypt data |
| `readRaw(path)` | Read as raw bytes |
| `readText(path)` | Read as text string |
| `write(path, data, options?)` | Encrypt and write data |
| `delete(path)` | Delete data |
| `exists(path)` | Check if resource exists |
| `list(options?)` | List accessible resources |
| `listScope()` | Get token's granted scopes |
| `hasPermission(path, permission)` | Check specific permission |
| `getAccessiblePaths(permission)` | Get all paths for a permission |

### Reading Data

```typescript
// Read JSON data (default)
const data = await agent.read<HealthMetrics>('health/metrics');

// Read raw bytes
const bytes = await agent.readRaw('files/document.pdf');

// Read as text
const text = await agent.readText('notes/memo.txt');
```

### Writing Data

```typescript
// Write JSON object
await agent.write('health/insights', { 
  score: 85, 
  recommendations: ['Sleep more'] 
});

// Write text
await agent.write('notes/summary.txt', 'Analysis complete...');

// Write binary data
await agent.write('files/report.pdf', pdfBytes, {
  contentType: 'application/pdf'
});
```

### Scope Checking

```typescript
// List all granted scopes
const scopes = agent.listScope();
// [{ path: 'health/**', permissions: ['read', 'write'] }]

// Check specific permission
if (agent.hasPermission('health/metrics', 'write')) {
  await agent.write('health/metrics', newData);
}

// Get all readable paths
const readable = agent.getAccessiblePaths('read');
// ['health/**', 'identity/email']
```

## Error Handling

The SDK provides typed errors for different failure scenarios:

```typescript
import { 
  TokenExpiredError,
  InvalidTokenError,
  ScopeError,
  DecryptionError,
  DDCError,
  ResourceNotFoundError
} from '@proofi/agent-sdk';

try {
  const data = await agent.read('health/metrics');
} catch (error) {
  if (error instanceof TokenExpiredError) {
    console.log(`Token expired ${error.expiredAgo}ms ago`);
    // Request new token from user
  } else if (error instanceof ScopeError) {
    console.log(`Access denied for ${error.path}`);
    console.log('Available scopes:', error.availableScopes);
  } else if (error instanceof ResourceNotFoundError) {
    console.log(`Resource not found: ${error.path}`);
  } else if (error instanceof DecryptionError) {
    console.log('Failed to decrypt data');
  } else if (error instanceof DDCError) {
    console.log(`DDC error: ${error.message}`);
  }
}
```

## Key Generation

Generate a keypair for your agent:

```typescript
import { generateKeyPair, encodeBase64 } from '@proofi/agent-sdk';

// Generate new X25519 keypair
const { publicKey, privateKey } = generateKeyPair();

// Store private key securely
const privateKeyBase64 = encodeBase64(privateKey);

// Share public key for token creation
const publicKeyBase64 = encodeBase64(publicKey);
```

## Advanced Usage

### Custom DDC Client

```typescript
import { DDCClient, createDDCClient } from '@proofi/agent-sdk';

const ddc = createDDCClient({
  endpoint: 'https://custom-ddc.example.com',
  bucketId: 'bucket-123',
  timeout: 60000
});
```

### Token Parsing

```typescript
import { parseToken, validateToken } from '@proofi/agent-sdk';

// Parse token string
const token = parseToken(tokenString);

// Validate with issuer's public key
const result = validateToken(token, issuerPublicKey);
```

### Manual Crypto Operations

```typescript
import { 
  unwrapDEK, 
  decryptBlob, 
  encryptBlob 
} from '@proofi/agent-sdk';

// Unwrap DEK manually
const dek = unwrapDEK(token.wrappedDEK, privateKey);

// Decrypt data
const plaintext = await decryptBlob({ ciphertext, nonce }, dek);

// Encrypt data
const encrypted = await encryptBlob(data, dek);
```

## Security Considerations

1. **Private Key Storage**: Store your agent's private key securely (HSM, secure enclave, or encrypted at rest)

2. **Token Validation**: Always validate tokens before use - check expiry and scope

3. **Scope Enforcement**: The SDK enforces scopes locally, but the DDC also validates access

4. **Token Lifetime**: Request tokens with appropriate expiry times for your use case

5. **Key Rotation**: Support key rotation by accepting new tokens with updated keys

## Token Format

Tokens can be provided in two formats:

### JWT-like Format
```
eyJ0eXAiOiJQQ1QiLCJhbGciOiJFZDI1NTE5In0.eyJqdGkiOiJ0b2tlbi0xMjMiLC...
```

### JSON Object
```typescript
{
  version: 1,
  id: 'token-123',
  issuer: 'did:proofi:user123',
  audience: 'did:proofi:agent456',
  issuedAt: 1704067200,
  expiresAt: 1704153600,
  scopes: [
    { path: 'health/**', permissions: ['read', 'write'] }
  ],
  wrappedDEK: {
    ciphertext: '...',
    ephemeralPublicKey: '...',
    nonce: '...'
  },
  bucketId: 'bucket-abc',
  signature: '...'
}
```

## Path Patterns

Scopes support wildcard patterns:

| Pattern | Matches |
|---------|---------|
| `health/metrics` | Exact path only |
| `health/*` | Single level: `health/metrics`, `health/sleep` |
| `health/**` | Any depth: `health/metrics`, `health/sleep/quality` |

## License

MIT
