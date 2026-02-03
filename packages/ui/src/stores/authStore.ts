import { create } from 'zustand';
import type { KeyPairData } from '@proofi/core';
import { useWalletStore } from './walletStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3847';

interface AuthState {
  // Auth flow state
  isAuthenticated: boolean;
  email: string | null;
  otpSent: boolean;
  otpVerified: boolean;  // v2: true after OTP, waiting for PIN
  derivationSalt: string | null;  // v2: received after OTP verify
  hasExistingWallet: boolean;  // v2: true if user already has a registered address
  existingAddress: string | null;  // v2: the user's registered address (if any)
  token: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  setupPin: (pin: string) => Promise<void>;  // v2: derive key from PIN + salt
  restoreSession: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

/**
 * v2: Derive seed from PIN + derivation salt using PBKDF2.
 * Returns a 32-byte hex seed.
 */
async function deriveSeedFromPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Import PIN as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  // PBKDF2 with salt
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: encoder.encode(salt),
      iterations: 100000,  // 100k iterations for security
    },
    keyMaterial,
    256,  // 32 bytes
  );

  // Convert to hex
  const bytes = new Uint8Array(derivedBits);
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derive an sr25519 keypair from a hex seed using KeyringManager.
 */
async function deriveKeypairFromSeed(seedHex: string): Promise<KeyPairData> {
  const { KeyringManager } = await import('@proofi/core');
  const mgr = new KeyringManager();
  mgr.ss58Prefix = 54; // Cere network
  await mgr.init();

  const pair = mgr.importKey({
    type: 'sr25519',
    secretKey: seedHex,
    label: 'proofi-wallet',
    purposes: ['transaction', 'credential', 'authentication'],
  });

  return pair;
}

/**
 * Encrypt seed with PIN for secure storage.
 */
async function encryptSeed(seed: string, pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Derive AES key from PIN
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode('proofi-encrypt'), iterations: 50000 },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(seed),
  );

  // Return iv:ciphertext as base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt seed with PIN.
 */
async function decryptSeed(encrypted: string, pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  // Derive AES key from PIN
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode('proofi-encrypt'), iterations: 50000 },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );

  return decoder.decode(plaintext);
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  isAuthenticated: false,
  email: null,
  otpSent: false,
  otpVerified: false,
  derivationSalt: null,
  hasExistingWallet: false,
  existingAddress: null,
  token: null,
  loading: false,
  error: null,

  sendOtp: async (email: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send OTP');
      }
      set({ email, otpSent: true, loading: false });
      window.parent.postMessage({ type: 'PROOFI_OTP_SENT', email }, '*');
    } catch (e: any) {
      set({ error: e.message || 'Failed to send verification code', loading: false });
    }
  },

  verifyOtp: async (code: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: get().email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Store JWT token and derivation salt
      localStorage.setItem('proofi_token', data.token);
      localStorage.setItem('proofi_email', data.email);

      // v2: Now waiting for PIN to derive key
      // Store hasAddress so PinScreen can show restore vs create flow
      set({ 
        otpVerified: true,
        derivationSalt: data.derivationSalt,
        hasExistingWallet: !!data.hasAddress,
        existingAddress: data.address || null,
        token: data.token,
        loading: false,
      });

      // If user already has an address, they need to enter PIN to restore
      // If new user, they'll create a new PIN
      window.parent.postMessage({ 
        type: 'PROOFI_OTP_VERIFIED', 
        email: get().email,
        hasAddress: data.hasAddress,
      }, '*');

    } catch (e: any) {
      set({ error: e.message || 'Verification failed', loading: false });
    }
  },

  /**
   * v2: Create wallet from PIN + derivation salt.
   * Called after OTP verification.
   * 
   * For new users: creates a new wallet and registers the address.
   * For existing users: verifies PIN unlocks the correct wallet.
   */
  setupPin: async (pin: string) => {
    const { derivationSalt, token, email, hasExistingWallet, existingAddress } = get();
    console.log('[setupPin] Starting...', { 
      hasDerivationSalt: !!derivationSalt, 
      hasToken: !!token, 
      hasExistingWallet, 
      existingAddress 
    });
    
    if (!derivationSalt || !token) {
      console.error('[setupPin] Missing derivationSalt or token');
      set({ error: 'Please verify OTP first' });
      return;
    }

    set({ loading: true, error: null });
    try {
      // Derive seed from PIN + salt (server never sees this)
      console.log('[setupPin] Deriving seed from PIN + salt...');
      const seed = await deriveSeedFromPin(pin, derivationSalt);
      console.log('[setupPin] Seed derived, length:', seed.length);
      
      // Create keypair from seed
      console.log('[setupPin] Creating keypair...');
      const keypair = await deriveKeypairFromSeed(seed);
      console.log('[setupPin] Keypair created:', keypair.address);
      
      // For existing users: verify the derived address matches stored address
      if (hasExistingWallet && existingAddress) {
        if (keypair.address !== existingAddress) {
          console.error('[setupPin] ❌ Address mismatch! Wrong PIN.');
          console.log('[setupPin] Expected:', existingAddress);
          console.log('[setupPin] Got:', keypair.address);
          set({ 
            error: 'Wrong PIN. The PIN you entered doesn\'t match your wallet.', 
            loading: false 
          });
          return;
        }
        console.log('[setupPin] ✅ Address verified, PIN correct!');
      }
      
      // Store encrypted seed for session restore
      console.log('[setupPin] Encrypting seed...');
      const encryptedSeed = await encryptSeed(seed, pin);
      localStorage.setItem('proofi_encrypted_seed', encryptedSeed);
      localStorage.setItem('proofi_address', keypair.address);

      // Register address with server (server only sees public address)
      // For existing users this is idempotent
      console.log('[setupPin] Registering address with server...');
      const res = await fetch(`${API_URL}/auth/register-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ address: keypair.address }),
      });
      console.log('[setupPin] Server response:', res.status);

      // Connect wallet with full keypair
      useWalletStore.getState().connect(keypair.address, keypair);

      set({ isAuthenticated: true, loading: false });
      console.log('[setupPin] ✅ Wallet', hasExistingWallet ? 'restored' : 'created', 'successfully!');
      window.parent.postMessage(
        { type: 'PROOFI_AUTHENTICATED', email, address: keypair.address },
        '*',
      );
    } catch (e: any) {
      console.error('[setupPin] ❌ Error:', e);
      set({ error: e.message || 'Failed to create wallet', loading: false });
    }
  },

  /**
   * Restore session from stored encrypted seed.
   * Requires PIN to decrypt.
   */
  restoreSession: async () => {
    const token = localStorage.getItem('proofi_token');
    const email = localStorage.getItem('proofi_email');
    const encryptedSeed = localStorage.getItem('proofi_encrypted_seed');
    
    if (!token || !email) return;

    // If we have encrypted seed, user needs to enter PIN to decrypt
    // For now, just restore the address without signing capability
    const cachedAddress = localStorage.getItem('proofi_address');
    if (cachedAddress) {
      // Connect without keypair (read-only mode until PIN entered)
      useWalletStore.getState().connect(cachedAddress);
      set({ isAuthenticated: true, email });
      
      // Signal that PIN is needed to unlock full signing
      if (encryptedSeed) {
        window.parent.postMessage({ type: 'PROOFI_NEEDS_PIN_UNLOCK', email, address: cachedAddress }, '*');
      }
    }
  },

  logout: () => {
    localStorage.removeItem('proofi_token');
    localStorage.removeItem('proofi_email');
    localStorage.removeItem('proofi_address');
    localStorage.removeItem('proofi_encrypted_seed');
    useWalletStore.getState().disconnect();
    set({ 
      isAuthenticated: false, 
      email: null, 
      otpSent: false, 
      otpVerified: false,
      derivationSalt: null,
      hasExistingWallet: false,
      existingAddress: null,
      token: null,
    });
    window.parent.postMessage({ type: 'PROOFI_LOGGED_OUT' }, '*');
  },

  clearError: () => set({ error: null }),
}));
