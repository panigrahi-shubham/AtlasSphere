/** NASA GIBS WMS 1.3.0 capabilities verified 27 October 2026. */
export const SATELLITE_LAYERS = Object.freeze([
  Object.freeze({
    id: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    name: 'MODIS Terra true colour',
    start: '2000-02-24',
    attribution: 'Imagery: NASA GIBS / EOSDIS',
    limitations: 'Daily satellite mosaic: clouds, gaps and swath lines are normal. Not street-level imagery.'
  })
]);

const endpoint = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi';
const day = 86400000;
function dateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
export function satelliteDateBounds(now = new Date()) {
  return { minimum: SATELLITE_LAYERS[0].start, maximum: now.toISOString().slice(0, 10), defaultDate: new Date(now.getTime() - 7 * day).toISOString().slice(0, 10) };
}

export function buildSatelliteImageryURL({ latitude, longitude, date, layerId = SATELLITE_LAYERS[0].id }: { latitude: number; longitude: number; date: string; layerId?: string }, now = new Date()) {
  const layer = SATELLITE_LAYERS.find(item => item.id === layerId);
  if (!layer) throw new Error('Unsupported satellite imagery layer.');
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180) throw new Error('Enter valid latitude and longitude above before loading satellite imagery.');
  if (!dateOnly(date)) throw new Error('Enter a valid satellite date.');
  if (date < layer.start) throw new Error(`Satellite imagery for this layer starts on ${layer.start}.`);
  const today = satelliteDateBounds(now).maximum;
  if (date > today) throw new Error(`Choose a satellite date on or before ${today}.`);
  // WMS 1.3.0 EPSG:4326 uses latitude, longitude axis order, unlike WMS 1.1.1.
  const bbox = [Math.max(-90, latitude - 3), Math.max(-180, longitude - 4), Math.min(90, latitude + 3), Math.min(180, longitude + 4)];
  const query = new URLSearchParams({ SERVICE: 'WMS', REQUEST: 'GetMap', VERSION: '1.3.0', LAYERS: layer.id, STYLES: '', CRS: 'EPSG:4326', BBOX: bbox.join(','), WIDTH: '800', HEIGHT: '600', FORMAT: 'image/jpeg', TIME: date });
  return `${endpoint}?${query}`;
}
