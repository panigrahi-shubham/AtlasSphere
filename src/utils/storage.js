import { practiceStorageKey } from '../dev/bugMode.js';
export const STORAGE_KEYS = {
  unit: 'earthscope:temperature-unit:v1',
  favorites: 'earthscope:favorites:v1'
};

export function readJSON(key) {
  try {
    const raw = globalThis.localStorage.getItem(practiceStorageKey(key));
    if (raw === null) return { value: null, status: 'empty' };
    try { return { value: JSON.parse(raw), status: 'ok' }; }
    catch { return { value: null, status: 'invalid' }; }
  } catch { return { value: null, status: 'unavailable' }; }
}

export function writeJSON(key, value) {
  try { globalThis.localStorage.setItem(practiceStorageKey(key), JSON.stringify(value)); return true; }
  catch { return false; }
}

/** Whitelist saved location fields; never trust cached keys or arbitrary properties. */
export function normalizeFavorite(city) {
  if (!city || typeof city !== 'object' || Array.isArray(city) ||
      typeof city.name !== 'string' || !city.name.trim() ||
      !Number.isFinite(city.latitude) || Math.abs(city.latitude) > 90 ||
      !Number.isFinite(city.longitude) || Math.abs(city.longitude) > 180) return null;
  const optionalText = value => typeof value === 'string' && value.trim() ? value.trim() : null;
  return {
    id: typeof city.id === 'string' || Number.isInteger(city.id) ? String(city.id) : null,
    name: city.name.trim(), latitude: city.latitude, longitude: city.longitude,
    country: optionalText(city.country), region: optionalText(city.region),
    timezone: optionalText(city.timezone), elevation: Number.isFinite(city.elevation) ? city.elevation : null
  };
}

export function locationKey(city) {
  return /^\d+$/.test(String(city.id)) ? `geonames:${city.id}`
    : `coordinates:${city.latitude},${city.longitude}`;
}

export function sameLocation(a, b) {
  return locationKey(a) === locationKey(b) || (a.latitude === b.latitude && a.longitude === b.longitude);
}

export function normalizeFavorites(value) {
  if (!Array.isArray(value)) return { cities: [], invalid: true };
  const cities = [];
  let invalid = false;
  for (const entry of value) {
    const city = normalizeFavorite(entry);
    if (!city) { invalid = true; continue; }
    if (!cities.some(existing => sameLocation(existing, city))) cities.push(city);
  }
  return { cities, invalid };
}
