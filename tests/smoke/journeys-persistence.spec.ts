import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const password = `Smoke!${randomUUID()}aA1`;
const users: { token: string; email: string }[] = [];
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aZkAAAAASUVORK5CYII=';
const headers = (index: number) => ({ authorization: `Bearer ${users[index].token}` });

test.beforeAll(async ({ request }) => {
  await expect.poll(async () => {
    try { return (await request.get('/api/v1/health', { timeout: 10000 })).status(); } catch { return 0; }
  }, { timeout: 120000, intervals: [2000, 5000] }).toBe(200);
  for (let i = 0; i < 2; i++) {
    const email = `worker-${test.info().workerIndex}-${randomUUID()}@example.test`;
    const response = await request.post('/api/v1/auth/register', { data: { email, password } });
    expect(response.status()).toBe(201);
    users.push({ token: (await response.json()).accessToken, email });
  }
});
test.afterAll(async ({ request }) => {
  const failures: number[] = [];
  for (const user of users) {
    try {
      const response = await request.delete('/api/v1/account', { headers: { authorization: `Bearer ${user.token}` }, data: { password } });
      if (response.status() !== 204) failures.push(response.status());
    } catch { failures.push(0); }
  }
  expect(failures, 'Smoke account cleanup').toEqual([]);
});

test('alert persistence, validation and ownership', async ({ request }) => {
  const endpoint = '/api/v1/journeys/alerts';
  expect((await request.get(endpoint)).status()).toBe(401);
  expect((await request.post(endpoint, { headers: headers(0), data: { city: '', condition: 'bad', threshold: 5 } })).status()).toBe(400);
  const created = await request.post(endpoint, { headers: headers(0), data: { city: 'Delhi', condition: 'temperature-above', threshold: 30 } });
  expect(created.status()).toBe(201);
  const id = (await created.json()).alert.id;
  try {
    expect((await (await request.get(endpoint, { headers: headers(0) })).json()).alerts.some((alert: any) => alert.id === id)).toBe(true);
    expect((await request.put(`${endpoint}/${id}`, { headers: headers(1), data: { city: 'Delhi', condition: 'temperature-above', threshold: 20 } })).status()).toBe(404);
    expect((await request.put(`${endpoint}/${id}`, { headers: headers(0), data: { city: 'Delhi', condition: 'temperature-below', threshold: 20 } })).status()).toBe(200);
    expect((await request.delete(`${endpoint}/${id}`, { headers: headers(1) })).status()).toBe(404);
  } finally { expect((await request.delete(`${endpoint}/${id}`, { headers: headers(0) })).status()).toBe(204); }
});

test('review persistence, image, validation and deletion', async ({ request }) => {
  const endpoint = '/api/v1/journeys/reviews/taj-mahal';
  expect((await request.put(endpoint, { data: { rating: 5, body: 'Smoke' } })).status()).toBe(401);
  expect((await request.put(endpoint, { headers: headers(0), data: { rating: 6, body: 'Smoke' } })).status()).toBe(400);
  const unique = `Smoke ${randomUUID()}`;
  expect((await request.put(endpoint, { headers: headers(0), data: { rating: 4, body: unique } })).status()).toBe(200);
  try {
    expect((await (await request.get(endpoint)).json()).reviews.some((review: any) => review.body === unique)).toBe(true);
    expect((await request.put(endpoint, { headers: headers(0), data: { rating: 5, body: unique, image: png } })).status()).toBe(200);
    const review = (await (await request.get(endpoint)).json()).reviews.find((item: any) => item.body === unique);
    expect(review.imageUrl).toBeTruthy();
    const image = await request.get(review.imageUrl);
    expect(image.status()).toBe(200); expect(image.headers()['content-type']).toContain('image/png');
    expect((await image.body()).subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect((await request.delete(endpoint, { headers: headers(1) })).status()).toBe(404);
  } finally { expect((await request.delete(endpoint, { headers: headers(0) })).status()).toBe(204); }
});
