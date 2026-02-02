import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  otpSent: boolean;
  loading: boolean;
  error: string | null;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  email: null,
  otpSent: false,
  loading: false,
  error: null,

  sendOtp: async (email: string) => {
    set({ loading: true, error: null });
    try {
      // TODO: integrate with actual auth service
      // For now, simulate OTP send
      await new Promise((r) => setTimeout(r, 800));
      set({ email, otpSent: true, loading: false });
      window.parent.postMessage({ type: 'PROOFI_OTP_SENT', email }, '*');
    } catch {
      set({ error: 'Failed to send verification code', loading: false });
    }
  },

  verifyOtp: async (code: string) => {
    set({ loading: true, error: null });
    try {
      // TODO: integrate with actual auth verification
      await new Promise((r) => setTimeout(r, 600));
      if (code.length !== 6) {
        set({ error: 'Invalid code', loading: false });
        return;
      }
      set({ isAuthenticated: true, loading: false });
      window.parent.postMessage(
        { type: 'PROOFI_AUTHENTICATED', email: get().email },
        '*',
      );
    } catch {
      set({ error: 'Verification failed', loading: false });
    }
  },

  logout: () => {
    set({ isAuthenticated: false, email: null, otpSent: false });
    window.parent.postMessage({ type: 'PROOFI_LOGGED_OUT' }, '*');
  },

  clearError: () => set({ error: null }),
}));
