/**
 * The UI suite blocks and records unmocked external requests so test results do
 * not depend on live services. Uncaught page errors fail the test at teardown.
 */
import { test as base, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ExplorerPage } from './pages/ExplorerPage';

// Every UI test gets a clean browser context. Page-level API mocks take priority
// over this context-level boundary; an omitted mock must never contact a live API.
export const test = base.extend<{ appBoundary: void; explorer: ExplorerPage }>({
  explorer: async ({ page }, use) => { await use(new ExplorerPage(page)); },
  appBoundary: [async ({ context, page, baseURL }, use) => {
    const origin = new URL(baseURL ?? 'http://127.0.0.1:5173').origin;
    const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
    const unexpected: string[] = [];
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) {
        unexpected.push(`${url.origin}${url.pathname}`);
        await route.abort('blockedbyclient');
        return;
      }
      const source = process.env.EARTHSCOPE_UI_SOURCE;
      if (source !== 'memory' && source !== 'dist') { await route.fallback(); return; }
      // Server-free verification serves only the actual app shell and source.
      const requestedPath = decodeURIComponent(url.pathname);
      const missingPage = route.request().resourceType() === 'document' && !['/', '/index.html', '/explore', '/explore.html', '/about.html', '/404.html', '/geoguess', '/geoguess.html', '/journeys', '/journeys.html'].includes(requestedPath);
      const pathname = missingPage ? '/404.html' : requestedPath === '/explore' ? '/explore.html' : requestedPath === '/journeys' ? '/journeys.html' : requestedPath === '/geoguess' ? '/geoguess.html' : requestedPath === '/api/v1/news' ? '/fixtures/news.json' : requestedPath;
      const directory = source === 'dist' ? path.join(root, 'dist') : root;
      const assetRoot = source === 'memory' && (pathname.startsWith('/images/') || pathname.startsWith('/fixtures/') || pathname === '/favicon.svg') ? path.join(root, 'public') : directory;
      const file = path.resolve(assetRoot, pathname === '/' ? 'index.html' : `.${pathname}`);
      if ((!['/', '/index.html', '/explore.html', '/about.html', '/404.html', '/geoguess.html', '/journeys.html', '/favicon.svg'].includes(pathname) && !pathname.startsWith(source === 'dist' ? '/assets/' : '/src/') && !pathname.startsWith('/images/') && !pathname.startsWith('/fixtures/')) || !file.startsWith(directory + path.sep)) {
        await route.fulfill({ status: 404, body: 'Not found' }); return;
      }
      try {
        const type = ['.js', '.ts'].includes(path.extname(file)) ? 'text/javascript'
          : path.extname(file) === '.css' ? 'text/css' : /\.(jpg|jpeg)$/.test(file) ? 'image/jpeg' : file.endsWith('.png') ? 'image/png' : file.endsWith('.webp') ? 'image/webp' : file.endsWith('.woff2') ? 'font/woff2' : file.endsWith('.svg') ? 'image/svg+xml' : file.endsWith('.json') ? 'application/json' : 'text/html';
        let body = await readFile(file);
        // Emulate Vite's development flag only for raw source mode. Dist stays untouched.
        if (source === 'memory' && pathname === '/src/dev/bugMode.js') body = Buffer.from(body.toString().replace('import.meta.env?.DEV', 'true'));
        await route.fulfill({ body, contentType: type, status: missingPage ? 404 : 200 });
      } catch { await route.fulfill({ status: 404, body: 'Not found' }); }
    });
    await use();
    expect(unexpected, 'UI tests must mock every external browser request').toEqual([]);
    expect(errors, 'Application must not produce uncaught JavaScript errors').toEqual([]);
  }, { auto: true }]
});

export { expect };
/** Intercept direct Open-Meteo requests with a deterministic outage response. */
export async function mockOpenMeteoDown(page: import('@playwright/test').Page) {
  await page.route(/^https:\/\/(?:api|geocoding-api)\.open-meteo\.com\//, route => route.fulfill({ status: 503, json: { error: true, reason: 'Fixture provider outage' } }));
}
export type { Page } from '@playwright/test';
