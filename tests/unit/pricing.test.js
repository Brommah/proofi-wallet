/**
 * Pricing Unit Tests
 * Tests for price calculations and projections
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══ Pricing Utilities ═══

/**
 * Base prices per data category (USD per month per query)
 */
const BASE_PRICES = {
  location: 0.005,
  contacts: 0.002,
  calendar: 0.003,
  health: 0.010,
  financial: 0.020,
  social: 0.004,
  browsing: 0.001
};

/**
 * Platform fee percentage (Proofi takes 10%)
 */
const PLATFORM_FEE = 0.10;

/**
 * Calculate user earnings after platform fee
 */
function calculateNetEarnings(grossEarnings) {
  return grossEarnings * (1 - PLATFORM_FEE);
}

/**
 * Calculate platform fee amount
 */
function calculatePlatformFee(grossEarnings) {
  return grossEarnings * PLATFORM_FEE;
}

/**
 * Calculate total gross earnings from enabled categories
 */
function calculateGrossEarnings(enabledCategories) {
  return enabledCategories.reduce((total, category) => {
    return total + (BASE_PRICES[category] || 0);
  }, 0);
}

/**
 * Project annual earnings
 */
function projectAnnualEarnings(monthlyEarnings) {
  return monthlyEarnings * 12;
}

/**
 * Calculate earnings with query volume multiplier
 */
function calculateVolumeEarnings(basePrice, queriesPerMonth) {
  return basePrice * queriesPerMonth;
}

/**
 * Format currency for display
 */
function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(amount);
}

/**
 * Format percentage
 */
function formatPercentage(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(value);
}

/**
 * Calculate tier bonus based on total enabled categories
 */
function calculateTierBonus(enabledCount) {
  if (enabledCount >= 7) return 0.20; // 20% bonus for all categories
  if (enabledCount >= 5) return 0.10; // 10% bonus for 5+ categories
  if (enabledCount >= 3) return 0.05; // 5% bonus for 3+ categories
  return 0;
}

/**
 * Calculate total earnings with tier bonus
 */
function calculateWithTierBonus(grossEarnings, enabledCount) {
  const bonus = calculateTierBonus(enabledCount);
  return grossEarnings * (1 + bonus);
}

/**
 * Calculate agent subscription cost
 */
function calculateAgentCost(queriesPerMonth, pricePerQuery) {
  return queriesPerMonth * pricePerQuery;
}

/**
 * Estimate market value based on data rarity
 */
function estimateMarketValue(category, userCount) {
  const baseValue = BASE_PRICES[category] || 0.001;
  // Rarer data (fewer users sharing) is worth more
  const rarityMultiplier = Math.max(1, 10000 / userCount);
  return baseValue * Math.min(rarityMultiplier, 10); // Cap at 10x
}

// ═══ Tests ═══

describe('Pricing Module', () => {
  describe('BASE_PRICES', () => {
    it('should have all required categories', () => {
      const categories = ['location', 'contacts', 'calendar', 'health', 'financial', 'social', 'browsing'];
      for (const cat of categories) {
        expect(BASE_PRICES).toHaveProperty(cat);
        expect(BASE_PRICES[cat]).toBeGreaterThan(0);
      }
    });

    it('should have financial as highest priced', () => {
      const maxPrice = Math.max(...Object.values(BASE_PRICES));
      expect(BASE_PRICES.financial).toBe(maxPrice);
    });

    it('should have browsing as lowest priced', () => {
      const minPrice = Math.min(...Object.values(BASE_PRICES));
      expect(BASE_PRICES.browsing).toBe(minPrice);
    });
  });

  describe('calculateNetEarnings', () => {
    it('should deduct 10% platform fee', () => {
      const gross = 100;
      const net = calculateNetEarnings(gross);
      expect(net).toBe(90);
    });

    it('should handle zero earnings', () => {
      expect(calculateNetEarnings(0)).toBe(0);
    });

    it('should handle small amounts', () => {
      const net = calculateNetEarnings(0.045);
      expect(net).toBeCloseTo(0.0405, 5);
    });
  });

  describe('calculatePlatformFee', () => {
    it('should calculate 10% fee', () => {
      expect(calculatePlatformFee(100)).toBe(10);
    });

    it('should handle fractional amounts', () => {
      expect(calculatePlatformFee(0.50)).toBeCloseTo(0.05, 5);
    });
  });

  describe('calculateGrossEarnings', () => {
    it('should sum prices for enabled categories', () => {
      const enabled = ['location', 'health'];
      const earnings = calculateGrossEarnings(enabled);
      expect(earnings).toBe(0.005 + 0.010);
    });

    it('should return 0 for empty array', () => {
      expect(calculateGrossEarnings([])).toBe(0);
    });

    it('should calculate all categories', () => {
      const all = Object.keys(BASE_PRICES);
      const earnings = calculateGrossEarnings(all);
      const expected = Object.values(BASE_PRICES).reduce((a, b) => a + b, 0);
      expect(earnings).toBeCloseTo(expected, 5);
    });

    it('should ignore unknown categories', () => {
      const enabled = ['location', 'unknown'];
      const earnings = calculateGrossEarnings(enabled);
      expect(earnings).toBe(0.005);
    });
  });

  describe('projectAnnualEarnings', () => {
    it('should multiply by 12', () => {
      expect(projectAnnualEarnings(10)).toBe(120);
    });

    it('should handle fractional amounts', () => {
      expect(projectAnnualEarnings(0.045)).toBeCloseTo(0.54, 5);
    });
  });

  describe('calculateVolumeEarnings', () => {
    it('should multiply price by query count', () => {
      const earnings = calculateVolumeEarnings(0.005, 100);
      expect(earnings).toBe(0.5);
    });

    it('should handle zero queries', () => {
      expect(calculateVolumeEarnings(0.005, 0)).toBe(0);
    });

    it('should handle large volumes', () => {
      const earnings = calculateVolumeEarnings(0.001, 1000000);
      expect(earnings).toBe(1000);
    });
  });

  describe('formatCurrency', () => {
    it('should format as USD by default', () => {
      const formatted = formatCurrency(10.50);
      expect(formatted).toMatch(/\$10\.50/);
    });

    it('should handle small amounts with precision', () => {
      const formatted = formatCurrency(0.0045);
      expect(formatted).toMatch(/\$0\.004/);
    });

    it('should format other currencies', () => {
      const formatted = formatCurrency(10, 'EUR');
      expect(formatted).toMatch(/€/);
    });
  });

  describe('formatPercentage', () => {
    it('should format decimal as percentage', () => {
      const formatted = formatPercentage(0.10);
      expect(formatted).toMatch(/10%/);
    });

    it('should handle fractional percentages', () => {
      const formatted = formatPercentage(0.155);
      expect(formatted).toMatch(/15\.5%|16%/); // Depends on rounding
    });
  });

  describe('calculateTierBonus', () => {
    it('should return 0% for 0-2 categories', () => {
      expect(calculateTierBonus(0)).toBe(0);
      expect(calculateTierBonus(1)).toBe(0);
      expect(calculateTierBonus(2)).toBe(0);
    });

    it('should return 5% for 3-4 categories', () => {
      expect(calculateTierBonus(3)).toBe(0.05);
      expect(calculateTierBonus(4)).toBe(0.05);
    });

    it('should return 10% for 5-6 categories', () => {
      expect(calculateTierBonus(5)).toBe(0.10);
      expect(calculateTierBonus(6)).toBe(0.10);
    });

    it('should return 20% for all 7 categories', () => {
      expect(calculateTierBonus(7)).toBe(0.20);
    });
  });

  describe('calculateWithTierBonus', () => {
    it('should add tier bonus to gross earnings', () => {
      const gross = 1.00;
      const withBonus = calculateWithTierBonus(gross, 7);
      expect(withBonus).toBe(1.20); // 20% bonus
    });

    it('should not add bonus for few categories', () => {
      const gross = 1.00;
      const withBonus = calculateWithTierBonus(gross, 2);
      expect(withBonus).toBe(1.00);
    });

    it('should correctly apply 5% bonus', () => {
      const gross = 1.00;
      const withBonus = calculateWithTierBonus(gross, 3);
      expect(withBonus).toBe(1.05);
    });
  });

  describe('calculateAgentCost', () => {
    it('should multiply queries by price', () => {
      const cost = calculateAgentCost(1000, 0.005);
      expect(cost).toBe(5);
    });

    it('should handle zero queries', () => {
      expect(calculateAgentCost(0, 0.005)).toBe(0);
    });
  });

  describe('estimateMarketValue', () => {
    it('should return base price for high user count', () => {
      const value = estimateMarketValue('location', 100000);
      expect(value).toBeCloseTo(0.005, 5);
    });

    it('should increase value for rare data', () => {
      const rareValue = estimateMarketValue('location', 100);
      const commonValue = estimateMarketValue('location', 10000);
      expect(rareValue).toBeGreaterThan(commonValue);
    });

    it('should cap multiplier at 10x', () => {
      const value = estimateMarketValue('location', 1);
      expect(value).toBe(0.005 * 10); // Capped at 10x
    });

    it('should handle unknown category', () => {
      const value = estimateMarketValue('unknown', 10000);
      expect(value).toBeCloseTo(0.001, 5); // Default price
    });
  });

  describe('Pricing Consistency', () => {
    it('should ensure net + fee = gross', () => {
      const gross = 100;
      const net = calculateNetEarnings(gross);
      const fee = calculatePlatformFee(gross);
      expect(net + fee).toBeCloseTo(gross, 5);
    });

    it('should maintain price ratios', () => {
      // Financial should be 2x health
      expect(BASE_PRICES.financial / BASE_PRICES.health).toBe(2);
      // Health should be 10x browsing
      expect(BASE_PRICES.health / BASE_PRICES.browsing).toBe(10);
    });
  });
});
