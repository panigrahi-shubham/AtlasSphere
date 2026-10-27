const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;
const buckets = {
  minute: { values: [] as number[], head: 0, duration: minute, limit: 550 },
  hour: { values: [] as number[], head: 0, duration: hour, limit: 4_500 },
  day: { values: [] as number[], head: 0, duration: day, limit: 9_000 }
};

function count(bucket: typeof buckets.minute, now: number) {
  while (bucket.head < bucket.values.length && now - bucket.values[bucket.head] >= bucket.duration) bucket.head++;
  if (bucket.head > 512 && bucket.head * 2 > bucket.values.length) {
    bucket.values = bucket.values.slice(bucket.head);
    bucket.head = 0;
  }
  return bucket.values.length - bucket.head;
}

/** Reserve one upstream call while staying below Open-Meteo's free tier limits. */
export function reserveOpenMeteoCall(now = Date.now()): boolean {
  const daily = count(buckets.day, now);
  const hourly = count(buckets.hour, now);
  const minutely = count(buckets.minute, now);
  if (daily >= 9_000 || hourly >= 4_500 || minutely >= 550) return false;
  buckets.minute.values.push(now);
  buckets.hour.values.push(now);
  buckets.day.values.push(now);
  return true;
}

export function clearOpenMeteoBudgetForTest() {
  for (const bucket of Object.values(buckets)) { bucket.values.length = 0; bucket.head = 0; }
}
