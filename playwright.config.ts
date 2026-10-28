import { suiteBase, browserDiagnostics, localWebServer } from './tests/config/base';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  ...suiteBase('ui'),
  testDir: './tests/ui',
  // These existing built-asset scenarios run in the separate v2 suite.
  testIgnore: ['**/pages/design-system.spec.ts', '**/pages/atlas-features.spec.ts', '**/pages/explorer-layout.spec.ts', '**/pages/explorer-home.spec.ts'],
  fullyParallel: true,
  use: { ...browserDiagnostics,
    baseURL: `http://127.0.0.1:${process.env.EARTHSCOPE_PORT ?? '5173'}`, },
  projects: [
    { name: 'ui', use: { ...browserDiagnostics, ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...browserDiagnostics, ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...browserDiagnostics, ...devices['Desktop Safari'] } }
  ],
  webServer: process.env.EARTHSCOPE_UI_SOURCE === 'memory' || process.env.EARTHSCOPE_EXTERNAL_SERVER === '1' ? undefined : localWebServer(
    process.env.EARTHSCOPE_STATIC_TEST_SERVER === '1'
      ? 'py -m http.server 5173 --bind 127.0.0.1'
      : `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${process.env.EARTHSCOPE_PORT ?? '5173'}`,
    `http://127.0.0.1:${process.env.EARTHSCOPE_PORT ?? '5173'}`, 20000)
});
