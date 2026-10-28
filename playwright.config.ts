import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ui',
  // These existing built-asset scenarios run in the separate v2 suite.
  testIgnore: ['**/pages/design-system.spec.ts', '**/pages/atlas-features.spec.ts', '**/pages/explorer-layout.spec.ts', '**/pages/explorer-home.spec.ts'],
  fullyParallel: true,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/ui', open: 'never' }]],
  outputDir: 'test-results/ui',
  use: {
    baseURL: `http://127.0.0.1:${process.env.EARTHSCOPE_PORT ?? '5173'}`, serviceWorkers: 'block',
    trace: 'retain-on-failure', screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'ui', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  webServer: process.env.EARTHSCOPE_UI_SOURCE === 'memory' || process.env.EARTHSCOPE_EXTERNAL_SERVER === '1' ? undefined : {
    command: process.env.EARTHSCOPE_STATIC_TEST_SERVER === '1'
      ? 'py -m http.server 5173 --bind 127.0.0.1'
      : `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${process.env.EARTHSCOPE_PORT ?? '5173'}`,
    url: `http://127.0.0.1:${process.env.EARTHSCOPE_PORT ?? '5173'}`,
    timeout: 20000,
    reuseExistingServer: !process.env.CI
  }
});
