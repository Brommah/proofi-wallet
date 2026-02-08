/**
 * Onboarding Integration Tests
 * Tests for the wallet onboarding flow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockApiResponse, mockApiError, mockNetworkError, mockWalletAddress, resetMocks } from '../setup.js';

// ═══ Onboarding Flow Utilities ═══

/**
 * Step 1: Generate or import wallet
 */
async function createWallet(method = 'generate') {
  if (method === 'generate') {
    // Generate new mnemonic (12 words)
    const entropy = crypto.getRandomValues(new Uint8Array(16));
    // Mock: return placeholder mnemonic
    return {
      mnemonic: 'abandon ability able about above absent absorb abstract absurd abuse access accident',
      address: mockWalletAddress()
    };
  } else if (method === 'import') {
    throw new Error('Import requires mnemonic');
  }
}

/**
 * Step 2: Set wallet password
 */
async function setPassword(password, confirmPassword) {
  if (password !== confirmPassword) {
    throw new Error('Passwords do not match');
  }
  
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  // Derive encryption key from password
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  return { success: true };
}

/**
 * Step 3: Backup recovery phrase
 */
async function backupRecoveryPhrase(mnemonic, confirmWords) {
  const words = mnemonic.split(' ');
  
  // Verify user can confirm random words
  for (const [index, word] of Object.entries(confirmWords)) {
    if (words[parseInt(index)] !== word) {
      throw new Error(`Word ${parseInt(index) + 1} is incorrect`);
    }
  }
  
  return { verified: true };
}

/**
 * Step 4: Complete onboarding
 */
async function completeOnboarding(address, preferences = {}) {
  const payload = {
    address,
    notifications: preferences.notifications ?? true,
    analytics: preferences.analytics ?? false,
    ...preferences
  };
  
  const response = await fetch('/api/onboarding/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Onboarding failed');
  }
  
  return response.json();
}

/**
 * Import existing wallet from mnemonic
 */
async function importWallet(mnemonic) {
  const words = mnemonic.trim().toLowerCase().split(/\s+/);
  
  if (words.length !== 12 && words.length !== 24) {
    throw new Error('Invalid recovery phrase length');
  }
  
  // Mock derivation
  return {
    address: mockWalletAddress(),
    imported: true
  };
}

/**
 * Validate onboarding state
 */
function validateOnboardingState(state) {
  const required = ['walletCreated', 'passwordSet', 'backupVerified'];
  const missing = required.filter(key => !state[key]);
  
  if (missing.length > 0) {
    return {
      complete: false,
      nextStep: missing[0],
      progress: (required.length - missing.length) / required.length
    };
  }
  
  return { complete: true, progress: 1 };
}

// ═══ Tests ═══

describe('Onboarding Flow', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('createWallet', () => {
    it('should generate a new wallet with mnemonic', async () => {
      const result = await createWallet('generate');
      
      expect(result).toHaveProperty('mnemonic');
      expect(result).toHaveProperty('address');
      expect(result.mnemonic.split(' ')).toHaveLength(12);
      expect(result.address).toMatch(/^5[1-9A-HJ-NP-Za-km-z]{47}$/);
    });

    it('should throw error when importing without mnemonic', async () => {
      await expect(createWallet('import'))
        .rejects.toThrow('Import requires mnemonic');
    });
  });

  describe('setPassword', () => {
    it('should accept matching passwords', async () => {
      const result = await setPassword('SecurePass123!', 'SecurePass123!');
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', async () => {
      await expect(setPassword('password1', 'password2'))
        .rejects.toThrow('Passwords do not match');
    });

    it('should reject short passwords', async () => {
      await expect(setPassword('short', 'short'))
        .rejects.toThrow('at least 8 characters');
    });

    it('should call crypto.subtle.importKey', async () => {
      await setPassword('password123', 'password123');
      expect(crypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array),
        'PBKDF2',
        false,
        ['deriveBits']
      );
    });
  });

  describe('backupRecoveryPhrase', () => {
    const mnemonic = 'abandon ability able about above absent absorb abstract absurd abuse access accident';

    it('should verify correct words', async () => {
      const confirmWords = { 0: 'abandon', 5: 'absent', 11: 'accident' };
      const result = await backupRecoveryPhrase(mnemonic, confirmWords);
      expect(result.verified).toBe(true);
    });

    it('should reject incorrect words', async () => {
      const confirmWords = { 0: 'wrong' };
      await expect(backupRecoveryPhrase(mnemonic, confirmWords))
        .rejects.toThrow('Word 1 is incorrect');
    });

    it('should verify multiple words', async () => {
      const words = mnemonic.split(' ');
      const confirmWords = {
        2: words[2],
        7: words[7],
        10: words[10]
      };
      const result = await backupRecoveryPhrase(mnemonic, confirmWords);
      expect(result.verified).toBe(true);
    });
  });

  describe('completeOnboarding', () => {
    it('should send onboarding data to API', async () => {
      mockApiResponse({ success: true, userId: '123' });
      
      const address = mockWalletAddress();
      await completeOnboarding(address);
      
      expect(fetch).toHaveBeenCalledWith('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining(address)
      });
    });

    it('should include preferences', async () => {
      mockApiResponse({ success: true });
      
      await completeOnboarding(mockWalletAddress(), {
        notifications: false,
        analytics: true,
        theme: 'dark'
      });
      
      const body = JSON.parse(fetch.mock.calls[0][1].body);
      expect(body.notifications).toBe(false);
      expect(body.analytics).toBe(true);
      expect(body.theme).toBe('dark');
    });

    it('should handle API errors', async () => {
      mockApiError('User already exists', 409);
      
      await expect(completeOnboarding(mockWalletAddress()))
        .rejects.toThrow('User already exists');
    });

    it('should handle network errors', async () => {
      mockNetworkError();
      
      await expect(completeOnboarding(mockWalletAddress()))
        .rejects.toThrow();
    });

    it('should default notifications to true and analytics to false', async () => {
      mockApiResponse({ success: true });
      
      await completeOnboarding(mockWalletAddress());
      
      const body = JSON.parse(fetch.mock.calls[0][1].body);
      expect(body.notifications).toBe(true);
      expect(body.analytics).toBe(false);
    });
  });

  describe('importWallet', () => {
    it('should accept 12-word mnemonic', async () => {
      const mnemonic = 'abandon ability able about above absent absorb abstract absurd abuse access accident';
      const result = await importWallet(mnemonic);
      
      expect(result.imported).toBe(true);
      expect(result).toHaveProperty('address');
    });

    it('should accept 24-word mnemonic', async () => {
      const mnemonic = Array(24).fill('abandon').join(' ');
      const result = await importWallet(mnemonic);
      
      expect(result.imported).toBe(true);
    });

    it('should normalize case and whitespace', async () => {
      const mnemonic = '  ABANDON  ABILITY  able About ABOVE  absent ABSORB abstract ABSURD abuse ACCESS accident  ';
      const result = await importWallet(mnemonic);
      
      expect(result.imported).toBe(true);
    });

    it('should reject invalid word count', async () => {
      const mnemonic = 'one two three';
      await expect(importWallet(mnemonic))
        .rejects.toThrow('Invalid recovery phrase length');
    });
  });

  describe('validateOnboardingState', () => {
    it('should return complete when all steps done', () => {
      const state = {
        walletCreated: true,
        passwordSet: true,
        backupVerified: true
      };
      
      const result = validateOnboardingState(state);
      expect(result.complete).toBe(true);
      expect(result.progress).toBe(1);
    });

    it('should return next step when incomplete', () => {
      const state = {
        walletCreated: true,
        passwordSet: false,
        backupVerified: false
      };
      
      const result = validateOnboardingState(state);
      expect(result.complete).toBe(false);
      expect(result.nextStep).toBe('passwordSet');
    });

    it('should calculate progress correctly', () => {
      const state = {
        walletCreated: true,
        passwordSet: true,
        backupVerified: false
      };
      
      const result = validateOnboardingState(state);
      expect(result.progress).toBeCloseTo(2/3, 2);
    });

    it('should return walletCreated as first step when empty', () => {
      const result = validateOnboardingState({});
      expect(result.nextStep).toBe('walletCreated');
      expect(result.progress).toBe(0);
    });
  });

  describe('Full Onboarding Flow', () => {
    it('should complete full flow successfully', async () => {
      mockApiResponse({ success: true, userId: 'user123' });
      
      // Step 1: Create wallet
      const wallet = await createWallet('generate');
      expect(wallet.mnemonic).toBeDefined();
      
      // Step 2: Set password
      const passwordResult = await setPassword('SecurePass123!', 'SecurePass123!');
      expect(passwordResult.success).toBe(true);
      
      // Step 3: Verify backup
      const words = wallet.mnemonic.split(' ');
      const backupResult = await backupRecoveryPhrase(wallet.mnemonic, {
        0: words[0],
        5: words[5],
        11: words[11]
      });
      expect(backupResult.verified).toBe(true);
      
      // Step 4: Complete
      const completeResult = await completeOnboarding(wallet.address);
      expect(completeResult.success).toBe(true);
    });

    it('should track state through flow', async () => {
      const state = {
        walletCreated: false,
        passwordSet: false,
        backupVerified: false
      };
      
      // Check initial state
      expect(validateOnboardingState(state).progress).toBe(0);
      
      // Create wallet
      await createWallet('generate');
      state.walletCreated = true;
      expect(validateOnboardingState(state).progress).toBeCloseTo(1/3, 2);
      
      // Set password
      await setPassword('password123', 'password123');
      state.passwordSet = true;
      expect(validateOnboardingState(state).progress).toBeCloseTo(2/3, 2);
      
      // Verify backup
      state.backupVerified = true;
      expect(validateOnboardingState(state).complete).toBe(true);
    });
  });
});
