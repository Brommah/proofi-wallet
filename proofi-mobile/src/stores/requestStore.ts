import { create } from 'zustand';

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
    // In mobile, we handle this via deep links or push notification callbacks
    set({ pendingRequest: null });
  },

  reject: () => {
    const req = get().pendingRequest;
    if (!req) return;
    set({ pendingRequest: null });
  },

  clear: () => set({ pendingRequest: null }),
}));
