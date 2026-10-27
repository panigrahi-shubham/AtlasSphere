import { fetchJSON } from './http.js';

export const DAILY_VARIABLES = ['temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max', 'precipitation_sum', 'wind_speed_10m_max', 'uv_index_max', 'sunrise', 'sunset', 'weather_code'];
export function advancedForecastURL(city) {
  if (!Number.isFinite(city?.latitude) || Math.abs(city.latitude) > 90 || !Number.isFinite(city?.longitude) || Math.abs(city.longitude) > 180) throw new Error('Invalid location coordinates.');
  return `https://api.open-meteo.com/v1/forecast?${new URLSearchParams({ latitude: city.latitude, longitude: city.longitude, daily: DAILY_VARIABLES.join(','), timezone: 'auto', timeformat: 'unixtime', temperature_unit: 'celsius', wind_speed_unit: 'kmh', precipitation_unit: 'mm', forecast_days: '7' })}`;
}
export function normalizeDaily(data) {
  if (data?.error || !Array.isArray(data?.daily?.time) || data.daily_units?.time !== 'unixtime') throw new Error('Extended forecast is unavailable. Please retry.');
  try { new Intl.DateTimeFormat('en', { timeZone: data.timezone }).format(); }
  catch { throw new Error('Extended forecast timezone is invalid.'); }
  if (typeof data.timezone !== 'string') throw new Error('Extended forecast timezone is missing.');
  const d = data.daily, u = data.daily_units;
  const metric = (key, unit, i, valid = () => true) => Array.isArray(d[key]) && u[key] === unit && Number.isFinite(d[key][i]) && valid(d[key][i]) ? d[key][i] : null;
  const positive = n => n >= 0;
  const days = d.time.slice(0, 7).map((time, i) => {
    if (!Number.isFinite(time) || !Number.isFinite(new Date(time * 1000).getTime()) || (i && time <= d.time[i - 1])) throw new Error('Extended forecast dates are invalid.');
    let max = metric('temperature_2m_max', '°C', i), min = metric('temperature_2m_min', '°C', i);
    if (max !== null && min !== null && min > max) { max = null; min = null; }
    return { time, max, min, rain: metric('precipitation_probability_max', '%', i, n => n >= 0 && n <= 100), precipitation: metric('precipitation_sum', 'mm', i, positive), wind: metric('wind_speed_10m_max', 'km/h', i, positive), uv: metric('uv_index_max', '', i, positive), sunrise: metric('sunrise', 'unixtime', i, n => Number.isFinite(new Date(n * 1000).getTime())), sunset: metric('sunset', 'unixtime', i, n => Number.isFinite(new Date(n * 1000).getTime())), code: metric('weather_code', 'wmo code', i, Number.isInteger) };
  });
  if (!days.length) throw new Error('Extended forecast is empty. Please retry.');
  return { timezone: data.timezone, days };
}
export async function getAdvancedForecast(city, options) {
  return normalizeDaily(await fetchJSON(`/api/v1/weather?${new URLSearchParams({ lat: city.latitude, lon: city.longitude, units: 'celsius', view: 'daily' })}`, { ...options, fallbackUrl: advancedForecastURL(city), service: 'Forecast', action: 'Extended forecast' }));
}
