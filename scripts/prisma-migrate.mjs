import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

if (existsSync('.env')) process.loadEnvFile('.env');
const env = { ...process.env, DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL };
const cli = fileURLToPath(new URL('../node_modules/prisma/build/index.js', import.meta.url));
const result = spawnSync(process.execPath, [cli, 'migrate', 'deploy'], { env, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
