import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Omuto/i);
  });

  test('should navigate to finance hub', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Finance');
    await expect(page).toHaveURL(/finance/);
  });

  test('should navigate to HR hub', async ({ page }) => {
    await page.goto('/');
    await page.click('text=HR');
    await expect(page).toHaveURL(/hr/);
  });

  test('should show breadcrumbs on nested pages', async ({ page }) => {
    await page.goto('/finance/requisitions');
    const breadcrumbs = page.locator('nav');
    await expect(breadcrumbs).toBeVisible();
  });

  test('should open command palette with keyboard shortcut', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Meta+K');
    const commandDialog = page.locator('[cmdk-dialog]');
    await expect(commandDialog).toBeVisible();
  });
});

test.describe('Forms', () => {
  test('should load expense report form', async ({ page }) => {
    await page.goto('/forms/expense');
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/forms/expense');
    await page.click('button[type="submit"]');
    const errorMessages = page.locator('[class*="text-destructive"]');
    await expect(errorMessages.first()).toBeVisible();
  });
});

test.describe('Mobile', () => {
  test('should show mobile navigation on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const mobileNav = page.locator('nav');
    await expect(mobileNav).toBeVisible();
  });
});
