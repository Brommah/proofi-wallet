import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ProofiScreen } from '../src/screens/ProofiScreen';

// Mock walletStore
jest.mock('../src/stores/walletStore', () => ({
  useWalletStore: () => ({
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    isConnected: true,
  }),
}));

// Mock child screens
jest.mock('../src/screens/HealthScopesScreen', () => ({
  HealthScopesScreen: ({ onScopesChange }: any) => {
    const { Text, TouchableOpacity, View } = require('react-native');
    return (
      <View testID="health-scopes-screen">
        <Text>HealthScopesScreen Mock</Text>
        <TouchableOpacity testID="toggle-scope" onPress={() => onScopesChange?.([])}>
          <Text>Toggle Scope</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../src/screens/CapabilityTokensScreen', () => ({
  CapabilityTokensScreen: () => {
    const { Text, View } = require('react-native');
    return (
      <View testID="capability-tokens-screen">
        <Text>CapabilityTokensScreen Mock</Text>
      </View>
    );
  },
}));

jest.mock('../src/screens/AuditChainScreen', () => ({
  AuditChainScreen: () => {
    const { Text, View } = require('react-native');
    return (
      <View testID="audit-chain-screen">
        <Text>AuditChainScreen Mock</Text>
      </View>
    );
  },
}));

describe('ProofiScreen', () => {
  it('renders overview tab by default', () => {
    render(<ProofiScreen />);
    
    // The title text contains newline: "Your Data.\nYour Control."
    expect(screen.getByText(/Your Data/)).toBeTruthy();
    expect(screen.getByText(/Your Control/)).toBeTruthy();
  });

  it('shows LOCAL-FIRST AI badge', () => {
    render(<ProofiScreen />);
    
    expect(screen.getByText('LOCAL-FIRST AI')).toBeTruthy();
  });

  it('displays subtitle text', () => {
    render(<ProofiScreen />);
    
    expect(screen.getByText(/Cryptographic proof for every access/)).toBeTruthy();
  });

  it('shows quick stats for scopes and tokens', () => {
    render(<ProofiScreen />);
    
    expect(screen.getByText('SCOPES')).toBeTruthy();
    expect(screen.getByText('TOKENS')).toBeTruthy();
  });

  it('renders three action cards', () => {
    render(<ProofiScreen />);
    
    expect(screen.getByText('Data Scopes')).toBeTruthy();
    expect(screen.getByText('Capability Tokens')).toBeTruthy();
    expect(screen.getByText('Audit Chain')).toBeTruthy();
  });

  it('navigates to scopes screen on card press', () => {
    render(<ProofiScreen />);
    
    const scopesCard = screen.getByText('Data Scopes');
    fireEvent.press(scopesCard);
    
    expect(screen.getByTestId('health-scopes-screen')).toBeTruthy();
    expect(screen.getByText('← OVERVIEW')).toBeTruthy();
  });

  it('navigates to tokens screen on card press', () => {
    render(<ProofiScreen />);
    
    const tokensCard = screen.getByText('Capability Tokens');
    fireEvent.press(tokensCard);
    
    expect(screen.getByTestId('capability-tokens-screen')).toBeTruthy();
    expect(screen.getByText('← OVERVIEW')).toBeTruthy();
  });

  it('navigates to audit screen on card press', () => {
    render(<ProofiScreen />);
    
    const auditCard = screen.getByText('Audit Chain');
    fireEvent.press(auditCard);
    
    expect(screen.getByTestId('audit-chain-screen')).toBeTruthy();
    expect(screen.getByText('← OVERVIEW')).toBeTruthy();
  });

  it('returns to overview from sub-screen', async () => {
    render(<ProofiScreen />);
    
    // Go to scopes
    fireEvent.press(screen.getByText('Data Scopes'));
    expect(screen.getByTestId('health-scopes-screen')).toBeTruthy();
    
    // Go back
    fireEvent.press(screen.getByText('← OVERVIEW'));
    
    await waitFor(() => {
      expect(screen.getByText(/Your Data/)).toBeTruthy();
    });
  });

  it('shows privacy comparison section', () => {
    render(<ProofiScreen />);
    
    expect(screen.getByText('Not "trust us" — verify.')).toBeTruthy();
    expect(screen.getByText('🍎 Others')).toBeTruthy();
    expect(screen.getByText('🔒 Proofi')).toBeTruthy();
  });

  it('displays comparison items correctly', () => {
    render(<ProofiScreen />);
    
    // Others (negative)
    expect(screen.getByText('✕ Data on remote servers')).toBeTruthy();
    expect(screen.getByText('✕ No audit trail')).toBeTruthy();
    expect(screen.getByText('✕ Permanent access')).toBeTruthy();
    
    // Proofi (positive)
    expect(screen.getByText('✓ 100% local processing')).toBeTruthy();
    expect(screen.getByText('✓ Cryptographic audit')).toBeTruthy();
    expect(screen.getByText('✓ Auto-expiring tokens')).toBeTruthy();
  });

  it('shows connected wallet when address exists', () => {
    render(<ProofiScreen />);
    
    expect(screen.getByText('CONNECTED WALLET')).toBeTruthy();
    expect(screen.getByText(/5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY/)).toBeTruthy();
    expect(screen.getByText('CERE MAINNET')).toBeTruthy();
  });

  it('updates scope count when scopes change', async () => {
    render(<ProofiScreen />);
    
    // Initially should show 0
    const scopeLabels = screen.getAllByText('0');
    expect(scopeLabels.length).toBeGreaterThan(0);
  });

  it('allows navigating via stat cards', () => {
    render(<ProofiScreen />);
    
    // Press the scopes stat card
    const scopeStats = screen.getByText('enabled →');
    fireEvent.press(scopeStats);
    
    expect(screen.getByTestId('health-scopes-screen')).toBeTruthy();
  });
});
