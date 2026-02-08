/**
 * Revocation Integration Tests
 * Tests for permission revocation and data deletion
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockApiResponse, mockApiError, mockNetworkError, mockWalletAddress, mockPermissions, resetMocks } from '../setup.js';

// ═══ Revocation Utilities ═══

/**
 * Revoke a specific permission category
 */
async function revokePermission(userAddress, category) {
  const response = await fetch('/api/permissions/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: userAddress, category })
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to revoke permission');
  }
  
  return response.json();
}

/**
 * Revoke all permissions (nuclear option)
 */
async function revokeAllPermissions(userAddress) {
  const response = await fetch('/api/permissions/revoke-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: userAddress })
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to revoke all permissions');
  }
  
  return response.json();
}

/**
 * Request data deletion for a category
 */
async function requestDataDeletion(userAddress, category, options = {}) {
  const response = await fetch('/api/data/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: userAddress,
      category,
      immediate: options.immediate ?? false,
      notifyAgents: options.notifyAgents ?? true
    })
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to request data deletion');
  }
  
  return response.json();
}

/**
 * Request complete account deletion (GDPR compliance)
 */
async function requestAccountDeletion(userAddress, confirmation) {
  if (confirmation !== 'DELETE MY ACCOUNT') {
    throw new Error('Invalid confirmation phrase');
  }
  
  const response = await fetch('/api/account/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: userAddress,
      confirmation
    })
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete account');
  }
  
  return response.json();
}

/**
 * Get revocation history
 */
async function getRevocationHistory(userAddress) {
  const response = await fetch(`/api/revocations?address=${userAddress}`);
  
  if (!response.ok) {
    return { revocations: [] };
  }
  
  return response.json();
}

/**
 * Check if category has active data connections
 */
async function checkActiveConnections(userAddress, category) {
  const response = await fetch(`/api/connections/active?address=${userAddress}&category=${category}`);
  
  if (!response.ok) {
    return { connections: [] };
  }
  
  return response.json();
}

/**
 * Disconnect from a specific agent
 */
async function disconnectAgent(userAddress, agentId) {
  const response = await fetch('/api/agents/disconnect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: userAddress, agentId })
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to disconnect agent');
  }
  
  return response.json();
}

/**
 * Update local permissions after revocation
 */
function updateLocalPermissions(permissions, category, enabled) {
  return {
    ...permissions,
    [category]: {
      ...permissions[category],
      enabled,
      lastUpdated: Date.now()
    }
  };
}

/**
 * Calculate earnings impact of revocation
 */
function calculateRevocationImpact(permissions, categoriesToRevoke) {
  let monthlyLoss = 0;
  
  for (const category of categoriesToRevoke) {
    if (permissions[category]?.enabled) {
      monthlyLoss += permissions[category].price || 0;
    }
  }
  
  return {
    monthlyLoss,
    annualLoss: monthlyLoss * 12
  };
}

// ═══ Tests ═══

describe('Revocation Flow', () => {
  let userPermissions;
  const userAddress = mockWalletAddress();
  
  beforeEach(() => {
    resetMocks();
    userPermissions = mockPermissions({
      location: { enabled: true, price: 0.005 },
      health: { enabled: true, price: 0.010 },
      financial: { enabled: true, price: 0.020 }
    });
  });

  describe('revokePermission', () => {
    it('should revoke a single permission', async () => {
      mockApiResponse({ success: true, category: 'location' });
      
      const result = await revokePermission(userAddress, 'location');
      
      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/permissions/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: userAddress, category: 'location' })
      });
    });

    it('should handle revocation errors', async () => {
      mockApiError('Permission not found', 404);
      
      await expect(revokePermission(userAddress, 'unknown'))
        .rejects.toThrow('Permission not found');
    });

    it('should handle network errors', async () => {
      mockNetworkError();
      
      await expect(revokePermission(userAddress, 'location'))
        .rejects.toThrow();
    });
  });

  describe('revokeAllPermissions', () => {
    it('should revoke all permissions', async () => {
      mockApiResponse({ 
        success: true, 
        revokedCount: 3,
        categories: ['location', 'health', 'financial']
      });
      
      const result = await revokeAllPermissions(userAddress);
      
      expect(result.success).toBe(true);
      expect(result.revokedCount).toBe(3);
    });

    it('should handle already-revoked state', async () => {
      mockApiResponse({ success: true, revokedCount: 0 });
      
      const result = await revokeAllPermissions(userAddress);
      
      expect(result.revokedCount).toBe(0);
    });
  });

  describe('requestDataDeletion', () => {
    it('should request deletion with default options', async () => {
      mockApiResponse({ 
        success: true, 
        deletionId: 'del-123',
        scheduledAt: Date.now() + 86400000 // 24h from now
      });
      
      const result = await requestDataDeletion(userAddress, 'location');
      
      expect(result.deletionId).toBeDefined();
      
      const body = JSON.parse(fetch.mock.calls[0][1].body);
      expect(body.immediate).toBe(false);
      expect(body.notifyAgents).toBe(true);
    });

    it('should request immediate deletion', async () => {
      mockApiResponse({ success: true, deletedAt: Date.now() });
      
      await requestDataDeletion(userAddress, 'location', { immediate: true });
      
      const body = JSON.parse(fetch.mock.calls[0][1].body);
      expect(body.immediate).toBe(true);
    });

    it('should optionally skip agent notification', async () => {
      mockApiResponse({ success: true });
      
      await requestDataDeletion(userAddress, 'location', { notifyAgents: false });
      
      const body = JSON.parse(fetch.mock.calls[0][1].body);
      expect(body.notifyAgents).toBe(false);
    });
  });

  describe('requestAccountDeletion', () => {
    it('should delete account with correct confirmation', async () => {
      mockApiResponse({ 
        success: true, 
        deletionScheduled: true,
        finalDeletionDate: Date.now() + 2592000000 // 30 days
      });
      
      const result = await requestAccountDeletion(userAddress, 'DELETE MY ACCOUNT');
      
      expect(result.success).toBe(true);
      expect(result.deletionScheduled).toBe(true);
    });

    it('should reject invalid confirmation phrase', async () => {
      await expect(requestAccountDeletion(userAddress, 'delete my account'))
        .rejects.toThrow('Invalid confirmation phrase');
    });

    it('should reject empty confirmation', async () => {
      await expect(requestAccountDeletion(userAddress, ''))
        .rejects.toThrow('Invalid confirmation phrase');
    });
  });

  describe('getRevocationHistory', () => {
    it('should return revocation history', async () => {
      mockApiResponse({
        revocations: [
          { category: 'location', revokedAt: Date.now() - 86400000, reason: 'user' },
          { category: 'health', revokedAt: Date.now(), reason: 'user' }
        ]
      });
      
      const result = await getRevocationHistory(userAddress);
      
      expect(result.revocations).toHaveLength(2);
    });

    it('should return empty array on error', async () => {
      mockApiError('Server error', 500);
      
      const result = await getRevocationHistory(userAddress);
      
      expect(result.revocations).toEqual([]);
    });
  });

  describe('checkActiveConnections', () => {
    it('should return active connections for category', async () => {
      mockApiResponse({
        connections: [
          { agentId: 'agent-1', agentName: 'Health Bot', connectedAt: Date.now() },
          { agentId: 'agent-2', agentName: 'Fitness App', connectedAt: Date.now() }
        ]
      });
      
      const result = await checkActiveConnections(userAddress, 'health');
      
      expect(result.connections).toHaveLength(2);
    });

    it('should return empty connections on error', async () => {
      mockApiError('Not found', 404);
      
      const result = await checkActiveConnections(userAddress, 'unknown');
      
      expect(result.connections).toEqual([]);
    });
  });

  describe('disconnectAgent', () => {
    it('should disconnect from specific agent', async () => {
      mockApiResponse({ success: true, agentId: 'agent-1' });
      
      const result = await disconnectAgent(userAddress, 'agent-1');
      
      expect(result.success).toBe(true);
    });

    it('should handle unknown agent', async () => {
      mockApiError('Agent not connected', 404);
      
      await expect(disconnectAgent(userAddress, 'unknown'))
        .rejects.toThrow('Agent not connected');
    });
  });

  describe('updateLocalPermissions', () => {
    it('should disable permission locally', () => {
      const updated = updateLocalPermissions(userPermissions, 'location', false);
      
      expect(updated.location.enabled).toBe(false);
      expect(updated.location.lastUpdated).toBeDefined();
    });

    it('should re-enable permission locally', () => {
      const disabled = updateLocalPermissions(userPermissions, 'location', false);
      const enabled = updateLocalPermissions(disabled, 'location', true);
      
      expect(enabled.location.enabled).toBe(true);
    });

    it('should preserve other permissions', () => {
      const updated = updateLocalPermissions(userPermissions, 'location', false);
      
      expect(updated.health.enabled).toBe(true);
      expect(updated.financial.enabled).toBe(true);
    });

    it('should preserve price', () => {
      const updated = updateLocalPermissions(userPermissions, 'location', false);
      
      expect(updated.location.price).toBe(0.005);
    });
  });

  describe('calculateRevocationImpact', () => {
    it('should calculate monthly loss for single category', () => {
      const impact = calculateRevocationImpact(userPermissions, ['location']);
      
      expect(impact.monthlyLoss).toBe(0.005);
      expect(impact.annualLoss).toBe(0.06);
    });

    it('should calculate loss for multiple categories', () => {
      const impact = calculateRevocationImpact(userPermissions, ['location', 'health']);
      
      expect(impact.monthlyLoss).toBe(0.015);
      expect(impact.annualLoss).toBe(0.18);
    });

    it('should handle already-disabled categories', () => {
      userPermissions.location.enabled = false;
      
      const impact = calculateRevocationImpact(userPermissions, ['location']);
      
      expect(impact.monthlyLoss).toBe(0);
    });

    it('should calculate all categories', () => {
      const impact = calculateRevocationImpact(userPermissions, 
        ['location', 'health', 'financial']
      );
      
      expect(impact.monthlyLoss).toBe(0.035); // 0.005 + 0.010 + 0.020
    });
  });

  describe('Full Revocation Flow', () => {
    it('should revoke permission and track impact', async () => {
      // Check current earnings
      const beforeImpact = calculateRevocationImpact(userPermissions, ['health']);
      expect(beforeImpact.monthlyLoss).toBe(0.010);
      
      // Revoke permission
      mockApiResponse({ success: true });
      await revokePermission(userAddress, 'health');
      
      // Update local state
      const updatedPermissions = updateLocalPermissions(userPermissions, 'health', false);
      expect(updatedPermissions.health.enabled).toBe(false);
      
      // Request data deletion
      mockApiResponse({ success: true, deletionId: 'del-456' });
      const deletion = await requestDataDeletion(userAddress, 'health');
      expect(deletion.deletionId).toBeDefined();
    });

    it('should handle complete account deletion flow', async () => {
      // First revoke all
      mockApiResponse({ success: true, revokedCount: 3 });
      await revokeAllPermissions(userAddress);
      
      // Then delete account
      mockApiResponse({ 
        success: true, 
        deletionScheduled: true 
      });
      const result = await requestAccountDeletion(userAddress, 'DELETE MY ACCOUNT');
      
      expect(result.deletionScheduled).toBe(true);
    });

    it('should disconnect agents before revocation', async () => {
      // Check active connections
      mockApiResponse({
        connections: [
          { agentId: 'health-bot', agentName: 'Health Bot' }
        ]
      });
      const connections = await checkActiveConnections(userAddress, 'health');
      expect(connections.connections).toHaveLength(1);
      
      // Disconnect agent
      mockApiResponse({ success: true });
      await disconnectAgent(userAddress, 'health-bot');
      
      // Then revoke
      mockApiResponse({ success: true });
      await revokePermission(userAddress, 'health');
    });
  });
});
