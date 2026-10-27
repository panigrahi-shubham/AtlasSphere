import { defineConfig } from '@playwright/test';

// Live API checks do not need the website or a local development server.
export default defineConfig({
  testDir: './tests/api',
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  outputDir: 'test-results/api',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/api', open: 'never' }]]
});
