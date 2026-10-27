export function normalizeCountries(records) {
  if (!Array.isArray(records)) return [];
  return records.filter(c => typeof c?.name?.common === 'string' && /^[A-Z]{3}$/.test(c.cca3)).map(c => ({
    code: c.cca3, alpha2: c.cca2, numeric: /^\d{3}$/.test(c.ccn3) ? c.ccn3 : null,
    name: c.name.common, official: c.name.official || c.name.common,
    capital: Array.isArray(c.capital) ? c.capital.filter(v => typeof v === 'string').join(', ') : '',
    latitude: Number.isFinite(c.latlng?.[0]) ? c.latlng[0] : null,
    longitude: Number.isFinite(c.latlng?.[1]) ? c.latlng[1] : null,
    landlocked: typeof c.landlocked === 'boolean' ? c.landlocked : null,
    region: typeof c.region === 'string' ? c.region : '', subregion: typeof c.subregion === 'string' ? c.subregion : '',
    population: Number.isFinite(c.population) && c.population >= 0 ? c.population : null,
    area: Number.isFinite(c.area) && c.area > 0 ? c.area : null,
    languages: c.languages && typeof c.languages === 'object' ? Object.values(c.languages).filter(v => typeof v === 'string').join(', ') : ''
  })).sort((a, b) => a.name.localeCompare(b.name, 'en'));
}
export function filterCountries(countries, query, region) {
  const term = query.trim().toLocaleLowerCase('en');
  return countries.filter(c => (!region || c.region === region) && `${c.name} ${c.official} ${c.capital}`.toLocaleLowerCase('en').includes(term));
}
export function hemisphere(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return 'Coordinates unavailable';
  return `${latitude === 0 ? 'On the Equator' : latitude > 0 ? 'Northern hemisphere' : 'Southern hemisphere'}; ${longitude === 0 ? 'on the prime meridian' : longitude > 0 ? 'east of Greenwich' : 'west of Greenwich'}`;
}
