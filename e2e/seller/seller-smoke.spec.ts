import { test, expect } from '@playwright/test';

test.describe('seller web shell', () => {
  test('loads auth or dashboard without crash', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    expect(response?.status(), 'HTTP status should be OK').toBeLessThan(400);

    await expect(page.locator('body')).toBeVisible();

    const authOrApp = page.getByText(/GoPasal|Sign in|Sign In|Dashboard|Orders/i).first();
    await expect(authOrApp).toBeVisible({ timeout: 25_000 });
  });
});
