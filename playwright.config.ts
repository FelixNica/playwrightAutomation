/**
 * Prompt used in Cursor:
 * "Create a Playwright config for https://mega-image.ro with 60s timeout,
 * HTML reporter, screenshots on failure, and Chrome desktop viewport."
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  timeout: 10_000,
  expect: { timeout: 10_000 },
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
  use: {
    baseURL: 'https://mega-image.ro',
    headless: true,
    viewport: { width: 1366, height: 900 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
