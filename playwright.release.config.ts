import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/release', retries: 0, workers: 2,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/release', open: 'never' }]],
  outputDir: 'test-results/release',
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5173', serviceWorkers: 'block', trace: 'retain-on-failure', screenshot: 'only-on-failure' }
});
