/**
 * Feature: weather Story
 * Layer: Unit — node:test
 * Real: Imported application modules
 * Mocked: Fixture inputs and test-supplied dependencies
 * Guards: Regressions in weather story; negative cases remain explicit below
 * Run: npm test
 * Needs: Node.js 24
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weatherStory } from '../../src/utils/weatherStory.ts';
// Risk: A current snapshot could be described as a future prediction.
// Given validated current metrics, When a weather story is built, Then it describes observed model values without inventing a forecast.
test('weather story describes validated current metrics without inventing a future forecast', () => {
  const story = weatherStory({ condition: 'rain', humidity: 80, wind: 5 });
  assert.match(story, /Rain.*humid air.*light winds/); assert.doesNotMatch(story, /after|tomorrow|umbrella/);
});
// Risk: Missing or impossible readings could appear in editorial weather text.
// Given invalid secondary metrics, When the story is built, Then those details are omitted.
test('weather story ignores absent or physically invalid secondary metrics', () => {
  assert.equal(weatherStory({ condition: 'unknown', humidity: null, wind: null }), 'Explore the current conditions. Based on the current weather report.');
  assert.doesNotMatch(weatherStory({ condition: 'clear', humidity: 110, wind: -1 }), /humid|winds|breeze/);
});
