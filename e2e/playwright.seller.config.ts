import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke tests for the Expo seller web bundle.
 * Start the seller app first: `npm run dev:seller`, then either rely on the default
 * port or set `SELLER_E2E_BASE_URL` (see repo `.env.example`).
 */
export default defineConfig({
  testDir: './seller',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.SELLER_E2E_BASE_URL ?? 'http://127.0.0.1:8081',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
});
