import { chromium, firefox, webkit } from 'playwright';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const missing = Object.entries({ chromium, firefox, webkit })
  .filter(([, browser]) => !existsSync(browser.executablePath())).map(([name]) => name);
if (missing.length) {
  console.error(`Matching Playwright browser binaries are missing: ${missing.join(', ')}.`);
  console.error('Install them with: npx playwright install chromium firefox webkit');
  process.exit(1);
}
const memory = process.argv.includes('--memory');
const args = process.argv.slice(2).filter(argument => argument !== '--memory');
const result = spawnSync(process.execPath, [
  fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url)), 'test', ...args
], {
  stdio: 'inherit',
  env: { ...process.env, ...(memory ? { EARTHSCOPE_UI_SOURCE: 'memory' } : {}) }
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
