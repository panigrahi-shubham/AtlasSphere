import { suiteBase, browserDiagnostics } from './tests/config/base';
import { defineConfig, devices } from '@playwright/test';
const production = process.env.HOME_PRODUCTION === '1';
const baseURL = production ? 'http://127.0.0.1:31424' : 'http://127.0.0.1:5173';
export default defineConfig({
  ...suiteBase('home'),
  testDir: './tests/home', fullyParallel: true, workers: 2, timeout: 30000, outputDir: production ? 'test-results/home-production' : 'test-results/home',
  use: { ...browserDiagnostics, baseURL, },
  projects: [
    { name: 'home-desktop', use: { ...browserDiagnostics, ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'home-touch', use: { ...browserDiagnostics, ...devices['iPhone 13'], defaultBrowserType: 'chromium', viewport: { width: 375, height: 812 } } }
  ],
  webServer: production
    ? { command: 'node --experimental-strip-types api/server.ts', url: baseURL,
        env: { APP_ENV: 'production', NODE_ENV: 'production', PORT: '31424', FIXTURES: '0', DATABASE_URL: '', AUTH_SECRET: '' },
        reuseExistingServer: false, timeout: 30000 }
    : { command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1', url: baseURL, reuseExistingServer: !process.env.CI, timeout: 30000 }
});
