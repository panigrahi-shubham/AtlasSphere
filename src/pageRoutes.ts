/** Exact public route allowlist shared by Vite, Express and the static renderer. */
import { planets } from "./home/universe/planets.ts";
export const discoveryPages = [
  {
    route: "/universe/planets",
    file: "planets.html",
    title: "Planet directory",
    description:
      "Discover eight planets with sourced facts, photographs, search and classification filters.",
  },
  {
    route: "/universe/compare",
    file: "planet-comparison.html",
    title: "Compare planets",
    description:
      "Compare planet sizes, masses, gravity, orbits, rotation and temperatures with NASA reference data.",
  },
  ...planets.map((p) => ({
    route: `/universe/planets/${p.slug}`,
    file: `planet-${p.slug}.html`,
    title: p.name,
    description: `${p.story} Explore ${p.name}'s atmosphere, measurements, missions and scientific references.`,
  })),
  {
    route: "/universe/solar-system",
    file: "solar-system.html",
    title: "The Solar System",
    description:
      "Explore eight planets in an accessible 3D model with an adjustable educational clock, planet selection and NASA reference facts.",
  },
];
