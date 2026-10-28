/** Curated educational summaries. References checked 2026-10-28; no live readings. */
export const scienceVerifiedAt = "2026-10-28";

export interface DiscoveryTopic {
  id: string;
  title: string;
  description: string;
  source: string;
  sourceLabel: string;
  image?: string;
  imageAlt?: string;
}

export interface AstronomyFact extends DiscoveryTopic {
  value: string;
  unit: string;
  label: string;
  approximate: boolean;
  verifiedAt: string;
}

export const scienceImages = {
  saturn: {
    src: "/images/earth-space/saturn.webp",
    small: "/images/earth-space/saturn-640.webp",
    width: 1600,
    height: 774,
    alt: "Saturn and its broad rings against black space, photographed by Cassini.",
    credit: "NASA/JPL/Space Science Institute",
    source: "https://science.nasa.gov/image-detail/amf-pia11141/",
  },
  nebula: {
    src: "/images/earth-space/nebula.webp",
    small: "/images/earth-space/nebula-640.webp",
    width: 1200,
    height: 1123,
    alt: "The Pillars of Creation: towering clouds of dust among stars, in a Webb infrared composite.",
    credit:
      "NASA, ESA, CSA, STScI; processing: J. DePasquale, A. Pagan, A. Koekemoer (STScI)",
    source:
      "https://science.nasa.gov/asset/webb/pillars-of-creation-nircam-and-miri-composite-image/",
    note: "Infrared observations mapped to visible colors; not a natural-color view.",
  },
};

export const universeCategories: DiscoveryTopic[] = [
  {
    id: "solar-system",
    title: "Solar System",
    description:
      "One star, eight planets, and a vast family of smaller worlds held together by gravity.",
    source: "https://science.nasa.gov/solar-system/solar-system-facts/",
    sourceLabel: "NASA Science",
    image: scienceImages.saturn.src,
    imageAlt: scienceImages.saturn.alt,
  },
  {
    id: "sun",
    title: "Sun",
    description:
      "Our nearest star powers its light and heat by fusing hydrogen into helium in its core.",
    source: "https://science.nasa.gov/sun/facts/",
    sourceLabel: "NASA Science",
  },
  {
    id: "planets",
    title: "Planets",
    description:
      "Rocky inner worlds, gas giants, and ice giants reveal different paths of planetary formation.",
    source: "https://science.nasa.gov/solar-system/planets/",
    sourceLabel: "NASA Science",
    image: scienceImages.saturn.src,
    imageAlt: scienceImages.saturn.alt,
  },
  {
    id: "moons",
    title: "Moons",
    description:
      "Natural satellites are worlds in their own right. Our Moon turns once for each orbit, keeping the same side toward Earth.",
    source: "https://science.nasa.gov/moon/facts/",
    sourceLabel: "NASA Science",
  },
  {
    id: "stars",
    title: "Stars",
    description:
      "Gravity gathers gas into stars. Their masses shape how brightly they shine and how their lives unfold.",
    source: "https://science.nasa.gov/universe/stars/",
    sourceLabel: "NASA Science",
    image: scienceImages.nebula.src,
    imageAlt: scienceImages.nebula.alt,
  },
  {
    id: "galaxies",
    title: "Galaxies",
    description:
      "Immense systems of stars, gas, dust, and dark matter form the universe’s galactic neighborhoods.",
    source: "https://science.nasa.gov/universe/galaxies/",
    sourceLabel: "NASA Science",
  },
  {
    id: "nebulae",
    title: "Nebulae",
    description:
      "Interstellar clouds of gas and dust can nurture new stars. Webb reveals this structure in infrared light.",
    source: scienceImages.nebula.source,
    sourceLabel: "NASA Webb",
    image: scienceImages.nebula.src,
    imageAlt: scienceImages.nebula.alt,
  },
  {
    id: "black-holes",
    title: "Black Holes",
    description:
      "Beyond a black hole’s event horizon, even light cannot escape. Nearby matter helps astronomers study these objects.",
    source: "https://science.nasa.gov/universe/black-holes/",
    sourceLabel: "NASA Science",
  },
  {
    id: "space-missions",
    title: "Space Missions",
    description:
      "Robotic explorers carry our questions outward. The Voyager spacecraft crossed the Sun’s heliosphere into interstellar space.",
    source: "https://science.nasa.gov/mission/voyager/",
    sourceLabel: "NASA Voyager",
  },
];

export const astronomyFacts: AstronomyFact[] = [
  {
    id: "earth",
    title: "Earth",
    value: "71",
    unit: "%",
    label: "surface covered by ocean",
    approximate: true,
    description:
      "A connected global ocean shapes our planet’s climate and landscapes.",
    source: "https://science.nasa.gov/earth/facts/",
    sourceLabel: "NASA Earth facts",
    verifiedAt: scienceVerifiedAt,
  },
  {
    id: "moon",
    title: "Moon",
    value: "384,400",
    unit: "km",
    label: "average distance from Earth",
    approximate: true,
    description:
      "The distance varies along the Moon’s orbit; this is an average, not a live measurement.",
    source: "https://science.nasa.gov/moon/facts/",
    sourceLabel: "NASA Moon facts",
    verifiedAt: scienceVerifiedAt,
  },
  {
    id: "mars",
    title: "Mars",
    value: "24.6",
    unit: "hours",
    label: "one rotation",
    approximate: true,
    description:
      "The red planet turns at a rate surprisingly close to Earth’s.",
    source: "https://science.nasa.gov/mars/facts/",
    sourceLabel: "NASA Mars facts",
    verifiedAt: scienceVerifiedAt,
  },
  {
    id: "jupiter",
    title: "Jupiter",
    value: "9.9",
    unit: "hours",
    label: "one rotation",
    approximate: true,
    description:
      "Our solar system’s largest planet has its shortest planetary day.",
    source: "https://science.nasa.gov/jupiter/jupiter-facts/",
    sourceLabel: "NASA Jupiter facts",
    verifiedAt: scienceVerifiedAt,
  },
  {
    id: "saturn",
    title: "Saturn",
    value: "29.4",
    unit: "Earth years",
    label: "one orbit around the Sun",
    approximate: true,
    description: "A Saturnian year spans almost three decades on Earth.",
    source: "https://science.nasa.gov/saturn/facts/",
    sourceLabel: "NASA Saturn facts",
    verifiedAt: scienceVerifiedAt,
  },
  {
    id: "sun",
    title: "Sun",
    value: "4.6",
    unit: "billion years",
    label: "estimated age",
    approximate: true,
    description: "The Sun formed from a collapsing cloud of gas and dust.",
    source: "https://science.nasa.gov/sun/facts/",
    sourceLabel: "NASA Sun facts",
    verifiedAt: scienceVerifiedAt,
  },
  {
    id: "milky-way",
    title: "Milky Way",
    value: ">100,000",
    unit: "light-years",
    label: "stellar disk span",
    approximate: true,
    description:
      "Our home galaxy is a spiral system. A light-year measures distance, not time.",
    source: "https://science.nasa.gov/universe/galaxies/",
    sourceLabel: "NASA Galaxies",
    verifiedAt: scienceVerifiedAt,
  },
];

export const earthScienceTopics: DiscoveryTopic[] = [
  {
    id: "plate-tectonics",
    title: "Plate tectonics",
    description:
      "Earth’s rigid outer shell is divided into slowly moving plates that reshape its surface.",
    source: "https://science.nasa.gov/earth/facts/",
    sourceLabel: "NASA Earth facts",
  },
  {
    id: "earthquakes",
    title: "Earthquakes",
    description:
      "A sudden slip along a fault releases energy that travels through the Earth as seismic waves.",
    source:
      "https://www.usgs.gov/faqs/what-earthquake-and-what-causes-them-happen",
    sourceLabel: "USGS Earthquake Hazards",
  },
  {
    id: "volcanoes",
    title: "Volcanoes",
    description:
      "Vents connect Earth’s surface to magma below, releasing lava, gases, and fragments of rock.",
    source: "https://www.usgs.gov/programs/VHP/about-volcanoes",
    sourceLabel: "USGS Volcano Hazards",
    image: "/images/fujisan.jpg",
    imageAlt:
      "Mount Fuji, a volcano in Japan, seen beyond a mountain landscape.",
  },
  {
    id: "earth-interior",
    title: "Earth’s interior",
    description:
      "Crust, mantle, liquid outer core, and solid inner core make up our planet’s layered interior.",
    source: "https://science.nasa.gov/earth/facts/",
    sourceLabel: "NASA Earth facts",
  },
  {
    id: "oceans",
    title: "Oceans",
    description:
      "Ocean currents redistribute heat, linking the tropics to higher latitudes and influencing climate.",
    source: "https://science.nasa.gov/earth/climate-change/ocean-and-climate/",
    sourceLabel: "NASA Earth science",
    image: "/images/great-barrier-reef.jpg",
    imageAlt: "The Great Barrier Reef and blue ocean photographed from orbit.",
  },
  {
    id: "atmosphere",
    title: "Atmosphere",
    description:
      "Near the surface, Earth’s air is mostly nitrogen and oxygen, with smaller amounts of other gases.",
    source: "https://science.nasa.gov/earth/facts/",
    sourceLabel: "NASA Earth facts",
  },
  {
    id: "climate-systems",
    title: "Climate systems",
    description:
      "Ocean and atmosphere continuously exchange heat and water, connecting changes across the planet.",
    source: "https://science.nasa.gov/earth/climate-change/ocean-and-climate/",
    sourceLabel: "NASA Earth science",
  },
];

export const historyTopics: DiscoveryTopic[] = [
  {
    id: "ancient-civilizations",
    title: "Ancient civilizations",
    description:
      "Memphis and its surrounding pyramid fields preserve the monuments of Egypt’s ancient capital.",
    source: "https://whc.unesco.org/en/list/86/",
    sourceLabel: "UNESCO World Heritage",
    image: "/images/pyramids-of-giza.jpg",
    imageAlt: "The pyramids of Giza standing on Egypt’s desert plateau.",
  },
  {
    id: "historical-geography",
    title: "Historical geography",
    description:
      "Waldseemüller’s 1507 map is the first known map to use the name America: a record of a changing European worldview.",
    source:
      "https://www.loc.gov/exhibits/exploring-the-early-americas/interactives/waldseemuller-maps/worldmap1507/highlights1507.html",
    sourceLabel: "Library of Congress",
  },
  {
    id: "major-explorations",
    title: "Major explorations",
    description:
      "Launched in 1977, Voyager 1 and 2 explored the outer planets before traveling beyond the heliosphere.",
    source: "https://science.nasa.gov/mission/voyager/",
    sourceLabel: "NASA Voyager",
  },
  {
    id: "historical-timelines",
    title: "Historical timelines",
    description:
      "Apollo 11 landed on the Moon on 20 July 1969 and returned its crew to Earth on 24 July.",
    source: "https://www.nasa.gov/mission/apollo-11/",
    sourceLabel: "NASA Apollo 11",
  },
  {
    id: "scientific-discoveries",
    title: "Scientific discoveries",
    description:
      "In January 1610, Galileo identified four moons orbiting Jupiter, challenging an Earth-centered view of the heavens.",
    source:
      "https://www.nasa.gov/general/415-years-ago-astronomer-galileo-discovers-jupiters-moons/",
    sourceLabel: "NASA History",
  },
];
