export function isTimezone(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try { new Intl.DateTimeFormat('en', { timeZone: value }).format(); return true; }
  catch { return false; }
}

export function localTime(timezone, date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone, dateStyle: 'medium', timeStyle: 'short'
  }).format(date);
}

export function forecastTime(timestamp, timezone) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone, day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset'
  }).format(new Date(timestamp * 1000));
}
