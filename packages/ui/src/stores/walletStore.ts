import { create } from 'zustand';

interface ConnectedApp {
  name: string;
  origin: string;
  connectedAt: number;
  permissions: string[];
}

interface WalletState {
  address: string | null;
  isConnected: boolean;
  connectedApps: ConnectedApp[];
  connect: (address: string) => void;
  disconnect: () => void;
  addConnectedApp: (app: ConnectedApp) => void;
  removeConnectedApp: (origin: string) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  isConnected: false,
  connectedApps: [],

  connect: (address: string) => {
    set({ address, isConnected: true });
    window.parent.postMessage({ type: 'PROOFI_CONNECTED', address }, '*');
  },

  disconnect: () => {
    set({ address: null, isConnected: false, connectedApps: [] });
    window.parent.postMessage({ type: 'PROOFI_DISCONNECTED' }, '*');
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
