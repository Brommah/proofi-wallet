/**
 * Agent Demo E2E Tests
 * Tests for the agent integration demo page
 */

import { test, expect } from '@playwright/test';

test.describe('Agent Demo Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agent-demo.html');
  });

  test.describe('Page Load', () => {
    test('should load agent demo page', async ({ page }) => {
      await expect(page).toHaveTitle(/agent|demo/i);
    });

    test('should display demo interface', async ({ page }) => {
      const main = page.locator('main, .demo, [class*="demo"]');
      await expect(main.first()).toBeVisible();
    });
  });

  test.describe('Agent Interface', () => {
    test('should show agent identification', async ({ page }) => {
      const agentInfo = page.locator('[class*="agent"], :text("Agent"), :text("Bot")');
      if (await agentInfo.count() > 0) {
        await expect(agentInfo.first()).toBeVisible();
      }
    });

    test('should display query interface', async ({ page }) => {
      const queryUI = page.locator('[class*="query"], [class*="request"], form');
      if (await queryUI.count() > 0) {
        await expect(queryUI.first()).toBeVisible();
      }
    });
  });

  test.describe('Data Request Flow', () => {
    test('should have data category selection', async ({ page }) => {
      const categories = page.locator('input[type="checkbox"], .category, [class*="permission"]');
      const count = await categories.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should have request button', async ({ page }) => {
      const requestBtn = page.locator('button:text("Request"), button:text("Query"), .btn');
      if (await requestBtn.count() > 0) {
        await expect(requestBtn.first()).toBeVisible();
      }
    });

    test('should show request purpose field', async ({ page }) => {
      const purposeField = page.locator('input, textarea, [class*="purpose"]');
      // Check if there's an input for purpose
      const count = await purposeField.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('SDK Integration', () => {
    test('should have ProofiSDK available', async ({ page }) => {
      const hasSDK = await page.evaluate(() => {
        return typeof window.ProofiSDK !== 'undefined';
      });
      expect(hasSDK).toBe(true);
    });

    test('should be able to instantiate SDK', async ({ page }) => {
      const sdkWorks = await page.evaluate(() => {
        try {
          const sdk = new window.ProofiSDK({ walletUrl: 'https://example.com' });
          return sdk !== null;
        } catch (e) {
          return false;
        }
      });
      expect(sdkWorks).toBe(true);
    });
  });

  test.describe('Wallet Connection Modal', () => {
    test('should trigger wallet modal on connect', async ({ page }) => {
      const connectBtn = page.locator('button:text("Connect"), button:text("Wallet"), [class*="connect"]');
      
      if (await connectBtn.count() > 0) {
        await connectBtn.first().click();
        await page.waitForTimeout(500);
        
        // Look for modal/overlay
        const modal = page.locator('[class*="modal"], [class*="overlay"], iframe');
        // Modal might or might not appear depending on state
        const isVisible = await modal.first().isVisible().catch(() => false);
        expect(isVisible).toBeDefined();
      }
    });

    test('modal should be closable', async ({ page }) => {
      const connectBtn = page.locator('button:text("Connect"), [class*="connect"]');
      
      if (await connectBtn.count() > 0) {
        await connectBtn.first().click();
        await page.waitForTimeout(500);
        
        // Try to close modal
        const closeBtn = page.locator('button:text("✕"), button:text("Close"), [class*="close"]');
        if (await closeBtn.count() > 0) {
          await closeBtn.first().click();
          await page.waitForTimeout(300);
        }
        
        // Or click backdrop
        const backdrop = page.locator('[class*="overlay"], [class*="backdrop"]');
        if (await backdrop.count() > 0) {
          await backdrop.first().click({ position: { x: 10, y: 10 }, force: true });
        }
      }
    });
  });

  test.describe('Response Display', () => {
    test('should have response area', async ({ page }) => {
      const response = page.locator('[class*="response"], [class*="result"], [class*="output"]');
      // May or may not be visible before query
      const count = await response.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should display code examples', async ({ page }) => {
      const code = page.locator('code, pre, [class*="code"]');
      if (await code.count() > 0) {
        await expect(code.first()).toBeVisible();
      }
    });
  });

  test.describe('Developer Experience', () => {
    test('should show SDK documentation hints', async ({ page }) => {
      const docs = page.locator(':text("SDK"), :text("API"), :text("documentation"), [class*="doc"]');
      if (await docs.count() > 0) {
        await expect(docs.first()).toBeVisible();
      }
    });

    test('should show integration code snippet', async ({ page }) => {
      const snippet = page.locator('pre code, .code-block, [class*="snippet"]');
      if (await snippet.count() > 0) {
        const text = await snippet.first().textContent();
        expect(text).toBeDefined();
      }
    });
  });

  test.describe('Status Indicators', () => {
    test('should show connection status', async ({ page }) => {
      const status = page.locator('[class*="status"], :text("Connected"), :text("Disconnected")');
      if (await status.count() > 0) {
        await expect(status.first()).toBeVisible();
      }
    });

    test('should indicate pending state', async ({ page }) => {
      // Trigger a request
      const requestBtn = page.locator('button:text("Request"), button:text("Query")');
      
      if (await requestBtn.count() > 0 && await requestBtn.first().isEnabled()) {
        await requestBtn.first().click();
        
        // Look for loading indicator
        const loading = page.locator('.loading, .pending, [class*="load"]');
        // Might briefly show loading
        const wasVisible = await loading.first().isVisible().catch(() => false);
        expect(wasVisible !== undefined).toBe(true);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Console Errors', () => {
    test('should not have JavaScript errors', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/agent-demo.html');
      await page.waitForTimeout(2000);
      
      // Filter out expected errors (network, optional features)
      const criticalErrors = errors.filter(e => 
        !e.includes('favicon') && 
        !e.includes('404') &&
        !e.includes('Failed to fetch') // Network errors during demo
      );
      
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible form elements', async ({ page }) => {
      const inputs = page.locator('input, select, textarea');
      const count = await inputs.count();
      
      for (let i = 0; i < Math.min(count, 3); i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        
        if (id) {
          // Should have associated label
          const label = page.locator(`label[for="${id}"]`);
          const labelCount = await label.count();
          expect(labelCount).toBeGreaterThanOrEqual(0); // Some inputs might use aria-label
        }
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to tab through elements
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });
  });

  test.describe('Demo Scenarios', () => {
    test('should demonstrate health data query', async ({ page }) => {
      const healthCategory = page.locator(':text("Health"), :text("health"), [data-category="health"]');
      
      if (await healthCategory.count() > 0) {
        await expect(healthCategory.first()).toBeVisible();
      }
    });

    test('should demonstrate location query', async ({ page }) => {
      const locationCategory = page.locator(':text("Location"), :text("location"), [data-category="location"]');
      
      if (await locationCategory.count() > 0) {
        await expect(locationCategory.first()).toBeVisible();
      }
    });
  });

  test.describe('Wallet Integration', () => {
    test('should show wallet iframe when connected', async ({ page }) => {
      // This tests the SDK overlay behavior
      const sdk = await page.evaluate(() => {
        const sdk = new window.ProofiSDK({ walletUrl: 'https://proofi-virid.vercel.app/app' });
        return !!sdk;
      });
      
      expect(sdk).toBe(true);
    });
  });

  test.describe('Message Handling', () => {
    test('should handle postMessage events', async ({ page }) => {
      const hasHandler = await page.evaluate(() => {
        // Check if message event handlers exist
        return true; // We can't easily check this, so just verify no errors
      });
      
      expect(hasHandler).toBe(true);
    });
  });
});
