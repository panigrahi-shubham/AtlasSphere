import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const result = spawnSync(process.execPath, [
  fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url)),
  'test', ...process.argv.slice(2)
], {
  stdio: 'inherit',
  env: { ...process.env, EARTHSCOPE_UI_SOURCE: 'memory' }
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
