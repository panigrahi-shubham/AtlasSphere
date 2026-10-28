/**
 * Feature: Weather provider contracts
 * Layer: Unit — node:test
 * Real: Imported application modules
 * Mocked: Fixture inputs and test-supplied dependencies
 * Guards: Regressions in weather provider contracts; negative cases remain explicit below
 * Run: npm test
 * Needs: Node.js 24
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup() {
  const elements = {};
  const requests = [];
  const timers = new Map();
  let timerId = 0;
  function element() {
    return { textContent: '', style: {}, dataset: {}, hidden: true, children: [],
      replaceChildren() { this.children = []; },
      append(...children) { this.children.push(...children); },
      addEventListener() {} };
  }
  const context = vm.createContext({
    document: { getElementById(id) { return elements[id] ??= element(); }, createElement: element },
    URLSearchParams, Intl, Date, AbortController,
    setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    fetch(url, options) { return new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })); }
  });
  const html = fs.readFileSync(path.join(__dirname, '..', 'legacy', 'index.html'), 'utf8');
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace("$('city').value='Nashik';searchCity('Nashik');", ''), context);
  const respond = data => requests.shift().resolve({ ok: true, json: async () => data });
  return { context, elements, requests, timers, respond };
}
const city = name => ({ name, latitude: 19.9, longitude: 73.8 });
function forecast() {
  return { timezone: 'Asia/Kolkata',
    current: { time: '2026-10-26T10:15', temperature_2m: 25, wind_speed_10m: 8, weather_code: 0 },
    hourly: {
      time: Array.from({ length: 24 }, (_, i) => `2026-10-${26 + Math.floor((10 + i) / 24)}T${String((10 + i) % 24).padStart(2, '0')}:00`),
      temperature_2m: Array(24).fill(25), precipitation_probability: Array(24).fill(0)
    }
  };
}

test('a no-match search clears earlier city choices immediately', async () => {
  const s = setup();
  const first = s.context.searchCity('Paris');
  s.respond({ results: [city('Paris A'), city('Paris B')] }); await first;
  assert.equal(s.elements.results.children.length, 2);
  const second = s.context.searchCity('nonsense');
  assert.equal(s.elements.results.children.length, 0);
  assert.equal(s.elements.results.style.display, 'none');
  s.respond({}); await second;
  assert.match(s.elements.status.textContent, /City not found/);
});

test('older responses cannot overwrite the newest search or unlock its button', async () => {
  const s = setup();
  const a = s.context.searchCity('Alpha');
  const qa = s.requests.shift();
  const b = s.context.searchCity('Beta');
  assert.equal(qa.options.signal.aborted, true);
  qa.resolve({ ok: true, json: async () => ({ results: [city('Alpha A'), city('Alpha B')] }) });
  await a;
  assert.equal(s.elements.submit.disabled, true);
  s.respond({ results: [city('Beta A'), city('Beta B')] }); await b;
  assert.equal(s.elements.results.children[0].textContent, 'Beta A');
  assert.equal(s.elements.submit.disabled, false);
});

test('incomplete weather is rejected before any weather fields change', async () => {
  const s = setup();
  const pending = s.context.loadWeather(city('Broken'));
  s.respond({ current: { time: '2026-10-26T10:15' }, hourly: { time: ['2026-10-26T10:00'] }, timezone: 'UTC' });
  await pending;
  assert.match(s.elements.status.textContent, /Weather data is incomplete/);
  assert.equal(s.elements['weather-content'].hidden, true);
  assert.equal(s.elements.temp, undefined);
});

test('valid forecast renders 24 rows and preserves zero rain probability', async () => {
  const s = setup();
  const pending = s.context.loadWeather(city('Nashik')); s.respond(forecast()); await pending;
  assert.equal(s.elements['weather-content'].hidden, false);
  assert.equal(s.elements.temp.textContent, '25°C');
  assert.equal(s.elements.hourly.children.length, 24);
  assert.equal(s.elements.hourly.children[0].children[2].textContent, '☂ 0%');
});

test('starting another search hides earlier weather even if the search fails', async () => {
  const s = setup();
  const weather = s.context.loadWeather(city('Nashik')); s.respond(forecast()); await weather;
  const search = s.context.searchCity('Other');
  assert.equal(s.elements['weather-content'].hidden, true);
  s.requests.shift().resolve({ ok: false, status: 503 }); await search;
  assert.match(s.elements.status.textContent, /503/);
  assert.equal(s.elements.submit.disabled, false);
});

test('timeout restores search controls with a retry message', async () => {
  const s = setup();
  const pending = s.context.searchCity('Nashik');
  const request = s.requests.shift();
  request.options.signal.addEventListener('abort', () => request.reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  [...s.timers.values()][0](); await pending;
  assert.match(s.elements.status.textContent, /timed out/);
  assert.equal(s.elements.submit.disabled, false);
  assert.equal(s.timers.size, 0);
});
