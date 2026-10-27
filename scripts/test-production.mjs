import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
for (const [entry, args, extraEnv] of [
  ['../node_modules/vite/bin/vite.js', ['build'], {}],
  ['../node_modules/@playwright/test/cli.js', ['test', '--config=playwright.release.config.ts', ...process.argv.slice(2)], { EARTHSCOPE_UI_SOURCE: 'dist' }]
]) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(entry, import.meta.url)), ...args], { stdio: 'inherit', env: { ...process.env, ...extraEnv } });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
