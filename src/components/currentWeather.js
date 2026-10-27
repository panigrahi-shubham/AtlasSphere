import { getCurrentWeather } from '../services/weatherService.js';
import { weatherCondition } from '../utils/weatherCodes.js';
import { localTime } from '../utils/time.js';
import { formatTemperature } from '../utils/temperature.js';
import { bugEnabled } from '../dev/bugMode.js';
export { localTime } from '../utils/time.js';

const unavailable = 'Not available';
const formatNumber = (value, unit) => value === null ? unavailable
  : `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)} ${unit}`;
export function initCurrentWeather({ fetchWeather = getCurrentWeather, onLoaded = () => {}, onClear = () => {}, getUnit = () => 'celsius' } = {}) {
  const panel = document.querySelector('#weather-panel');
  const content = document.querySelector('#weather-values');
  const loading = document.querySelector('#weather-loading');
  const error = document.querySelector('#weather-error');
  const retry = document.querySelector('#weather-retry');
  const note = document.querySelector('#weather-note');
  const refresh = document.querySelector('#weather-refresh');
  let controller, clock, selectedCity;
  let version = 0;
  let currentData = null;
  const text = (id, value) => { document.getElementById(id).textContent = value; };
  function updateTemperatures() {
    if (!currentData) return;
    text('temperature', formatTemperature(currentData.temperature, getUnit()));
    text('feels-like', formatTemperature(currentData.feelsLike, getUnit()));
  }

  function clear() {
    version++;
    controller?.abort();
    clearInterval(clock);
    selectedCity = null;
    currentData = null;
    content.hidden = true;
    loading.hidden = true;
    if (document.querySelector('#weather-skeleton')) document.querySelector('#weather-skeleton').hidden = true;
    retry.hidden = true;
    error.textContent = '';
    note.textContent = '';
    panel.setAttribute('aria-busy', 'false');
    refresh.disabled = true;
    onClear();
  }
  async function load(city) {
    clear();
    selectedCity = city;
    const token = version;
    controller = new AbortController();
    loading.hidden = false;
    if (document.querySelector('#weather-skeleton')) document.querySelector('#weather-skeleton').hidden = false;
    refresh.disabled = true;
    panel.setAttribute('aria-busy', 'true');
    try {
      const data = await fetchWeather(city, { signal: controller.signal });
      if (token !== version) return;
      const condition = weatherCondition(data.code, data.isDay);
      currentData = data;
      updateTemperatures();
      text('humidity', formatNumber(bugEnabled('HUM-001') ? null : data.humidity, '%'));
      text('wind', formatNumber(data.wind, 'km/h'));
      text('precipitation', formatNumber(data.precipitation, 'mm'));
      text('precipitation-period', data.interval === null ? 'Reporting period unavailable'
        : `Over the preceding ${formatNumber(data.interval / 60, 'minutes')}`);
      text('weather-description', condition.description);
      text('weather-icon', condition.icon);
      document.querySelector('#weather-icon').setAttribute('aria-label', condition.description);
      text('weather-as-of', `Weather valid at ${localTime(data.timezone, new Date(data.time * 1000))} (${data.timezone})`);
      const updateClock = () => text('local-time', `${localTime(data.timezone)} (${data.timezone})`);
      updateClock();
      clock = setInterval(updateClock, 60000);
      if (data.incomplete) note.textContent = 'Some weather details are unavailable. Showing the data provided.';
      content.hidden = false;
      onLoaded(data, city);
    } catch (failure) {
      if (token !== version || failure.name === 'AbortError') return;
      error.textContent = failure.message || 'Unable to load weather. Please try again.';
      retry.hidden = false;
    } finally {
      if (token === version) {
        loading.hidden = true;
        if (document.querySelector('#weather-skeleton')) document.querySelector('#weather-skeleton').hidden = true;
        panel.setAttribute('aria-busy', 'false');
        refresh.disabled = false;
      }
    }
  }
  retry.addEventListener('click', () => { if (selectedCity) void load(selectedCity); });
  refresh.addEventListener('click', () => { if (selectedCity) void load(selectedCity); });
  return { load, clear, updateTemperatures };
}
