import { suiteBase } from './tests/config/base';
import { defineConfig } from '@playwright/test';

// Live API checks do not need the website or a local development server.
export default defineConfig({
  ...suiteBase('api'),
  testDir: './tests/api',
  workers: 1,
  });
