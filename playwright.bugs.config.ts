import { suiteBase, browserDiagnostics } from './tests/config/base';
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  ...suiteBase('bugs'),
  testDir: './tests/bugs', workers: 2,
  use: { ...browserDiagnostics, ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${process.env.EARTHSCOPE_PORT ?? '5173'}`, },
  webServer: process.env.EARTHSCOPE_UI_SOURCE === 'memory' ? undefined : { command: `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${process.env.EARTHSCOPE_PORT ?? '5173'}`, url: `http://127.0.0.1:${process.env.EARTHSCOPE_PORT ?? '5173'}`, timeout: 20000, reuseExistingServer: !process.env.CI }
});
