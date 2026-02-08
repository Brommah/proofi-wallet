import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { CapabilityTokensScreen, CapabilityToken } from '../src/screens/CapabilityTokensScreen';
import { HealthScope } from '../src/screens/HealthScopesScreen';

describe('CapabilityTokensScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  });

  it('renders the header correctly', async () => {
    render(<CapabilityTokensScreen />);
    
    expect(screen.getByText('CAPABILITY TOKENS')).toBeTruthy();
    expect(screen.getByText('Agent Access')).toBeTruthy();
    expect(screen.getByText(/Manage which AI agents/)).toBeTruthy();
  });

  it('shows empty state when no tokens', async () => {
    render(<CapabilityTokensScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('No Tokens Yet')).toBeTruthy();
    });
    expect(screen.getByText(/Grant access to an AI agent/)).toBeTruthy();
  });

  it('renders grant new access button', () => {
    render(<CapabilityTokensScreen />);
    
    expect(screen.getByText('GRANT NEW ACCESS')).toBeTruthy();
  });

  it('opens grant modal when pressing button', async () => {
    render(<CapabilityTokensScreen />);
    
    const grantButton = screen.getByText('GRANT NEW ACCESS');
    fireEvent.press(grantButton);
    
    await waitFor(() => {
      expect(screen.getByText('GRANT ACCESS TO AGENT')).toBeTruthy();
      expect(screen.getByText('SELECT AGENT')).toBeTruthy();
    });
  });

  it('shows available agents in grant modal', async () => {
    render(<CapabilityTokensScreen />);
    
    fireEvent.press(screen.getByText('GRANT NEW ACCESS'));
    
    await waitFor(() => {
      expect(screen.getByText('Health Analyzer')).toBeTruthy();
      expect(screen.getByText('Cross-Source Intel')).toBeTruthy();
      expect(screen.getByText('Sleep Coach')).toBeTruthy();
      expect(screen.getByText('Fitness Tracker')).toBeTruthy();
    });
  });

  it('shows expiry options in grant modal', async () => {
    render(<CapabilityTokensScreen />);
    
    fireEvent.press(screen.getByText('GRANT NEW ACCESS'));
    
    await waitFor(() => {
      expect(screen.getByText('TOKEN EXPIRY')).toBeTruthy();
      expect(screen.getByText('1 HOUR')).toBeTruthy();
      expect(screen.getByText('24 HOURS')).toBeTruthy();
      expect(screen.getByText('7 DAYS')).toBeTruthy();
      expect(screen.getByText('30 DAYS')).toBeTruthy();
    });
  });

  it('can cancel grant modal', async () => {
    render(<CapabilityTokensScreen />);
    
    fireEvent.press(screen.getByText('GRANT NEW ACCESS'));
    
    await waitFor(() => {
      expect(screen.getByText('CANCEL')).toBeTruthy();
    });
    
    fireEvent.press(screen.getByText('CANCEL'));
    
    await waitFor(() => {
      expect(screen.queryByText('SELECT AGENT')).toBeNull();
    });
  });

  it('displays active and expired token counts', async () => {
    const mockTokens: CapabilityToken[] = [
      {
        id: 'tok_active',
        agentId: 'proofi-health-analyzer',
        agentName: 'Health Analyzer',
        scopes: ['health/sleep/*'],
        issuedAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        status: 'active',
        usageCount: 5,
      },
      {
        id: 'tok_expired',
        agentId: 'proofi-sleep-coach',
        agentName: 'Sleep Coach',
        scopes: ['health/hrv/*'],
        issuedAt: Date.now() - 7200000,
        expiresAt: Date.now() - 3600000,
        status: 'expired',
        usageCount: 10,
      },
    ];
    
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
      JSON.stringify(mockTokens)
    );
    
    render(<CapabilityTokensScreen />);
    
    await waitFor(() => {
      // Should show 1 active, 1 expired
      expect(screen.getByText('ACTIVE')).toBeTruthy();
      expect(screen.getByText('EXPIRED')).toBeTruthy();
    });
  });

  it('displays token details for active tokens', async () => {
    const mockTokens: CapabilityToken[] = [
      {
        id: 'tok_test123',
        agentId: 'proofi-health-analyzer',
        agentName: 'Health Analyzer',
        scopes: ['health/sleep/*', 'health/hrv/*'],
        issuedAt: Date.now(),
        expiresAt: Date.now() + 3600000, // 1 hour
        status: 'active',
        usageCount: 5,
      },
    ];
    
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
      JSON.stringify(mockTokens)
    );
    
    render(<CapabilityTokensScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Health Analyzer')).toBeTruthy();
      expect(screen.getByText('tok_test123')).toBeTruthy();
      expect(screen.getByText('SCOPES')).toBeTruthy();
      expect(screen.getByText('REVOKE ACCESS')).toBeTruthy();
    });
  });

  it('uses enabledScopes prop for granting tokens', () => {
    const enabledScopes: HealthScope[] = [
      {
        id: 'sleep',
        name: 'Sleep',
        description: 'Sleep data',
        icon: '😴',
        path: 'health/sleep/*',
        enabled: true,
      },
    ];
    
    render(<CapabilityTokensScreen enabledScopes={enabledScopes} />);
    
    // Component should render without errors
    expect(screen.getByText('CAPABILITY TOKENS')).toBeTruthy();
  });
});
