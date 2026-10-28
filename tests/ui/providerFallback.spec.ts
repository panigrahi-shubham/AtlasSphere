import { test, expect } from '../support/uiTest';
import { currentWeatherFixture } from '../fixtures/currentWeather.js';
import { readFile } from 'node:fs/promises';

const city = { id: 1, name: 'Nashik', country: 'India', country_code: 'IN', latitude: 19.99, longitude: 73.78, timezone: 'Asia/Kolkata' };
test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/auth/refresh', route => route.fulfill({ status: 401, json: { error: { message: 'Sign in' } } }));
});

for (const [searchStatus, weatherStatus] of [[502, 503], [503, 502]]) {
  test(`search ${searchStatus} and weather ${weatherStatus} recover through the public provider`, async ({ page }) => {
    let geoCalls = 0, weatherCalls = 0;
    await page.route('**/api/v1/geocode?**', route => route.fulfill({ status: searchStatus, json: {} }));
    await page.route('**/api/v1/weather?**', route => route.fulfill({ status: weatherStatus, json: {} }));
    await page.route('https://geocoding-api.open-meteo.com/**', route => {
      geoCalls++; expect(new URL(route.request().url()).searchParams.get('name')).toBe('Nashik');
      return route.fulfill({ json: { results: [city] } });
    });
    await page.route('https://api.open-meteo.com/**', route => { weatherCalls++; return route.fulfill({ json: currentWeatherFixture }); });
    await page.goto('/explore.html');
    await page.getByTestId('city-search-input').fill('Nashik'); await page.getByTestId('city-search-button').click();
    await page.getByTestId('city-suggestion').click();
    await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
    expect(geoCalls).toBe(1); expect(weatherCalls).toBe(1);
  });
}

for (const stage of ['search', 'weather']) {
  test(`${stage} 429 never contacts the direct provider`, async ({ page }) => {
    let fallbackCalls = 0;
    await page.route(/^https:\/\/(?:api|geocoding-api)\.open-meteo\.com\//, route => { fallbackCalls++; return route.fulfill({ json: {} }); });
    await page.route('**/api/v1/geocode?**', route => route.fulfill({ status: stage === 'search' ? 429 : 200, json: { results: [city] } }));
    await page.route('**/api/v1/weather?**', route => route.fulfill({ status: 429, json: {} }));
    await page.goto('/explore.html');
    await page.getByTestId('city-search-input').fill('Nashik'); await page.getByTestId('city-search-button').click();
    if (stage === 'weather') await page.getByTestId('city-suggestion').click();
    await expect(page.getByTestId(stage === 'search' ? 'search-error' : 'weather-error')).toContainText('Too many');
    expect(fallbackCalls).toBe(0);
  });
}

test('a failed direct lookup keeps the original server error', async ({ page }) => {
  await page.route('**/api/v1/geocode?**', route => route.fulfill({ status: 502, json: {} }));
  await page.route('https://geocoding-api.open-meteo.com/**', route => route.fulfill({ status: 503, json: {} }));
  await page.goto('/explore.html');
  await page.getByTestId('city-search-input').fill('Nashik'); await page.getByTestId('city-search-button').click();
  await expect(page.getByTestId('search-error')).toContainText('Location service unavailable (502)');
});

test('capital lookup fallback keeps the country restriction', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/v1/geocode?**', route => route.fulfill({ status: 503, json: {} }));
  await page.route('https://geocoding-api.open-meteo.com/**', route => {
    calls++; expect(new URL(route.request().url()).searchParams.get('countryCode')).toBe('IN');
    return route.fulfill({ json: { results: [{ ...city, name: 'New Delhi' }] } });
  });
  await page.route('**/api/v1/weather?**', route => route.fulfill({ json: currentWeatherFixture }));
  await page.goto('/explore.html'); await page.getByTestId('atlas-load').click();
  await page.getByTestId('country-filter').fill('India');
  await page.getByTestId('country-directory').getByRole('button', { name: 'India', exact: true }).click();
  await page.getByTestId('country-weather').click();
  await expect(page.getByTestId('city-name')).toHaveText('New Delhi'); expect(calls).toBe(1);
});

test('seven-day forecast fallback retains the current weather', async ({ page }) => {
  const daily = JSON.parse(await readFile(new URL('../fixtures/api-daily.json', import.meta.url), 'utf8'));
  let calls = 0;
  await page.route('**/api/v1/geocode?**', route => route.fulfill({ json: { results: [city] } }));
  await page.route('**/api/v1/weather?**', route => route.fulfill(new URL(route.request().url()).searchParams.get('view') === 'daily' ? { status: 504, json: {} } : { json: currentWeatherFixture }));
  await page.route('https://api.open-meteo.com/**', route => {
    calls++; expect(new URL(route.request().url()).searchParams.get('forecast_days')).toBe('7');
    return route.fulfill({ json: daily });
  });
  await page.goto('/explore.html');
  await page.getByTestId('city-search-input').fill('Nashik'); await page.getByTestId('city-search-button').click();
  await page.getByTestId('city-suggestion').click(); await page.getByTestId('advanced-load').click();
  await expect(page.getByTestId('daily-row')).toHaveCount(7);
  await expect(page.getByTestId('current-temperature')).toHaveText('24°C'); expect(calls).toBe(1);
});
