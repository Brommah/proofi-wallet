import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady, decodeAddress } from '@polkadot/util-crypto';

/** Check if an address has a valid SS58 checksum (legacy addresses don't) */
function isValidSS58(address: string): boolean {
  try {
    decodeAddress(address); // throws on bad checksum
    return true;
  } catch {
    return false;
  }
}
import { API_URL } from '../constants/api';
import { useWalletStore } from './walletStore';
import { deriveSeedFromPin, encryptSeed, decryptSeed } from '../lib/crypto';

interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  otpSent: boolean;
  otpVerified: boolean;
  derivationSalt: string | null;
  hasExistingWallet: boolean;
  existingAddress: string | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  setupPin: (pin: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

/**
 * Derive an sr25519 keypair and SS58 address from a hex seed.
 * Uses @polkadot/keyring — identical to the web wallet's KeyringManager.importSr25519.
 *
 * Web equivalent:
 *   const keyring = new Keyring({ type: 'sr25519', ss58Format: 54 });
 *   const pair = keyring.addFromUri(seedHex);
 */
async function deriveKeypair(seedHex: string) {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 54 });
  return keyring.addFromUri(seedHex);
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
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      // Store JWT token securely
      await SecureStore.setItemAsync('proofi_token', data.token);
      await SecureStore.setItemAsync('proofi_email', data.email);

      set({
        otpVerified: true,
        derivationSalt: data.derivationSalt,
        hasExistingWallet: !!data.hasAddress,
        existingAddress: data.address || null,
        token: data.token,
        loading: false,
      });
    } catch (e: any) {
      set({ error: e.message || 'Verification failed', loading: false });
    }
  },

  setupPin: async (pin: string) => {
    const { derivationSalt, token, email, hasExistingWallet, existingAddress } = get();
    if (!derivationSalt || !token) {
      set({ error: 'Please verify OTP first' });
      return;
    }

    set({ loading: true, error: null });
    try {
      // 1. Derive seed from PIN + salt using PBKDF2-SHA256 (100k iterations)
      //    Matches web: crypto.subtle.deriveBits({ name:'PBKDF2', hash:'SHA-256', salt, iterations:100000 }, key, 256)
      const seed = deriveSeedFromPin(pin, derivationSalt);

      // 2. Create sr25519 keypair from seed using @polkadot/keyring
      //    Matches web: KeyringManager.importKey({ type:'sr25519', secretKey: seed })
      //    Which internally does: keyring.addFromUri(u8aToHex(secretKeyBytes))
      const pair = await deriveKeypair(seed);
      const address = pair.address;

      // 3. For existing users: verify the derived address matches
      //    Skip check if existing address has invalid SS58 checksum (pre-migration wallet)
      const isLegacyAddress = existingAddress && !isValidSS58(existingAddress);
      if (hasExistingWallet && existingAddress && !isLegacyAddress) {
        if (address !== existingAddress) {
          set({
            error: "Wrong PIN. The PIN you entered doesn't match your wallet.",
            loading: false,
          });
          return;
        }
      }

      // 4. Encrypt and store seed securely
      const encryptedSeed = await encryptSeed(seed, pin);
      await SecureStore.setItemAsync('proofi_encrypted_seed', encryptedSeed);
      await SecureStore.setItemAsync('proofi_address', address);

      // 5. Register address with server
      await fetch(`${API_URL}/auth/register-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ address }),
      });

      // 6. Connect wallet
      useWalletStore.getState().connect(address, seed);

      set({ isAuthenticated: true, loading: false });
    } catch (e: any) {
      set({ error: e.message || 'Failed to create wallet', loading: false });
    }
  },

  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('proofi_token');
      const email = await SecureStore.getItemAsync('proofi_email');
      const address = await SecureStore.getItemAsync('proofi_address');

      if (!token || !email || !address) return;

      // Restore read-only mode (PIN/biometric needed for signing)
      useWalletStore.getState().connect(address);
      set({ isAuthenticated: true, email, token });
    } catch {
      // Silently fail — user will need to re-authenticate
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('proofi_token');
    await SecureStore.deleteItemAsync('proofi_email');
    await SecureStore.deleteItemAsync('proofi_address');
    await SecureStore.deleteItemAsync('proofi_encrypted_seed');
    await SecureStore.deleteItemAsync('proofi_biometric_enabled');
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
  },

  clearError: () => set({ error: null }),
}));
