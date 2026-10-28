import { account } from '../services/account.ts';
import { readJSON, writeJSON } from '../utils/storage.js';
import { weatherStory } from '../utils/weatherStory.ts';

export function initAppearance() {
  const key = 'earthscope:theme:v1';
  const saved = readJSON(key);
  const preference = matchMedia('(prefers-color-scheme: light)');
  let theme = ['light', 'dark'].includes(saved.value) ? saved.value : preference.matches ? 'light' : 'dark';
  const anonymousTheme = theme;
  const toggle = document.querySelector('#theme-toggle');
  function render() {
    document.documentElement.dataset.theme = theme;
    toggle.textContent = theme === 'dark' ? '☀ Light theme' : '☾ Dark theme';
    toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    toggle.setAttribute('aria-pressed', String(theme === 'light'));
  }
  addEventListener('skyatlas-account-changed', () => {
    if (account.user?.theme && ['light', 'dark'].includes(account.user.theme)) theme = account.user.theme;
    else theme = anonymousTheme;
    render();
  });
  toggle.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark'; render();
    if (account.signedIn) void account.request('/account/theme', { method: 'PUT', body: JSON.stringify({ theme }) });
    if (account.signedIn) document.querySelector('#appearance-status').textContent = '';
    else document.querySelector('#appearance-status').textContent = writeJSON(key, theme) ? '' : 'Theme changed for this session. Your browser could not save it.';
  });
  render();
  function imageFallback(image) {
    if (image instanceof HTMLImageElement && image.matches('[data-geography-photo]')) {
      image.hidden = true; image.closest('figure')?.classList.add('photo-unavailable');
    }
  }
  document.addEventListener('error', event => imageFallback(event.target), true);
  for (const image of document.querySelectorAll('img[data-geography-photo]')) {
    if (image.complete && image.naturalWidth === 0) imageFallback(image);
  }
  return {
    clear() { delete document.body.dataset.condition; delete document.body.dataset.daylight; document.querySelector('#weather-story').textContent = ''; },
    weather(data) {
      const code = data.code;
      const condition = code === 0 ? 'clear' : [1, 2, 3].includes(code) ? 'cloudy' : [45, 48].includes(code) ? 'fog' : [71, 73, 75, 77, 85, 86].includes(code) ? 'snow' : [95, 96, 99].includes(code) ? 'storm' : [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code) ? 'rain' : 'unknown';
      document.body.dataset.condition = condition;
      document.body.dataset.daylight = data.isDay === 0 ? 'night' : data.isDay === 1 ? 'day' : 'unknown';
      document.querySelector('#weather-story').textContent = weatherStory({ condition, humidity: data.humidity, wind: data.wind });
    }
  };
}
