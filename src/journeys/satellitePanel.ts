import { SATELLITE_LAYERS, buildSatelliteImageryURL, satelliteDateBounds } from '../services/satelliteImagery.ts';

export function initSatellitePanel() {
  const form = document.querySelector<HTMLFormElement>('#sat-form');
  if (!form) return;
  const date = document.querySelector<HTMLInputElement>('#sat-date')!;
  const latitude = document.querySelector<HTMLInputElement>('#time-lat')!;
  const longitude = document.querySelector<HTMLInputElement>('#time-lon')!;
  const status = document.querySelector<HTMLElement>('#sat-status')!;
  const figure = document.querySelector<HTMLElement>('#sat-figure')!;
  const caption = document.querySelector<HTMLElement>('#sat-caption')!;
  const layer = SATELLITE_LAYERS[0], bounds = satelliteDateBounds();
  date.min = bounds.minimum; date.max = bounds.maximum; date.value = bounds.defaultDate;
  document.querySelector<HTMLElement>('#sat-attribution')!.textContent = layer.attribution;
  document.querySelector<HTMLElement>('#sat-limitations')!.textContent = layer.limitations;
  let generation = 0, timer: ReturnType<typeof setTimeout> | undefined;
  let image = document.querySelector<HTMLImageElement>('#sat-image')!;
  const stop = () => {
    if (timer) clearTimeout(timer);
    image.onload = null; image.onerror = null; image.removeAttribute('src');
  };
  form.addEventListener('submit', event => {
    event.preventDefault(); stop(); const current = ++generation; figure.hidden = true;
    date.removeAttribute('aria-invalid');
    try {
      const lat = latitude.valueAsNumber, lon = longitude.valueAsNumber, selectedDate = date.value;
      const url = buildSatelliteImageryURL({ latitude: lat, longitude: lon, date: selectedDate });
      status.textContent = 'Loading satellite image…';
      const next = document.createElement('img');
      next.id = 'sat-image'; next.dataset.testid = 'sat-image'; next.width = 800; next.height = 600;
      next.alt = `Daily satellite mosaic around latitude ${lat}, longitude ${lon} on ${selectedDate}.`;
      next.decoding = 'async'; next.referrerPolicy = 'no-referrer';
      const fail = () => {
        if (current !== generation) return;
        stop(); figure.hidden = true;
        status.textContent = 'Satellite image unavailable for this date or place. Try another date.';
      };
      next.onload = () => {
        if (current !== generation) return;
        if (timer) clearTimeout(timer);
        caption.textContent = `${selectedDate} — ${layer.name}`;
        status.textContent = `Satellite image loaded for ${selectedDate}.`; figure.hidden = false;
      };
      next.onerror = fail;
      image.replaceWith(next); image = next;
      timer = setTimeout(fail, 20000); image.src = url;
    } catch (error) {
      if (!date.value || date.value < date.min || date.value > date.max) date.setAttribute('aria-invalid', 'true');
      status.textContent = error instanceof Error ? error.message : 'Satellite image unavailable. Try another date.';
    }
  });
  addEventListener('pagehide', () => { generation++; stop(); figure.hidden = true; status.textContent = 'Choose a date and load satellite imagery.'; });
}
