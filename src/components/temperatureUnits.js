import { readJSON, writeJSON, STORAGE_KEYS } from '../utils/storage.js';

export function initTemperatureUnits({ onChange }) {
  const saved = readJSON(STORAGE_KEYS.unit);
  const valid = saved.value === 'celsius' || saved.value === 'fahrenheit';
  let unit = valid ? saved.value : 'celsius';
  const status = document.querySelector('#unit-status');
  if (saved.status === 'unavailable') status.textContent = 'Temperature preferences cannot be saved in this browser. Switching still works for this session.';
  else if (saved.status === 'invalid' || saved.status === 'ok' && !valid) status.textContent = 'Saved temperature preference was invalid. Using Celsius.';
  function render() {
    for (const value of ['celsius', 'fahrenheit']) {
      document.querySelector(`#unit-${value}`).setAttribute('aria-pressed', String(unit === value));
    }
    document.querySelector('#temperature-caption').textContent = `Modelled weather estimates from Open-Meteo, not direct station observations. Temperatures in ${unit === 'celsius' ? 'Celsius' : 'Fahrenheit'}.`;
  }
  for (const value of ['celsius', 'fahrenheit']) {
    document.querySelector(`#unit-${value}`).addEventListener('click', () => {
      unit = value;
      status.textContent = writeJSON(STORAGE_KEYS.unit, unit) ? '' : 'Unit changed for this session. Your browser could not save the preference.';
      render(); onChange();
    });
  }
  render();
  return { getUnit: () => unit };
}
