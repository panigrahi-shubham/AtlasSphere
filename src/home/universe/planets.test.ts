import { describe, it, expect } from "vitest";
import { planets, orbitalAngle, modelPosition } from "./planets";
describe("NASA snapshot and educational orbit contract", () => {
  it("contains eight ordered, uniquely addressable planets with valid reference values", () => {
    expect(planets.map((p) => p.slug)).toEqual([
      "mercury",
      "venus",
      "earth",
      "mars",
      "jupiter",
      "saturn",
      "uranus",
      "neptune",
    ]);
    for (const [i, p] of planets.entries()) {
      expect(p.diameter).toBeGreaterThan(0);
      expect(p.mass).toBeGreaterThan(0);
      expect(p.orbit).toBeGreaterThan(0);
      expect(p.source).toMatch(/^https:\/\/science.nasa.gov\//);
      if (i) expect(p.distance).toBeGreaterThan(planets[i - 1].distance);
    }
    expect(planets[1].rotation).toBeLessThan(0);
    expect(planets[6].rotation).toBeLessThan(0);
  });
  it("returns to the starting position after one sidereal period", () => {
    expect(orbitalAngle(365.2, 365.2)).toBe(0);
    expect(modelPosition(2, 365.2)).toEqual(modelPosition(2, 0));
    expect(orbitalAngle(44, 88)).toBeCloseTo(Math.PI);
  });
});
