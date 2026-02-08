/**
 * Vitest Test Setup
 * Common mocks and utilities for unit/integration tests
 */

import { vi } from 'vitest';

// ═══ Browser API Mocks ═══

// Mock crypto.randomUUID
if (!globalThis.crypto) {
  globalThis.crypto = {};
}
globalThis.crypto.randomUUID = vi.fn(() => 
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  })
);

// Mock crypto.getRandomValues
globalThis.crypto.getRandomValues = vi.fn((array) => {
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
});

// Mock crypto.subtle (for encryption tests)
globalThis.crypto.subtle = {
  generateKey: vi.fn().mockResolvedValue({
    publicKey: { type: 'public' },
    privateKey: { type: 'private' }
  }),
  encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
  decrypt: vi.fn().mockResolvedValue(new Uint8Array([116, 101, 115, 116]).buffer), // 'test'
  deriveKey: vi.fn().mockResolvedValue({ type: 'derived' }),
  deriveBits: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
  importKey: vi.fn().mockResolvedValue({ type: 'imported' }),
  exportKey: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
  digest: vi.fn().mockImplementation(async (algorithm, data) => {
    // Simple mock hash
    const arr = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      arr[i] = (data[i % data.length] || 0) ^ i;
    }
    return arr.buffer;
  }),
  sign: vi.fn().mockResolvedValue(new ArrayBuffer(64)),
  verify: vi.fn().mockResolvedValue(true)
};

// ═══ localStorage Mock ═══
const localStorageData = {};
globalThis.localStorage = {
  getItem: vi.fn((key) => localStorageData[key] || null),
  setItem: vi.fn((key, value) => { localStorageData[key] = String(value); }),
  removeItem: vi.fn((key) => { delete localStorageData[key]; }),
  clear: vi.fn(() => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }),
  get length() { return Object.keys(localStorageData).length; },
  key: vi.fn((i) => Object.keys(localStorageData)[i] || null)
};

// ═══ sessionStorage Mock ═══
const sessionStorageData = {};
globalThis.sessionStorage = {
  getItem: vi.fn((key) => sessionStorageData[key] || null),
  setItem: vi.fn((key, value) => { sessionStorageData[key] = String(value); }),
  removeItem: vi.fn((key) => { delete sessionStorageData[key]; }),
  clear: vi.fn(() => { Object.keys(sessionStorageData).forEach(k => delete sessionStorageData[k]); }),
  get length() { return Object.keys(sessionStorageData).length; },
  key: vi.fn((i) => Object.keys(sessionStorageData)[i] || null)
};

// ═══ Fetch Mock ═══
globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue({}),
  text: vi.fn().mockResolvedValue(''),
  blob: vi.fn().mockResolvedValue(new Blob())
});

// ═══ postMessage Mock ═══
globalThis.postMessage = vi.fn();

// ═══ Helper Functions ═══

/**
 * Reset all mocks between tests
 */
export function resetMocks() {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
}

/**
 * Mock a successful API response
 */
export function mockApiResponse(data, status = 200) {
  globalThis.fetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data))
  });
}

/**
 * Mock a failed API response
 */
export function mockApiError(error = 'Server error', status = 500) {
  globalThis.fetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: vi.fn().mockResolvedValue({ error }),
    text: vi.fn().mockResolvedValue(JSON.stringify({ error }))
  });
}

/**
 * Mock network failure
 */
export function mockNetworkError() {
  globalThis.fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
}

/**
 * Create a mock wallet address (Sr25519 format)
 */
export function mockWalletAddress() {
  return '5' + Array.from({ length: 47 }, () => 
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'[
      Math.floor(Math.random() * 58)
    ]
  ).join('');
}

/**
 * Create mock permission data
 */
export function mockPermissions(overrides = {}) {
  return {
    location: { enabled: false, price: 0.005 },
    contacts: { enabled: false, price: 0.002 },
    calendar: { enabled: false, price: 0.003 },
    health: { enabled: false, price: 0.010 },
    financial: { enabled: false, price: 0.020 },
    social: { enabled: false, price: 0.004 },
    browsing: { enabled: false, price: 0.001 },
    ...overrides
  };
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(condition, timeout = 5000) {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('waitFor timeout');
    }
    await new Promise(r => setTimeout(r, 50));
  }
}

/**
 * Create a mock DOM element
 */
export function createElement(tag, attributes = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') el.className = value;
    else if (key === 'textContent') el.textContent = value;
    else if (key.startsWith('data-')) el.setAttribute(key, value);
    else el[key] = value;
  });
  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  });
  return el;
}

// Auto-reset between tests
beforeEach(() => {
  resetMocks();
});
