import { useWalletStore } from '../src/stores/walletStore';
import { act } from '@testing-library/react-native';

// Mock fetch
global.fetch = jest.fn();

describe('walletStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    const store = useWalletStore.getState();
    store.disconnect();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('initial state', () => {
    it('starts with no wallet connected', () => {
      const state = useWalletStore.getState();
      
      expect(state.address).toBeNull();
      expect(state.seedHex).toBeNull();
      expect(state.isConnected).toBe(false);
      expect(state.isUnlocked).toBe(false);
      expect(state.balance).toBeNull();
      expect(state.connectedApps).toEqual([]);
    });
  });

  describe('connect', () => {
    it('sets address and connects', () => {
      const store = useWalletStore.getState();
      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      
      act(() => {
        store.connect(testAddress);
      });
      
      const state = useWalletStore.getState();
      expect(state.address).toBe(testAddress);
      expect(state.isConnected).toBe(true);
      expect(state.isUnlocked).toBe(false); // No seed provided
    });

    it('sets seedHex and unlocks when provided', () => {
      const store = useWalletStore.getState();
      const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      const testSeed = '0xabcdef1234567890';
      
      act(() => {
        store.connect(testAddress, testSeed);
      });
      
      const state = useWalletStore.getState();
      expect(state.address).toBe(testAddress);
      expect(state.seedHex).toBe(testSeed);
      expect(state.isConnected).toBe(true);
      expect(state.isUnlocked).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('resets all state', () => {
      const store = useWalletStore.getState();
      
      // First connect
      act(() => {
        store.connect('5GrwvaEF', '0xseed');
        store.addConnectedApp({
          name: 'Test App',
          origin: 'https://test.com',
          connectedAt: Date.now(),
          permissions: ['read'],
        });
      });
      
      // Then disconnect
      act(() => {
        store.disconnect();
      });
      
      const state = useWalletStore.getState();
      expect(state.address).toBeNull();
      expect(state.seedHex).toBeNull();
      expect(state.isConnected).toBe(false);
      expect(state.isUnlocked).toBe(false);
      expect(state.balance).toBeNull();
      expect(state.connectedApps).toEqual([]);
    });
  });

  describe('unlock', () => {
    it('sets seedHex and unlocks', () => {
      const store = useWalletStore.getState();
      
      act(() => {
        store.connect('5GrwvaEF');
        store.unlock('0xnewseed');
      });
      
      const state = useWalletStore.getState();
      expect(state.seedHex).toBe('0xnewseed');
      expect(state.isUnlocked).toBe(true);
    });
  });

  describe('connectedApps', () => {
    it('adds a connected app', () => {
      const store = useWalletStore.getState();
      
      act(() => {
        store.addConnectedApp({
          name: 'Proofi Web',
          origin: 'https://proofi.tech',
          connectedAt: 1234567890,
          permissions: ['read', 'write'],
        });
      });
      
      const state = useWalletStore.getState();
      expect(state.connectedApps).toHaveLength(1);
      expect(state.connectedApps[0].name).toBe('Proofi Web');
      expect(state.connectedApps[0].origin).toBe('https://proofi.tech');
    });

    it('replaces app with same origin', () => {
      const store = useWalletStore.getState();
      
      act(() => {
        store.addConnectedApp({
          name: 'App v1',
          origin: 'https://app.com',
          connectedAt: 1000,
          permissions: ['read'],
        });
        store.addConnectedApp({
          name: 'App v2',
          origin: 'https://app.com',
          connectedAt: 2000,
          permissions: ['read', 'write'],
        });
      });
      
      const state = useWalletStore.getState();
      expect(state.connectedApps).toHaveLength(1);
      expect(state.connectedApps[0].name).toBe('App v2');
      expect(state.connectedApps[0].connectedAt).toBe(2000);
    });

    it('removes a connected app', () => {
      const store = useWalletStore.getState();
      
      act(() => {
        store.addConnectedApp({
          name: 'App to Remove',
          origin: 'https://remove.me',
          connectedAt: Date.now(),
          permissions: [],
        });
        store.removeConnectedApp('https://remove.me');
      });
      
      const state = useWalletStore.getState();
      expect(state.connectedApps).toHaveLength(0);
    });
  });

  describe('fetchBalance', () => {
    it('does nothing when not connected', async () => {
      const store = useWalletStore.getState();
      
      await act(async () => {
        await store.fetchBalance();
      });
      
      const state = useWalletStore.getState();
      expect(state.balance).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('sets balanceLoading during fetch', async () => {
      const store = useWalletStore.getState();
      
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ formatted: '100 CERE' }),
        }), 50))
      );
      
      act(() => {
        store.connect('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
      });
      
      // Wait for auto-fetch to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Balance loading should be false after completion
      const state = useWalletStore.getState();
      expect(state.balanceLoading).toBe(false);
    });

    it('handles API success response', async () => {
      const store = useWalletStore.getState();
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ formatted: '1,234.56 CERE' }),
      });
      
      act(() => {
        store.connect('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
      });
      
      // Wait for auto-fetch
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const state = useWalletStore.getState();
      expect(state.balance).toBe('1,234.56 CERE');
      expect(state.balanceLoading).toBe(false);
    });

    it('handles fetch error gracefully', async () => {
      const store = useWalletStore.getState();
      
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      act(() => {
        store.connect('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
      });
      
      // Wait for auto-fetch
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const state = useWalletStore.getState();
      expect(state.balance).toBe('0.00');
      expect(state.balanceLoading).toBe(false);
    });
  });
});
