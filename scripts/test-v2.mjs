import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
for (const [entry, args] of [
  ['../node_modules/vite/bin/vite.js', ['build']],
  ['../node_modules/@playwright/test/cli.js', ['test', '--config=playwright.v2.config.ts', ...process.argv.slice(2)]]
]) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(entry, import.meta.url)), ...args], { stdio: 'inherit', env: { ...process.env, EARTHSCOPE_UI_SOURCE: 'dist' } });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
