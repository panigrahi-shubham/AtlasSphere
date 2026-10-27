import { fetchJSON } from './http.js';
import { isTimezone } from '../utils/time.js';

export const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
export const CURRENT_VARIABLES = [
  'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
  'weather_code', 'wind_speed_10m', 'precipitation', 'is_day'
];
export const HOURLY_VARIABLES = [
  'temperature_2m', 'weather_code', 'precipitation_probability', 'wind_speed_10m', 'is_day'
];

export function weatherURL(city) {
  if (!Number.isFinite(city?.latitude) || Math.abs(city.latitude) > 90 ||
      !Number.isFinite(city?.longitude) || Math.abs(city.longitude) > 180) {
    throw new Error('This location has invalid coordinates. Please search again.');
  }
  const params = new URLSearchParams({
    latitude: String(city.latitude), longitude: String(city.longitude),
    current: CURRENT_VARIABLES.join(','), hourly: HOURLY_VARIABLES.join(','),
    timezone: 'auto', timeformat: 'unixtime',
    temperature_unit: 'celsius', wind_speed_unit: 'kmh', precipitation_unit: 'mm',
    // Some timezone offsets start the response before the current report.
    // Buffer the request; validation still limits the display to the next 24 hours.
    forecast_hours: '48'
  });
  return `${WEATHER_ENDPOINT}?${params}`;
}

/** Temperature/time are required. Missing secondary metrics stay unavailable. */
export function validateCurrentWeather(data) {
  const current = data?.current, units = data?.current_units;
  if (data?.error || !current || !units || !Number.isFinite(current.temperature_2m) ||
      !Number.isFinite(current.time) || !Number.isFinite(new Date(current.time * 1000).getTime()) ||
      units.temperature_2m !== '°C' || units.time !== 'unixtime' ||
      typeof data.timezone !== 'string' || !data.timezone.trim()) {
    throw new Error('Current weather data is incomplete or invalid. Please try again.');
  }
  if (!isTimezone(data.timezone)) throw new Error('Weather timezone is unavailable. Please try again.');
  const metric = (name, unit, predicate = () => true) =>
    Number.isFinite(current[name]) && units[name] === unit && predicate(current[name])
      ? current[name] : null;
  const result = {
    temperature: current.temperature_2m,
    feelsLike: metric('apparent_temperature', '°C'),
    humidity: metric('relative_humidity_2m', '%', value => value >= 0 && value <= 100),
    wind: metric('wind_speed_10m', 'km/h', value => value >= 0),
    precipitation: metric('precipitation', 'mm', value => value >= 0),
    code: Number.isInteger(current.weather_code) && units.weather_code === 'wmo code' ? current.weather_code : null,
    isDay: current.is_day === 0 || current.is_day === 1 ? current.is_day : null,
    time: current.time, timezone: data.timezone,
    interval: Number.isFinite(current.interval) && current.interval > 0 && units.interval === 'seconds' ? current.interval : null
  };
  result.incomplete = ['feelsLike', 'humidity', 'wind', 'precipitation', 'code'].some(key => result[key] === null);
  return result;
}

export async function getCurrentWeather(city, options = {}) {
  const data = await fetchJSON(`/api/v1/weather?${new URLSearchParams({ lat: city.latitude, lon: city.longitude, units: 'celsius' })}`, {
    ...options, service: 'Weather', action: 'Weather request'
  });
  const current = validateCurrentWeather(data);
  return { ...current, forecast: validateHourlyForecast(data, current.time) };
}

/** A damaged forecast must never hide otherwise usable current conditions. */
export function validateHourlyForecast(data, fromTime) {
  const hourly = data?.hourly, units = data?.hourly_units;
  const unavailable = { hours: [], incomplete: true };
  if (!Number.isFinite(fromTime) || !hourly || units?.time !== 'unixtime' ||
      !Array.isArray(hourly.time) || !hourly.time.length ||
      !hourly.time.every((time, index, times) => Number.isFinite(time) &&
        Number.isFinite(new Date(time * 1000).getTime()) && (index === 0 || time > times[index - 1]))) {
    return unavailable;
  }
  const metric = (name, unit, index, predicate = () => true) => {
    const value = Array.isArray(hourly[name]) ? hourly[name][index] : null;
    return units[name] === unit && Number.isFinite(value) && predicate(value) ? value : null;
  };
  const hours = [];
  for (let i = 0; i < hourly.time.length && hours.length < 24; i++) {
    if (hourly.time[i] < fromTime) continue;
    // Only include timestamps in the next 24-hour window; do not fill data gaps with later days.
    if (hourly.time[i] >= fromTime + 24 * 3600) break;
    hours.push({
      time: hourly.time[i],
      temperature: metric('temperature_2m', '°C', i),
      code: metric('weather_code', 'wmo code', i, Number.isInteger),
      precipitation: metric('precipitation_probability', '%', i, value => value >= 0 && value <= 100),
      wind: metric('wind_speed_10m', 'km/h', i, value => value >= 0),
      isDay: metric('is_day', '', i, value => value === 0 || value === 1)
    });
  }
  return {
    hours,
    incomplete: hours.length < 24 || hours.some(hour =>
      ['temperature', 'code', 'precipitation', 'wind', 'isDay'].some(key => hour[key] === null))
  };
}
