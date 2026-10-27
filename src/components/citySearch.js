import { searchCities } from '../services/geocodingService.js';
import { bugEnabled } from '../dev/bugMode.js';

export function initCitySearch({ onSelect, onReset, search = searchCities }) {
  const form = document.querySelector('#search-form');
  const input = document.querySelector('#city');
  const suggestions = document.querySelector('#suggestions');
  const error = document.querySelector('#search-error');
  const status = document.querySelector('#search-status');
  const loading = document.querySelector('#loading');
  let controller;
  let version = 0;

  function clearResults() {
    suggestions.replaceChildren();
    suggestions.hidden = true;
  }
  function setLoading(value) {
    loading.hidden = !value;
    form.setAttribute('aria-busy', String(value));
  }
  function invalidate() {
    version++;
    controller?.abort();
    clearResults();
    setLoading(false);
    error.textContent = '';
    input.removeAttribute('aria-invalid');
    status.textContent = '';
    onReset();
  }
  function choose(city, token) {
    if (token !== version) return;
    input.value = city.name;
    clearResults();
    status.textContent = `Selected ${city.name}, ${city.country ?? 'country unavailable'}.`;
    onSelect(city);
  }
  input.addEventListener('input', invalidate);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    invalidate();
    const query = input.value.trim();
    if (!bugEnabled('SEARCH-001') && Array.from(query).length < 2) {
      error.textContent = query ? 'Enter at least 2 characters to search for a city.' : 'Enter a city name.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    controller = new AbortController();
    const token = version;
    setLoading(true);
    try {
      const cities = await search(query, { signal: controller.signal });
      if (token !== version) return;
      if (!cities.length) {
        error.textContent = `No cities found for “${query}”. Try another name.`;
        return;
      }
      for (const city of cities) {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.testid = 'city-suggestion';
        button.textContent = [city.name, city.region, city.country ?? 'Country unavailable'].filter(Boolean).join(', ');
        button.addEventListener('click', () => choose(city, token));
        item.append(button);
        suggestions.append(item);
      }
      suggestions.hidden = false;
      status.textContent = `${cities.length} location${cities.length === 1 ? '' : 's'} found. Choose a city below.`;
    } catch (failure) {
      if (token === version && failure.name !== 'AbortError') error.textContent = failure.message || 'Unable to search. Please try again.';
    } finally {
      if (token === version) setLoading(false);
    }
  });
  function buttons() { return [...suggestions.querySelectorAll('button')]; }
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' && !suggestions.hidden) {
      event.preventDefault(); buttons()[0]?.focus();
    }
    if (event.key === 'Escape') { invalidate(); }
  });
  document.querySelector('#city-clear').addEventListener('click', () => {
    invalidate(); input.value = ''; input.focus();
  });
  suggestions.addEventListener('keydown', event => {
    if (event.key === 'Escape') { invalidate(); input.focus(); return; }
    const options = buttons(), index = options.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (event.key === 'ArrowUp' && index === 0) input.focus();
      else options[(index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length]?.focus();
    }
  });
  return { reset: invalidate };
}
