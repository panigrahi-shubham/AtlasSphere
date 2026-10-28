/**
 * Feature: Browser-to-local-API integration
 * Layer: API integration — Playwright
 * Real: Express API and configured PostgreSQL persistence
 * Mocked: Upstream responses or injected dependencies where supplied by the scenario
 * Guards: Regressions in browser-to-local-api integration; negative cases remain explicit below
 * Run: npm run test:accounts:local
 * Needs: Isolated DATABASE_URL and AUTH_SECRET, or the disposable local PostgreSQL wrapper
 */
import { test, expect } from '@playwright/test';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { createApp } from '../../api/app.ts';

// Risk: The browser and API could work independently while their integration fails.
// Given a local API with fixtures, When the browser searches and reads news, Then weather and news render through that API.
test('site searches, displays fixture weather and reads news through its own API', async ({ page }) => {
  const oldEnv = process.env.APP_ENV, oldFixtures = process.env.FIXTURES;
  process.env.APP_ENV = 'test'; process.env.FIXTURES = '1';
  const server = await createServer({
    configFile: 'vite.config.js',
    server: { host: '127.0.0.1', port: 0, strictPort: false },
    plugins: [{
      name: 'isolated-news-fixture', enforce: 'pre',
      configureServer(vite) {
        // Exercise the real API with fixed news, independently of RSS commits.
        vite.middlewares.use(createApp({ env: 'test', fixtures: true,
          newsPath: fileURLToPath(new URL('../../public/fixtures/news.json', import.meta.url)) }));
      }
    }]
  });
  try {
    await server.listen();
    const address = server.httpServer?.address();
    if (!address || typeof address === 'string') throw new Error('Vite did not start');
    const origin = `http://127.0.0.1:${address.port}`;
    await page.goto(origin + '/explore.html');
    await expect(page.getByTestId('news-item')).toHaveCount(2);
    await page.getByTestId('city-search-input').fill('Nashik');
    await page.getByTestId('city-search-button').click();
    await page.getByTestId('city-suggestion').click();
    await expect(page.getByTestId('current-temperature')).toContainText('24');
    await page.getByTestId('advanced-load').click();
    await expect(page.getByTestId('daily-table')).toBeVisible();
    const response = await page.request.get(origin + '/api/v1/health');
    expect(response.status()).toBe(200);
  } finally {
    await server.close();
    if (oldEnv === undefined) delete process.env.APP_ENV; else process.env.APP_ENV = oldEnv;
    if (oldFixtures === undefined) delete process.env.FIXTURES; else process.env.FIXTURES = oldFixtures;
  }
});

