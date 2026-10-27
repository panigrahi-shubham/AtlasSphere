import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const targets = ['api','src','scripts'];
let checked = 0;
for (const folder of targets) {
  const walk = path => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const full = join(path, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(m?js|cjs)$/.test(entry.name)) {
        const result = spawnSync(process.execPath, ['--check', full], { encoding: 'utf8' });
        if (result.status !== 0) { console.error(result.stderr); process.exit(result.status ?? 1); }
        checked++;
      }
    }
  };
  walk(folder);
}
console.log(`Syntax checked ${checked} JavaScript files.`);
