import { defineConfig } from '@playwright/test';

const baseURL = process.env.SKYATLAS_URL || 'https://skyatlas-9mae.onrender.com';
export default defineConfig({
  testDir: './tests/smoke', workers: 1, timeout: 150000, retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/smoke-prod', open: 'never' }]],
  use: { baseURL },
  ...(process.env.SKYATLAS_SMOKE_LOCAL === '1' ? { webServer: { command: 'node --experimental-strip-types api/server.ts', url: `${baseURL}/api/v1/health`, timeout: 30000, reuseExistingServer: false } } : {})
});
