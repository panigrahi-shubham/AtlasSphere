import { test, expect } from '@playwright/test';
import { buildSatelliteImageryURL } from '../../src/services/satelliteImagery.ts';

test('@live NASA GIBS returns a JPEG for a fixed satellite date', async ({ request }) => {
  const url = buildSatelliteImageryURL({ latitude: 27.175, longitude: 78.042, date: '2024-01-01' });
  const response = await request.get(url, { timeout: 30000 });
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/jpeg');
  expect((await response.body()).subarray(0, 3)).toEqual(Buffer.from([255, 216, 255]));
});
