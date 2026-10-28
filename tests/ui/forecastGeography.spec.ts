import { test, expect, mockOpenMeteoDown, type Page } from '../support/uiTest';
import { currentWeatherFixture } from '../fixtures/currentWeather.js';

const endpoint = '**/api/v1/weather?**';
const city = { id: 1, name: 'Nashik', admin1: 'Maharashtra', country: 'India', latitude: 19.99, longitude: 73.78, elevation: 565, timezone: 'Asia/Kolkata' };
test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/geocode?**', route => route.fulfill({ json: { results: [city] } }));
  await page.route(endpoint, route => route.fulfill({ json: currentWeatherFixture }));
  await page.goto('/');
});
async function select(page: Page) {
  await page.getByTestId('city-search-input').fill('Nashik');
  await page.getByTestId('city-search-button').click();
  await page.getByTestId('city-suggestion').click();
}

test('shows 24 hourly cards with local dates, icons, temperature, rain chance and wind', async ({ page }) => {
  await select(page);
  await expect(page.getByTestId('forecast-hour')).toHaveCount(24);
  const first = page.getByTestId('forecast-hour').first();
  await expect(first.getByTestId('forecast-time')).toHaveText('26 Oct, 13:00 GMT+5:30');
  await expect(first.getByTestId('forecast-temperature')).toHaveText('20°C');
  await expect(first.getByRole('img')).toHaveAccessibleName('Partly cloudy');
  await expect(first.getByTestId('forecast-precipitation')).toHaveText('Rain chance: 0%');
  await expect(first.getByTestId('forecast-wind')).toHaveText('Wind: 8.5 km/h');
  await expect(page.getByTestId('forecast-timezone')).toContainText('Asia/Kolkata');
  await expect(page.getByTestId('forecast-note')).toBeEmpty();
});

test('geography shows selected coordinates and geocoding elevation, not weather grid elevation', async ({ page }) => {
  const data = { ...currentWeatherFixture, elevation: 999 };
  await page.route(endpoint, route => route.fulfill({ json: data }));
  await select(page);
  await expect(page.getByTestId('latitude-value')).toHaveText('19.990°');
  await expect(page.getByTestId('longitude-value')).toHaveText('73.780°');
  await expect(page.getByTestId('elevation-value')).toHaveText('565 m');
  await expect(page.getByTestId('geography-country')).toHaveText('India');
  await expect(page.getByTestId('geography-region')).toHaveText('Maharashtra');
  await expect(page.getByTestId('timezone-value')).toHaveText('Asia/Kolkata');
  await expect(page.getByTestId('geography-local-time')).not.toHaveText('Not available');
});

test('geography remains usable on weather failure and never invents missing optional details', async ({ page }) => {
  await mockOpenMeteoDown(page);
  const missing = { id: 1, name: 'Nashik', latitude: 19.99, longitude: 73.78 };
  await page.route('**/api/v1/geocode?**', route => route.fulfill({ json: { results: [missing] } }));
  await page.route(endpoint, route => route.fulfill({ status: 503, json: {} }));
  await select(page);
  await expect(page.getByTestId('weather-error')).toContainText('503');
  await expect(page.getByTestId('geography-details')).toBeVisible();
  for (const id of ['elevation-value', 'geography-country', 'geography-region', 'timezone-value', 'geography-local-time']) {
    await expect(page.getByTestId(id)).toHaveText('Not available');
  }
});

test('missing hourly data leaves current weather and geography visible', async ({ page }) => {
  const data = structuredClone(currentWeatherFixture); delete data.hourly;
  await page.route(endpoint, route => route.fulfill({ json: data }));
  await select(page);
  await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  await expect(page.getByTestId('forecast-note')).toContainText('Hourly forecast is unavailable');
  await expect(page.getByTestId('hourly-forecast')).toBeHidden();
  await expect(page.getByTestId('geography-details')).toBeVisible();
});

test('short forecasts show only available hours with a clear message', async ({ page }) => {
  const data = structuredClone(currentWeatherFixture); data.hourly.time = data.hourly.time.slice(0, 4);
  await page.route(endpoint, route => route.fulfill({ json: data }));
  await select(page);
  await expect(page.getByTestId('forecast-hour')).toHaveCount(3);
  await expect(page.getByTestId('forecast-note')).toContainText('Only 3 of 24');
});

test('partial hourly metrics keep valid rows and show unavailable values', async ({ page }) => {
  const data = structuredClone(currentWeatherFixture);
  Object.assign(data.hourly, { temperature_2m: [], precipitation_probability: [], wind_speed_10m: [] });
  await page.route(endpoint, route => route.fulfill({ json: data }));
  await select(page);
  await expect(page.getByTestId('forecast-hour')).toHaveCount(24);
  const first = page.getByTestId('forecast-hour').first();
  await expect(first.getByTestId('forecast-temperature')).toHaveText('Not available');
  await expect(first.getByTestId('forecast-precipitation')).toContainText('Not available');
  await expect(first.getByTestId('forecast-wind')).toContainText('Not available');
  await expect(page.getByTestId('forecast-note')).toContainText('Some hourly details are unavailable');
});

test('editing another search clears forecast and geography along with weather', async ({ page }) => {
  await select(page); await expect(page.getByTestId('forecast-hour')).toHaveCount(24);
  await page.getByTestId('city-search-input').fill('Tokyo');
  await expect(page.getByTestId('forecast-section')).toBeHidden();
  await expect(page.getByTestId('forecast-hour')).toHaveCount(0);
  await expect(page.getByTestId('geography-details')).toBeHidden();
});

test('mobile forecast scrolls horizontally without widening the page', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await select(page); await expect(page.getByTestId('forecast-hour')).toHaveCount(24);
  const list = page.getByTestId('hourly-forecast');
  await list.scrollIntoViewIfNeeded();
  expect(await list.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  await list.focus(); await page.keyboard.press('End');
  await expect(page.getByTestId('forecast-hour').last()).toBeInViewport();
  await page.keyboard.press('Home');
  await expect(page.getByTestId('forecast-hour').first()).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('weather-resolved timezone updates geography and its local clock', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-26T10:00:00Z') });
  const data = { ...currentWeatherFixture, timezone: 'Asia/Tokyo' };
  await page.route(endpoint, route => route.fulfill({ json: data }));
  await select(page);
  await expect(page.getByTestId('timezone-value')).toHaveText('Asia/Tokyo');
  await expect(page.getByTestId('geography-local-time')).toHaveText('26 Oct 2026, 19:00');
  await page.clock.fastForward(60000);
  await expect(page.getByTestId('geography-local-time')).toHaveText('26 Oct 2026, 19:01');
});
