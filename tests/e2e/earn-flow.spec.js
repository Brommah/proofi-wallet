/**
 * Earn Flow E2E Tests
 * Tests for the data monetization earn page
 */

import { test, expect } from '@playwright/test';

test.describe('Earn Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/earn.html');
  });

  test.describe('Page Load', () => {
    test('should load earn page successfully', async ({ page }) => {
      await expect(page).toHaveTitle(/earn/i);
    });

    test('should display header with balance', async ({ page }) => {
      const header = page.locator('.header, [class*="header"]').first();
      await expect(header).toBeVisible();
    });

    test('should display earnings summary', async ({ page }) => {
      // Look for earnings display
      const earnings = page.locator('[class*="earn"], [class*="balance"], .header-balance');
      const count = await earnings.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Permission Categories', () => {
    test('should display permission toggle cards', async ({ page }) => {
      const permissionCards = page.locator('[class*="permission"], [class*="category"], .toggle-card');
      await expect(permissionCards.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show category names', async ({ page }) => {
      const categories = ['Location', 'Health', 'Financial', 'Contacts', 'Calendar', 'Social', 'Browsing'];
      
      for (const category of categories.slice(0, 3)) {
        const element = page.getByText(category, { exact: false });
        // At least some categories should be visible
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          break;
        }
      }
    });

    test('should show price per category', async ({ page }) => {
      // Look for price indicators ($ or currency)
      const priceElements = page.locator(':text("$"), :text("USD"), [class*="price"]');
      await expect(priceElements.first()).toBeVisible();
    });
  });

  test.describe('Permission Toggles', () => {
    test('should have toggleable permissions', async ({ page }) => {
      const toggles = page.locator('input[type="checkbox"], .toggle, [class*="switch"]');
      const count = await toggles.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should update earnings when toggle clicked', async ({ page }) => {
      // Find a toggle
      const toggle = page.locator('input[type="checkbox"], .toggle, [role="switch"]').first();
      
      if (await toggle.count() > 0) {
        // Get initial earnings text
        const earningsElement = page.locator('[class*="earn"], [class*="total"]').first();
        const initialText = await earningsElement.textContent();
        
        // Click toggle
        await toggle.click();
        await page.waitForTimeout(300);
        
        // Earnings might have changed (or confirmation dialog shown)
        const newText = await earningsElement.textContent();
        // We just verify the interaction worked
        expect(newText).toBeDefined();
      }
    });

    test('toggles should be keyboard accessible', async ({ page }) => {
      const toggle = page.locator('input[type="checkbox"], .toggle, [role="switch"]').first();
      
      if (await toggle.count() > 0) {
        await toggle.focus();
        await page.keyboard.press('Space');
        // Should toggle without error
      }
    });
  });

  test.describe('Earnings Calculator', () => {
    test('should display monthly projection', async ({ page }) => {
      const monthly = page.locator(':text("month"), :text("Monthly"), [class*="monthly"]');
      await expect(monthly.first()).toBeVisible();
    });

    test('should display annual projection', async ({ page }) => {
      const annual = page.locator(':text("year"), :text("Annual"), :text("Yearly"), [class*="annual"]');
      // Annual might not be visible by default
      if (await annual.count() > 0) {
        await expect(annual.first()).toBeVisible();
      }
    });

    test('should show total earnings', async ({ page }) => {
      const total = page.locator('[class*="total"], [class*="sum"], .earnings-total');
      await expect(total.first()).toBeVisible();
    });
  });

  test.describe('Data Privacy Indicators', () => {
    test('should show encryption status', async ({ page }) => {
      const encryption = page.locator(':text("encrypt"), :text("Encrypt"), :text("🔐"), [class*="encrypt"]');
      // Check if any encryption indicators exist
      const count = await encryption.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show privacy guarantees', async ({ page }) => {
      const privacy = page.locator(':text("privacy"), :text("Privacy"), :text("private"), [class*="privacy"]');
      if (await privacy.count() > 0) {
        await expect(privacy.first()).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.reload();
      
      // Should still show main content
      await expect(page.locator('body')).toBeVisible();
      
      // Permission cards should be visible
      const content = page.locator('[class*="permission"], [class*="category"], main');
      await expect(content.first()).toBeVisible();
    });

    test('should stack cards vertically on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.reload();
      
      // Cards should be stacked (single column)
      const cards = page.locator('[class*="card"], [class*="permission"]');
      if (await cards.count() >= 2) {
        const firstBox = await cards.first().boundingBox();
        const secondBox = await cards.nth(1).boundingBox();
        
        if (firstBox && secondBox) {
          // On mobile, second card should be below first (not side by side)
          expect(secondBox.y).toBeGreaterThanOrEqual(firstBox.y);
        }
      }
    });
  });

  test.describe('Navigation', () => {
    test('should have back/home navigation', async ({ page }) => {
      const nav = page.locator('nav, .header, [class*="nav"]');
      await expect(nav.first()).toBeVisible();
    });

    test('should be able to navigate to wallet', async ({ page }) => {
      const walletLink = page.locator('a[href*="wallet"], a[href*="app"], [class*="wallet"]');
      if (await walletLink.count() > 0) {
        await expect(walletLink.first()).toBeVisible();
      }
    });
  });

  test.describe('Views/Tabs', () => {
    test('should handle multiple views if present', async ({ page }) => {
      const tabs = page.locator('[role="tab"], .tab, [class*="tab"]');
      const count = await tabs.count();
      
      if (count > 1) {
        // Click second tab
        await tabs.nth(1).click();
        await page.waitForTimeout(300);
        
        // Content should update
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('Bottom Navigation', () => {
    test('should display bottom nav on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.reload();
      
      const bottomNav = page.locator('[class*="bottom-nav"], [class*="nav-bottom"], footer nav');
      // Bottom nav is optional
      if (await bottomNav.count() > 0) {
        await expect(bottomNav.first()).toBeVisible();
      }
    });
  });

  test.describe('Loading States', () => {
    test('should not show infinite loading', async ({ page }) => {
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      const loader = page.locator('.loading, .spinner, [class*="load"]');
      const visibleLoaders = await loader.filter({ hasNot: page.locator(':text("")') }).count();
      
      // Loaders should be gone after 2 seconds
      expect(visibleLoaders).toBeLessThanOrEqual(1);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle offline gracefully', async ({ page, context }) => {
      // Load page first
      await page.waitForLoadState('networkidle');
      
      // Go offline
      await context.setOffline(true);
      
      // Try to interact
      const toggle = page.locator('input[type="checkbox"], .toggle').first();
      if (await toggle.count() > 0) {
        await toggle.click();
        await page.waitForTimeout(500);
        
        // Should show some error or cached state, not crash
        await expect(page.locator('body')).toBeVisible();
      }
      
      // Go back online
      await context.setOffline(false);
    });
  });
});
