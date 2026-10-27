/** Browser permission flow only; native Capacitor permission handling is Phase 3. */
export function initLocation({ onSelect }) {
  const button = document.querySelector('#use-location');
  const status = document.querySelector('#location-status');
  let version = 0;
  function cancel() { version++; button.disabled = false; status.textContent = ''; }
  document.querySelector('#city').addEventListener('input', cancel);
  document.querySelector('#city-clear').addEventListener('click', cancel);
  button.addEventListener('click', () => {
    if (!navigator.geolocation) { status.textContent = 'Location is unavailable in this browser. Search for a city instead.'; return; }
    const token = ++version; button.disabled = true; status.textContent = 'Waiting for location permission…';
    navigator.geolocation.getCurrentPosition(position => {
      if (token !== version) return;
      button.disabled = false;
      const { latitude, longitude } = position.coords;
      if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180) { status.textContent = 'Location coordinates are unavailable. Search for a city instead.'; return; }
      onSelect({ id: `coordinates:${latitude},${longitude}`, name: 'Your location', latitude, longitude, country: null, region: null, elevation: null, timezone: null });
      status.textContent = 'Using device coordinates. A city name and country have not been reverse-geocoded.';
    }, error => {
      if (token !== version) return;
      button.disabled = false;
      status.textContent = error.code === 1 ? 'Location permission denied. Search for a city instead.' : error.code === 3 ? 'Location request timed out. Search for a city instead.' : 'Unable to determine your location. Search for a city instead.';
    }, { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false });
  });
  return { cancel };
}
