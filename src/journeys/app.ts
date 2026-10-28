import { account } from '../services/account.ts';
import { landmarks } from '../data/landmarks.js';
import { initSatellitePanel } from './satellitePanel.ts';

initSatellitePanel();

const $ = (selector: string) => document.querySelector(selector) as HTMLElement;
const show = (selector: string, message: string) => { $(selector).textContent = message; };
function item(list: HTMLElement, text: string, controls: [string, () => void][] = []) {
  const li = document.createElement('li'), span = document.createElement('span'); span.textContent = text; li.append(span);
  for (const [label, click] of controls) { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.addEventListener('click', click); li.append(button); }
  list.append(li);
}
const year = $('#time-year') as HTMLInputElement;
year.addEventListener('input', () => show('#time-value', year.value));
$('#time-form').addEventListener('submit', async event => {
  event.preventDefault(); const y = Number(year.value), current = new Date().getUTCFullYear();
  if (y > current + 30) { show('#time-result', `${y}: Fiction. Imagine a future city designed for its changing climate. Not a forecast; no weather values are implied.`); return; }
  if (y > current) { show('#time-result', `${y}: Scientific estimate. Global climate risks increase with warming (IPCC AR6). This is general climate context, not a forecast for this city or day.`); return; }
  show('#time-result', 'Loading historical weather…');
  try {
    const params = new URLSearchParams({ date: `${y}-01-01`, lat: ($('#time-lat') as HTMLInputElement).value, lon: ($('#time-lon') as HTMLInputElement).value });
    const response = await fetch(`/api/v1/journeys/time-machine?${params}`); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Historical weather is unavailable.');
    show('#time-result', `${data.date}: ${data.label} — ${data.kind} from ${data.source}. High ${data.maximum}°C, low ${data.minimum}°C. ${data.note}`);
  } catch (error: any) { show('#time-result', error.message); }
});

let editingTrip = '';
async function trips() {
  if (!account.signedIn) return;
  try {
    const { trips: records } = await account.request('/journeys/trips'); const list = $('#trip-list'); list.replaceChildren();
    for (const trip of records) item(list, `${trip.name}: ${trip.city} (${trip.startDate.slice(0, 10)} to ${trip.endDate.slice(0, 10)}). ${Date.parse(trip.startDate) - Date.now() < 7 * 86400000 ? 'Forecast may be available: search this city on the homepage.' : 'Forecast is outside the supported horizon.'}`, [
      ['Edit', () => { editingTrip = trip.id; for (const field of ['name', 'city']) ($('#trip-' + field) as HTMLInputElement).value = trip[field]; ($('#trip-start') as HTMLInputElement).value = trip.startDate.slice(0, 10); ($('#trip-end') as HTMLInputElement).value = trip.endDate.slice(0, 10); $('#trip-cancel').hidden = false; ($('#trip-name') as HTMLInputElement).focus(); }],
      ['Available forecasts', async () => {
        show('#trip-status', 'Checking forecast availability…');
        try {
          const geoResponse = await fetch(`/api/v1/geocode?q=${encodeURIComponent(trip.city)}`);
          if (!geoResponse.ok) throw new Error('City lookup is unavailable.');
          const city = (await geoResponse.json()).results?.[0];
          if (!city) throw new Error('City was not found; choose a more specific name.');
          const weatherResponse = await fetch(`/api/v1/weather?lat=${city.latitude}&lon=${city.longitude}&view=daily`);
          if (!weatherResponse.ok) throw new Error('Daily forecast is unavailable.');
          const daily = (await weatherResponse.json()).daily;
          const days = daily.time.map((stamp: string, index: number) => ({ date: new Date(typeof stamp === 'number' ? stamp * 1000 : stamp).toISOString().slice(0, 10), high: daily.temperature_2m_max[index], low: daily.temperature_2m_min[index] }));
          const available = days.filter((d: any) => d.date >= trip.startDate.slice(0,10) && d.date <= trip.endDate.slice(0,10) && Number.isFinite(d.high) && Number.isFinite(d.low));
          show('#trip-status', available.length ? `${city.name}, ${city.country || 'country unavailable'} — ${available.map((d: any) => `${d.date}: ${d.high}°C high, ${d.low}°C low`).join('; ')}. Modelled forecast by Open-Meteo. Other trip days are outside the available forecast.` : 'No trip days have an available forecast. No weather has been invented.');
        } catch (error: any) { show('#trip-status', error.message); }
      }],
      ['Delete', async () => { await account.request(`/journeys/trips/${trip.id}`, { method: 'DELETE' }); await trips(); }]
    ]);
  } catch (error: any) { show('#trip-status', error.message); }
}
$('#trip-form').addEventListener('submit', async event => {
  event.preventDefault();
  const data = { name: ($('#trip-name') as HTMLInputElement).value, city: ($('#trip-city') as HTMLInputElement).value, startDate: ($('#trip-start') as HTMLInputElement).value, endDate: ($('#trip-end') as HTMLInputElement).value };
  try { await account.request('/journeys/trips' + (editingTrip ? `/${editingTrip}` : ''), { method: editingTrip ? 'PUT' : 'POST', body: JSON.stringify(data) }); show('#trip-status', 'Trip saved.'); editingTrip = ''; (event.target as HTMLFormElement).reset(); $('#trip-cancel').hidden = true; await trips(); } catch (error: any) { show('#trip-status', error.message); }
});
$('#trip-cancel').addEventListener('click', () => { editingTrip = ''; ($('#trip-form') as HTMLFormElement).reset(); $('#trip-cancel').hidden = true; });

async function alerts() {
  if (!account.signedIn) return;
  try {
    const data = await account.request('/journeys/alerts');
    $('#alert-list').replaceChildren(); $('#notification-list').replaceChildren();
    for (const alert of data.alerts) item($('#alert-list'), `${alert.city}: ${alert.condition} ${alert.threshold}`, [['Edit', () => { ($('#alert-city') as HTMLInputElement).value = alert.city; ($('#alert-condition') as HTMLSelectElement).value = alert.condition; ($('#alert-threshold') as HTMLInputElement).value = String(alert.threshold); ($('#alert-form') as HTMLFormElement).dataset.editId = alert.id; ($('#alert-city') as HTMLInputElement).focus(); }], ['Delete', async () => { await account.request(`/journeys/alerts/${alert.id}`, { method: 'DELETE' }); await alerts(); }]]);
    for (const note of data.notifications) item($('#notification-list'), note.message);
  } catch (error: any) { show('#alert-status', error.message); }
}
$('#alert-form').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.target as HTMLFormElement;
  const data = { city: ($('#alert-city') as HTMLInputElement).value, condition: ($('#alert-condition') as HTMLSelectElement).value, threshold: Number(($('#alert-threshold') as HTMLInputElement).value) };
  try { await account.request('/journeys/alerts' + (form.dataset.editId ? `/${form.dataset.editId}` : ''), { method: form.dataset.editId ? 'PUT' : 'POST', body: JSON.stringify(data) }); show('#alert-status', 'Rule saved.'); delete form.dataset.editId; form.reset(); await alerts(); } catch (error: any) { show('#alert-status', error.message); }
});
const landmark = $('#review-landmark') as HTMLSelectElement;
for (const place of landmarks) { const option = document.createElement('option'); option.value = place.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); option.textContent = place.name; landmark.add(option); }
async function reviews() {
  try {
    const response = await fetch(`/api/v1/journeys/reviews/${landmark.value}`); const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Reviews are unavailable.');
    const list = $('#review-list'); list.replaceChildren();
    const sorted = data.reviews.sort((a: any, b: any) => ($('#review-sort') as HTMLSelectElement).value === 'rating' ? b.rating - a.rating : Date.parse(b.createdAt) - Date.parse(a.createdAt));
    for (const review of sorted) {
      item(list, `${review.rating}/5 — ${review.author || 'AtlasSphere explorer'}: ${review.body || 'No written comment'}`);
      if (review.imageUrl) { const image = document.createElement('img'); image.src = review.imageUrl; image.loading = 'lazy'; image.alt = 'Photo submitted with landmark review'; list.lastElementChild?.append(image); }
    }
  } catch (error: any) { show('#review-status', error.message); }
}
landmark.addEventListener('change', reviews); $('#review-sort').addEventListener('change', reviews);
$('#review-form').addEventListener('submit', async event => {
  event.preventDefault();
  let image: string | null = null; const file = ($('#review-image') as HTMLInputElement).files?.[0];
  try {
    if (file) {
      if (!['image/png', 'image/jpeg'].includes(file.type)) throw new Error('Choose a JPG or PNG photo.');
      const url = URL.createObjectURL(file), photo = new Image();
      try {
        await new Promise<void>((resolve, reject) => { photo.onload = () => resolve(); photo.onerror = () => reject(new Error('Photo could not be read.')); photo.src = url; });
        const scale = Math.min(1, 1280 / Math.max(photo.naturalWidth, photo.naturalHeight));
        const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(photo.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(photo.naturalHeight * scale));
        const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Photo could not be processed.');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);
        image = canvas.toDataURL('image/jpeg', 0.8);
        if (Math.ceil((image.length - 'data:image/jpeg;base64,'.length) * 3 / 4) > 1024 * 1024) throw new Error('Compressed photo is larger than 1 MB. Choose another photo.');
      } finally { URL.revokeObjectURL(url); }
    }
    await account.request(`/journeys/reviews/${landmark.value}`, { method: 'PUT', body: JSON.stringify({ rating: Number(($('#review-rating') as HTMLInputElement).value), body: ($('#review-body') as HTMLTextAreaElement).value, image }) }); show('#review-status', 'Review saved.'); await reviews();
  } catch (error: any) { show('#review-status', error.message); }
});
$('#review-delete').addEventListener('click', async () => { try { await account.request(`/journeys/reviews/${landmark.value}`, { method: 'DELETE' }); show('#review-status', 'Review deleted.'); await reviews(); } catch (error: any) { show('#review-status', error.message); } });
void account.refresh().then(user => { show('#journey-account', user ? `Signed in as ${user.email}.` : 'Sign in on the homepage to save trips, rules and reviews.'); void trips(); void alerts(); });
void reviews();
