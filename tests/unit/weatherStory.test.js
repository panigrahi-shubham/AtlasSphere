import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weatherStory } from '../../src/utils/weatherStory.ts';
test('weather story describes validated current metrics without inventing a future forecast', () => {
  const story = weatherStory({ condition: 'rain', humidity: 80, wind: 5 });
  assert.match(story, /Rain.*humid air.*light winds/); assert.doesNotMatch(story, /after|tomorrow|umbrella/);
});
test('weather story ignores absent or physically invalid secondary metrics', () => {
  assert.equal(weatherStory({ condition: 'unknown', humidity: null, wind: null }), 'Explore the current conditions. Based on the current weather report.');
  assert.doesNotMatch(weatherStory({ condition: 'clear', humidity: 110, wind: -1 }), /humid|winds|breeze/);
});
