/** Optional, validated handoff from the React discovery homepage. */
export function readExplorerPlace(search: string) {
  const params = new URLSearchParams(search);
  const name = params.get('place')?.trim();
  const rawLatitude = params.get('lat'), rawLongitude = params.get('lon');
  if (!name || name.length > 100 || rawLatitude === null || rawLongitude === null || !rawLatitude.trim() || !rawLongitude.trim()) return null;
  const latitude = Number(rawLatitude), longitude = Number(rawLongitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { id: `${latitude},${longitude}`, name, latitude, longitude, country: params.get('country')?.slice(0, 100) || null, region: null, timezone: null, elevation: null };
}
