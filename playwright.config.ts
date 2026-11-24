import { defineConfig, devices } from '@playwright/test';

// Target defaults to the public practice host; override with BASE_URL=... to point elsewhere.
const BASE_URL = process.env.BASE_URL ?? 'https://app.thetestingacademy.com';

export default defineConfig({
  testDir: './tests',
  // Behaviour specs that depend on the chat app's own JavaScript live in tests/pending (see README).
  testIgnore: process.env.INCLUDE_PENDING ? [] : ['**/pending/**'],
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3, // polite guest on a third-party host
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
});
