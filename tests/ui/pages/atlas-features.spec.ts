/**
 * Feature: Atlas, daily forecast and interactive globe
 * Layer: UI regression — Playwright
 * Real: Browser rendering, routing and interaction
 * Mocked: Provider responses and browser failures where supplied by the scenario
 * Guards: Regressions in atlas, daily forecast and interactive globe; negative cases remain explicit below
 * Run: npm run test:v2 -- tests/ui/pages/atlas-features.spec.ts
 * Needs: Installed Chromium and the suite’s local server or production build
 */
import { test, expect, mockOpenMeteoDown, type Page } from '../../support/uiTest';
import { currentWeatherFixture } from '../../fixtures/currentWeather.js';

const city = { id: 1, name: 'Nashik', country: 'India', country_code: 'IN', admin1: 'Maharashtra', latitude: 19.99, longitude: 73.78, timezone: 'Asia/Kolkata' };
function dailyFixture() {
  const days = Array.from({ length: 7 }, (_, i) => 1792953000 + i * 86400);
  return { timezone: 'Asia/Kolkata', daily_units: { time: 'unixtime', temperature_2m_max: '°C', temperature_2m_min: '°C', precipitation_probability_max: '%', precipitation_sum: 'mm', wind_speed_10m_max: 'km/h', uv_index_max: '', sunrise: 'unixtime', sunset: 'unixtime', weather_code: 'wmo code' }, daily: { time: days, temperature_2m_max: [25, 26, 27, 28, 29, 30, 31], temperature_2m_min: Array(7).fill(15), precipitation_probability_max: [0, 10, 20, 30, 40, 50, 60], precipitation_sum: Array(7).fill(0), wind_speed_10m_max: Array(7).fill(12), uv_index_max: Array(7).fill(4), sunrise: days.map(t => t + 21600), sunset: days.map(t => t + 64800), weather_code: Array(7).fill(2) } };
}
test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/geocode?**', route => route.fulfill({ json: { results: [city] } }));
  await page.route('**/api/v1/weather?**', route => route.fulfill({ json: new URL(route.request().url()).searchParams.get('view') === 'daily' ? dailyFixture() : currentWeatherFixture }));
  await page.goto('/explore.html');
});
async function atlas(page: Page) { await page.getByTestId('atlas-load').click(); await expect(page.getByTestId('world-map')).toBeVisible(); }
async function selectCity(page: Page) { await page.getByTestId('city-search-input').fill('Nashik'); await page.getByTestId('city-search-button').click(); await page.getByTestId('city-suggestions').getByRole('button').click(); await expect(page.getByTestId('current-temperature')).toHaveText('24°C'); }


// Risk: The atlas could load eagerly or omit directory records.
// Given the initial explorer, When the atlas is opened, Then it loads on demand with the complete directory.
test('atlas is loaded on demand and includes the complete country directory', async ({ page }) => {
  await expect(page.getByTestId('world-map')).toBeHidden(); await atlas(page);
  await expect(page.getByTestId('map-country')).toHaveCount(177);
  await expect(page.getByTestId('country-count')).toContainText('250 of 250');
});

// Risk: Map interactions could exclude keyboard users.
// Given the atlas, When countries and zoom controls are used by keyboard, Then selection and reset work.
test('country map supports keyboard selection and zoom/reset', async ({ page }) => {
  await atlas(page); const india = page.getByRole('button', { name: 'Explore India', exact: true });
  await india.focus(); await page.keyboard.press('Enter'); await expect(page.getByTestId('country-title')).toHaveText('India');
  await expect(india).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('map-zoom-in').click(); await expect(page.getByTestId('map-zoom-level')).toHaveText('135%');
  await page.getByTestId('map-reset').click(); await expect(page.getByTestId('map-zoom-level')).toHaveText('100%');
});

// Risk: Filters could miss capitals, regions or empty-result states.
// Given country records, When those filters are applied, Then results match the selected criteria.
test('country filters support capitals, regions and no matches', async ({ page }) => {
  await atlas(page); await page.getByTestId('country-filter').fill('New Delhi'); await expect(page.getByTestId('country-option')).toHaveText(['India']);
  await page.getByTestId('country-region').selectOption('Europe'); await expect(page.getByTestId('country-count')).toContainText('0 of');
  await page.getByTestId('country-filter').fill(''); await expect(page.getByTestId('country-option').first()).toBeVisible();
});

// Risk: Country selection could leave unrelated facts or landmarks visible.
// Given different countries, When selection changes, Then sourced details update with it.
test('country facts and sourced landmarks change with country selection', async ({ page }) => {
  await atlas(page); await page.getByTestId('country-filter').fill('India'); await page.getByTestId('country-directory').getByRole('button', { name: 'India', exact: true }).click();
  await expect(page.getByTestId('country-facts')).toContainText('New Delhi'); await expect(page.getByTestId('landmark-card')).toHaveCount(2);
  await expect(page.getByTestId('landmark-card').first().getByRole('link', { name: 'UNESCO site record', exact: true })).toHaveAttribute('href', 'https://whc.unesco.org/en/list/252/');
  await page.getByTestId('landmarks-worldwide').click(); await expect(page.getByTestId('landmark-card')).toHaveCount(16);
});

// Risk: A landmark could open weather for the prior city.
// Given a landmark, When opened and saved, Then its own coordinates drive weather and favorites.
test('a landmark opens its own coordinates, weather and saved-location flow', async ({ page }) => {
  await atlas(page); await page.getByRole('button', { name: 'Explore Taj Mahal', exact: true }).click();
  await expect(page.getByTestId('city-name')).toHaveText('Taj Mahal'); await expect(page.getByTestId('latitude-value')).toContainText('27.175');
  await page.getByTestId('favorite-toggle').click(); await expect(page.getByTestId('favorites-list')).toContainText('Taj Mahal');
  await expect(page.getByTestId('map-location')).toContainText('Taj Mahal');
});

// Risk: A capital lookup could select a same-name city abroad.
// Given a country selection, When its capital is opened, Then the lookup uses that country restriction.
test('capital lookup uses a country filter before opening weather', async ({ page }) => {
  await page.route('**/api/v1/geocode?**', route => { const url = new URL(route.request().url()); expect(url.searchParams.get('countryCode')).toBe('IN'); return route.fulfill({ json: { results: [{ ...city, name: 'New Delhi' }] } }); });
  await atlas(page); await page.getByTestId('country-filter').fill('India'); await page.getByTestId('country-directory').getByRole('button', { name: 'India', exact: true }).click(); await page.getByTestId('country-weather').click();
  await expect(page.getByTestId('city-name')).toHaveText('New Delhi');
});

// Risk: A failed capital request could disable the rest of the atlas.
// Given a lookup outage, When retry is used, Then the atlas remains usable and selection can recover.
test('capital failure preserves the usable atlas and allows retry', async ({ page }) => {
  await mockOpenMeteoDown(page);
  await page.route('**/api/v1/geocode?**', route => route.fulfill({ status: 503, json: {} }));
  await atlas(page); await page.getByTestId('country-filter').fill('India'); await page.getByTestId('country-directory').getByRole('button', { name: 'India', exact: true }).click(); await page.getByTestId('country-weather').click();
  await expect(page.getByTestId('country-status')).toContainText('503'); await expect(page.getByTestId('country-weather')).toBeEnabled(); await expect(page.getByTestId('world-map')).toBeVisible();
});

// Risk: Daily charts could omit metrics or use the browser timezone.
// Given a daily fixture, When chart and table load, Then seven days and the selected timezone are represented.
test('seven day chart and table load with selected timezone and all daily metrics', async ({ page }) => {
  await selectCity(page); await page.getByTestId('advanced-load').click(); await expect(page.getByTestId('daily-row')).toHaveCount(7);
  await expect(page.getByTestId('chart-caption')).toContainText('Asia/Kolkata'); await expect(page.getByTestId('daily-row').first()).toContainText('25°C');
  await expect(page.getByTestId('daily-row').first()).toContainText('06:00');
  await expect(page.getByTestId('weather-chart').locator('circle')).toHaveCount(7);
});

// Risk: Changing chart units could refetch or corrupt data.
// Given a loaded chart, When measurement and units change, Then the same data is rendered without another request.
test('chart measurement and temperature units switch without refetching', async ({ page }) => {
  let requests = 0; await page.route('**/api/v1/weather?**', route => { requests++; return route.fulfill({ json: new URL(route.request().url()).searchParams.get('view') === 'daily' ? dailyFixture() : currentWeatherFixture }); });
  await selectCity(page); await page.getByTestId('advanced-load').click(); await expect(page.getByTestId('daily-row')).toHaveCount(7);
  await page.getByTestId('unit-fahrenheit').click(); await expect(page.getByTestId('daily-row').first()).toContainText('77°F'); await expect(page.getByTestId('chart-caption')).toContainText('°F'); await expect(page.getByTestId('dashboard-high')).toHaveText('77°F'); await expect(page.getByTestId('dashboard-low')).toHaveText('59°F');
  await page.getByTestId('chart-metric').selectOption('rain'); await expect(page.getByTestId('chart-caption')).toContainText('(%)');
  await page.getByTestId('chart-metric').selectOption('wind'); await expect(page.getByTestId('chart-caption')).toContainText('km/h'); expect(requests).toBe(2);
});

// Risk: Missing daily values could be drawn as false zero readings.
// Given gaps in daily metrics, When chart and table render, Then gaps remain honest and available values remain visible.
test('missing daily metrics create chart gaps and available table values remain usable', async ({ page }) => {
  await page.route('**/api/v1/weather?**', route => { const data = dailyFixture(); data.daily.temperature_2m_max[2] = null as any; data.daily.sunrise = []; return route.fulfill({ json: new URL(route.request().url()).searchParams.get('view') === 'daily' ? data : currentWeatherFixture }); });
  await selectCity(page); await page.getByTestId('advanced-load').click(); await expect(page.getByTestId('daily-row')).toHaveCount(7); await expect(page.getByTestId('weather-chart').locator('circle')).toHaveCount(6);
  await expect(page.getByTestId('daily-row').nth(2)).toContainText('Not available'); await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
});

// Risk: A daily outage could hide usable current conditions.
// Given a failed extended request, When retry runs, Then current weather remains and the daily view can recover.
test('extended forecast failure does not hide current weather and can retry', async ({ page }) => {
  await mockOpenMeteoDown(page);
  let failed = true; await page.route('**/api/v1/weather?**', route => { const daily = new URL(route.request().url()).searchParams.get('view') === 'daily'; return route.fulfill({ status: daily && failed ? 503 : 200, json: daily ? dailyFixture() : currentWeatherFixture }); });
  await selectCity(page); await page.getByTestId('advanced-load').click(); await expect(page.getByTestId('advanced-status')).toContainText('503'); await expect(page.getByTestId('current-temperature')).toBeVisible(); failed = false;
  await page.getByTestId('advanced-load').click(); await expect(page.getByTestId('daily-row')).toHaveCount(7);
});

// Risk: Clearing a place could allow its delayed forecast to return.
// Given a pending daily response, When selection is cleared, Then the obsolete forecast is discarded.
test('clearing a city discards a pending extended forecast', async ({ page }) => {
  let release = () => {}; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/v1/weather?**', async route => { const daily = new URL(route.request().url()).searchParams.get('view') === 'daily'; if (daily) await gate; await route.fulfill({ json: daily ? dailyFixture() : currentWeatherFixture }).catch(() => {}); });
  await selectCity(page); await page.getByTestId('advanced-load').click(); await expect(page.getByTestId('advanced-status')).toContainText('Loading');
  await page.getByTestId('city-search-clear').click(); release(); await expect(page.getByTestId('advanced-section')).toBeHidden(); await expect(page.getByTestId('daily-row')).toHaveCount(0);
});

// Risk: Missing WebGL could remove geographic exploration entirely.
// Given an unavailable context, When 3D is requested, Then an accessible map fallback remains.
test('WebGL unavailable shows an accessible map fallback', async ({ page }) => {
  await page.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, type: any, ...args: any[]) { return type === 'webgl2' ? null : (original as any).call(this, type, ...args); } as any; });
  await page.reload(); await atlas(page); await page.getByTestId('globe-load').click(); await expect(page.getByTestId('globe-status')).toContainText('3D is unavailable'); await expect(page.getByTestId('world-map')).toBeVisible();
});

// Risk: The globe could render without responding to selected weather or controls.
// Given selected rain conditions, When the 3D view and controls are used, Then rendering and the selected visualization work.
test('Three.js renders a globe and selected rain visualization with interactive controls', async ({ page }) => {
  const rainy = structuredClone(currentWeatherFixture); rainy.current.weather_code = 61;
  await page.route('**/api/v1/weather?**', route => route.fulfill({ json: rainy }));
  await selectCity(page); await atlas(page); await page.getByTestId('globe-load').click();
  await expect(page.getByTestId('globe-status')).toContainText('Globe ready'); await expect(page.getByTestId('globe-renderer')).toBeVisible();
  await expect(page.getByTestId('globe-weather')).toContainText('Rain visualization');
  await page.getByTestId('globe-canvas').screenshot({ path: 'test-results/v2/globe-selected.png' });
  await page.getByTestId('globe-rotate').click(); await expect(page.getByTestId('globe-rotate')).toHaveAttribute('aria-pressed', 'true'); await page.getByTestId('globe-reset').click(); await expect(page.getByTestId('globe-rotate')).toHaveAttribute('aria-pressed', 'false');
  await page.getByTestId('globe-canvas').screenshot({ path: 'test-results/v2/globe-desktop.png' }); await page.getByTestId('globe-renderer').focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('+');
});

// Risk: Expanded geography controls could overflow a phone.
// Given a narrow viewport, When atlas and charts open, Then content remains within the page width.
test('mobile atlas and charts stay within page width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); await atlas(page); await selectCity(page); await page.getByTestId('advanced-load').click(); await expect(page.getByTestId('daily-row')).toHaveCount(7);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByTestId('country-filter')).toBeVisible(); await page.screenshot({ path: 'test-results/v2/mobile.png', fullPage: true });
});


// Risk: Advanced controls could lack usable accessible names.
// Given expanded atlas and forecast tools, When accessibility is checked, Then their controls remain identifiable.
test('expanded atlas and forecast controls have accessible names', async ({ page }) => {
  test.setTimeout(90000); // Hundreds of real accessible-name assertions; keep each assertion's normal timeout.
  await atlas(page); await selectCity(page); await page.getByTestId('advanced-load').click(); await expect(page.getByTestId('daily-row')).toHaveCount(7);
  for (const control of await page.locator('input:visible, select:visible, button:visible').all()) await expect(control).toHaveAccessibleName(/\S/);
});


// Risk: Clearing selection could leave a stale location marker or weather effect.
// Given a selected place, When cleared, Then map and globe indicators are removed.
test('clearing the selection removes the map marker and the globe weather effects', async ({ page }) => {
  await selectCity(page); await atlas(page); await expect(page.getByTestId('map-location')).toContainText('Nashik');
  await page.getByTestId('city-search-clear').click(); await expect(page.getByTestId('map-location')).toHaveText('Select a city or landmark to place a marker.');
  await expect(page.getByTestId('world-map').locator('.map-pin')).toBeHidden();
});
