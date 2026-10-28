import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/ui/pages',
  testMatch: ['design-system.spec.ts', 'atlas-features.spec.ts', 'explorer-layout.spec.ts', 'explorer-home.spec.ts'],
  fullyParallel: true, workers: 3, retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/v2', open: 'never' }]],
  outputDir: 'test-results/v2',
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure', screenshot: 'only-on-failure', serviceWorkers: 'block', launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } }
});
