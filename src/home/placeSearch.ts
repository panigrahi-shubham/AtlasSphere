export type Place = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  region: string;
};

export function validatePlaces(data: unknown): Place[] {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    "error" in data
  )
    throw new Error(
      "The search service returned incomplete data. Please try again.",
    );
  const results = "results" in data ? data.results : [];
  if (!Array.isArray(results))
    throw new Error(
      "The search service returned incomplete data. Please try again.",
    );
  return results.slice(0, 5).map((value: unknown) => {
    if (!value || typeof value !== "object")
      throw new Error("The search service returned an invalid place.");
    const p = value as Record<string, unknown>;
    if (
      typeof p.name !== "string" ||
      !p.name.trim() ||
      typeof p.latitude !== "number" ||
      !Number.isFinite(p.latitude) ||
      Math.abs(p.latitude) > 90 ||
      typeof p.longitude !== "number" ||
      !Number.isFinite(p.longitude) ||
      Math.abs(p.longitude) > 180
    )
      throw new Error("The search service returned an invalid place.");
    return {
      id: String(p.id ?? `${p.latitude},${p.longitude}`),
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      country:
        typeof p.country === "string" ? p.country : "Country unavailable",
      region: typeof p.admin1 === "string" ? p.admin1 : "",
    };
  });
}

export async function findPlaces(
  term: string,
  signal: AbortSignal,
): Promise<Place[]> {
  if (Array.from(term.trim()).length < 2 || Array.from(term.trim()).length > 80)
    throw new Error("Enter between 2 and 80 characters.");
  const response = await fetch(
    `/api/v1/geocode?${new URLSearchParams({ q: term.trim() })}`,
    { signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]) },
  );
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "Search is busy. Please wait a moment and try again."
        : "Places could not be loaded. Please try again.",
    );
  return validatePlaces(await response.json());
}

export function explorerLink(
  place: Pick<Place, "name" | "latitude" | "longitude" | "country">,
) {
  return `/explore.html?${new URLSearchParams({ place: place.name, lat: String(place.latitude), lon: String(place.longitude), country: place.country })}#selection`;
}
