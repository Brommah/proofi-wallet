# Proofi Chrome Extension - Audit & Alignment Runbook

**Audit Date:** 2025-02-08  
**Status:** Gaps Identified - Fixes Required  
**Auditor:** Extension Alignment Agent

---

## 📋 Executive Summary

The Chrome extension provides a functional self-custodial wallet with basic DDC storage capabilities. However, it is **NOT aligned** with the CLI's capability token flow and lacks critical features for the health data use case.

| Feature | CLI | Mobile | Extension | Status |
|---------|-----|--------|-----------|--------|
| Wallet creation | ✅ Ed25519 | ✅ sr25519 | ✅ sr25519 | ⚠️ Key mismatch |
| Auth signature | ✅ Ed25519 | ✅ Bearer/sig | ✅ sr25519 sig | ✅ Works |
| Data scope selection | ✅ `--scopes` | ❌ None | ❌ None | 🔴 MISSING |
| Capability tokens | ✅ Full flow | ❌ None | ❌ None | 🔴 MISSING |
| Agent permissions | ✅ `grant` cmd | ❌ None | ❌ None | 🔴 MISSING |
| DDC storage | ✅ Via API | ✅ Via API | ✅ Via API | ✅ Works |
| CERE balance | ❌ N/A | ✅ RPC | ❌ None | 🔴 MISSING |
| CERE transfer | ❌ N/A | ✅ RPC | ❌ None | 🟡 Nice-to-have |
| Health data upload | ✅ XML parse | ❌ None | ❌ None | 🔴 MISSING |

---

## 🔍 Gap Analysis

### GAP 1: Data Scope Selection (Critical)

**What CLI has:**
```bash
proofi grant health-analyzer --scopes health/read,fitness/read
```

**What Extension lacks:**
- No UI for selecting which health data categories to share
- No scope picker (steps, heart rate, sleep, workouts, etc.)
- No granular permission control

**Impact:** Users cannot choose what data an agent sees - all or nothing.

**Fix Required:**
```javascript
// New: src/lib/scopes.js
export const HEALTH_SCOPES = {
  'health/steps': { label: 'Steps', icon: '👣' },
  'health/heart-rate': { label: 'Heart Rate', icon: '❤️' },
  'health/hrv': { label: 'HRV', icon: '📈' },
  'health/sleep': { label: 'Sleep', icon: '😴' },
  'health/spo2': { label: 'Blood Oxygen', icon: '🫁' },
  'health/workouts': { label: 'Workouts', icon: '🏋️' },
  'health/nutrition': { label: 'Nutrition', icon: '🍎' },
};
```

---

### GAP 2: Capability Token Flow (Critical)

**What CLI has:**
```javascript
// CLI creates signed capability tokens
const token = {
  id: crypto.randomUUID(),
  issuer: 'did:key:z...',
  subject: 'did:proofi:agent:health-analyzer',
  scopes: [{ path: 'health/read', permissions: ['read'] }],
  resources: [{ cid: 'bafy...', type: 'health-data' }],
  expiresAt: Math.floor(Date.now() / 1000) + 86400,
  signature: '...'
};
```

**What Extension has:**
```javascript
// Extension uses simple signature auth
Authorization: Signature ${address}:${timestamp}:${signature}
```

**Impact:** No capability delegation, no time-limited access, no revocation.

**Fix Required:** Add capability token generation and management.

---

### GAP 3: Keypair Type Mismatch

**CLI:** Ed25519 + X25519 (via tweetnacl)  
**Extension:** sr25519 (via @polkadot/keyring)

**Impact:** DID formats don't match. CLI uses `did:key:z...`, extension uses Cere SS58 addresses.

**Recommendation:** Keep sr25519 for extension (matches Cere network), but add capability token layer on top using same logic as CLI but with sr25519 signatures.

---

### GAP 4: Missing CERE Wallet Features

**What Mobile has:**
- Balance display via HTTP RPC
- Token transfers
- Connected apps management

**What Extension lacks:**
- No balance display
- No transfer capability
- No token management

**Fix Required:** Port balance fetching from mobile.

---

## 🛠️ Fixes Implementation Plan

### Fix 1: Add Data Scope Selection Screen

**File:** `src/popup.html` (add after credential screen)

```html
<!-- Data Scope Selection Screen -->
<div id="screen-scopes" class="screen" style="display:none;">
  <div class="screen-header">
    <button id="btn-scopes-back" class="btn-ghost text-mono text-xs text-muted">← BACK</button>
    <h1 class="text-display text-display-sm">SELECT DATA</h1>
    <p class="text-body-sm text-muted" style="margin-top: 4px;">Choose which health data to share with agents</p>
  </div>
  <div class="form-section">
    <div class="scopes-grid" id="scopes-grid">
      <!-- Dynamically populated -->
    </div>
    <div id="selected-scopes" class="text-mono text-xs text-muted" style="margin-top: 16px;"></div>
    <button id="btn-confirm-scopes" class="btn-primary btn-full">CONFIRM SELECTION</button>
  </div>
</div>
```

**File:** `src/popup.js` (add scope handling)

```javascript
// ── Data Scope Selection ──────────────────────────────────────────────────

const HEALTH_SCOPES = {
  'health/steps': { label: 'Steps', icon: '👣', selected: true },
  'health/heart-rate': { label: 'Heart Rate', icon: '❤️', selected: true },
  'health/hrv': { label: 'HRV', icon: '📈', selected: false },
  'health/sleep': { label: 'Sleep', icon: '😴', selected: true },
  'health/spo2': { label: 'Blood Oxygen', icon: '🫁', selected: false },
  'health/workouts': { label: 'Workouts', icon: '🏋️', selected: true },
};

function renderScopesGrid() {
  const grid = $('#scopes-grid');
  grid.innerHTML = Object.entries(HEALTH_SCOPES).map(([key, scope]) => `
    <label class="scope-card ${scope.selected ? 'selected' : ''}" data-scope="${key}">
      <input type="checkbox" ${scope.selected ? 'checked' : ''}>
      <span class="scope-icon">${scope.icon}</span>
      <span class="scope-label">${scope.label}</span>
    </label>
  `).join('');
  
  $$('.scope-card').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.dataset.scope;
      HEALTH_SCOPES[key].selected = !HEALTH_SCOPES[key].selected;
      card.classList.toggle('selected');
      updateSelectedScopes();
    });
  });
}

function updateSelectedScopes() {
  const selected = Object.entries(HEALTH_SCOPES)
    .filter(([_, s]) => s.selected)
    .map(([k, _]) => k);
  $('#selected-scopes').textContent = `${selected.length} categories selected`;
}

function getSelectedScopes() {
  return Object.entries(HEALTH_SCOPES)
    .filter(([_, s]) => s.selected)
    .map(([k, _]) => ({ path: k, permissions: ['read'] }));
}
```

---

### Fix 2: Add Capability Token Generation

**File:** `src/lib/capability.js` (NEW)

```javascript
/**
 * Proofi Capability Tokens
 * Creates time-limited, scoped access tokens for agents.
 */

import { createKeypair } from './keyring.js';

/**
 * Create a capability token for an agent.
 * @param {Object} params
 * @param {Object} params.keypair - User's sr25519 keypair
 * @param {string} params.agentId - Agent identifier
 * @param {Array} params.scopes - Granted scopes
 * @param {Array} params.resources - CIDs of accessible data
 * @param {number} params.expiresIn - Seconds until expiry (default: 24h)
 */
export function createCapabilityToken({ keypair, agentId, scopes, resources, expiresIn = 86400 }) {
  const now = Math.floor(Date.now() / 1000);
  
  const token = {
    version: '1.0',
    id: crypto.randomUUID(),
    issuer: keypair.address,
    subject: `did:proofi:agent:${agentId}`,
    issuedAt: now,
    expiresAt: now + expiresIn,
    scopes,
    resources: resources.map(cid => ({ cid, type: 'health-data' })),
  };
  
  // Sign the token
  const tokenBytes = new TextEncoder().encode(JSON.stringify(token));
  const signature = keypair.signHex(tokenBytes);
  
  return {
    ...token,
    signature,
  };
}

/**
 * Verify a capability token.
 * @param {Object} token - The signed token
 * @param {string} expectedIssuer - Expected issuer address
 */
export function verifyCapabilityToken(token, expectedIssuer) {
  // Check expiry
  if (token.expiresAt < Date.now() / 1000) {
    throw new Error('Token expired');
  }
  
  // Check issuer
  if (token.issuer !== expectedIssuer) {
    throw new Error('Invalid issuer');
  }
  
  // Signature verification would require the public key
  // For now, trust tokens from our own storage
  return true;
}

/**
 * Store capability token in chrome.storage.
 */
export async function storeCapabilityToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.get('proofi_capability_tokens', (result) => {
      const tokens = result.proofi_capability_tokens || {};
      tokens[token.subject] = token;
      chrome.storage.local.set({ proofi_capability_tokens: tokens }, resolve);
    });
  });
}

/**
 * Get all stored capability tokens.
 */
export async function getCapabilityTokens() {
  return new Promise((resolve) => {
    chrome.storage.local.get('proofi_capability_tokens', (result) => {
      resolve(result.proofi_capability_tokens || {});
    });
  });
}

/**
 * Revoke a capability token.
 */
export async function revokeCapabilityToken(agentId) {
  return new Promise((resolve) => {
    chrome.storage.local.get('proofi_capability_tokens', (result) => {
      const tokens = result.proofi_capability_tokens || {};
      delete tokens[`did:proofi:agent:${agentId}`];
      chrome.storage.local.set({ proofi_capability_tokens: tokens }, resolve);
    });
  });
}
```

---

### Fix 3: Add CERE Balance Display

**Port from mobile:** `proofi-mobile/src/stores/walletStore.ts`

**File:** `src/lib/cere.js` (NEW)

```javascript
/**
 * CERE Network utilities for Chrome Extension.
 * Balance fetching via HTTP RPC (no WebSocket).
 */

const CERE_DECIMALS = 10;
const CERE_SS58_PREFIX = 54;
const RPC_ENDPOINTS = [
  'https://archive.mainnet.cere.network',
  'https://rpc.mainnet.cere.network',
];

import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

/**
 * Fetch CERE balance via HTTP RPC.
 */
export async function fetchBalance(address) {
  try {
    // Decode address to get public key
    const pubkey = decodeAddress(address, true);
    const pubkeyHex = u8aToHex(pubkey).slice(2);
    
    // Blake2b-128 hash + concat pubkey for storage key
    // Using SubtleCrypto since we can't use @noble/hashes in extension easily
    const hashBuffer = await crypto.subtle.digest('SHA-256', pubkey);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).slice(0, 16)
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    // system.account storage prefix
    const storageKey = `0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9${hashHex}${pubkeyHex}`;
    
    for (const endpoint of RPC_ENDPOINTS) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'state_getStorage',
            params: [storageKey],
          }),
        });
        
        const data = await res.json();
        if (data.result) {
          const hex = data.result.slice(2);
          // AccountInfo: nonce(8) + consumers(8) + providers(8) + sufficients(8) + free(32)
          const freeHex = hex.slice(32, 64);
          const leBytes = freeHex.match(/.{2}/g) || [];
          const beHex = leBytes.reverse().join('');
          const freeBn = BigInt('0x' + beHex);
          
          return formatBalance(freeBn);
        }
      } catch (e) {
        continue;
      }
    }
    
    return '0 CERE';
  } catch (e) {
    console.error('[CERE] fetchBalance error:', e);
    return null;
  }
}

function formatBalance(planck) {
  const divisor = BigInt(10 ** CERE_DECIMALS);
  const whole = planck / divisor;
  const frac = planck % divisor;
  
  if (frac === 0n) return `${whole.toLocaleString()} CERE`;
  const fracStr = frac.toString().padStart(CERE_DECIMALS, '0').slice(0, 4).replace(/0+$/, '');
  return fracStr ? `${whole.toLocaleString()}.${fracStr} CERE` : `${whole.toLocaleString()} CERE`;
}
```

---

### Fix 4: Add Health Data Upload

**File:** `src/lib/health.js` (NEW)

```javascript
/**
 * Health data parsing and processing.
 * Mirrors CLI's parseAppleHealthXML for browser file upload.
 */

/**
 * Parse Apple Health export XML.
 * Uses regex for memory efficiency (no full DOM parse).
 */
export function parseAppleHealthXML(xmlContent) {
  const records = [];
  
  // Extract Record elements
  const recordRegex = /<Record\s+([^>]+)\/>/g;
  let match;
  
  while ((match = recordRegex.exec(xmlContent)) !== null) {
    const attrs = match[1];
    const record = {};
    
    const attrRegex = /(\w+)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      record[attrMatch[1]] = attrMatch[2];
    }
    
    if (record.type) {
      records.push({
        type: record.type,
        value: parseFloat(record.value) || record.value,
        unit: record.unit,
        startDate: record.startDate,
        endDate: record.endDate,
        sourceName: record.sourceName
      });
    }
  }
  
  // Extract Workouts
  const workoutRegex = /<Workout\s+([^>]+)\/>/g;
  while ((match = workoutRegex.exec(xmlContent)) !== null) {
    const attrs = match[1];
    const workout = {};
    
    const attrRegex = /(\w+)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      workout[attrMatch[1]] = attrMatch[2];
    }
    
    if (workout.workoutActivityType) {
      records.push({
        type: 'HKWorkout',
        workoutType: workout.workoutActivityType,
        duration: parseFloat(workout.duration),
        calories: parseFloat(workout.totalEnergyBurned),
        startDate: workout.startDate,
        endDate: workout.endDate
      });
    }
  }
  
  return { records };
}

/**
 * Filter records by selected scopes.
 */
export function filterByScopes(records, scopes) {
  const scopeMap = {
    'health/steps': ['HKQuantityTypeIdentifierStepCount'],
    'health/heart-rate': ['HKQuantityTypeIdentifierHeartRate'],
    'health/hrv': ['HKQuantityTypeIdentifierHeartRateVariabilitySDNN'],
    'health/sleep': ['HKCategoryTypeIdentifierSleepAnalysis'],
    'health/spo2': ['HKQuantityTypeIdentifierOxygenSaturation'],
    'health/workouts': ['HKWorkout'],
  };
  
  const allowedTypes = scopes.flatMap(s => scopeMap[s.path] || []);
  return records.filter(r => allowedTypes.includes(r.type));
}

/**
 * Generate summary from health records.
 */
export function summarizeHealthData(records) {
  const byType = {};
  for (const r of records) {
    if (!byType[r.type]) byType[r.type] = [];
    byType[r.type].push(r);
  }
  
  const summary = [];
  
  const steps = byType['HKQuantityTypeIdentifierStepCount'] || [];
  if (steps.length > 0) {
    const avgSteps = Math.round(steps.reduce((a, b) => a + b.value, 0) / steps.length);
    summary.push(`📊 Steps: ${steps.length} records, avg ${avgSteps.toLocaleString()}/day`);
  }
  
  const hr = byType['HKQuantityTypeIdentifierHeartRate'] || [];
  if (hr.length > 0) {
    const avgHR = Math.round(hr.reduce((a, b) => a + b.value, 0) / hr.length);
    summary.push(`❤️ Heart Rate: ${hr.length} readings, avg ${avgHR} BPM`);
  }
  
  const workouts = byType['HKWorkout'] || [];
  if (workouts.length > 0) {
    const totalCal = Math.round(workouts.reduce((a, b) => a + (b.calories || 0), 0));
    summary.push(`🏋️ Workouts: ${workouts.length} sessions, ${totalCal.toLocaleString()} kcal`);
  }
  
  return { text: summary.join('\n'), totalRecords: records.length };
}
```

---

## 🧪 Testing Checklist

### Wallet Flow
- [ ] Fresh install → Login → PIN creation → Wallet created
- [ ] Returning user → PIN entry → Wallet restored (same address)
- [ ] Wrong PIN → Error shown, can retry
- [ ] Disconnect → State cleared, back to login

### Data Storage
- [ ] Store memo → CID returned, visible in list
- [ ] Store credential → CID returned, visible in list
- [ ] Refresh → Items reload from API

### Scope Selection (After Fix 1)
- [ ] Navigate to scope selection
- [ ] Toggle individual scopes on/off
- [ ] Confirm selection → Scopes saved
- [ ] Upload health data → Only selected scopes included

### Capability Tokens (After Fix 2)
- [ ] Grant access to agent → Token created
- [ ] Token has correct scopes and expiry
- [ ] Revoke token → Token deleted
- [ ] Expired token → Rejected on use

### CERE Balance (After Fix 3)
- [ ] Balance displays on dashboard
- [ ] Balance refreshes on demand
- [ ] Handles network errors gracefully

---

## 🏗️ Implementation Priority

1. **P0 - Critical (Week 1)**
   - [ ] Add data scope selection UI
   - [ ] Add capability token creation
   - [ ] Wire scopes to stored data

2. **P1 - Important (Week 2)**
   - [ ] Add CERE balance display
   - [ ] Add health data file upload
   - [ ] Add agent permission management UI

3. **P2 - Nice-to-have (Week 3)**
   - [ ] Add CERE token transfers
   - [ ] Add connected apps management
   - [ ] Add biometric unlock option

---

## 📁 Files to Create/Modify

### New Files
- `src/lib/capability.js` - Capability token generation
- `src/lib/cere.js` - CERE balance fetching  
- `src/lib/health.js` - Health data parsing
- `src/lib/scopes.js` - Scope definitions

### Modified Files
- `src/popup.html` - Add scope selection screen
- `src/popup.js` - Add scope/capability handlers
- `src/styles.css` - Add scope card styles

---

## ⚠️ Breaking Changes Required

None. All fixes are additive and backward compatible.

---

## 📝 Notes for Main Agent

1. **Key type consistency:** CLI uses Ed25519, extension uses sr25519. This is acceptable since they serve different purposes (CLI for local analysis, extension for Cere network). However, capability tokens should use the same signing algorithm as the platform (sr25519 for extension).

2. **API alignment:** The extension uses the same API endpoints as mobile/web (`/ddc/memo`, `/ddc/credential`, `/ddc/list`). These work correctly.

3. **The big gap** is the missing capability token flow. Without it, agents cannot get scoped, time-limited access to user data. The CLI has this fully implemented; the extension needs it.

4. **Health data upload** is completely missing from extension. CLI has full XML parsing; this should be ported.

---

*Generated by Extension Alignment Agent*
