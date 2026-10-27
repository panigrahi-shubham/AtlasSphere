// Deterministic example response, used only by automated tests.
export const currentWeatherFixture = {
  timezone: 'Asia/Kolkata',
  current_units: {
    time: 'unixtime', interval: 'seconds', temperature_2m: '°C',
    apparent_temperature: '°C', relative_humidity_2m: '%',
    weather_code: 'wmo code', wind_speed_10m: 'km/h', precipitation: 'mm', is_day: ''
  },
  current: {
    time: 1792997100, interval: 900, temperature_2m: 24.4,
    apparent_temperature: 26.1, relative_humidity_2m: 64,
    weather_code: 2, wind_speed_10m: 8.5, precipitation: 0, is_day: 1
  }
};

currentWeatherFixture.hourly_units = {
  time: 'unixtime', temperature_2m: '°C', weather_code: 'wmo code',
  precipitation_probability: '%', wind_speed_10m: 'km/h', is_day: ''
};
currentWeatherFixture.hourly = {
  time: Array.from({ length: 25 }, (_, i) => currentWeatherFixture.current.time - 900 + i * 3600),
  temperature_2m: Array.from({ length: 25 }, (_, i) => 20 + i / 10),
  weather_code: Array(25).fill(2),
  precipitation_probability: Array(25).fill(0),
  wind_speed_10m: Array(25).fill(8.5),
  is_day: Array.from({ length: 25 }, (_, i) => i < 6 || i > 18 ? 1 : 0)
};
