export const ROUNDS = 5;
export const STORAGE_KEY = 'earthscope.geoguess.v1';
export function mulberry32(seed) { let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function shuffle(items, random) { const a = [...items]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function haversine(lat1, lon1, lat2, lon2) { const rad = Math.PI / 180, dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad; const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2; return 12742 * Math.asin(Math.min(1, Math.sqrt(h))); }
export const landmarkPoints = km => Math.round(5000 * Math.exp(-km / 2000));
export const outlinePoints = seconds => 1000 + Math.max(0, Math.min(30, seconds)) * 20;
export const displayDistance = (km, unit) => `${Math.round(unit === 'fahrenheit' ? km * 0.621371 : km)} ${unit === 'fahrenheit' ? 'miles' : 'km'}`;
export function leaderboardInsert(rows, entry) { return [...rows, entry].sort((a, b) => b.score - a.score || Date.parse(a.date) - Date.parse(b.date)).slice(0, 10); }
export function cleanBoard(raw) {
  const result = { best: { landmark: 0, outline: 0 }, leaderboard: { landmark: [], outline: [] } };
  for (const mode of ['landmark', 'outline']) {
    if (Number.isFinite(raw?.best?.[mode])) result.best[mode] = Math.max(0, raw.best[mode]);
    if (Array.isArray(raw?.leaderboard?.[mode])) result.leaderboard[mode] = raw.leaderboard[mode].filter(e => e && typeof e.name === 'string' && Number.isFinite(e.score) && Number.isInteger(e.seed) && !Number.isNaN(Date.parse(e.date))).reduce(leaderboardInsert, []);
  }
  return result;
}
