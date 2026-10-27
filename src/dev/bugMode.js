// Vite replaces this flag. Node and ordinary static source serving default off.
const DEV = import.meta.env?.DEV === true;
const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);
export const BUG_MODE = DEV && params.get('bugMode') === '1';
export const DEFECTS = {
  'TEMP-001': 'Incorrect Fahrenheit conversion',
  'HUM-001': 'Missing humidity value',
  'FAV-001': 'Duplicate favorite locations',
  'SEARCH-001': 'Empty/short search reaches the API',
  'TIME-001': 'Hourly times use UTC instead of the location',
  'GG-BUG-1': 'GeoGuess Fahrenheit distance changes scoring',
  'GG-BUG-2': 'GeoGuess timer continues briefly after answering'
};
const active = new Set((params.get('bugs') ?? '').split(',').filter(id => Object.hasOwn(DEFECTS, id)));
export const bugEnabled = id => BUG_MODE && active.has(id);
export const practiceStorageKey = key => BUG_MODE ? `earthscope:practice:${key}` : key;

export function initBugMode() {
  if (!BUG_MODE) return;
  const panel = document.createElement('section');
  panel.className = 'detail-panel practice-panel'; panel.dataset.testid = 'bug-mode-panel';
  panel.setAttribute('aria-label', 'Development testing mode');
  const heading = document.createElement('h2'); heading.textContent = 'Testing practice mode';
  const note = document.createElement('p');
  note.textContent = 'Development only. Selected defects are intentional. Favorites and preferences use isolated practice storage. Changing a defect reloads the page.';
  panel.append(heading, note);
  for (const [id, description] of Object.entries(DEFECTS)) {
    const label = document.createElement('label');
    const input = document.createElement('input'); input.type = 'checkbox'; input.checked = active.has(id);
    input.dataset.testid = `bug-${id}`;
    input.addEventListener('change', () => {
      input.checked ? active.add(id) : active.delete(id);
      const url = new URL(window.location.href);
      url.searchParams.set('bugs', [...active].join(',')); window.location.assign(url);
    });
    label.append(input, `${id}: ${description}`); panel.append(label);
  }
  const exit = document.createElement('button'); exit.type = 'button'; exit.textContent = 'Exit practice mode'; exit.dataset.testid = 'bug-mode-exit';
  exit.addEventListener('click', () => {
    const url = new URL(window.location.href); url.searchParams.delete('bugMode'); url.searchParams.delete('bugs'); window.location.assign(url);
  });
  panel.append(exit); document.querySelector('main').prepend(panel);
}
