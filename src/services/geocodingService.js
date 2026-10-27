import { fetchJSON } from './http.js';
import { bugEnabled } from '../dev/bugMode.js';

export const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
export function geocodingURL(query, countryCode) {
  const params = new URLSearchParams({ name: query, count: '5', language: 'en', format: 'json' });
  if (countryCode) params.set('countryCode', countryCode);
  return `${GEOCODING_ENDPOINT}?${params}`;
}

export function validateLocations(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.error) {
    throw new Error('The location service returned invalid data. Please try again.');
  }
  const results = data.results === undefined ? [] : data.results;
  if (!Array.isArray(results) || !results.every(city =>
    city && typeof city.name === 'string' && city.name.trim() &&
    Number.isFinite(city.latitude) && Math.abs(city.latitude) <= 90 &&
    Number.isFinite(city.longitude) && Math.abs(city.longitude) <= 180)) {
    throw new Error('Location data is incomplete. Please try again.');
  }
  return results.map(city => ({
    id: String(city.id ?? `${city.latitude},${city.longitude}`),
    name: city.name,
    country: typeof city.country === 'string' ? city.country : null,
    region: typeof city.admin1 === 'string' ? city.admin1 : null,
    latitude: city.latitude,
    longitude: city.longitude,
    elevation: Number.isFinite(city.elevation) ? city.elevation : null,
    timezone: typeof city.timezone === 'string' ? city.timezone : null
  }));
}

export async function searchCities(query, options) {
  const term = query.trim();
  if (!bugEnabled('SEARCH-001') && Array.from(term).length < 2) throw new Error('Enter at least 2 characters to search for a city.');
  const params = new URLSearchParams({ q: term });
  return validateLocations(await fetchJSON(`/api/v1/geocode?${params}`, { ...options, fallbackUrl: geocodingURL(term), fallbackOnSlow: import.meta.env?.VITE_PAGES_FALLBACK === '1' }));
}
