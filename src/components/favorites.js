import { readJSON, writeJSON, STORAGE_KEYS, normalizeFavorite, normalizeFavorites, sameLocation, locationKey } from '../utils/storage.js';
import { favoriteView } from '../utils/favoriteView.js';
import { account } from '../services/account.ts';
import { bugEnabled } from '../dev/bugMode.js';

export function initFavorites({ onOpen }) {
  const list = document.querySelector('#favorites-list');
  const empty = document.querySelector('#favorites-empty');
  const status = document.querySelector('#favorites-status');
  const toggle = document.querySelector('#favorite-toggle');
  const filter = document.querySelector('#favorites-filter');
  const sort = document.querySelector('#favorites-sort');
  const clearButton = document.querySelector('#favorites-clear');
  const dialog = document.querySelector('#favorites-clear-dialog');
  const saved = readJSON(STORAGE_KEYS.favorites);
  const normalized = normalizeFavorites(saved.value);
  let cities = saved.status === 'ok' ? normalized.cities : [];
  let selected = null;
  const anonymousCities = [...cities];
  let wasSignedIn = false;
  addEventListener('skyatlas-account-changed', async () => {
    if (!account.signedIn) {
      if (wasSignedIn) { cities = [...anonymousCities]; render(); }
      wasSignedIn = false; return;
    }
    try {
      const incoming = wasSignedIn ? await account.request('/favorites') : await account.request('/favorites/sync', { method: 'POST', body: JSON.stringify({ favorites: cities.slice(0, 20) }) });
      if (!account.signedIn) return;
      cities = normalizeFavorites(incoming.favorites).cities; wasSignedIn = true; render();
      status.textContent = 'Favorites synced with your account.';
    } catch (error) { status.textContent = 'Could not sync favorites: ' + error.message; }
  });
  if (saved.status === 'unavailable') status.textContent = 'Favorites cannot be saved in this browser. You can still use them for this session.';
  else if (saved.status === 'invalid' || saved.status === 'ok' && normalized.invalid) {
    status.textContent = 'Some saved favorites could not be read. Valid locations are still available; you can save locations again.';
  }
  const label = city => [city.name, city.region, city.country].filter(Boolean).join(', ');
  const contains = city => !bugEnabled('FAV-001') && cities.some(existing => sameLocation(existing, city));
  function renderToggle() {
    const saved = selected && contains(selected);
    toggle.disabled = !selected;
    toggle.setAttribute('aria-pressed', String(Boolean(saved)));
    toggle.textContent = saved ? 'Remove favorite' : 'Save favorite';
  }
  function persist(message) {
    if (account.signedIn) {
      status.textContent = message;
      void account.request('/favorites', { method: 'PUT', body: JSON.stringify({ favorites: cities }) })
        .catch(error => { status.textContent = 'Could not sync favorites: ' + error.message; });
    } else {
      status.textContent = writeJSON(STORAGE_KEYS.favorites, cities) ? message
        : `${message} Changes apply to this session; your browser could not save favorites.`;
    }
    render();
  }
  function remove(city) {
    cities = cities.filter(existing => !sameLocation(existing, city));
    persist(`Removed ${city.name} from favorites.`);
  }
  function render() {
    list.replaceChildren();
    empty.hidden = cities.length > 0;
    const visible = favoriteView(cities, filter.value, sort.value);
    document.querySelector('#favorites-no-matches').hidden = !cities.length || visible.length > 0;
    document.querySelector('#favorites-count').textContent = `Showing ${visible.length} of ${cities.length} favorites`;
    clearButton.disabled = cities.length === 0;
    for (const city of visible) {
      const item = document.createElement('li');
      item.dataset.testid = 'favorite-item'; item.dataset.locationId = locationKey(city);
      const open = document.createElement('button');
      open.type = 'button'; open.className = 'favorite-open';
      open.textContent = label(city); open.setAttribute('aria-label', `Open ${label(city)}`);
      open.addEventListener('click', () => onOpen(city));
      const removeButton = document.createElement('button');
      removeButton.type = 'button'; removeButton.className = 'favorite-remove';
      removeButton.textContent = 'Remove'; removeButton.setAttribute('aria-label', `Remove ${label(city)} from favorites`);
      removeButton.addEventListener('click', () => {
        remove(city);
        (list.querySelector('button') ?? (cities.length ? filter : empty)).focus();
      });
      item.append(open, removeButton); list.append(item);
    }
    renderToggle();
  }
  toggle.addEventListener('click', () => {
    if (!selected) return;
    if (contains(selected)) remove(selected);
    else { cities.push(selected); persist(`Saved ${selected.name} to favorites.`); }
  });
  filter.addEventListener('input', render);
  sort.addEventListener('change', render);
  clearButton.addEventListener('click', () => dialog.showModal());
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const first = document.querySelector('#favorites-cancel-clear');
    const last = document.querySelector('#favorites-confirm-clear');
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.querySelector('#favorites-cancel-clear').addEventListener('click', () => dialog.close());
  document.querySelector('#favorites-confirm-clear').addEventListener('click', () => {
    cities = []; persist('All favorites removed.'); dialog.close(); filter.focus();
  });
  dialog.addEventListener('close', () => { if (cities.length) clearButton.focus(); });
  render();
  return {
    select(city) { selected = normalizeFavorite(city); renderToggle(); },
    clearSelection() { selected = null; renderToggle(); }
  };
}

