import { isTimezone, localTime } from '../utils/time.js';

const availableText = value => typeof value === 'string' && value.trim() ? value : 'Not available';
export function initGeographyDetails() {
  const section = document.querySelector('#geography-section');
  let clock;
  const text = (id, value) => { document.getElementById(id).textContent = value; };
  function clear() { clearInterval(clock); section.hidden = true; }
  function setTimezone(timezone) {
    clearInterval(clock);
    const valid = isTimezone(timezone);
    text('geo-timezone', valid ? timezone : 'Not available');
    const update = () => text('geo-local-time', valid ? localTime(timezone) : 'Not available');
    update();
    if (valid) clock = setInterval(update, 60000);
  }
  function render(city) {
    clear();
    text('latitude', Number.isFinite(city.latitude) ? `${city.latitude.toFixed(3)}°` : 'Not available');
    text('longitude', Number.isFinite(city.longitude) ? `${city.longitude.toFixed(3)}°` : 'Not available');
    text('geo-country', availableText(city.country));
    text('geo-region', availableText(city.region));
    text('elevation', Number.isFinite(city.elevation) ? `${Math.round(city.elevation)} m` : 'Not available');
    setTimezone(city.timezone);
    section.hidden = false;
  }
  return { clear, render, setTimezone };
}
