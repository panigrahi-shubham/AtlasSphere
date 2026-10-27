import { getAdvancedForecast } from '../services/advancedForecast.js';
import { formatTemperature } from '../utils/temperature.js';
import { weatherCondition } from '../utils/weatherCodes.js';

const svgNS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs) => { const el = document.createElementNS(svgNS, tag); for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v); return el; };
export function initAdvancedForecast({ getUnit }) {
  const panel = document.querySelector('#advanced-section');
  const status = document.querySelector('#advanced-status');
  const load = document.querySelector('#advanced-load');
  const chart = document.querySelector('#weather-chart');
  const metric = document.querySelector('#chart-metric');
  const rows = document.querySelector('#daily-forecast');
  let city, data, controller, version = 0;
  const number = (value, suffix) => value === null ? 'Not available' : `${value} ${suffix}`;
  function render() {
    if (!data) return;
    rows.replaceChildren();
    const date = time => new Intl.DateTimeFormat('en', { timeZone: data.timezone, weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(time * 1000));
    const clock = time => time === null ? 'Not available' : new Intl.DateTimeFormat('en', { timeZone: data.timezone, hour: '2-digit', minute: '2-digit' }).format(new Date(time * 1000));
    const first = data.days[0];
    for (const [id, value] of Object.entries({ 'dashboard-high': formatTemperature(first.max, getUnit()), 'dashboard-low': formatTemperature(first.min, getUnit()), 'dashboard-uv': number(first.uv, ''), 'dashboard-sunrise': clock(first.sunrise), 'dashboard-sunset': clock(first.sunset) })) document.getElementById(id).textContent = value;
    for (const day of data.days) {
      const row = document.createElement('tr'); row.dataset.testid = 'daily-row';
      for (const value of [date(day.time), weatherCondition(day.code).description, formatTemperature(day.max, getUnit()), formatTemperature(day.min, getUnit()), number(day.rain, '%'), number(day.precipitation, 'mm'), number(day.wind, 'km/h'), number(day.uv, ''), clock(day.sunrise), clock(day.sunset)]) {
        const cell = document.createElement('td'); cell.textContent = value; row.append(cell);
      }
      rows.append(row);
    }
    document.querySelector('#advanced-results').hidden = false;
    chart.replaceChildren();
    const temperature = metric.value === 'temperature';
    const unit = temperature ? (getUnit() === 'fahrenheit' ? '°F' : '°C') : metric.value === 'rain' ? '%' : 'km/h';
    const convert = n => n === null ? null : temperature && getUnit() === 'fahrenheit' ? n * 9 / 5 + 32 : n;
    const values = data.days.map(d => convert(temperature ? d.max : d[metric.value]));
    const valid = values.filter(Number.isFinite);
    const label = `${metric.selectedOptions[0].textContent} (${unit}) · ${data.timezone}`;
    document.querySelector('#chart-caption').textContent = label;
    const title = svgEl('title', {}); title.textContent = label; chart.append(title);
    if (!valid.length) { status.textContent = 'No chart values available. See the forecast table for other measurements.'; return; }
    const bottom = Math.min(0, ...valid), top = Math.max(bottom + 1, ...valid);
    for (let i = 0; i < 4; i++) {
      const y = 30 + i * 60;
      chart.append(svgEl('line', { x1: 60, x2: 740, y1: y, y2: y, stroke: '#33516a' }));
      const tick = svgEl('text', { x: 8, y: y + 4, fill: '#bfd3e3', 'font-size': 12 }); tick.textContent = Math.round(top - (top - bottom) * i / 3); chart.append(tick);
    }
    let segment = [];
    const flush = () => { if (segment.length > 1) chart.append(svgEl('polyline', { points: segment.join(' '), fill: 'none', stroke: '#77e5d3', 'stroke-width': 3 })); segment = []; };
    values.forEach((v, i) => {
      const x = 80 + i * 100;
      const tick = svgEl('text', { x, y: 240, fill: '#bfd3e3', 'font-size': 11, 'text-anchor': 'middle' }); tick.textContent = date(data.days[i].time); chart.append(tick);
      if (v === null) { flush(); return; }
      const y = 210 - (v - bottom) / (top - bottom) * 180;
      segment.push(`${x},${y}`);
      const point = svgEl('circle', { cx: x, cy: y, r: 5, fill: '#77e5d3' });
      const tooltip = svgEl('title', {}); tooltip.textContent = `${date(data.days[i].time)}: ${Math.round(v * 10) / 10} ${unit}`; point.append(tooltip); chart.append(point);
    }); flush();
  }
  async function fetchForecast() {
    if (!city) return;
    controller?.abort(); controller = new AbortController(); const token = ++version;
    load.disabled = true; panel.setAttribute('aria-busy', 'true'); status.textContent = 'Loading seven-day forecast…';
    try {
      const result = await getAdvancedForecast(city, { signal: controller.signal });
      if (token !== version) return;
      data = result; status.textContent = `${data.days.length} forecast days · ${data.timezone}. Forecast confidence decreases further ahead.`; render();
    } catch (error) { if (token === version && error.name !== 'AbortError') status.textContent = `${error.message}${data ? ' Showing the previous forecast.' : ''}`; }
    finally { if (token === version) { load.disabled = false; load.textContent = data ? 'Refresh seven-day forecast' : 'Load seven-day forecast'; panel.setAttribute('aria-busy', 'false'); } }
  }
  load.addEventListener('click', fetchForecast); metric.addEventListener('change', render);
  function clear() { for (const id of ['dashboard-high','dashboard-low','dashboard-uv','dashboard-sunrise','dashboard-sunset']) document.getElementById(id).textContent = 'Not loaded'; ++version; controller?.abort(); data = null; city = null; panel.hidden = true; rows.replaceChildren(); chart.replaceChildren(); document.querySelector('#advanced-results').hidden = true; load.disabled = false; panel.setAttribute('aria-busy', 'false'); }
  return { clear, select(location) { clear(); city = location; panel.hidden = false; load.textContent = 'Load seven-day forecast'; status.textContent = 'Load an extended forecast when you need it. Current weather uses a separate request.'; }, updateTemperatures: render };
}
