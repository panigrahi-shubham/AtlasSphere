import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests/api-local', workers: 1, retries: 0, reporter: [['list'], ['html', { outputFolder: 'playwright-report/api-local', open: 'never' }]], outputDir: 'test-results/api-local' });
