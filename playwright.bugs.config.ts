import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/bugs', retries: 0, workers: 2,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/bugs', open: 'never' }]],
  outputDir: 'test-results/bugs',
  use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${process.env.EARTHSCOPE_PORT ?? '5173'}`, serviceWorkers: 'block', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: process.env.EARTHSCOPE_UI_SOURCE === 'memory' ? undefined : { command: `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${process.env.EARTHSCOPE_PORT ?? '5173'}`, url: `http://127.0.0.1:${process.env.EARTHSCOPE_PORT ?? '5173'}`, timeout: 20000, reuseExistingServer: !process.env.CI }
});
