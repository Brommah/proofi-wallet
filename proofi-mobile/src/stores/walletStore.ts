import { create } from 'zustand';
import { API_URL, CERE_DECIMALS } from '../constants/api';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { blake2b } from '@noble/hashes/blake2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

// Substrate RPC endpoints (HTTP — no WebSocket needed)
const RPC_ENDPOINTS = [
  'https://archive.mainnet.cere.network',
  'https://rpc.mainnet.cere.network',
];

interface ConnectedApp {
  name: string;
  origin: string;
  connectedAt: number;
  permissions: string[];
}

interface WalletState {
  address: string | null;
  seedHex: string | null;
  isConnected: boolean;
  isUnlocked: boolean;
  balance: string | null;
  balanceLoading: boolean;
  connectedApps: ConnectedApp[];

  connect: (address: string, seedHex?: string) => void;
  disconnect: () => void;
  unlock: (seedHex: string) => void;
  fetchBalance: () => Promise<void>;
  addConnectedApp: (app: ConnectedApp) => void;
  removeConnectedApp: (origin: string) => void;
}

export const useWalletStore = create<WalletState>()((set, get) => ({
  address: null,
  seedHex: null,
  isConnected: false,
  isUnlocked: false,
  balance: null,
  balanceLoading: false,
  connectedApps: [],

  connect: (address: string, seedHex?: string) => {
    set({
      address,
      seedHex: seedHex || null,
      isConnected: true,
      isUnlocked: !!seedHex,
    });
    // Auto-fetch balance on connect
    setTimeout(() => get().fetchBalance(), 100);
  },

  disconnect: () => {
    set({
      address: null,
      seedHex: null,
      isConnected: false,
      isUnlocked: false,
      balance: null,
      connectedApps: [],
    });
  },

  unlock: (seedHex: string) => {
    set({ seedHex, isUnlocked: true });
  },

  fetchBalance: async () => {
    const { address } = get();
    if (!address) {
      console.log('[wallet] fetchBalance: no address');
      return;
    }
    console.log('[wallet] fetchBalance starting for:', address);
    set({ balanceLoading: true });
    try {
      // Try API first, fallback to direct RPC
      let balance: string | null = null;

      // Method 1: API endpoint
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${API_URL}/balance/${address}`, { signal: controller.signal });
        clearTimeout(timer);
        console.log('[wallet] API balance response:', res.status);
        if (res.ok) {
          const data = await res.json();
          balance = data.formatted || null;
        }
      } catch (e) {
        console.log('[wallet] API balance failed:', e);
      }

      // Method 2: Direct HTTP RPC (no WebSocket needed)
      if (!balance) {
        console.log('[wallet] Falling back to direct RPC');
        balance = await fetchBalanceViaRpc(address);
      }

      console.log('[wallet] Final balance:', balance);
      set({ balance: balance || '0.00', balanceLoading: false });
    } catch (e) {
      console.error('[wallet] fetchBalance error:', e);
      set({ balance: '0.00', balanceLoading: false });
    }
  },

  addConnectedApp: (app: ConnectedApp) => {
    set((state) => ({
      connectedApps: [
        ...state.connectedApps.filter((a) => a.origin !== app.origin),
        app,
      ],
    }));
  },

  removeConnectedApp: (origin: string) => {
    set((state) => ({
      connectedApps: state.connectedApps.filter((a) => a.origin !== origin),
    }));
  },
}));

/**
 * Fetch balance via Substrate HTTP JSON-RPC (no WebSocket needed).
 * Uses system.account storage query with SCALE-encoded key.
 */
async function fetchBalanceViaRpc(address: string): Promise<string | null> {
  try {
    // Normalize address & get public key
    let pubkey: Uint8Array;
    try {
      pubkey = decodeAddress(address, true); // ignoreChecksum for legacy addresses
    } catch (e) {
      console.warn('[wallet] decodeAddress failed:', e);
      return null;
    }

    // Build storage key for system.account(pubkey)
    // system.account hash: 0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9
    // + blake2_128_concat(pubkey)
    const pubkeyHex = u8aToHex(pubkey).slice(2); // remove 0x
    // blake2b with 16-byte (128-bit) output — pure JS, no WASM needed
    const blake2Hash = bytesToHex(blake2b(pubkey, { dkLen: 16 }));
    const storageKey = `0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9${blake2Hash}${pubkeyHex}`;
    console.log('[wallet] Fetching balance for', address, 'storageKey length:', storageKey.length);

    // Try each RPC endpoint
    for (const endpoint of RPC_ENDPOINTS) {
      try {
        console.log('[wallet] Trying RPC endpoint:', endpoint);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'state_getStorage',
            params: [storageKey],
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);

        const data = await res.json();
        console.log('[wallet] RPC response:', data.result ? `got ${data.result.length} chars` : 'null result', data.error || '');
        if (data.result) {
          // SCALE decode AccountInfo: nonce(4) + consumers(4) + providers(4) + sufficients(4) + data.free(16) + ...
          const hex = data.result.slice(2); // remove 0x
          // AccountInfo layout: nonce(u32=8hex) + consumers(u32=8hex) + providers(u32=8hex) + sufficients(u32=8hex) + free(u128=32hex)
          const freeHex = hex.slice(32, 64); // bytes 16-31 = free balance (little-endian u128)
          
          // Convert little-endian hex to BigInt
          const leBytes = freeHex.match(/.{2}/g) || [];
          const beHex = leBytes.reverse().join('');
          const freeBn = BigInt('0x' + beHex);
          console.log('[wallet] Decoded free balance:', freeBn.toString());
          
          const whole = freeBn / BigInt(Math.pow(10, CERE_DECIMALS));
          const frac = freeBn % BigInt(Math.pow(10, CERE_DECIMALS));
          
          if (frac === BigInt(0)) {
            return `${whole.toLocaleString()} CERE`;
          }
          // Show up to 4 decimal places (matching web wallet)
          const fracStr = frac.toString().padStart(CERE_DECIMALS, '0').slice(0, 4);
          const trimmed = fracStr.replace(/0+$/, '');
          if (trimmed) {
            return `${whole.toLocaleString()}.${trimmed} CERE`;
          }
          return `${whole.toLocaleString()} CERE`;
        }
      } catch (e) {
        console.warn('[wallet] RPC endpoint failed:', endpoint, e);
        continue; // try next endpoint
      }
    }

    return null;
  } catch (e) {
    console.error('[wallet] fetchBalanceViaRpc error:', e);
    return null;
  }
}
