// WMO descriptions: https://open-meteo.com/en/docs#weathervariables
const descriptions = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Light freezing rain', 67: 'Heavy freezing rain',
  71: 'Slight snowfall', 73: 'Moderate snowfall', 75: 'Heavy snowfall', 77: 'Snow grains',
  80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail',
  97: 'Heavy thunderstorm', 99: 'Thunderstorm with heavy hail'
};

export function weatherCondition(code, isDay) {
  const description = descriptions[code] ?? 'Weather conditions unavailable';
  let icon = '?';
  if (code === 0 || code === 1) icon = isDay === 0 ? '☾' : isDay === 1 ? '☀' : '◌';
  else if (code === 2 || code === 3) icon = '☁';
  else if (code === 45 || code === 48) icon = '≋';
  else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) icon = '🌧';
  else if ((code >= 71 && code <= 77) || code === 85 || code === 86) icon = '❄';
  else if (code >= 95 && code <= 99) icon = '⛈';
  if (!Object.hasOwn(descriptions, code)) icon = '?';
  return { description, icon };
}
