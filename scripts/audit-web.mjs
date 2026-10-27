import lighthouse from 'lighthouse';
import { chromium } from '@playwright/test';
import { createApp } from '../api/app.ts';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const freePort = () => new Promise(resolvePort => { const server = createServer(); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolvePort(port)); }); });
const report = resolve('lighthouse-report');
await mkdir(report, { recursive: true });
const site = createApp({ env: 'production' }).listen(0, '127.0.0.1');
await new Promise((resolveListen, rejectListen) => {
  site.once('listening', resolveListen);
  site.once('error', rejectListen);
});
const sitePort = site.address().port;
const chromePort = await freePort();
const chrome = spawn(chromium.executablePath(), ['--headless', '--no-first-run', '--disable-background-networking', '--disable-extensions', '--disable-default-apps', '--no-sandbox', `--remote-debugging-port=${chromePort}`, `--user-data-dir=${resolve(report, 'profile')}`], { windowsHide: true, stdio: 'ignore' });
async function untilReady() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try { const response = await fetch(`http://127.0.0.1:${chromePort}/json/version`, { signal: AbortSignal.timeout(1000) }); if (response.ok) return; } catch { /* Chrome is starting. */ }
    await new Promise(done => setTimeout(done, 250));
  }
  throw new Error('Chromium debugging port did not open.');
}
try {
  await untilReady();
  const rows = [];
  for (let run = 1; run <= 3; run++) {
    const result = await lighthouse(`http://127.0.0.1:${sitePort}/`, { port: chromePort, output: 'json', logLevel: 'error', onlyCategories: ['performance','accessibility'], formFactor: 'mobile', throttlingMethod: 'simulate' });
    if (!result) throw new Error('Lighthouse returned no result.');
    const { lhr } = result;
    const row = { run, performance: Math.round((lhr.categories.performance.score ?? 0) * 100), accessibility: Math.round((lhr.categories.accessibility.score ?? 0) * 100), cls: lhr.audits['cumulative-layout-shift'].numericValue ?? null };
    rows.push(row); console.log(row);
    await writeFile(resolve(report, `run-${run}.json`), JSON.stringify(lhr), 'utf8');
  }
  const good = rows.every(row => row.performance >= 80 && row.accessibility >= 90 && row.cls !== null && row.cls < 0.1);
  await writeFile(resolve(report, 'summary.json'), JSON.stringify({ conditions: 'Lighthouse mobile simulation; production homepage at 390×844, no city selected', target: { performance: 80, accessibility: 90, clsUnder: 0.1 }, runs: rows, meetsTargets: good }, null, 2));
  if (!good) process.exitCode = 1;
} finally {
  chrome.kill();
  await new Promise(done => site.close(done));
}
