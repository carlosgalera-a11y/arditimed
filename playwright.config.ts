import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config para Cartagenaeste · smoke + a11y tests.
 *
 * Uso:
 *   npm run e2e          → smoke tests sobre area2cartagena.es producción
 *   npm run e2e:local    → contra http://127.0.0.1:5500 (Live Server o python -m http.server)
 *   npm run e2e:headed   → con browser visible para debug
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://area2cartagena.es',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
