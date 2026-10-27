import { landmarks } from '../data/landmarks.js';
import snapshot from '../data/countries.json';
import world from 'world-atlas/countries-110m.json';
import { feature } from 'topojson-client';
import { ROUNDS, mulberry32, shuffle } from './core.ts';
export { ROUNDS, STORAGE_KEY, mulberry32, shuffle, haversine, landmarkPoints, outlinePoints, displayDistance, leaderboardInsert, cleanBoard } from './core.ts';

const records = new Map(snapshot.countries.map(c => [Number(c.ccn3), c]));
export const countryFeatures = feature(world, world.objects.countries).features;
// Reject tiny and fragmented shapes: approximate bounding box must span 7° in both axes.
function bounds(f) { const points = []; const walk = a => { if (typeof a[0] === 'number') points.push(a); else a.forEach(walk); }; walk(f.geometry.coordinates); const lons = points.map(p => p[0]), lats = points.map(p => p[1]); return [Math.max(...lons) - Math.min(...lons), Math.max(...lats) - Math.min(...lats)]; }
export const outlinePool = countryFeatures.map(f => ({ feature: f, record: records.get(Number(f.id)) })).filter(x => x.record && bounds(x.feature).every(v => v >= 7));
export function makeRounds(mode, seed) {
  const random = mulberry32(seed);
  if (mode === 'landmark') return shuffle(landmarks, random).slice(0, ROUNDS).map(l => ({ id: l.name, answer: l.name, lat: l.latitude, lon: l.longitude, country: snapshot.countries.find(c => c.cca3 === l.country)?.name.common ?? l.country }));
  return shuffle(outlinePool, random).slice(0, ROUNDS).map(x => {
    const same = shuffle(outlinePool.filter(y => y.record.region === x.record.region && y.record.cca3 !== x.record.cca3), random);
    const other = shuffle(outlinePool.filter(y => y.record.region !== x.record.region), random);
    const options = shuffle([x, ...[...same, ...other].slice(0, 3)], random).map(y => y.record.name.common);
    return { id: x.record.cca3, answer: x.record.name.common, options, feature: x.feature };
  });
}
