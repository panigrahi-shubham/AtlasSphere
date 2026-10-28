import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const args = ['--experimental-strip-types', '--test'];
if (process.env.CI) {
  mkdirSync('test-results/junit', { recursive: true });
  args.push('--test-reporter=spec', '--test-reporter-destination=stdout', '--test-reporter=junit', '--test-reporter-destination=test-results/junit/unit.xml');
}
args.push('tests/*.test.cjs', 'tests/unit/*.test.js', ...process.argv.slice(2));
const result = spawnSync(process.execPath, args, { stdio: 'inherit', env: process.env, windowsHide: true });
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
