import { bugEnabled } from '../dev/bugMode.js';
export function formatTemperature(celsius, unit = 'celsius') {
  if (!Number.isFinite(celsius)) return 'Not available';
  const value = unit === 'fahrenheit' ? celsius * 9 / 5 + (bugEnabled('TEMP-001') ? 0 : 32) : celsius;
  return `${Math.round(value)}°${unit === 'fahrenheit' ? 'F' : 'C'}`;
}
