import { suiteBase, browserDiagnostics } from './tests/config/base';
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  ...suiteBase('release'),
  testDir: './tests/release', workers: 2,
  use: { ...browserDiagnostics, ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5173', }
});
