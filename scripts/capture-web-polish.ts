import { chromium } from 'playwright';
import { readFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'docs/screenshots');
await mkdir(directory, { recursive: true });
for (const size of ['desktop', 'mobile']) {
  await copyFile(path.join(directory, `phase1-after-${size}.png`), path.join(directory, `roadmap-phase1-before-${size}.png`)).catch(() => {});
}
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== 'http://earthscope.test') { await route.abort(); return; }
    const filename = path.resolve(root, 'dist', url.pathname === '/' ? 'index.html' : `.${url.pathname}`);
    if (!filename.startsWith(path.join(root, 'dist') + path.sep)) { await route.abort(); return; }
    try {
      const type = filename.endsWith('.js') ? 'text/javascript' : filename.endsWith('.css') ? 'text/css' : filename.endsWith('.json') ? 'application/json' : filename.endsWith('.svg') ? 'image/svg+xml' : /\.(jpg|jpeg)$/.test(filename) ? 'image/jpeg' : 'text/html';
      await route.fulfill({ body: await readFile(filename), contentType: type });
    } catch { await route.fulfill({ status: 404, body: 'Not found' }); }
  });
  await page.goto('http://earthscope.test/');
  await page.getByTestId('news-item').first().waitFor();
  await page.getByTestId('hero-photo').evaluate(image => image.decode());
  for (const [size, width] of [['desktop', 1440], ['mobile', 375]]) {
    await page.setViewportSize({ width: Number(width), height: size === 'mobile' ? 900 : 1000 });
    await page.screenshot({ path: path.join(directory, `roadmap-phase1-after-${size}.png`), fullPage: true });
    await page.screenshot({ path: path.join(directory, `roadmap-phase1-preview-${size}.png`) });
  }
  console.log('Desktop/mobile before and after captures available in docs/screenshots.');
} finally { await browser.close(); }
