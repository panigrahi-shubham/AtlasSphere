// Heavy map data and Three.js stay out of the initial city-search bundle.
export function initExploration({ onOpen }) {
  const button = document.querySelector('#atlas-load');
  const status = document.querySelector('#atlas-status');
  let atlas, city, weather;
  async function openAtlas() {
    button.disabled = true; status.textContent = 'Opening the world atlas…';
    try {
      if (!atlas) {
        const { createAtlas } = await import('./worldAtlas.js');
        atlas = createAtlas({ onOpen });
      }
      document.querySelector('#atlas-content').hidden = false;
      if (city) { atlas.selectCity(city); if (weather) atlas.setWeather(weather, city); }
      status.textContent = 'Atlas ready. Choose a country on the map or use the country directory.';
      button.hidden = true;
      return true;
    } catch { status.textContent = 'Unable to open the atlas. Please try again.'; }
    finally { button.disabled = false; }
    return false;
  }
  button.addEventListener('click', openAtlas);
  for (const link of document.querySelectorAll('.sky-discovery-card, [data-testid="featured-atlas-link"]')) {
    link.addEventListener('click', async event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target || target.id === 'atlas-section') return;
      event.preventDefault();
      if (await openAtlas()) {
        history.replaceState(null, '', `#${target.id}`);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
  return {
    select(location) { city = location; weather = null; atlas?.selectCity(location); },
    clear() { city = null; weather = null; atlas?.clearSelection(); },
    invalidateWeather() { weather = null; atlas?.clearWeather(); },
    weather(data, location) { weather = data; atlas?.setWeather(data, location); }
  };
}
