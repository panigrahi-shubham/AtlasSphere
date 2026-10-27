import world from 'world-atlas/countries-110m.json';
import { feature } from 'topojson-client';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import snapshot from '../data/countries.json';
import { landmarks } from '../data/landmarks.js';
import { normalizeCountries, filterCountries, hemisphere } from '../utils/countries.js';
import { fetchJSONWithFallback } from '../services/http.js';
import { validateLocations, geocodingURL } from '../services/geocodingService.js';
import photos from '../data/photos.json';

const NS = 'http://www.w3.org/2000/svg';
const countries = normalizeCountries(snapshot.countries);
const features = feature(world, world.objects.countries).features;
export function createAtlas({ onOpen }) {
  const map = document.querySelector('#world-map');
  const group = document.createElementNS(NS, 'g'); map.append(group);
  const projection = geoNaturalEarth1().fitExtent([[10, 10], [950, 480]], { type: 'Sphere' });
  const path = geoPath(projection);
  const directory = document.querySelector('#country-directory');
  const input = document.querySelector('#country-filter');
  const region = document.querySelector('#country-region');
  const status = document.querySelector('#country-status');
  const globeStatus = document.querySelector('#globe-status');
  const pin = document.createElementNS(NS, 'circle'); pin.setAttribute('r', '5'); pin.setAttribute('class', 'map-pin'); pin.setAttribute('hidden', '');
  let zoom = 1, panX = 0, panY = 0, country, selectedCity, weather, globe, controller, request = 0;
  const paths = [];
  for (const f of features) {
    const node = document.createElementNS(NS, 'path');
    const record = countries.find(c => c.numeric === f.id);
    node.setAttribute('d', path(f)); node.setAttribute('class', 'country-shape');
    node.setAttribute('role', 'button'); node.setAttribute('tabindex', '0');
    node.setAttribute('aria-label', `Explore ${record?.name ?? f.properties.name}`);
    node.setAttribute('data-testid', 'map-country'); node.setAttribute('aria-pressed', 'false');
    const title = document.createElementNS(NS, 'title'); title.textContent = record?.name ?? f.properties.name; node.append(title);
    const choose = () => record ? selectCountry(record) : (status.textContent = `Detailed country information is unavailable for ${f.properties.name}.`);
    node.addEventListener('click', choose);
    node.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(); } });
    group.append(node); paths.push({ node, record });
  }
  group.append(pin);
  function transform() { group.setAttribute('transform', `translate(${480 + panX} ${245 + panY}) scale(${zoom}) translate(-480 -245)`); document.querySelector('#map-zoom-level').textContent = `${Math.round(zoom * 100)}%`; }
  function zoomBy(factor) { zoom = Math.max(1, Math.min(5, zoom * factor)); if (zoom === 1) panX = panY = 0; transform(); }
  document.querySelector('#map-zoom-in').addEventListener('click', () => zoomBy(1.35));
  document.querySelector('#map-zoom-out').addEventListener('click', () => zoomBy(1 / 1.35));
  document.querySelector('#map-reset').addEventListener('click', () => { zoom = 1; panX = panY = 0; transform(); });
  map.addEventListener('keydown', event => {
    if (event.target !== map) return;
    const directions = { ArrowLeft: [35, 0], ArrowRight: [-35, 0], ArrowUp: [0, 35], ArrowDown: [0, -35] };
    if (directions[event.key]) { event.preventDefault(); panX += directions[event.key][0]; panY += directions[event.key][1]; transform(); }
    if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomBy(1.35); }
    if (event.key === '-') { event.preventDefault(); zoomBy(1 / 1.35); }
  });
  // Drag from the ocean background to pan; country clicks remain unambiguous.
  let drag;
  map.addEventListener('pointerdown', e => { if (e.target === map) { drag = { x: e.clientX, y: e.clientY, px: panX, py: panY }; map.setPointerCapture(e.pointerId); } });
  map.addEventListener('pointermove', e => { if (!drag) return; const scale = 960 / map.getBoundingClientRect().width; panX = drag.px + (e.clientX - drag.x) * scale; panY = drag.py + (e.clientY - drag.y) * scale; transform(); });
  map.addEventListener('pointerup', () => { drag = null; }); map.addEventListener('pointercancel', () => { drag = null; });
  function renderDirectory() {
    const matches = filterCountries(countries, input.value, region.value);
    directory.replaceChildren(); document.querySelector('#country-count').textContent = `${matches.length} of ${countries.length} countries and territories`;
    for (const c of matches) {
      const item = document.createElement('li'), button = document.createElement('button'); button.type = 'button'; button.textContent = c.name;
      button.dataset.testid = 'country-option'; button.setAttribute('aria-pressed', String(country?.code === c.code));
      button.addEventListener('click', () => selectCountry(c)); item.append(button); directory.append(item);
    }
  }
  input.addEventListener('input', renderDirectory); region.addEventListener('change', renderDirectory);
  function selectCountry(c) {
    ++request; controller?.abort(); country = c; status.textContent = `${c.name} selected. Country facts and landmarks updated.`;
    document.querySelector('#country-details').hidden = false;
    document.querySelector('#country-title').textContent = c.name;
    const facts = document.querySelector('#country-facts'); facts.replaceChildren();
    const entries = [['Official name', c.official], ['Capital', c.capital || 'Not available'], ['Region', [c.region, c.subregion].filter(Boolean).join(' · ')], ['Area', c.area === null ? 'Not available' : `${c.area.toLocaleString('en')} km²`], ['Languages', c.languages || 'Not available'], ['Geography', c.landlocked === null ? 'Not available' : c.landlocked ? 'Landlocked' : 'Has a coastline'], ['Reference coordinates', c.latitude === null || c.longitude === null ? 'Not available' : `${c.latitude}°, ${c.longitude}°`], ['Position', hemisphere(c.latitude, c.longitude)]];
    for (const [label, value] of entries) { const box = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = label; dd.textContent = value; box.append(dt, dd); facts.append(box); }
    const capital = document.querySelector('#country-weather'); capital.disabled = !c.capital; capital.textContent = c.capital ? `Find weather in ${c.capital}` : 'Capital unavailable';
    for (const p of paths) { const active = p.record?.code === c.code; p.node.classList.toggle('selected', active); p.node.setAttribute('aria-pressed', String(active)); }
    document.querySelector('#country-source').textContent = `Country reference snapshot: ${snapshot.retrieved}. Reference coordinates describe the country, not its capital. Borders are simplified and may omit small territories; they do not express a political position.`;
    renderLandmarks(c.code); renderDirectory();
  }
  document.querySelector('#country-weather').addEventListener('click', async () => {
    if (!country?.capital) return;
    const c = country, token = ++request; controller?.abort(); controller = new AbortController();
    status.textContent = `Finding ${c.capital}…`; document.querySelector('#country-weather').disabled = true;
    try {
      const params = new URLSearchParams({ q: c.capital.split(',')[0], countryCode: c.alpha2 });
      const raw = await fetchJSONWithFallback(`/api/v1/geocode?${params}`, geocodingURL(c.capital.split(',')[0], c.alpha2), { signal: controller.signal });
      if (token !== request) return;
      const matching = { ...raw, results: raw.results?.filter(r => r.country_code?.toUpperCase() === c.alpha2) };
      const locations = validateLocations(matching);
      if (!locations.length) throw new Error('Capital not found. Use city search to choose a location.');
      status.textContent = `Opened ${locations[0].name}.`; onOpen(locations[0]);
    } catch (error) { if (token === request && error.name !== 'AbortError') status.textContent = error.message; }
    finally { if (token === request) document.querySelector('#country-weather').disabled = false; }
  });
  function renderLandmarks(code) {
    const list = document.querySelector('#landmark-list'); list.replaceChildren();
    const matches = code ? landmarks.filter(l => l.country === code) : landmarks;
    document.querySelector('#landmark-count').textContent = matches.length ? `${matches.length} curated landmarks. Coordinates are approximate; weather is a model estimate for that location.` : 'No curated landmarks for this country yet. Try the worldwide collection.';
    for (const l of matches) {
      const card = document.createElement('article'); card.dataset.testid = 'landmark-card';
      const photo = photos[l.name];
      if (photo) {
        const figure = document.createElement('figure'); figure.className = 'landmark-photo';
        const image = document.createElement('img'); image.src = photo.src; image.alt = photo.alt; image.width = 640; image.height = 400; image.loading = 'lazy'; image.decoding = 'async'; image.dataset.geographyPhoto = ''; image.dataset.testid = 'landmark-photo';
        const caption = document.createElement('figcaption');
        const credit = document.createElement('a'); credit.href = photo.source; credit.target = '_blank'; credit.rel = 'noopener noreferrer'; credit.textContent = `Photo: ${photo.author} · ${photo.license}`;
        const license = document.createElement('a'); license.href = photo.licenseUrl; license.target = '_blank'; license.rel = 'noopener noreferrer'; license.textContent = 'License';
        caption.append(credit, ' · ', license); figure.append(image, caption); card.append(figure);
      } else { card.classList.add('landmark-no-photo'); }
      const title = document.createElement('h4'); title.textContent = l.name;
      const fact = document.createElement('p'); fact.textContent = l.fact;
      const source = document.createElement('a'); source.href = l.source; source.textContent = 'UNESCO site record'; source.target = '_blank'; source.rel = 'noopener noreferrer';
      const button = document.createElement('button'); button.type = 'button'; button.className = 'secondary-button'; button.textContent = `Explore ${l.name}`;
      button.addEventListener('click', () => onOpen({ id: `landmark:${l.name}`, name: l.name, latitude: l.latitude, longitude: l.longitude, country: countries.find(c => c.code === l.country)?.name ?? null, elevation: null, timezone: null, region: null }));
      card.append(title, fact, source, button); list.append(card);
    }
  }
  document.querySelector('#landmarks-worldwide').addEventListener('click', () => renderLandmarks(null));
  const globeButton = document.querySelector('#globe-load');
  globeButton.addEventListener('click', async () => {
    globeButton.disabled = true; globeStatus.textContent = 'Preparing the 3D globe…';
    try {
      const { createGlobe } = await import('./globe.js');
      globe = createGlobe({ container: document.querySelector('#globe-canvas'), features });
      if (selectedCity) globe.select(selectedCity, weather);
      globeButton.hidden = true; document.querySelector('#globe-controls').hidden = false;
      globeStatus.textContent = 'Globe ready. Drag to rotate, use the zoom buttons, or use arrow keys on the globe. Weather effects represent only the selected location.';
    } catch { globeStatus.textContent = '3D is unavailable: this device needs WebGL 2. The interactive map and country directory remain available.'; }
    finally { globeButton.disabled = false; }
  });
  document.querySelector('#globe-rotate').addEventListener('click', event => { const active = globe.toggleRotation(); event.currentTarget.setAttribute('aria-pressed', String(active)); });
  document.querySelector('#globe-zoom-in').addEventListener('click', () => globe.zoom(-0.4));
  document.querySelector('#globe-zoom-out').addEventListener('click', () => globe.zoom(0.4));
  document.querySelector('#globe-reset').addEventListener('click', () => { globe.reset(); document.querySelector('#globe-rotate').setAttribute('aria-pressed', 'false'); });
  renderDirectory(); renderLandmarks(null); transform();
  return {
    selectCity(city) {
      selectedCity = city; weather = null;
      const point = projection([city.longitude, city.latitude]); pin.removeAttribute('hidden'); pin.setAttribute('cx', point[0]); pin.setAttribute('cy', point[1]);
      document.querySelector('#map-location').textContent = `Selected location: ${city.name} · ${city.latitude.toFixed(3)}°, ${city.longitude.toFixed(3)}°`;
      const c = countries.find(c => c.name === city.country || c.official === city.country); if (c) selectCountry(c);
      globe?.select(city, null);
    },
    setWeather(data, location) { if (selectedCity?.latitude !== location.latitude || selectedCity?.longitude !== location.longitude) return; weather = data; globe?.select(location, data); },
    clearWeather() { weather = null; globe?.select(selectedCity, null); },
    clearSelection() { selectedCity = null; weather = null; pin.setAttribute('hidden', ''); document.querySelector('#map-location').textContent = 'Select a city or landmark to place a marker.'; globe?.select(null, null); }
  };
}
