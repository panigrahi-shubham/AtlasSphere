import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Check repository-relative Markdown links without fetching third-party sites.
const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' })
  .split('\0').filter(file => file.endsWith('.md') && existsSync(file));
const missing = [];
for (const file of new Set(files)) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  let fenced = false;
  for (const [index, line] of lines.entries()) {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    for (const match of line.matchAll(/\]\((?:<([^>]+)>|([^\s)]+))/g)) {
      const target = match[1] ?? match[2];
      if (/^(?:[a-z][a-z0-9+.-]*:|#|\/)/i.test(target)) continue;
      const rawPath = target.split(/[?#]/, 1)[0];
      let decoded;
      try { decoded = decodeURIComponent(rawPath); } catch { missing.push(`${file}:${index + 1}: invalid encoding`); continue; }
      if (decoded && !existsSync(path.resolve(path.dirname(file), decoded))) missing.push(`${file}:${index + 1}: ${target}`);
    }
  }
}
if (missing.length) { console.error(missing.join('\n')); process.exitCode = 1; }
else console.log(`Checked local links in ${new Set(files).size} Markdown files.`);
