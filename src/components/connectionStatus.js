export function initConnectionStatus() {
  const banner = document.querySelector('#connection-status');
  function update(restored = false) {
    const offline = !navigator.onLine;
    banner.hidden = !offline && !restored;
    banner.textContent = offline
      ? 'You appear to be offline. Displayed weather is a previous snapshot. Reconnect and refresh for new data.'
      : 'Connection restored. Search or refresh weather when you are ready.';
  }
  update();
  window.addEventListener('offline', () => update());
  window.addEventListener('online', () => update(true));
}
