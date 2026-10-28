import { suiteBase, browserDiagnostics } from './tests/config/base';
import { defineConfig } from '@playwright/test';

const baseURL = process.env.SKYATLAS_URL || 'https://atlassphere.vercel.app';
export default defineConfig({
  ...suiteBase('smoke-prod'),
  testDir: './tests/smoke', workers: 1, timeout: 150000, use: { ...browserDiagnostics, baseURL },
  ...(process.env.SKYATLAS_SMOKE_LOCAL === '1' ? { webServer: { command: 'node --experimental-strip-types api/server.ts', url: `${baseURL}/api/v1/health`, timeout: 30000, reuseExistingServer: false } } : {})
});
