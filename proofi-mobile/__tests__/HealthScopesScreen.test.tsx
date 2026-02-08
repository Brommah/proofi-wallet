import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { HealthScopesScreen, HealthScope } from '../src/screens/HealthScopesScreen';

describe('HealthScopesScreen', () => {
  it('renders all default scopes', () => {
    render(<HealthScopesScreen />);
    
    // Check that all scope names are rendered
    expect(screen.getByText('Steps')).toBeTruthy();
    expect(screen.getByText('Heart Rate')).toBeTruthy();
    expect(screen.getByText('HRV')).toBeTruthy();
    expect(screen.getByText('Sleep')).toBeTruthy();
    expect(screen.getByText('Blood Oxygen')).toBeTruthy();
    expect(screen.getByText('Workouts')).toBeTruthy();
    expect(screen.getByText('Nutrition')).toBeTruthy();
    expect(screen.getByText('Body Metrics')).toBeTruthy();
  });

  it('displays header correctly', () => {
    render(<HealthScopesScreen />);
    
    expect(screen.getByText('DATA SCOPES')).toBeTruthy();
    expect(screen.getByText('Your Health Data')).toBeTruthy();
  });

  it('shows correct initial selected count', () => {
    render(<HealthScopesScreen />);
    
    // Check for the 0 selected count
    const stats = screen.getAllByText('0');
    expect(stats.length).toBeGreaterThan(0);
  });

  it('calls onScopesChange when toggling a scope', () => {
    const mockOnChange = jest.fn();
    render(<HealthScopesScreen onScopesChange={mockOnChange} />);
    
    // Find and press the Steps scope
    const stepsScope = screen.getByText('Steps');
    fireEvent.press(stepsScope);
    
    // Verify callback was called
    expect(mockOnChange).toHaveBeenCalled();
    
    // Check the updated scopes have steps enabled
    const updatedScopes = mockOnChange.mock.calls[0][0] as HealthScope[];
    const stepsScopes = updatedScopes.find(s => s.id === 'steps');
    expect(stepsScopes?.enabled).toBe(true);
  });

  it('supports initial scopes prop', () => {
    const initialScopes: HealthScope[] = [
      {
        id: 'steps',
        name: 'Steps',
        description: 'Daily step count',
        icon: '👟',
        path: 'health/steps/*',
        enabled: true, // Pre-enabled
      },
    ];
    
    render(<HealthScopesScreen initialScopes={initialScopes} />);
    
    // Verify the component renders with initial scopes
    expect(screen.getByText('Steps')).toBeTruthy();
  });

  it('handles select all functionality', () => {
    const mockOnChange = jest.fn();
    render(<HealthScopesScreen onScopesChange={mockOnChange} />);
    
    // Find and press SELECT ALL
    const selectAllButton = screen.getByText('SELECT ALL');
    fireEvent.press(selectAllButton);
    
    // Verify callback was called with all scopes enabled
    expect(mockOnChange).toHaveBeenCalled();
    const updatedScopes = mockOnChange.mock.calls[0][0] as HealthScope[];
    expect(updatedScopes.every(s => s.enabled)).toBe(true);
  });

  it('displays privacy guarantee card', () => {
    render(<HealthScopesScreen />);
    
    expect(screen.getByText('PRIVACY GUARANTEE')).toBeTruthy();
    expect(screen.getByText(/Data is processed locally/)).toBeTruthy();
  });

  it('shows scope paths in mono font', () => {
    render(<HealthScopesScreen />);
    
    // Check that scope paths are rendered
    expect(screen.getByText('health/steps/*')).toBeTruthy();
    expect(screen.getByText('health/heartRate/*')).toBeTruthy();
  });
});
