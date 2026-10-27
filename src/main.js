import { initCitySearch } from './components/citySearch.js';
import { initCurrentWeather } from './components/currentWeather.js';
import { initHourlyForecast } from './components/hourlyForecast.js';
import { initGeographyDetails } from './components/geographyDetails.js';
import { initTemperatureUnits } from './components/temperatureUnits.js';
import { initFavorites } from './components/favorites.js';
import { initConnectionStatus } from './components/connectionStatus.js';
import { initBugMode, practiceStorageKey } from './dev/bugMode.js';
import { initAdvancedForecast } from './components/advancedForecast.js';
import { initExploration } from './components/exploration.js';
import { initAppearance } from './components/appearance.ts';
import { initNews } from './components/news.ts';
import { initLocation } from './components/location.ts';
import { initAccount } from './components/account.ts';

document.querySelector('[data-testid="skip-to-search"]')?.addEventListener('click', event => {
  const search = document.querySelector('#city');
  if (search instanceof HTMLElement) { event.preventDefault(); search.focus(); }
});

initBugMode();
initConnectionStatus();
initNews();
initAccount();
const appearance = initAppearance();
let location;

const selection = document.querySelector('#selection');
const units = initTemperatureUnits({
  onChange() { weather.updateTemperatures(); hourly.updateTemperatures(); advanced.updateTemperatures(); }
});
const advanced = initAdvancedForecast({ getUnit: units.getUnit });
const explorer = initExploration({ onOpen(city) { search.reset(); showCity(city); } });
const hourly = initHourlyForecast({ getUnit: units.getUnit });
const geography = initGeographyDetails();
const weather = initCurrentWeather({
  getUnit: units.getUnit,
  onClear() { hourly.clear(); explorer.invalidateWeather(); appearance.clear(); },
  onLoaded(data, city) { hourly.render(data.forecast, data.timezone); geography.setTimezone(data.timezone); explorer.weather(data, city); appearance.weather(data); }
});
const favorites = initFavorites({
  onOpen(city) {
    search.reset();
    document.querySelector('#city').value = city.name;
    document.querySelector('#search-status').textContent = `Opened saved location: ${city.name}.`;
    showCity(city);
  }
});
function showCity(city) {
  location?.cancel();
  document.querySelector('#home-weather-empty').hidden = true;
  document.querySelector('#selected-city').textContent = city.name;
  document.querySelector('#selected-country').textContent = city.country ?? 'Country unavailable';
  document.querySelector('#selected-region').textContent = city.region ?? 'Region unavailable';
  selection.hidden = false;
  document.querySelector('#selected-city').focus();
  favorites.select(city);
  geography.render(city);
  advanced.select(city);
  explorer.select(city);
  void weather.load(city);
}
const search = initCitySearch({
  onReset() {
    location?.cancel();
    document.querySelector('#home-weather-empty').hidden = false;
    selection.hidden = true; weather.clear(); geography.clear(); favorites.clearSelection(); advanced.clear(); explorer.clear();
  },
  onSelect: showCity
});
location = initLocation({ onSelect(city) { search.reset(); showCity(city); } });

// The homepage preview reads the same local GeoGuess scoreboard as the game.
try {
  const saved = JSON.parse(localStorage.getItem(practiceStorageKey('earthscope.geoguess.v1')));
  const pin = Number.isFinite(saved?.best?.landmark) ? saved.best.landmark : 0;
  const outline = Number.isFinite(saved?.best?.outline) ? saved.best.outline : 0;
  if (pin || outline) document.querySelector('#home-guess-best').textContent = `Your best: Landmark Pin ${pin.toLocaleString()} · Country Outline ${outline.toLocaleString()}`;
} catch { /* Local storage is optional. */ }


