import test from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, shuffle, haversine, landmarkPoints, outlinePoints, displayDistance, leaderboardInsert, cleanBoard } from '../../src/geoguess/core.ts';

test('seeded shuffle repeats exactly and selects without duplicates', () => {
  const source = Array.from({ length: 16 }, (_, i) => i);
  const a = shuffle(source, mulberry32(42));
  assert.deepEqual(a, shuffle(source, mulberry32(42)));
  assert.notDeepEqual(a, shuffle(source, mulberry32(43)));
  assert.equal(new Set(a.slice(0, 5)).size, 5);
});
test('haversine, scoring and units match the published rules', () => {
  assert.equal(haversine(28.6139, 77.209, 28.6139, 77.209), 0);
  assert.ok(Math.abs(haversine(28.6139, 77.209, 19.076, 72.8777) - 1150) < 10);
  assert.deepEqual([0, 500, 2000, 10000].map(landmarkPoints), [5000, 3894, 1839, 34]);
  assert.equal(outlinePoints(30), 1600);
  assert.equal(displayDistance(100, 'fahrenheit'), '62 miles');
  assert.equal(displayDistance(100, 'celsius'), '100 km');
});
test('leaderboard caps at ten, scores descend and earlier tie wins', () => {
  const entries = Array.from({ length: 12 }, (_, i) => ({ name: String(i), score: 12 - i, seed: i, date: '2026-10-26T00:00:00Z' }));
  const board = entries.reduce(leaderboardInsert, []);
  assert.equal(board.length, 10); assert.equal(board[0].score, 12);
  const tie = leaderboardInsert([{ name: 'later', score: 100, seed: 1, date: '2026-10-27T00:00:00Z' }], { name: 'earlier', score: 100, seed: 2, date: '2026-10-26T00:00:00Z' });
  assert.equal(tie[0].name, 'earlier');
  assert.equal(cleanBoard({ best: { outline: 4 }, leaderboard: { outline: entries } }).leaderboard.outline.length, 10);
});
