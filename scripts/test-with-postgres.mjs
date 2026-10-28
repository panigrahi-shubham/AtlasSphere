import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
const databaseDir = resolve('.local-postgres', `run-${randomBytes(8).toString('hex')}`);
const databasePort = await new Promise((resolvePort, reject) => {
  const reservation = createServer();
  reservation.once('error', reject);
  reservation.listen(0, '127.0.0.1', () => {
    const { port } = reservation.address();
    reservation.close(error => error ? reject(error) : resolvePort(port));
  });
});
const testDatabaseName = `skyatlas_test_${randomBytes(8).toString('hex')}`;
const pg = new EmbeddedPostgres({ databaseDir, user: 'skyatlas', password: 'local-test-password', port: databasePort, persistent: true, onLog: () => {}, onError: message => console.error(message) });
const windowsControl = process.platform === 'win32' ? (await import('@embedded-postgres/windows-x64')).pg_ctl : undefined;
function controlCluster(action) {
  const args = [action, '-D', databaseDir, '-w', '-t', '20'];
  if (action === 'start') args.push('-o', `-p ${databasePort}`, '-l', resolve(databaseDir, 'server.log'));
  else args.push('-m', 'fast');
  const result = spawnSync(windowsControl, args, { stdio: 'inherit', windowsHide: true, timeout: 25000 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Disposable PostgreSQL ${action} failed with ${result.status}.`);
}
async function manageDatabase(action) {
  if (!windowsControl) return action === 'CREATE' ? pg.createDatabase(testDatabaseName) : pg.dropDatabase(testDatabaseName);
  const client = pg.getPgClient();
  try {
    await client.connect();
    // The name belongs only to this run; escape it as an identifier rather than
    // interpolating arbitrary input into SQL.
    await client.query(`${action} DATABASE ${client.escapeIdentifier(testDatabaseName)}`);
  } finally { await client.end(); }
}
let started = false, created = false;
const run = (command, args, env) => {
  const result = spawnSync(process.execPath, [command, ...args], { stdio: 'inherit', env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status}`);
};
try {
  if (!existsSync(resolve(databaseDir, 'PG_VERSION'))) await pg.initialise();
  // pg_ctl owns the Windows process lifecycle; the library's taskkill path can
  // leave a child process behind. Linux retains the existing lifecycle.
  if (windowsControl) controlCluster('start'); else await pg.start();
  started = true;
  const env = { ...process.env, DATABASE_URL: `postgresql://skyatlas:local-test-password@127.0.0.1:${databasePort}/${testDatabaseName}`, DIRECT_DATABASE_URL: '', AUTH_SECRET: 'local-test-secret-never-deploy-32-characters', APP_ENV: 'test', FIXTURES: '1' };
  await manageDatabase('CREATE'); created = true;
  run(resolve('scripts/prisma-migrate.mjs'), [], env);
  run(resolve('node_modules/@playwright/test/cli.js'), ['test', '--config=playwright.api-local.config.ts', '--reporter=list'], env);
  if (process.argv.includes('--smoke')) {
    const smokeEnv = { ...env, SKYATLAS_SMOKE_LOCAL: '1', SKYATLAS_URL: 'http://127.0.0.1:31423', PORT: '31423' };
    run(resolve('node_modules/@playwright/test/cli.js'), ['test', '--config=playwright.smoke.config.ts', '--reporter=list'], smokeEnv);
  }
} catch (error) { console.error(error); process.exitCode = 1; }
finally {
  if (created) {
    try { await manageDatabase('DROP'); }
    catch (error) { console.error('Could not remove the disposable test database:', error); process.exitCode = 1; }
  }
  if (started) {
    try { if (windowsControl) controlCluster('stop'); else await pg.stop(); }
    catch (error) { console.error('Could not stop the disposable test cluster:', error); process.exitCode = 1; }
  }
}
// Preserve failure status through the embedded library's process-exit hook.
process.exit(process.exitCode ?? 0);
