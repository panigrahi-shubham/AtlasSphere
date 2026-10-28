import { suiteBase, browserDiagnostics } from './tests/config/base';
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  ...suiteBase('v2'),
  testDir: './tests/ui/pages',
  testMatch: ['design-system.spec.ts', 'atlas-features.spec.ts', 'explorer-layout.spec.ts', 'explorer-home.spec.ts'],
  fullyParallel: true, workers: 3, use: { ...browserDiagnostics, ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5173', launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } }
});
