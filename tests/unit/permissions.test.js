/**
 * Permissions Unit Tests
 * Tests for permission toggling and management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPermissions } from '../setup.js';

// ═══ Permission Utilities (extracted from earn.html patterns) ═══

/**
 * Permission categories with default prices (monthly USD)
 */
const PERMISSION_CATEGORIES = {
  location: { name: 'Location', price: 0.005, icon: '📍' },
  contacts: { name: 'Contacts', price: 0.002, icon: '👥' },
  calendar: { name: 'Calendar', price: 0.003, icon: '📅' },
  health: { name: 'Health', price: 0.010, icon: '❤️' },
  financial: { name: 'Financial', price: 0.020, icon: '💳' },
  social: { name: 'Social', price: 0.004, icon: '💬' },
  browsing: { name: 'Browsing', price: 0.001, icon: '🌐' }
};

/**
 * Calculate total monthly earnings from permissions
 */
function calculateEarnings(permissions) {
  return Object.entries(permissions)
    .filter(([_, config]) => config.enabled)
    .reduce((total, [_, config]) => total + (config.price || 0), 0);
}

/**
 * Calculate annual earnings projection
 */
function calculateAnnualEarnings(permissions) {
  return calculateEarnings(permissions) * 12;
}

/**
 * Toggle a permission
 */
function togglePermission(permissions, category) {
  if (!PERMISSION_CATEGORIES[category]) {
    throw new Error(`Unknown permission category: ${category}`);
  }
  
  return {
    ...permissions,
    [category]: {
      ...permissions[category],
      enabled: !permissions[category].enabled
    }
  };
}

/**
 * Enable all permissions
 */
function enableAllPermissions(permissions) {
  const result = {};
  for (const [key, value] of Object.entries(permissions)) {
    result[key] = { ...value, enabled: true };
  }
  return result;
}

/**
 * Disable all permissions
 */
function disableAllPermissions(permissions) {
  const result = {};
  for (const [key, value] of Object.entries(permissions)) {
    result[key] = { ...value, enabled: false };
  }
  return result;
}

/**
 * Get enabled permission count
 */
function getEnabledCount(permissions) {
  return Object.values(permissions).filter(p => p.enabled).length;
}

/**
 * Validate permission structure
 */
function validatePermissions(permissions) {
  const errors = [];
  
  for (const [key, value] of Object.entries(permissions)) {
    if (typeof value.enabled !== 'boolean') {
      errors.push(`${key}: 'enabled' must be a boolean`);
    }
    if (typeof value.price !== 'number' || value.price < 0) {
      errors.push(`${key}: 'price' must be a non-negative number`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Get permissions by sensitivity level
 */
function getPermissionsByLevel(permissions) {
  const levels = {
    low: [], // browsing
    medium: [], // location, calendar, social
    high: [], // contacts, health, financial
  };
  
  const levelMap = {
    browsing: 'low',
    location: 'medium',
    calendar: 'medium',
    social: 'medium',
    contacts: 'high',
    health: 'high',
    financial: 'high'
  };
  
  for (const [key, value] of Object.entries(permissions)) {
    const level = levelMap[key] || 'medium';
    if (value.enabled) {
      levels[level].push(key);
    }
  }
  
  return levels;
}

// ═══ Tests ═══

describe('Permissions Module', () => {
  let permissions;

  beforeEach(() => {
    permissions = mockPermissions();
  });

  describe('calculateEarnings', () => {
    it('should return 0 when no permissions are enabled', () => {
      const earnings = calculateEarnings(permissions);
      expect(earnings).toBe(0);
    });

    it('should calculate earnings for single enabled permission', () => {
      permissions.location.enabled = true;
      const earnings = calculateEarnings(permissions);
      expect(earnings).toBe(0.005);
    });

    it('should calculate earnings for multiple enabled permissions', () => {
      permissions.location.enabled = true;
      permissions.health.enabled = true;
      const earnings = calculateEarnings(permissions);
      expect(earnings).toBe(0.015); // 0.005 + 0.010
    });

    it('should calculate earnings for all enabled permissions', () => {
      const allEnabled = enableAllPermissions(permissions);
      const earnings = calculateEarnings(allEnabled);
      // 0.005 + 0.002 + 0.003 + 0.010 + 0.020 + 0.004 + 0.001 = 0.045
      expect(earnings).toBeCloseTo(0.045, 5);
    });

    it('should handle custom prices', () => {
      const customPermissions = {
        premium: { enabled: true, price: 1.50 }
      };
      const earnings = calculateEarnings(customPermissions);
      expect(earnings).toBe(1.50);
    });
  });

  describe('calculateAnnualEarnings', () => {
    it('should multiply monthly earnings by 12', () => {
      permissions.location.enabled = true;
      const annual = calculateAnnualEarnings(permissions);
      expect(annual).toBe(0.005 * 12);
    });

    it('should return 0 when no permissions enabled', () => {
      const annual = calculateAnnualEarnings(permissions);
      expect(annual).toBe(0);
    });
  });

  describe('togglePermission', () => {
    it('should enable a disabled permission', () => {
      expect(permissions.location.enabled).toBe(false);
      const updated = togglePermission(permissions, 'location');
      expect(updated.location.enabled).toBe(true);
    });

    it('should disable an enabled permission', () => {
      permissions.location.enabled = true;
      const updated = togglePermission(permissions, 'location');
      expect(updated.location.enabled).toBe(false);
    });

    it('should not mutate original permissions', () => {
      const original = { ...permissions };
      togglePermission(permissions, 'location');
      expect(permissions.location.enabled).toBe(original.location.enabled);
    });

    it('should preserve other properties', () => {
      const updated = togglePermission(permissions, 'location');
      expect(updated.location.price).toBe(0.005);
    });

    it('should throw error for unknown category', () => {
      expect(() => togglePermission(permissions, 'unknown'))
        .toThrow('Unknown permission category: unknown');
    });

    it('should preserve other permissions unchanged', () => {
      const updated = togglePermission(permissions, 'location');
      expect(updated.health.enabled).toBe(permissions.health.enabled);
      expect(updated.contacts.enabled).toBe(permissions.contacts.enabled);
    });
  });

  describe('enableAllPermissions', () => {
    it('should enable all permissions', () => {
      const allEnabled = enableAllPermissions(permissions);
      for (const value of Object.values(allEnabled)) {
        expect(value.enabled).toBe(true);
      }
    });

    it('should preserve prices', () => {
      const allEnabled = enableAllPermissions(permissions);
      expect(allEnabled.location.price).toBe(0.005);
      expect(allEnabled.health.price).toBe(0.010);
    });

    it('should not mutate original', () => {
      enableAllPermissions(permissions);
      expect(permissions.location.enabled).toBe(false);
    });
  });

  describe('disableAllPermissions', () => {
    it('should disable all permissions', () => {
      const enabled = enableAllPermissions(permissions);
      const disabled = disableAllPermissions(enabled);
      for (const value of Object.values(disabled)) {
        expect(value.enabled).toBe(false);
      }
    });
  });

  describe('getEnabledCount', () => {
    it('should return 0 when none enabled', () => {
      expect(getEnabledCount(permissions)).toBe(0);
    });

    it('should count enabled permissions', () => {
      permissions.location.enabled = true;
      permissions.health.enabled = true;
      expect(getEnabledCount(permissions)).toBe(2);
    });

    it('should count all when all enabled', () => {
      const allEnabled = enableAllPermissions(permissions);
      expect(getEnabledCount(allEnabled)).toBe(7);
    });
  });

  describe('validatePermissions', () => {
    it('should validate correct permissions', () => {
      const result = validatePermissions(permissions);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid enabled value', () => {
      const invalid = { test: { enabled: 'yes', price: 0.01 } };
      const result = validatePermissions(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("'enabled' must be a boolean");
    });

    it('should detect negative price', () => {
      const invalid = { test: { enabled: true, price: -0.01 } };
      const result = validatePermissions(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("'price' must be a non-negative number");
    });

    it('should detect non-number price', () => {
      const invalid = { test: { enabled: true, price: '0.01' } };
      const result = validatePermissions(invalid);
      expect(result.valid).toBe(false);
    });
  });

  describe('getPermissionsByLevel', () => {
    it('should categorize browsing as low sensitivity', () => {
      permissions.browsing.enabled = true;
      const levels = getPermissionsByLevel(permissions);
      expect(levels.low).toContain('browsing');
    });

    it('should categorize location as medium sensitivity', () => {
      permissions.location.enabled = true;
      const levels = getPermissionsByLevel(permissions);
      expect(levels.medium).toContain('location');
    });

    it('should categorize financial as high sensitivity', () => {
      permissions.financial.enabled = true;
      const levels = getPermissionsByLevel(permissions);
      expect(levels.high).toContain('financial');
    });

    it('should only include enabled permissions', () => {
      const levels = getPermissionsByLevel(permissions);
      expect(levels.low).toHaveLength(0);
      expect(levels.medium).toHaveLength(0);
      expect(levels.high).toHaveLength(0);
    });
  });

  describe('PERMISSION_CATEGORIES', () => {
    it('should have all required categories', () => {
      const required = ['location', 'contacts', 'calendar', 'health', 'financial', 'social', 'browsing'];
      for (const cat of required) {
        expect(PERMISSION_CATEGORIES).toHaveProperty(cat);
      }
    });

    it('should have name, price, and icon for each category', () => {
      for (const [key, value] of Object.entries(PERMISSION_CATEGORIES)) {
        expect(value).toHaveProperty('name');
        expect(value).toHaveProperty('price');
        expect(value).toHaveProperty('icon');
        expect(typeof value.name).toBe('string');
        expect(typeof value.price).toBe('number');
        expect(typeof value.icon).toBe('string');
      }
    });

    it('should have positive prices', () => {
      for (const [key, value] of Object.entries(PERMISSION_CATEGORIES)) {
        expect(value.price).toBeGreaterThan(0);
      }
    });
  });
});
