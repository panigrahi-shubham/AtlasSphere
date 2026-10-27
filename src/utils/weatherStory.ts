export function weatherStory({ condition, humidity, wind }) {
  const known = ['clear', 'cloudy', 'fog', 'snow', 'storm', 'rain'].includes(condition);
  const parts = [known ? `${condition[0].toUpperCase() + condition.slice(1)} conditions at your destination` : 'Explore the current conditions'];
  if (Number.isFinite(humidity) && humidity >= 75 && humidity <= 100) parts.push('humid air');
  if (Number.isFinite(wind) && wind >= 0) parts.push(wind >= 30 ? 'brisk winds' : wind < 10 ? 'light winds' : 'a steady breeze');
  return `${parts.join(' · ')}. Based on the current weather report.`;
}
