import { test, expect } from '../support/uiTest';

test('Time Machine reports a generic archive provider failure', async ({ page }) => {
  await page.route('**/api/v1/auth/refresh', route => route.fulfill({ status: 401, json: { error: { message: 'Sign in' } } }));
  await page.route('**/api/v1/journeys/reviews/**', route => route.fulfill({ json: { reviews: [] } }));
  await page.route('**/api/v1/journeys/time-machine?**', route => route.fulfill({ status: 502, json: { error: { message: 'Historical weather is unavailable.' } } }));
  await page.goto('/journeys');
  await page.getByTestId('time-year').fill('1980');
  await page.getByTestId('time-explore').click();
  await expect(page.getByTestId('time-result')).toHaveText('Historical weather is unavailable.');
});

test('Time Machine separates historical data, climate context, and fiction', async ({ page }) => {
  await page.route('**/api/v1/auth/refresh', route => route.fulfill({ status: 401, json: { error: { message: 'Sign in' } } }));
  await page.route('**/api/v1/journeys/reviews/**', route => route.fulfill({ json: { reviews: [] } }));
  await page.route('**/api/v1/journeys/time-machine?**', route => route.fulfill({ json: { date: '1980-01-01', label: 'Real data', kind: 'Historical reanalysis', source: 'Open-Meteo ERA5', maximum: 21, minimum: 12, note: 'Modelled historical weather.' } }));
  await page.goto('/journeys');
  const year = page.getByTestId('time-year');
  const setYear = async (value: number) => year.evaluate((input, next) => {
    (input as HTMLInputElement).value = String(next);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await setYear(new Date().getUTCFullYear() + 1);
  await expect(page.locator('#time-value')).toHaveText(String(new Date().getUTCFullYear() + 1));
  await page.getByTestId('time-explore').click();
  await expect(page.getByTestId('time-result')).toContainText('Scientific estimate');
  await expect(page.getByTestId('time-result')).toContainText('not a forecast');
  await setYear(new Date().getUTCFullYear() + 31);
  await page.getByTestId('time-explore').click();
  await expect(page.getByTestId('time-result')).toContainText('Fiction');
  await expect(page.getByTestId('time-result')).toContainText('Not a forecast');
  await setYear(1980);
  await page.getByTestId('time-explore').click();
  await expect(page.getByTestId('time-result')).toContainText('Modelled historical weather');
});

test('trip, alert, and review controls complete their signed-in UI workflows', async ({ page }) => {
  const trips: any[] = [];
  const alerts: any[] = [];
  const reviews: any[] = [];
  let nextId = 1;
  let forecastDate = '';
  await page.route('**/api/v1/auth/refresh', route => route.fulfill({ json: { accessToken: 'browser-test-token', user: { id: 'browser-test-user', email: 'journeys@example.test', theme: 'dark' } } }));
  await page.route('**/api/v1/journeys/trips**', async route => {
    const request = route.request(), method = request.method(), url = new URL(request.url());
    if (method === 'GET') return route.fulfill({ json: { trips } });
    if (method === 'POST') {
      const input = request.postDataJSON(), trip = { id: `trip-${nextId++}`, ...input, startDate: `${input.startDate}T00:00:00.000Z`, endDate: `${input.endDate}T00:00:00.000Z` };
      trips.push(trip); return route.fulfill({ status: 201, json: { trip } });
    }
    const id = url.pathname.split('/').pop(), index = trips.findIndex(trip => trip.id === id);
    if (method === 'PUT') {
      const input = request.postDataJSON(); trips[index] = { ...trips[index], ...input, startDate: `${input.startDate}T00:00:00.000Z`, endDate: `${input.endDate}T00:00:00.000Z` };
      return route.fulfill({ json: { trip: trips[index] } });
    }
    trips.splice(index, 1); return route.fulfill({ status: 204, body: '' });
  });
  await page.route('**/api/v1/journeys/alerts**', async route => {
    const request = route.request(), method = request.method(), url = new URL(request.url());
    if (method === 'GET') return route.fulfill({ json: { alerts, notifications: [{ id: 'notification-1', message: 'Tokyo: temperature-above 30' }] } });
    if (method === 'POST') {
      const alert = { id: `alert-${nextId++}`, ...request.postDataJSON() }; alerts.push(alert);
      return route.fulfill({ status: 201, json: { alert } });
    }
    const id = url.pathname.split('/').pop(), index = alerts.findIndex(alert => alert.id === id);
    if (method === 'PUT') { alerts[index] = { ...alerts[index], ...request.postDataJSON() }; return route.fulfill({ json: { alert: alerts[index] } }); }
    alerts.splice(index, 1); return route.fulfill({ status: 204, body: '' });
  });
  await page.route('**/api/v1/journeys/reviews/**', async route => {
    const request = route.request(), method = request.method();
    if (method === 'GET') return route.fulfill({ json: { reviews } });
    if (method === 'PUT') {
      const input = request.postDataJSON(); reviews.splice(0, reviews.length, { author: 'SkyAtlas explorer', ...input, createdAt: new Date().toISOString(), imageUrl: null });
      return route.fulfill({ json: { review: reviews[0] } });
    }
    reviews.length = 0; return route.fulfill({ status: 204, body: '' });
  });
  await page.route('**/api/v1/geocode?**', route => route.fulfill({ json: { results: [{ name: 'Tokyo', country: 'Japan', latitude: 35.68, longitude: 139.69 }] } }));
  await page.route('**/api/v1/weather?**', route => route.fulfill({ json: { daily: { time: [forecastDate], temperature_2m_max: [23], temperature_2m_min: [15] } } }));
  await page.goto('/journeys');
  await expect(page.getByTestId('journey-account')).toContainText('Signed in as journeys@example.test');

  const dates = await page.evaluate(() => {
    const start = new Date(); start.setUTCDate(start.getUTCDate() + 2);
    const end = new Date(start); end.setUTCDate(end.getUTCDate() + 2);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  });
  forecastDate = dates.start;
  await page.getByLabel('Trip name').fill('Japan weekend');
  await page.locator('#trip-city').fill('Tokyo');
  await page.getByLabel('Start date').fill(dates.start);
  await page.getByLabel('End date').fill(dates.end);
  await page.getByTestId('trip-save').click();
  await expect(page.getByTestId('trip-list')).toContainText('Japan weekend: Tokyo');
  await page.getByRole('button', { name: 'Available forecasts' }).click();
  await expect(page.locator('#trip-status')).toContainText(`${dates.start}: 23°C high, 15°C low`);
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Trip name').fill('Tokyo visit');
  await page.getByTestId('trip-save').click();
  await expect(page.getByTestId('trip-list')).toContainText('Tokyo visit: Tokyo');
  await page.getByTestId('trip-list').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByTestId('trip-list').locator('li')).toHaveCount(0);

  await page.locator('#alert-city').fill('Tokyo');
  await page.getByLabel('Threshold').fill('30');
  await page.getByTestId('alert-save').click();
  await expect(page.getByTestId('alert-list')).toContainText('Tokyo: temperature-above 30');
  await expect(page.getByTestId('notification-list')).toContainText('Tokyo: temperature-above 30');
  await page.getByTestId('alert-list').getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Threshold').fill('32');
  await page.getByTestId('alert-save').click();
  await expect(page.getByTestId('alert-list')).toContainText('Tokyo: temperature-above 32');
  await page.getByTestId('alert-list').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByTestId('alert-list').locator('li')).toHaveCount(0);

  await page.getByLabel('Your review (up to 500 characters)').fill('A wonderful place in the Andes.');
  await page.locator('#review-image').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aZkAAAAASUVORK5CYII=', 'base64') });
  await page.getByTestId('review-save').click();
  await expect(page.locator('#review-status')).toHaveText('Review saved.');
  expect(reviews[0].image).toMatch(/^data:image\/jpeg;base64,/);
  await expect(page.getByTestId('review-list')).toContainText('5/5 — SkyAtlas explorer: A wonderful place in the Andes.');
  await page.getByRole('button', { name: 'Delete my review' }).click();
  await expect(page.getByTestId('review-list').locator('li')).toHaveCount(0);
});
