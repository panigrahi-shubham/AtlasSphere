import { suiteBase } from './tests/config/base';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  ...suiteBase('api-local'), testDir: './tests/api-local', workers: 1, });
