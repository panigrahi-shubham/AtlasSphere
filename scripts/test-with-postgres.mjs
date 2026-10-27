import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const databaseDir = resolve('.local-postgres');
const pg = new EmbeddedPostgres({ databaseDir, user: 'skyatlas', password: 'local-test-password', port: 54329, persistent: true, onLog: () => {}, onError: message => console.error(message) });
let started = false;
const run = (command, args, env) => {
  const result = spawnSync(process.execPath, [command, ...args], { stdio: 'inherit', env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status}`);
};
try {
  if (!existsSync(resolve(databaseDir, 'PG_VERSION'))) await pg.initialise();
  await pg.start(); started = true;
  const env = { ...process.env, DATABASE_URL: 'postgresql://skyatlas:local-test-password@127.0.0.1:54329/skyatlas_test', AUTH_SECRET: 'local-test-secret-never-deploy-32-characters', APP_ENV: 'test', FIXTURES: '1' };
  try { await pg.createDatabase('skyatlas_test'); } catch (error) { if (!String(error).includes('already exists')) throw error; }
  run(resolve('node_modules/prisma/build/index.js'), ['migrate', 'deploy'], env);
  run(resolve('node_modules/@playwright/test/cli.js'), ['test', '--config=playwright.api-local.config.ts', '--reporter=list'], env);
} catch (error) { console.error(error); process.exitCode = 1; }
finally { if (started) await pg.stop(); }
