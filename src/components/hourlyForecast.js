import { weatherCondition } from '../utils/weatherCodes.js';
import { forecastTime } from '../utils/time.js';
import { formatTemperature } from '../utils/temperature.js';
import { bugEnabled } from '../dev/bugMode.js';

export function initHourlyForecast({ getUnit = () => 'celsius' } = {}) {
  const section = document.querySelector('#forecast-section');
  const list = document.querySelector('#hourly-forecast');
  const note = document.querySelector('#forecast-note');
  list.addEventListener('keydown', event => {
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const end = event.key === 'End';
      list.scrollLeft = end ? list.scrollWidth : 0;
      list.scrollTop = end ? list.scrollHeight : 0;
    } else if (list.scrollWidth > list.clientWidth && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      list.scrollLeft += (event.key === 'ArrowRight' ? 1 : -1) * 177;
    }
  });
  let temperatures = [];
  function updateTemperatures() {
    for (const { element, value } of temperatures) element.textContent = formatTemperature(value, getUnit());
  }
  function clear() {
    section.hidden = true;
    list.replaceChildren();
    list.scrollLeft = 0;
    note.textContent = '';
    temperatures = [];
  }
  function render(forecast, timezone) {
    clear();
    section.hidden = false;
    const hours = forecast?.hours ?? [];
    document.querySelector('#forecast-timezone').textContent = `Local times in ${timezone}. Rain chance covers the hour preceding each timestamp.`;
    if (!hours.length) {
      note.textContent = 'Hourly forecast is unavailable. Current weather is shown above.';
      list.hidden = true;
      return;
    }
    list.hidden = false;
    for (const hour of hours) {
      const row = document.createElement('li');
      row.dataset.testid = 'forecast-hour';
      const time = document.createElement('time');
      time.dateTime = new Date(hour.time * 1000).toISOString();
      time.textContent = forecastTime(hour.time, bugEnabled('TIME-001') ? 'UTC' : timezone);
      time.dataset.testid = 'forecast-time';
      const condition = weatherCondition(hour.code, hour.isDay);
      const icon = document.createElement('span');
      icon.className = 'forecast-icon'; icon.textContent = condition.icon;
      icon.setAttribute('role', 'img'); icon.setAttribute('aria-label', condition.description);
      const temperature = document.createElement('strong');
      temperature.dataset.testid = 'forecast-temperature';
      temperature.textContent = formatTemperature(hour.temperature, getUnit());
      temperatures.push({ element: temperature, value: hour.temperature });
      const description = document.createElement('span');
      description.className = 'forecast-condition'; description.textContent = condition.description;
      const precipitation = document.createElement('span');
      precipitation.dataset.testid = 'forecast-precipitation';
      precipitation.textContent = hour.precipitation === null ? 'Rain chance: Not available' : `Rain chance: ${hour.precipitation}%`;
      const wind = document.createElement('span');
      wind.dataset.testid = 'forecast-wind';
      wind.textContent = hour.wind === null ? 'Wind: Not available' : `Wind: ${new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(hour.wind)} km/h`;
      row.append(time, icon, temperature, description, precipitation, wind);
      list.append(row);
    }
    if (hours.length < 24) note.textContent = `Only ${hours.length} of 24 forecast hours are available. Missing hours have not been filled in.`;
    else if (forecast.incomplete) note.textContent = 'Some hourly details are unavailable. Showing the data provided.';
  }
  return { clear, render, updateTemperatures };
}
