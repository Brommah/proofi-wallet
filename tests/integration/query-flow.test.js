/**
 * Query Flow Integration Tests
 * Tests for agent data queries and user approvals
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockApiResponse, mockApiError, mockNetworkError, mockWalletAddress, mockPermissions, resetMocks } from '../setup.js';

// ═══ Query Flow Utilities ═══

/**
 * Query request from an agent
 */
class QueryRequest {
  constructor(data) {
    this.id = crypto.randomUUID();
    this.agentId = data.agentId;
    this.agentName = data.agentName || 'Unknown Agent';
    this.categories = data.categories || [];
    this.purpose = data.purpose || '';
    this.expiresAt = data.expiresAt || Date.now() + 300000; // 5 min default
    this.status = 'pending';
    this.createdAt = Date.now();
  }
  
  isExpired() {
    return Date.now() > this.expiresAt;
  }
  
  getTimeRemaining() {
    return Math.max(0, this.expiresAt - Date.now());
  }
}

/**
 * Process incoming query from agent
 */
async function processIncomingQuery(queryData) {
  const request = new QueryRequest(queryData);
  
  // Validate agent exists
  const agentValid = await validateAgent(queryData.agentId);
  if (!agentValid) {
    throw new Error('Unknown agent');
  }
  
  // Check if categories are valid
  const invalidCategories = queryData.categories.filter(
    cat => !['location', 'contacts', 'calendar', 'health', 'financial', 'social', 'browsing'].includes(cat)
  );
  
  if (invalidCategories.length > 0) {
    throw new Error(`Invalid categories: ${invalidCategories.join(', ')}`);
  }
  
  return request;
}

/**
 * Validate agent is registered
 */
async function validateAgent(agentId) {
  const response = await fetch(`/api/agents/${agentId}`);
  return response.ok;
}

/**
 * Check user's permission settings for requested categories
 */
function checkPermissions(userPermissions, requestedCategories) {
  const result = {
    allowed: [],
    denied: [],
    earnings: 0
  };
  
  for (const category of requestedCategories) {
    if (userPermissions[category]?.enabled) {
      result.allowed.push(category);
      result.earnings += userPermissions[category].price || 0;
    } else {
      result.denied.push(category);
    }
  }
  
  return result;
}

/**
 * Approve a query request
 */
async function approveQuery(request, userAddress, userPermissions) {
  if (request.isExpired()) {
    throw new Error('Query request has expired');
  }
  
  const permCheck = checkPermissions(userPermissions, request.categories);
  
  if (permCheck.allowed.length === 0) {
    throw new Error('No permissions available for requested categories');
  }
  
  // Create encrypted response
  const response = await fetch('/api/query/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId: request.id,
      userAddress,
      categories: permCheck.allowed,
      agentId: request.agentId
    })
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to approve query');
  }
  
  request.status = 'approved';
  return {
    ...await response.json(),
    earnings: permCheck.earnings,
    categories: permCheck.allowed
  };
}

/**
 * Reject a query request
 */
async function rejectQuery(request, reason = '') {
  if (request.isExpired()) {
    // Already expired, nothing to do
    return { status: 'expired' };
  }
  
  await fetch('/api/query/reject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId: request.id,
      reason
    })
  });
  
  request.status = 'rejected';
  return { status: 'rejected', reason };
}

/**
 * Get pending queries for a user
 */
async function getPendingQueries(userAddress) {
  const response = await fetch(`/api/query/pending?address=${userAddress}`);
  if (!response.ok) return [];
  
  const data = await response.json();
  return data.queries.map(q => new QueryRequest(q));
}

/**
 * Calculate earnings from approved queries
 */
function calculateQueryEarnings(approvedQueries, permissions) {
  let total = 0;
  
  for (const query of approvedQueries) {
    for (const category of query.categories) {
      total += permissions[category]?.price || 0;
    }
  }
  
  return total;
}

// ═══ Tests ═══

describe('Query Flow', () => {
  let userPermissions;
  
  beforeEach(() => {
    resetMocks();
    userPermissions = mockPermissions({
      location: { enabled: true, price: 0.005 },
      health: { enabled: true, price: 0.010 }
    });
  });

  describe('QueryRequest', () => {
    it('should create request with defaults', () => {
      const request = new QueryRequest({
        agentId: 'agent-123',
        categories: ['location']
      });
      
      expect(request.id).toBeDefined();
      expect(request.status).toBe('pending');
      expect(request.agentName).toBe('Unknown Agent');
      expect(request.isExpired()).toBe(false);
    });

    it('should track expiration', async () => {
      const request = new QueryRequest({
        agentId: 'agent-123',
        categories: ['location'],
        expiresAt: Date.now() + 100 // 100ms
      });
      
      expect(request.isExpired()).toBe(false);
      
      await new Promise(r => setTimeout(r, 150));
      
      expect(request.isExpired()).toBe(true);
    });

    it('should calculate time remaining', () => {
      const request = new QueryRequest({
        agentId: 'agent-123',
        categories: ['location'],
        expiresAt: Date.now() + 60000 // 1 minute
      });
      
      const remaining = request.getTimeRemaining();
      expect(remaining).toBeGreaterThan(59000);
      expect(remaining).toBeLessThanOrEqual(60000);
    });
  });

  describe('processIncomingQuery', () => {
    it('should create valid query request', async () => {
      mockApiResponse({ valid: true }); // Agent validation
      
      const request = await processIncomingQuery({
        agentId: 'agent-123',
        agentName: 'Health Bot',
        categories: ['health', 'location'],
        purpose: 'Health tracking'
      });
      
      expect(request).toBeInstanceOf(QueryRequest);
      expect(request.categories).toEqual(['health', 'location']);
      expect(request.purpose).toBe('Health tracking');
    });

    it('should reject unknown agent', async () => {
      mockApiError('Not found', 404);
      
      await expect(processIncomingQuery({
        agentId: 'unknown',
        categories: ['location']
      })).rejects.toThrow('Unknown agent');
    });

    it('should reject invalid categories', async () => {
      mockApiResponse({ valid: true });
      
      await expect(processIncomingQuery({
        agentId: 'agent-123',
        categories: ['invalid-category']
      })).rejects.toThrow('Invalid categories');
    });
  });

  describe('checkPermissions', () => {
    it('should identify allowed categories', () => {
      const result = checkPermissions(userPermissions, ['location', 'health']);
      
      expect(result.allowed).toContain('location');
      expect(result.allowed).toContain('health');
      expect(result.denied).toHaveLength(0);
    });

    it('should identify denied categories', () => {
      const result = checkPermissions(userPermissions, ['location', 'financial']);
      
      expect(result.allowed).toContain('location');
      expect(result.denied).toContain('financial');
    });

    it('should calculate potential earnings', () => {
      const result = checkPermissions(userPermissions, ['location', 'health']);
      
      expect(result.earnings).toBe(0.015); // 0.005 + 0.010
    });

    it('should handle all denied', () => {
      const result = checkPermissions(userPermissions, ['financial', 'social']);
      
      expect(result.allowed).toHaveLength(0);
      expect(result.denied).toHaveLength(2);
      expect(result.earnings).toBe(0);
    });
  });

  describe('approveQuery', () => {
    it('should approve and return earnings', async () => {
      mockApiResponse({ success: true, transactionId: 'tx-123' });
      
      const request = new QueryRequest({
        agentId: 'agent-123',
        categories: ['location', 'health']
      });
      
      const result = await approveQuery(request, mockWalletAddress(), userPermissions);
      
      expect(result.earnings).toBe(0.015);
      expect(result.categories).toEqual(['location', 'health']);
      expect(request.status).toBe('approved');
    });

    it('should reject expired requests', async () => {
      const request = new QueryRequest({
        agentId: 'agent-123',
        categories: ['location'],
        expiresAt: Date.now() - 1000 // Already expired
      });
      
      await expect(approveQuery(request, mockWalletAddress(), userPermissions))
        .rejects.toThrow('expired');
    });

    it('should reject when no permissions available', async () => {
      const noPermissions = mockPermissions(); // All disabled
      
      const request = new QueryRequest({
        agentId: 'agent-123',
        categories: ['location']
      });
      
      await expect(approveQuery(request, mockWalletAddress(), noPermissions))
        .rejects.toThrow('No permissions available');
    });

    it('should only include allowed categories in approval', async () => {
      mockApiResponse({ success: true });
      
      const request = new QueryRequest({
        agentId: 'agent-123',
        categories: ['location', 'financial'] // financial not enabled
      });
      
      const result = await approveQuery(request, mockWalletAddress(), userPermissions);
      
      expect(result.categories).toEqual(['location']);
      expect(result.categories).not.toContain('financial');
    });
  });

  describe('rejectQuery', () => {
    it('should reject and update status', async () => {
      mockApiResponse({ success: true });
      
      const request = new QueryRequest({
        agentId: 'agent-123',
        categories: ['location']
      });
      
      const result = await rejectQuery(request, 'Not comfortable sharing');
      
      expect(result.status).toBe('rejected');
      expect(result.reason).toBe('Not comfortable sharing');
      expect(request.status).toBe('rejected');
    });

    it('should handle expired requests gracefully', async () => {
      const request = new QueryRequest({
        agentId: 'agent-123',
        categories: ['location'],
        expiresAt: Date.now() - 1000
      });
      
      const result = await rejectQuery(request);
      
      expect(result.status).toBe('expired');
    });
  });

  describe('getPendingQueries', () => {
    it('should return pending queries as QueryRequest objects', async () => {
      mockApiResponse({
        queries: [
          { agentId: 'agent-1', categories: ['location'] },
          { agentId: 'agent-2', categories: ['health'] }
        ]
      });
      
      const queries = await getPendingQueries(mockWalletAddress());
      
      expect(queries).toHaveLength(2);
      expect(queries[0]).toBeInstanceOf(QueryRequest);
      expect(queries[1]).toBeInstanceOf(QueryRequest);
    });

    it('should return empty array on error', async () => {
      mockApiError('Server error', 500);
      
      const queries = await getPendingQueries(mockWalletAddress());
      
      expect(queries).toEqual([]);
    });
  });

  describe('calculateQueryEarnings', () => {
    it('should sum earnings from all approved queries', () => {
      const queries = [
        { categories: ['location'] },
        { categories: ['health', 'location'] }
      ];
      
      const earnings = calculateQueryEarnings(queries, userPermissions);
      
      // location (0.005) + health (0.010) + location (0.005) = 0.020
      expect(earnings).toBe(0.020);
    });

    it('should handle empty queries', () => {
      expect(calculateQueryEarnings([], userPermissions)).toBe(0);
    });

    it('should handle unknown categories', () => {
      const queries = [{ categories: ['unknown'] }];
      expect(calculateQueryEarnings(queries, userPermissions)).toBe(0);
    });
  });

  describe('Full Query Flow', () => {
    it('should process, approve, and earn', async () => {
      // Mock agent validation
      mockApiResponse({ valid: true });
      
      // Process incoming query
      const request = await processIncomingQuery({
        agentId: 'health-bot',
        agentName: 'Health Tracker',
        categories: ['location', 'health'],
        purpose: 'Daily health monitoring'
      });
      
      expect(request.status).toBe('pending');
      
      // Check what user can share
      const permCheck = checkPermissions(userPermissions, request.categories);
      expect(permCheck.allowed).toHaveLength(2);
      expect(permCheck.earnings).toBe(0.015);
      
      // Approve the query
      mockApiResponse({ success: true, transactionId: 'tx-456' });
      const result = await approveQuery(request, mockWalletAddress(), userPermissions);
      
      expect(request.status).toBe('approved');
      expect(result.earnings).toBe(0.015);
    });

    it('should handle partial permissions', async () => {
      mockApiResponse({ valid: true });
      
      const request = await processIncomingQuery({
        agentId: 'data-bot',
        categories: ['location', 'financial', 'health']
      });
      
      // User only has location and health enabled
      mockApiResponse({ success: true });
      const result = await approveQuery(request, mockWalletAddress(), userPermissions);
      
      expect(result.categories).toContain('location');
      expect(result.categories).toContain('health');
      expect(result.categories).not.toContain('financial');
      expect(result.earnings).toBe(0.015);
    });
  });
});
