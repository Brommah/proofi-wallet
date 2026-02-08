# Proofi Testing Guide

> QA procedures for ensuring Proofi works correctly.

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [End-to-End Tests](#end-to-end-tests)
5. [Manual QA Checklist](#manual-qa-checklist)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)
8. [Test Data](#test-data)
9. [CI/CD Integration](#cicd-integration)

---

## Testing Philosophy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          TESTING PYRAMID                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                            ▲                                            │
│                           ╱ ╲                                           │
│                          ╱   ╲   E2E Tests (Slow, Expensive)           │
│                         ╱     ╲  • Full user flows                     │
│                        ╱       ╲ • Browser automation                  │
│                       ───────────                                       │
│                      ╱           ╲                                      │
│                     ╱             ╲  Integration Tests                  │
│                    ╱               ╲ • API endpoints                   │
│                   ╱                 ╲• Component interactions          │
│                  ─────────────────────                                  │
│                 ╱                     ╲                                 │
│                ╱                       ╲ Unit Tests (Fast, Cheap)      │
│               ╱                         ╲• Individual functions        │
│              ╱                           ╲• Crypto operations          │
│             ───────────────────────────────                             │
│                                                                         │
│   Run unit tests frequently. Run E2E before releases.                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core Principles

1. **Test crypto first** — Encryption/decryption must be bulletproof
2. **Test token validation** — Security boundary, no shortcuts
3. **Test happy paths + edge cases** — Expired tokens, invalid signatures
4. **Automate regression** — Catch regressions before users do
5. **Manual QA for UX** — Some things need human eyes

---

## Unit Tests

### Agent SDK

The agent-sdk uses **Vitest** for unit testing.

```bash
cd ~/clawd/proofi/agent-sdk

# Run all tests
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# Run specific test file
npm test -- src/__tests__/agent.test.ts

# Run with coverage
npm test -- --coverage
```

#### Key Test Files

| File | What It Tests |
|------|---------------|
| `agent.test.ts` | ProofiAgent class, token handling |
| `crypto.test.ts` | Key generation, DEK wrapping, encryption |
| `token.test.ts` | Token parsing, validation, expiration |
| `revocation.test.ts` | Token revocation checks |

#### Writing New Tests

```typescript
// src/__tests__/example.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { myFunction } from '../myModule';

describe('myFunction', () => {
  it('should do the expected thing', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    expect(() => myFunction(null)).toThrow('Invalid input');
  });
});
```

#### Crypto Test Examples

```typescript
import { generateKeyPair, wrapDEK, unwrapDEK, encryptBlob, decryptBlob } from '../crypto';

describe('crypto operations', () => {
  it('should round-trip DEK wrap/unwrap', () => {
    const keyPair = generateKeyPair();
    const dek = crypto.getRandomValues(new Uint8Array(32));
    
    const wrapped = wrapDEK(dek, keyPair.publicKey);
    const unwrapped = unwrapDEK(wrapped, keyPair.privateKey);
    
    expect(unwrapped).toEqual(dek);
  });

  it('should round-trip blob encrypt/decrypt', () => {
    const dek = crypto.getRandomValues(new Uint8Array(32));
    const data = new TextEncoder().encode('secret data');
    
    const encrypted = encryptBlob(data, dek);
    const decrypted = decryptBlob(encrypted, dek);
    
    expect(decrypted).toEqual(data);
  });
});
```

### Health Scripts

```bash
cd ~/clawd/proofi/scripts

# Install dev dependencies
npm install

# Run TypeScript directly with tsx
npx tsx import-health-data.ts --preview --file test-data.xml
```

---

## Integration Tests

### API Endpoint Testing

Use curl or a test framework to hit API endpoints:

```bash
# Start local server
vercel dev &

# Test token revocation check
curl -s "http://localhost:3000/api/ddc/revoke?tokenId=test-123" | jq

# Test drop upload
curl -X POST "http://localhost:3000/api/drop/upload" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' | jq

# Test photo chunk upload
curl -X POST "http://localhost:3000/api/photos/chunk" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @test-image.jpg | jq
```

### API Test Script

```bash
#!/bin/bash
# tests/api-integration.sh

BASE_URL="${1:-http://localhost:3000}"

echo "Testing API endpoints..."

# Test 1: Revocation endpoint
echo -n "Testing /api/ddc/revoke... "
RESP=$(curl -s "$BASE_URL/api/ddc/revoke?tokenId=test")
if echo "$RESP" | jq -e '.revoked' > /dev/null 2>&1; then
  echo "✓ PASS"
else
  echo "✗ FAIL: $RESP"
  exit 1
fi

# Test 2: Drop endpoint (404 expected for missing drop)
echo -n "Testing /api/drop/missing-id... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/drop/missing-id")
if [ "$HTTP_CODE" = "404" ]; then
  echo "✓ PASS (404 as expected)"
else
  echo "✗ FAIL: got $HTTP_CODE"
  exit 1
fi

echo "All API tests passed!"
```

### DDC Integration

Test DDC connectivity (requires testnet access):

```javascript
// tests/ddc-integration.js
import { DdcClient } from '@cere-ddc-sdk/ddc-client';

async function testDDC() {
  const client = await DdcClient.buildAndConnect({
    clusterAddress: 'wss://rpc.testnet.cere.network/ws',
  });

  console.log('DDC connected:', client.isConnected);
  
  // Test bucket access
  const bucketId = 'test-bucket-id';
  try {
    const bucket = await client.getBucket(bucketId);
    console.log('Bucket found:', bucket);
  } catch (e) {
    console.log('Bucket not found (expected for test):', e.message);
  }

  await client.disconnect();
}

testDDC().catch(console.error);
```

---

## End-to-End Tests

### Browser Testing Setup

For full E2E testing, use Playwright:

```bash
npm install -D @playwright/test
npx playwright install
```

### Example E2E Test

```typescript
// tests/e2e/wallet-connect.spec.ts
import { test, expect } from '@playwright/test';

test('user can connect wallet', async ({ page }) => {
  // Go to landing page
  await page.goto('http://localhost:3000');
  
  // Click connect button
  await page.click('[data-testid="connect-wallet"]');
  
  // Wait for wallet modal
  await expect(page.locator('.proofi-overlay')).toBeVisible();
  
  // Wallet iframe should load
  const iframe = page.frameLocator('.proofi-iframe');
  await expect(iframe.locator('.wallet-container')).toBeVisible();
});

test('demo games load correctly', async ({ page }) => {
  await page.goto('http://localhost:3000/game');
  
  // Game canvas should render
  await expect(page.locator('canvas')).toBeVisible();
  
  // Score display should exist
  await expect(page.locator('[data-testid="score"]')).toBeVisible();
});
```

### Run E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test wallet-connect

# Generate report
npx playwright show-report
```

---

## Manual QA Checklist

### Pre-Release Checklist

Run through this checklist before any production release:

#### Landing Page
- [ ] Page loads without console errors
- [ ] All images load correctly
- [ ] Mobile responsive (test 375px width)
- [ ] Links work (ecosystem, portal, etc.)
- [ ] Connect wallet button visible

#### Wallet Connection
- [ ] Click "Connect" opens wallet modal
- [ ] Modal is centered, dimmed background
- [ ] Can close modal with X or clicking outside
- [ ] After auth, address displayed correctly
- [ ] Connection persists on page refresh

#### Wallet App (/app)
- [ ] Shows address after connection
- [ ] Shows balance (if applicable)
- [ ] Can navigate between tabs
- [ ] Transaction signing works

#### Demo Games
- [ ] `/game` - Snake game loads and plays
- [ ] `/cryptoquest` - Game loads
- [ ] Score tracking works
- [ ] Achievements stored to wallet

#### Chrome Extension
- [ ] Extension icon appears in toolbar
- [ ] Popup opens on click
- [ ] Can connect to wallet
- [ ] Token management works
- [ ] Signing requests handled

#### Health Features
- [ ] `/health` page loads
- [ ] Scope selector works
- [ ] Data import flow (if testable)

#### API Endpoints
- [ ] `/api/ddc/revoke` responds
- [ ] `/api/drop/upload` accepts POST
- [ ] CORS headers correct for proofi.ai

#### Cross-Browser
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Performance Testing

### Lighthouse Audit

```bash
# Install lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse https://proofi.ai --output html --output-path ./lighthouse-report.html

# Key metrics to watch:
# - Performance > 90
# - Best Practices > 90
# - SEO > 90
```

### Load Testing

```bash
# Install k6
brew install k6

# Create test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,        // 10 virtual users
  duration: '30s', // for 30 seconds
};

export default function () {
  const res = http.get('https://proofi.ai');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
EOF

# Run load test
k6 run load-test.js
```

### Bundle Size Check

```bash
# Check what's in the bundle
npx source-map-explorer dist/*.js

# Or use bundlephobia for dependencies
open "https://bundlephobia.com/package/@proofi/agent-sdk"
```

---

## Security Testing

### Token Validation Tests

```typescript
describe('token security', () => {
  it('rejects expired tokens', async () => {
    const expiredToken = {
      ...validToken,
      expiresAt: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    };
    
    await expect(agent.validateToken()).rejects.toThrow(TokenExpiredError);
  });

  it('rejects tokens with wrong audience', async () => {
    const wrongAudienceToken = {
      ...validToken,
      audience: 'did:proofi:wrong-agent',
    };
    
    await expect(agent.validateToken()).rejects.toThrow(InvalidTokenError);
  });

  it('rejects tampered signatures', async () => {
    const tamperedToken = {
      ...validToken,
      signature: 'tampered-signature',
    };
    
    await expect(agent.validateToken()).rejects.toThrow(SignatureVerificationError);
  });
});
```

### Scope Enforcement Tests

```typescript
describe('scope enforcement', () => {
  it('allows access to granted paths', async () => {
    // Token grants: health/**
    const result = await agent.read('health/steps/2024-01-01');
    expect(result).toBeDefined();
  });

  it('denies access to non-granted paths', async () => {
    // Token grants: health/** but NOT finance/**
    await expect(agent.read('finance/transactions')).rejects.toThrow(ScopeError);
  });

  it('enforces read-only when no write permission', async () => {
    // Token grants: read on identity/email
    await expect(agent.write('identity/email', 'new@email.com'))
      .rejects.toThrow(ScopeError);
  });
});
```

### Input Validation

```bash
# Test API with malformed input
curl -X POST "http://localhost:3000/api/drop/upload" \
  -H "Content-Type: application/json" \
  -d '{"malformed": true, "__proto__": {"polluted": true}}'

# Should reject, not crash
```

---

## Test Data

### Sample Tokens

```json
// tests/fixtures/valid-token.json
{
  "version": 1,
  "id": "test-token-001",
  "issuer": "did:proofi:user-test",
  "audience": "did:proofi:agent-test",
  "issuedAt": 1707400000,
  "expiresAt": 1707486400,
  "scopes": [
    { "path": "health/**", "permissions": ["read"] }
  ],
  "wrappedDEK": "base64-encoded-wrapped-key",
  "bucketId": "test-bucket",
  "signature": "base64-encoded-signature"
}
```

### Sample Health Data

```xml
<!-- tests/fixtures/health-export-sample.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<HealthData>
  <Record type="HKQuantityTypeIdentifierStepCount" 
          value="1234" 
          startDate="2024-01-15T08:00:00"
          endDate="2024-01-15T09:00:00"/>
  <Record type="HKQuantityTypeIdentifierHeartRate"
          value="72"
          startDate="2024-01-15T10:00:00"
          endDate="2024-01-15T10:00:00"/>
</HealthData>
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test
        working-directory: agent-sdk
      
      - name: Run API tests
        run: |
          npm run dev &
          sleep 5
          ./tests/api-integration.sh
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./agent-sdk/coverage/lcov.info
```

### Pre-commit Hooks

```bash
# Install husky
npm install -D husky lint-staged
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm test"
```

---

## Quick Commands Reference

```bash
# Agent SDK tests
cd agent-sdk && npm test

# Watch mode
cd agent-sdk && npm run test:watch

# API integration test
./tests/api-integration.sh http://localhost:3000

# E2E tests
npx playwright test

# Lighthouse audit
lighthouse https://proofi.ai --output html

# Load test
k6 run load-test.js
```

---

*Last updated: 2025-02-08*
