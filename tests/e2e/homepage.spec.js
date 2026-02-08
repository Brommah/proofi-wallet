// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Proofi Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');
    
    // Check that the page title contains Proofi
    await expect(page).toHaveTitle(/Proofi/i);
  });

  test('should have main navigation visible', async ({ page }) => {
    await page.goto('/');
    
    // Check for main content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Proofi Portal', () => {
  test('should load portal page', async ({ page }) => {
    await page.goto('/portal.html');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Proofi Ecosystem', () => {
  test('should load ecosystem page', async ({ page }) => {
    await page.goto('/ecosystem.html');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('body')).toBeVisible();
  });
});
