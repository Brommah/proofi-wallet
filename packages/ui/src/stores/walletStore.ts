import { create } from 'zustand';
import type { KeyPairData } from '@proofi/core';

interface ConnectedApp {
  name: string;
  origin: string;
  connectedAt: number;
  permissions: string[];
}

interface WalletState {
  address: string | null;
  keypair: KeyPairData | null;
  isConnected: boolean;
  connectedApps: ConnectedApp[];
  connect: (address: string, keypair?: KeyPairData) => void;
  disconnect: () => void;
  setKeypair: (keypair: KeyPairData) => void;
  sign: (message: Uint8Array | string) => Uint8Array | null;
  addConnectedApp: (app: ConnectedApp) => void;
  removeConnectedApp: (origin: string) => void;
}

export const useWalletStore = create<WalletState>()((set, get) => ({
  address: null,
  keypair: null,
  isConnected: false,
  connectedApps: [],

  connect: (address: string, keypair?: KeyPairData) => {
    set({ address, keypair: keypair || null, isConnected: true });
    window.parent.postMessage({ type: 'PROOFI_CONNECTED', address }, '*');
  },

  disconnect: () => {
    set({ address: null, keypair: null, isConnected: false, connectedApps: [] });
    window.parent.postMessage({ type: 'PROOFI_DISCONNECTED' }, '*');
  },

  setKeypair: (keypair: KeyPairData) => {
    set({ keypair, address: keypair.address });
  },

  sign: (message: Uint8Array | string): Uint8Array | null => {
    const { keypair } = get();
    if (!keypair) {
      console.error('No keypair available for signing');
      return null;
    }
    const msgBytes = typeof message === 'string' 
      ? new TextEncoder().encode(message) 
      : message;
    return keypair.sign(msgBytes);
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
