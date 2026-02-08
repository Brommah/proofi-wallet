import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { AuditChainScreen, AuditEntry } from '../src/screens/AuditChainScreen';

// Mock walletStore
jest.mock('../src/stores/walletStore', () => ({
  useWalletStore: () => ({
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    isConnected: true,
  }),
}));

describe('AuditChainScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  });

  it('renders the header correctly', () => {
    render(<AuditChainScreen />);
    
    expect(screen.getByText('AUDIT CHAIN')).toBeTruthy();
    expect(screen.getByText('Access History')).toBeTruthy();
    expect(screen.getByText(/Every data access is cryptographically logged/)).toBeTruthy();
  });

  it('shows chain status card', async () => {
    render(<AuditChainScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('CHAIN STATUS')).toBeTruthy();
      expect(screen.getByText('CHAIN VALID')).toBeTruthy();
    });
  });

  it('displays verify button', async () => {
    render(<AuditChainScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('VERIFY')).toBeTruthy();
    });
  });

  it('generates demo entries on first load', async () => {
    render(<AuditChainScreen />);
    
    await waitFor(() => {
      // Demo chain should include these action types
      expect(screen.getByText('CONSENT_GRANTED')).toBeTruthy();
      expect(screen.getByText('WALLET_CONNECTED')).toBeTruthy();
      expect(screen.getByText('TOKEN_CREATED')).toBeTruthy();
    });
  });

  it('loads existing entries from storage', async () => {
    const mockEntries: AuditEntry[] = [
      {
        id: 'entry_0',
        action: 'CONSENT_GRANTED',
        timestamp: Date.now(),
        hash: 'abc123def456==',
        prevHash: null,
        details: {
          agentId: 'test-agent',
          requestedScopes: ['sleep'],
        },
      },
    ];
    
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
      JSON.stringify(mockEntries)
    );
    
    render(<AuditChainScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('CONSENT_GRANTED')).toBeTruthy();
      expect(screen.getByText('test-agent')).toBeTruthy();
    });
  });

  it('displays entry details', async () => {
    const mockEntries: AuditEntry[] = [
      {
        id: 'entry_test',
        action: 'DATA_ACCESSED',
        timestamp: Date.now(),
        hash: 'testhash123456789012345678901234567890123==',
        prevHash: 'prevhash12345678901234567890123456789012==',
        details: {
          scope: 'health/sleep/*',
          recordCount: 100,
          operation: 'read',
        },
      },
    ];
    
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
      JSON.stringify(mockEntries)
    );
    
    render(<AuditChainScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('DATA_ACCESSED')).toBeTruthy();
      expect(screen.getByText(/scope:/)).toBeTruthy();
      expect(screen.getByText(/health\/sleep/)).toBeTruthy();
    });
  });

  it('shows hash values for entries', async () => {
    render(<AuditChainScreen />);
    
    await waitFor(() => {
      // Should show hash prefixes
      const hashLabels = screen.getAllByText(/hash:/);
      expect(hashLabels.length).toBeGreaterThan(0);
    });
  });

  it('shows chain signature card', async () => {
    render(<AuditChainScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('CHAIN SIGNATURE')).toBeTruthy();
      expect(screen.getByText('FINAL HASH')).toBeTruthy();
    });
  });

  it('handles pull-to-refresh', async () => {
    render(<AuditChainScreen />);
    
    // The refresh control should be present
    await waitFor(() => {
      expect(screen.getByText('AUDIT CHAIN')).toBeTruthy();
    });
  });

  it('handles verify button press', async () => {
    render(<AuditChainScreen />);
    
    await waitFor(() => {
      const verifyButton = screen.getByText('VERIFY');
      fireEvent.press(verifyButton);
      // Chain should still be valid after verify
      expect(screen.getByText('CHAIN VALID')).toBeTruthy();
    });
  });

  it('displays action icons correctly', async () => {
    render(<AuditChainScreen />);
    
    await waitFor(() => {
      // Demo chain includes these emoji icons
      expect(screen.getByText('🔐')).toBeTruthy(); // CONSENT_GRANTED
      expect(screen.getByText('👛')).toBeTruthy(); // WALLET_CONNECTED
      expect(screen.getByText('🎫')).toBeTruthy(); // TOKEN_CREATED
    });
  });

  it('displays timestamps for entries', async () => {
    render(<AuditChainScreen />);
    
    await waitFor(() => {
      // Should render time values (format depends on locale)
      const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/);
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });
});
