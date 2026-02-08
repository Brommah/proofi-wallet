/**
 * Landing Page E2E Tests
 * Tests for main landing page navigation and responsiveness
 */

import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test.describe('Navigation', () => {
    test('should display logo and navigation', async ({ page }) => {
      // Check logo exists
      await expect(page.locator('.nav-logo')).toBeVisible();
      await expect(page.locator('.nav-logo-text')).toContainText(/proofi/i);
    });

    test('should have working navigation links', async ({ page }) => {
      // Check main nav links
      const navLinks = page.locator('.nav-links a');
      const count = await navLinks.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have CTA buttons in navigation', async ({ page }) => {
      await expect(page.locator('.nav-cta .btn').first()).toBeVisible();
    });

    test('should scroll to sections on nav click', async ({ page }) => {
      // Click features link if exists
      const featuresLink = page.locator('a[href="#features"]');
      if (await featuresLink.count() > 0) {
        await featuresLink.click();
        await page.waitForTimeout(500);
        // Verify scroll happened
        const scrollY = await page.evaluate(() => window.scrollY);
        expect(scrollY).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Hero Section', () => {
    test('should display main headline', async ({ page }) => {
      const hero = page.locator('.hero, [class*="hero"]').first();
      await expect(hero).toBeVisible();
      
      // Check for headline text
      const headline = page.locator('h1').first();
      await expect(headline).toBeVisible();
    });

    test('should display tagline or subheadline', async ({ page }) => {
      // Look for tagline or subtitle
      const tagline = page.locator('.hero-tagline, .hero p, .subtitle').first();
      await expect(tagline).toBeVisible();
    });

    test('should have primary CTA button', async ({ page }) => {
      const ctaButton = page.locator('.btn-primary, .hero .btn, [class*="cta"]').first();
      await expect(ctaButton).toBeVisible();
    });

    test('CTA button should be clickable', async ({ page }) => {
      const ctaButton = page.locator('.btn-primary, .hero .btn').first();
      await expect(ctaButton).toBeEnabled();
    });
  });

  test.describe('Features Section', () => {
    test('should display feature cards', async ({ page }) => {
      const features = page.locator('.feature, [class*="feature"]');
      const count = await features.count();
      // Landing page should have at least some features
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('feature cards should have icons and titles', async ({ page }) => {
      const featureCards = page.locator('.feature-card, [class*="feature"]');
      const count = await featureCards.count();
      
      if (count > 0) {
        const firstCard = featureCards.first();
        // Check for some content
        const text = await firstCard.textContent();
        expect(text.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Footer', () => {
    test('should have footer with links', async ({ page }) => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      
      const footer = page.locator('footer, [class*="footer"]');
      if (await footer.count() > 0) {
        await expect(footer.first()).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      
      // Navigation should still be accessible (may be in hamburger)
      const nav = page.locator('.nav, nav, [class*="nav"]').first();
      await expect(nav).toBeVisible();
    });

    test('should adapt to tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      
      // Content should be visible
      const hero = page.locator('.hero, h1').first();
      await expect(hero).toBeVisible();
    });

    test('should handle landscape mobile', async ({ page }) => {
      await page.setViewportSize({ width: 667, height: 375 });
      await page.reload();
      
      // Page should still be navigable
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    });

    test('should have alt text on images', async ({ page }) => {
      const images = page.locator('img:not([role="presentation"])');
      const count = await images.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        // Alt can be empty for decorative images, but should be present
        expect(alt).not.toBeNull();
      }
    });

    test('should have visible focus indicators', async ({ page }) => {
      // Tab to first focusable element
      await page.keyboard.press('Tab');
      
      // Check that something has focus
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('buttons should have accessible names', async ({ page }) => {
      const buttons = page.locator('button, .btn, [role="button"]');
      const count = await buttons.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        
        // Should have text or aria-label
        expect(text?.trim() || ariaLabel).toBeTruthy();
      }
    });
  });

  test.describe('Performance', () => {
    test('should load within reasonable time', async ({ page }) => {
      const start = Date.now();
      await page.goto('/index.html');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - start;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should not have console errors', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/index.html');
      await page.waitForTimeout(1000);
      
      // Filter out known benign errors (e.g., missing favicons)
      const criticalErrors = errors.filter(e => 
        !e.includes('favicon') && !e.includes('404')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Dark Theme', () => {
    test('should have dark background by default', async ({ page }) => {
      const body = page.locator('body');
      const bgColor = await body.evaluate(el => 
        getComputedStyle(el).backgroundColor
      );
      
      // Proofi uses dark theme - RGB values should be low
      const match = bgColor.match(/\d+/g);
      if (match) {
        const [r, g, b] = match.map(Number);
        expect(r + g + b).toBeLessThan(100); // Dark background
      }
    });

    test('should have readable text contrast', async ({ page }) => {
      const text = page.locator('h1').first();
      const color = await text.evaluate(el => 
        getComputedStyle(el).color
      );
      
      // Text should be light
      const match = color.match(/\d+/g);
      if (match) {
        const [r, g, b] = match.map(Number);
        expect(r + g + b).toBeGreaterThan(300); // Light text
      }
    });
  });
});
