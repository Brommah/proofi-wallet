import { create } from 'zustand';
import { useWalletStore } from './walletStore';

export type RequestType = 'sign' | 'connect';
export type SignCategory = 'credential' | 'transaction';

interface SignRequest {
  type: 'sign';
  id: string;
  appName: string;
  appOrigin: string;
  category: SignCategory;
  method: string;
  data: string;
}

interface ConnectRequest {
  type: 'connect';
  id: string;
  appName: string;
  appOrigin: string;
  permissions: string[];
}

export type PendingRequest = SignRequest | ConnectRequest;

interface RequestState {
  pendingRequest: PendingRequest | null;
  setRequest: (request: PendingRequest) => void;
  approve: () => void;
  reject: () => void;
  clear: () => void;
}

export const useRequestStore = create<RequestState>()((set, get) => ({
  pendingRequest: null,

  setRequest: (request: PendingRequest) => {
    set({ pendingRequest: request });
  },

  approve: () => {
    const req = get().pendingRequest;
    if (!req) return;
    window.parent.postMessage(
      { type: 'PROOFI_REQUEST_APPROVED', requestId: req.id, requestType: req.type },
      '*',
    );
    // For connect requests, also send PROOFI_CONNECTED with the wallet address
    // so the SDK knows to stop polling and resolve the connection
    if (req.type === 'connect') {
      const address = useWalletStore.getState().address;
      if (address) {
        window.parent.postMessage(
          { type: 'PROOFI_CONNECTED', address },
          '*',
        );
      }
    }
    set({ pendingRequest: null });
  },

  reject: () => {
    const req = get().pendingRequest;
    if (!req) return;
    window.parent.postMessage(
      { type: 'PROOFI_REQUEST_REJECTED', requestId: req.id, requestType: req.type },
      '*',
    );
    set({ pendingRequest: null });
  },

  clear: () => set({ pendingRequest: null }),
}));
