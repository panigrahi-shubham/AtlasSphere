export type Planet = {
  slug: string;
  name: string;
  kind: "Terrestrial" | "Gas giant" | "Ice giant";
  color: string;
  diameter: number;
  mass: number;
  gravity: number;
  distance: number;
  orbit: number;
  rotation: number;
  temperature: number;
  moons: number;
  rings: boolean;
  atmosphere: string;
  story: string;
  features: string;
  missions: string;
  image: string;
  alt: string;
  credit: string;
  source: string;
};
export const factSource = "https://nssdc.gsfc.nasa.gov/planetary/factsheet/";
export const factNotes =
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/fact_notes.html";
export const verifiedAt = "2026-10-28";
// NASA NSSDCA metric table (18 March 2025 edition), checked on the date above.
// These are reference snapshots, not current observations or ephemerides.
export const planets: Planet[] = [
  {
    slug: "mercury",
    name: "Mercury",
    kind: "Terrestrial",
    color: "#c3b4a1",
    diameter: 4879,
    mass: 0.33,
    gravity: 3.7,
    distance: 57.9,
    orbit: 88,
    rotation: 1407.6,
    temperature: 167,
    moons: 0,
    rings: false,
    atmosphere: "A very thin exosphere, rather than a substantial atmosphere.",
    story: "Small world. Dramatic extremes.",
    features:
      "A heavily cratered surface preserves impacts. With almost no atmosphere to retain heat, temperatures change sharply between day and night.",
    missions: "Mariner 10 and MESSENGER mapped this rocky world.",
    image: "/images/planets/mercury.webp",
    alt: "MESSENGER view of Mercury with the bright rays of Debussy crater",
    credit: "NASA / Johns Hopkins APL / Carnegie Institution of Washington",
    source: "https://science.nasa.gov/mercury/facts/",
  },
  {
    slug: "venus",
    name: "Venus",
    kind: "Terrestrial",
    color: "#e6c189",
    diameter: 12104,
    mass: 4.87,
    gravity: 8.9,
    distance: 108.2,
    orbit: 224.7,
    rotation: -5832.5,
    temperature: 464,
    moons: 0,
    rings: false,
    atmosphere: "Dense carbon dioxide, with clouds of sulfuric acid.",
    story: "A world behind the clouds.",
    features:
      "A strong greenhouse effect makes Venus hotter than Mercury. Its slow retrograde spin means that rotation and the solar day are very different measurements.",
    missions:
      "Mariner 10 photographed its clouds; Magellan used radar to reveal its surface.",
    image: "/images/planets/venus.webp",
    alt: "Mariner 10 view of the cloud-covered planet Venus",
    credit: "NASA / JPL-Caltech",
    source: "https://science.nasa.gov/venus/venus-facts/",
  },
  {
    slug: "earth",
    name: "Earth",
    kind: "Terrestrial",
    color: "#65bcda",
    diameter: 12756,
    mass: 5.97,
    gravity: 9.8,
    distance: 149.6,
    orbit: 365.2,
    rotation: 23.9,
    temperature: 15,
    moons: 1,
    rings: false,
    atmosphere: "Mostly nitrogen and oxygen.",
    story: "Our extraordinary home.",
    features:
      "Liquid oceans, an active crust and an atmosphere support the only life we have confirmed. An axial tilt produces opposite seasons in the two hemispheres.",
    missions:
      "Earth-observing missions including Terra and Suomi NPP study our changing planet.",
    image: "/images/earth-space/earth-hero.webp",
    alt: "NASA Blue Marble historical composite of Earth",
    credit: "NASA / NOAA · Blue Marble 2012",
    source: "https://science.nasa.gov/earth/facts/",
  },
  {
    slug: "mars",
    name: "Mars",
    kind: "Terrestrial",
    color: "#e18b65",
    diameter: 6792,
    mass: 0.642,
    gravity: 3.7,
    distance: 228,
    orbit: 687,
    rotation: 24.6,
    temperature: -65,
    moons: 2,
    rings: false,
    atmosphere: "Thin atmosphere, predominantly carbon dioxide.",
    story: "Follow the traces of water.",
    features:
      "Iron-bearing dust gives Mars its red appearance. Ancient valleys and minerals preserve evidence of wetter conditions; today it is a cold desert.",
    missions:
      "Curiosity and Perseverance explore the surface; Mars Reconnaissance Orbiter studies it from above.",
    image: "/images/planets/mars.webp",
    alt: "Curiosity rover view of a Martian dune after crossing it, with wheel tracks visible",
    credit: "NASA / JPL-Caltech / MSSS · Curiosity",
    source: "https://science.nasa.gov/mars/facts/",
  },
  {
    slug: "jupiter",
    name: "Jupiter",
    kind: "Gas giant",
    color: "#ddb599",
    diameter: 142984,
    mass: 1898,
    gravity: 23.1,
    distance: 778.5,
    orbit: 4331,
    rotation: 9.9,
    temperature: -110,
    moons: 95,
    rings: true,
    atmosphere: "Predominantly hydrogen and helium, with visible cloud bands.",
    story: "Weather on a colossal scale.",
    features:
      "The largest planet has no solid surface like Earth. Its bands and Great Red Spot reveal a turbulent atmosphere above a deep, high-pressure interior.",
    missions:
      "Galileo orbited Jupiter; Juno investigates its atmosphere and interior.",
    image: "/images/planets/jupiter.webp",
    alt: "Enhanced-color Voyager image of Jupiter with cloud bands and the Great Red Spot",
    credit: "NASA / JPL / USGS · Voyager, 1979; processed 1990",
    source: "https://science.nasa.gov/jupiter/jupiter-facts/",
  },
  {
    slug: "saturn",
    name: "Saturn",
    kind: "Gas giant",
    color: "#e8ce96",
    diameter: 120536,
    mass: 568,
    gravity: 9,
    distance: 1432,
    orbit: 10747,
    rotation: 10.7,
    temperature: -140,
    moons: 274,
    rings: true,
    atmosphere: "Mostly hydrogen and helium.",
    story: "A planet framed in ice.",
    features:
      "Saturn’s bright rings contain countless pieces of ice and rock. Its moons include Titan, with methane lakes, and Enceladus, which ejects material from a subsurface ocean.",
    missions:
      "Cassini orbited Saturn from 2004 to 2017; Huygens landed on Titan.",
    image: "/images/earth-space/saturn.webp",
    alt: "Cassini view of Saturn and its main rings",
    credit: "NASA / JPL-Caltech / Space Science Institute",
    source: "https://science.nasa.gov/saturn/facts/",
  },
  {
    slug: "uranus",
    name: "Uranus",
    kind: "Ice giant",
    color: "#9bdcdd",
    diameter: 51118,
    mass: 86.8,
    gravity: 8.7,
    distance: 2867,
    orbit: 30589,
    rotation: -17.2,
    temperature: -195,
    moons: 28,
    rings: true,
    atmosphere: "Hydrogen, helium and methane.",
    story: "A world tipped on its side.",
    features:
      "Uranus has an extreme axial tilt and long polar seasons. Methane absorbs red light in its atmosphere, contributing to its blue-green appearance.",
    missions: "Voyager 2 flew past Uranus in 1986.",
    image: "/images/planets/uranus.webp",
    alt: "Voyager 2 view of the pale blue-green disk of Uranus",
    credit: "NASA / JPL-Caltech",
    source: "https://science.nasa.gov/uranus/facts/",
  },
  {
    slug: "neptune",
    name: "Neptune",
    kind: "Ice giant",
    color: "#719ee4",
    diameter: 49528,
    mass: 102,
    gravity: 11,
    distance: 4515,
    orbit: 59800,
    rotation: 16.1,
    temperature: -200,
    moons: 16,
    rings: true,
    atmosphere: "Hydrogen, helium and methane.",
    story: "At the edge of the planetary realm.",
    features:
      "Very far from the Sun, Neptune is a cold, windy world. Mathematical predictions helped astronomers locate it in 1846. Triton is its largest moon.",
    missions: "Voyager 2 flew past Neptune in 1989.",
    image: "/images/planets/neptune.webp",
    alt: "Historical Voyager 2 full-disk image of Neptune, with enhanced blue color",
    credit: "NASA / JPL-Caltech",
    source: "https://science.nasa.gov/neptune/neptune-facts/",
  },
];

export function findPlanet(slug: string | undefined) {
  return planets.find((p) => p.slug === slug);
}
/** Circular, coplanar teaching model; angular offsets are illustrative, never an ephemeris. */
export function orbitalAngle(days: number, period: number): number {
  return ((days % period) / period) * Math.PI * 2;
}
export function modelPosition(index: number, days: number) {
  const planet = planets[index];
  const radius = 3.5 + index * 2.5;
  const angle = orbitalAngle(days, planet.orbit) + index * 0.85;
  return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
}
