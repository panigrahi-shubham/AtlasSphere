/**
 * Feature: Geographic search
 * Layer: Unit — Vitest
 * Real: Imported application modules
 * Mocked: Fixture inputs and test-supplied dependencies
 * Guards: Regressions in geographic search; negative cases remain explicit below
 * Run: npm run test:home:unit
 * Needs: Node.js 24
 */
import { describe, expect, it, vi } from "vitest";
import { explorerLink, findPlaces, validatePlaces } from "./placeSearch";
import { readExplorerPlace } from "../utils/explorerEntry";
describe("geographic search boundaries", () => {
  it("keeps valid zero coordinates and labels missing country metadata", () => {
    expect(
      validatePlaces({
        results: [{ name: "Null Island", latitude: 0, longitude: 0 }],
      })[0],
    ).toMatchObject({
      latitude: 0,
      longitude: 0,
      country: "Country unavailable",
    });
    expect(validatePlaces({})).toEqual([]);
  });
  it("rejects malformed service responses and invalid coordinates", () => {
    for (const value of [
      null,
      [],
      { error: true },
      { results: {} },
      { results: [{ name: "Bad", latitude: 91, longitude: 0 }] },
    ])
      expect(() => validatePlaces(value)).toThrow();
  });
  it("makes a validated round trip into the preserved explorer", () => {
    const place = {
      name: "Zürich & Lake",
      latitude: 47.37,
      longitude: 8.54,
      country: "Switzerland",
    };
    expect(
      readExplorerPlace(
        new URL(explorerLink(place), "https://example.test").search,
      ),
    ).toMatchObject(place);
    for (const query of [
      "?place=Bad&lat=91&lon=0",
      "?place=Bad&lat=&lon=0",
      "?place=Bad&lat=0",
      "?place=Bad&lat=0&lon=Infinity",
    ])
      expect(readExplorerPlace(query)).toBeNull();
  });
  it("does not issue an upstream request for a short or excessive query", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch");
    await expect(
      findPlaces("a", new AbortController().signal),
    ).rejects.toThrow();
    await expect(
      findPlaces("a".repeat(81), new AbortController().signal),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
    fetcher.mockRestore();
  });
  it("turns rate limits into an actionable message without an automatic retry", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 429 }));
    await expect(
      findPlaces("Delhi", new AbortController().signal),
    ).rejects.toThrow("wait a moment");
    expect(fetcher).toHaveBeenCalledOnce();
    fetcher.mockRestore();
  });
});
