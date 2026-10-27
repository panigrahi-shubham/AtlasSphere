import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
const databaseDir = resolve('.local-postgres');
const testDatabaseName = `skyatlas_test_${randomBytes(8).toString('hex')}`;
const pg = new EmbeddedPostgres({ databaseDir, user: 'skyatlas', password: 'local-test-password', port: 54329, persistent: true, onLog: () => {}, onError: message => console.error(message) });
let started = false, created = false;
const run = (command, args, env) => {
  const result = spawnSync(process.execPath, [command, ...args], { stdio: 'inherit', env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status}`);
};
try {
  if (!existsSync(resolve(databaseDir, 'PG_VERSION'))) await pg.initialise();
  await pg.start(); started = true;
  const env = { ...process.env, DATABASE_URL: `postgresql://skyatlas:local-test-password@127.0.0.1:54329/${testDatabaseName}`, DIRECT_DATABASE_URL: '', AUTH_SECRET: 'local-test-secret-never-deploy-32-characters', APP_ENV: 'test', FIXTURES: '1' };
  await pg.createDatabase(testDatabaseName); created = true;
  run(resolve('scripts/prisma-migrate.mjs'), [], env);
  run(resolve('node_modules/@playwright/test/cli.js'), ['test', '--config=playwright.api-local.config.ts', '--reporter=list'], env);
  if (process.argv.includes('--smoke')) {
    const smokeEnv = { ...env, SKYATLAS_SMOKE_LOCAL: '1', SKYATLAS_URL: 'http://127.0.0.1:31423', PORT: '31423' };
    run(resolve('node_modules/@playwright/test/cli.js'), ['test', '--config=playwright.smoke.config.ts', '--reporter=list'], smokeEnv);
  }
} catch (error) { console.error(error); process.exitCode = 1; }
finally {
  if (created) {
    try { await pg.dropDatabase(testDatabaseName); }
    catch (error) { console.error('Could not remove the disposable test database:', error); process.exitCode = 1; }
  }
  if (started) await pg.stop();
}
