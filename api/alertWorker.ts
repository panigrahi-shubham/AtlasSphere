import { db } from './database.ts';
import { reserveOpenMeteoCall } from './providerBudget.ts';
const everyThreeHours = 3 * 60 * 60 * 1000;
const dedupeWindow = 24 * 60 * 60 * 1000;
let running = false;
export function alertsRunning() { return running; }

/** One bounded pass; records are written only after a successful provider response. */
export async function checkAlerts(fetcher: typeof fetch = fetch, now = () => Date.now(), reserve = reserveOpenMeteoCall, database: typeof db = db) {
  if (!process.env.DATABASE_URL || running) return { checked: 0, created: 0 };
  running = true;
  let checked = 0, created = 0;
  try {
    const rules = await database.weatherAlert.findMany({ take: 120, orderBy: { createdAt: 'asc' } });
    const cache = new Map<string, { temperature: number; rain: number } | null>();
    for (const rule of rules) {
      try {
        if (!cache.has(rule.city)) {
          const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({ name: rule.city, count: '1', language: 'en', format: 'json' })}`;
          if (!reserve()) break;
          const placeResponse = await fetcher(geoUrl, { signal: AbortSignal.timeout(5000) });
          if (!placeResponse.ok) throw new Error('City lookup failed');
          const place = (await placeResponse.json() as any)?.results?.[0];
          if (!place || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) { cache.set(rule.city, null); continue; }
          const query = new URLSearchParams({ latitude: String(place.latitude), longitude: String(place.longitude), current: 'temperature_2m', hourly: 'precipitation_probability', forecast_hours: '1' });
          if (!reserve()) break;
          const weatherResponse = await fetcher(`https://api.open-meteo.com/v1/forecast?${query}`, { signal: AbortSignal.timeout(5000) });
          if (!weatherResponse.ok) throw new Error('Forecast unavailable');
          const weather: any = await weatherResponse.json();
          if (!Number.isFinite(weather?.current?.temperature_2m) || !Number.isFinite(weather?.hourly?.precipitation_probability?.[0])) throw new Error('Incomplete forecast');
          cache.set(rule.city, { temperature: weather.current.temperature_2m, rain: weather.hourly.precipitation_probability[0] });
        }
        const values = cache.get(rule.city);
        if (!values) continue;
        checked++;
        const matched = rule.condition === 'temperature-above' ? values.temperature > rule.threshold : rule.condition === 'temperature-below' ? values.temperature < rule.threshold : values.rain > rule.threshold;
        if (!matched) continue;
        await database.$transaction(async tx => {
          const updated = await tx.weatherAlert.updateMany({ where: { id: rule.id, OR: [{ lastSentAt: null }, { lastSentAt: { lt: new Date(now() - dedupeWindow) } }] }, data: { lastSentAt: new Date(now()) } });
          if (updated.count) {
            await tx.notification.create({ data: { userId: rule.userId, message: `${rule.city}: ${rule.condition} ${rule.threshold} (modelled weather by Open-Meteo)` } });
            created++;
          }
        });
      } catch { /* Skip this rule and retry on the next scheduled pass. */ }
    }
    return { checked, created };
  } finally { running = false; }
}
export function scheduleAlerts() {
  if (process.env.APP_ENV !== 'production' || !process.env.DATABASE_URL) return;
  const timer = setInterval(() => { void checkAlerts().catch(() => {}); }, everyThreeHours);
  timer.unref();
  void checkAlerts().catch(() => {});
}
