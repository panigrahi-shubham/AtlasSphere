# Phase 1 science content and image provenance

Verified 28 October 2026. `src/home/data/discoveries.ts` is a small, curated educational dataset, not a live astronomy service. Text is written for AtlasSphere and links to the supporting primary reference. Numeric cards explicitly mark approximate values. Moon counts are deliberately omitted because they change with new confirmations. No generated scientific images, simulated readings, paid APIs, or runtime image services are used.

## New local assets

All downloaded originals were read into memory and converted with Pillow to local WebP. Only proportional downsampling and encoding were applied; no scientific content was added or removed. The full frame is preserved. Both resulting images were opened and visually inspected.

### Saturn

- Files: `public/images/earth-space/saturn.webp` (1600 × 774, 19,458 bytes), `saturn-640.webp` (640 × 310, 4,256 bytes).
- Work: *Saturn … Four Years On*, PIA11141, released 30 December 2008.
- Source page: https://science.nasa.gov/image-detail/amf-pia11141/
- NASA catalog: https://images.nasa.gov/details/PIA11141
- Download: https://images-assets.nasa.gov/image/PIA11141/PIA11141~large.jpg
- Credit: **NASA/JPL/Space Science Institute**.
- Usage: permitted educational/informational reuse under [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) and [JPL image policy](https://www.jpl.nasa.gov/jpl-image-use-policy/). Retain the caption credit and link; do not imply agency endorsement. No NASA/JPL logo is used.
- Encoding: WebP quality 86, method 6; small rendition quality 82.

### Pillars of Creation

- Files: `public/images/earth-space/nebula.webp` (1200 × 1123, 365,992 bytes), `nebula-640.webp` (640 × 599, 104,180 bytes).
- Work: *Pillars of Creation (NIRCam and MIRI Composite Image)*, released 30 November 2022, observations from 14 August 2022.
- Source page: https://science.nasa.gov/asset/webb/pillars-of-creation-nircam-and-miri-composite-image/
- Download: https://assets.science.nasa.gov/dynamicimage/assets/science/missions/webb/outreach/migrated/2022/STScI-01GK2KMYS6HADS6ND8NRHG53RP.png?fit=clip&h=1872&w=2000
- Credit: **NASA, ESA, CSA, STScI; Image Processing: Joseph DePasquale (STScI), Alyssa Pagan (STScI), Anton Koekemoer (STScI)**.
- Usage: NASA educational/informational media reuse; retain full credit in attribution. See [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) and [Webb copyright policy](https://webbtelescope.org/copyright).
- Scientific display note: This is an infrared composite with wavelengths assigned visible colors. It is **not a natural-color human-eye view**. Preserve that explanation near the feature.
- Encoding: WebP quality 86, method 6; small rendition quality 82.

Existing geographic images referenced by the dataset are unchanged and retain the individual licenses and credits recorded in `src/data/photos.json` and `docs/PHOTO_CREDITS.md`. These include `fujisan.jpg`, `great-barrier-reef.jpg`, and `pyramids-of-giza.jpg`.

## Scientific references

- Earth ocean coverage, plates, atmospheric composition and internal layers: https://science.nasa.gov/earth/facts/
- Moon mean distance of approximately 384,400 km and synchronous rotation: https://science.nasa.gov/moon/facts/
- Mars rotation approximately 24.6 hours: https://science.nasa.gov/mars/facts/
- Jupiter rotation approximately 9.9 hours: https://science.nasa.gov/jupiter/jupiter-facts/
- Saturn orbital period approximately 29.4 Earth years: https://science.nasa.gov/saturn/facts/
- Sun age approximately 4.6 billion years and fusion: https://science.nasa.gov/sun/facts/
- Milky Way stellar disk spans over 100,000 light-years; galaxy descriptions: https://science.nasa.gov/universe/galaxies/
- Solar system overview: https://science.nasa.gov/solar-system/solar-system-facts/
- Planet categories: https://science.nasa.gov/solar-system/planets/
- Stars: https://science.nasa.gov/universe/stars/
- Black holes and event horizons: https://science.nasa.gov/universe/black-holes/
- Nebula description and assigned-color infrared imagery: the Webb source above.
- Earthquake mechanisms: https://www.usgs.gov/faqs/what-earthquake-and-what-causes-them-happen
- Volcanic vents, magma, and erupted material: https://www.usgs.gov/programs/VHP/about-volcanoes
- Ocean–atmosphere exchange and heat transport: https://science.nasa.gov/earth/climate-change/ocean-and-climate/

## Historical references

- Ancient Egypt and Memphis: https://whc.unesco.org/en/list/86/ (summary paraphrased; UNESCO page text is CC BY-SA IGO 3.0).
- The 1507 Waldseemüller map: https://www.loc.gov/exhibits/exploring-the-early-americas/interactives/waldseemuller-maps/worldmap1507/highlights1507.html
- Voyager launches in 1977 and heliosphere crossings: https://science.nasa.gov/mission/voyager/
- Apollo 11 Moon landing and return dates: https://www.nasa.gov/mission/apollo-11/
- Galileo’s identification of four Jovian satellites in January 1610: https://www.nasa.gov/general/415-years-ago-astronomer-galileo-discovers-jupiters-moons/

## Integration and verification

Exports: `universeCategories` (9), `astronomyFacts` (7), `earthScienceTopics` (7), `historyTopics` (5), `scienceImages` and `scienceVerifiedAt`. Topic records carry stable IDs, titles, original summaries and primary source links. Fact records add `value`, `unit`, `label`, `approximate`, and `verifiedAt`. Image metadata contains intrinsic dimensions and small-screen renditions.

The Phase 1 interface should render these as curated content. Future internal explorer pages must remain marked Coming Soon; the external references can already be read. The optional USGS live feed is deferred, so this module has no live timestamps, alerts, sensor claims or network dependency.

Executed validation: imported the TypeScript module with Node 24 type stripping; confirmed collection sizes, unique IDs within each collection, parseable source URLs, and existence of every referenced local image. The new downloaded assets were visually inspected. Parent integration owns lint/typecheck/browser checks and display attribution.

## Responsive photo derivatives — performance follow-up

Created 28 October 2026 from existing local assets; no new downloads. Originals remain byte-for-byte unchanged (SHA-256 checked during conversion). All frames preserve their original proportions and full geographic content. The image manifest is `src/home/data/photoRenditions.ts`.

Every original JPG in `public/images/` has two WebP derivatives under `public/images/discovery/`: suffix `-480.webp` uses quality 80 and suffix `-960.webp` uses quality 82, both Pillow/Lanczos/method 6. Width is capped at the source width; no upscaling. The manifest records the larger rendition’s actual dimensions.

The derivatives retain each original’s license and attribution, including ShareAlike where applicable. Full original URLs, authors and license links remain in `src/data/photos.json` and `docs/PHOTO_CREDITS.md`; the filename mapping below makes this inheritance explicit.

- `alpine-lake-480.webp`, `alpine-lake-960.webp` ← `alpine-lake.jpg`. Bri Schneiter; Pexels License (see docs/PHOTO_CREDITS.md). Large: 960 × 640, 30,500 bytes; small: 8,038 bytes.
- `central-amazon-conservation-complex-480.webp`, `central-amazon-conservation-complex-960.webp` ← `central-amazon-conservation-complex.jpg`. Diego Lezama; CC BY-SA 4.0. Large: 960 × 639, 48,404 bytes; small: 12,310 bytes.
- `fujisan-480.webp`, `fujisan-960.webp` ← `fujisan.jpg`. Suicasmo; CC BY-SA 4.0. Large: 960 × 469, 30,252 bytes; small: 7,020 bytes.
- `grand-canyon-national-park-480.webp`, `grand-canyon-national-park-960.webp` ← `grand-canyon-national-park.jpg`. Lennart Sikkema; CC BY 3.0. Large: 960 × 616, 209,576 bytes; small: 50,028 bytes.
- `great-barrier-reef-480.webp`, `great-barrier-reef-960.webp` ← `great-barrier-reef.jpg`. NASA/Kjell Lindgren; Public domain. Large: 960 × 639, 132,580 bytes; small: 28,120 bytes.
- `great-wall-480.webp`, `great-wall-960.webp` ← `great-wall.jpg`. Severin.stalder; CC BY-SA 3.0. Large: 960 × 638, 160,516 bytes; small: 35,202 bytes.
- `los-glaciares-national-park-480.webp`, `los-glaciares-national-park-960.webp` ← `los-glaciares-national-park.jpg`. Fernando; CC BY-SA 4.0. Large: 960 × 411, 91,850 bytes; small: 20,358 bytes.
- `machu-picchu-480.webp`, `machu-picchu-960.webp` ← `machu-picchu.jpg`. Draceane; CC BY-SA 4.0. Large: 960 × 640, 181,788 bytes; small: 37,774 bytes.
- `mont-saint-michel-and-its-bay-480.webp`, `mont-saint-michel-and-its-bay-960.webp` ← `mont-saint-michel-and-its-bay.jpg`. Amaustan; CC BY-SA 4.0. Large: 960 × 540, 66,524 bytes; small: 15,424 bytes.
- `pyramids-of-giza-480.webp`, `pyramids-of-giza-960.webp` ← `pyramids-of-giza.jpg`. KennyOMG; CC BY-SA 4.0. Large: 960 × 400, 73,854 bytes; small: 14,522 bytes.
- `sagarmatha-national-park-480.webp`, `sagarmatha-national-park-960.webp` ← `sagarmatha-national-park.jpg`. Rdevany; CC BY-SA 3.0. Large: 960 × 640, 157,760 bytes; small: 34,714 bytes.
- `serengeti-national-park-480.webp`, `serengeti-national-park-960.webp` ← `serengeti-national-park.jpg`. Bjørn Christian Tørrissen; CC BY-SA 3.0. Large: 960 × 553, 130,282 bytes; small: 25,484 bytes.
- `swiss-alps-jungfrau-aletsch-480.webp`, `swiss-alps-jungfrau-aletsch-960.webp` ← `swiss-alps-jungfrau-aletsch.jpg`. Robert J Heath; CC BY 2.0. Large: 960 × 640, 212,706 bytes; small: 47,562 bytes.
- `taj-mahal-480.webp`, `taj-mahal-960.webp` ← `taj-mahal.jpg`. Yann; edited by Jim Carter; CC BY-SA 4.0. Large: 960 × 631, 93,716 bytes; small: 22,132 bytes.
- `the-dolomites-480.webp`, `the-dolomites-960.webp` ← `the-dolomites.jpg`. kallerna; CC BY-SA 4.0. Large: 960 × 664, 188,298 bytes; small: 41,068 bytes.
- `western-ghats-480.webp`, `western-ghats-960.webp` ← `western-ghats.jpg`. Mdmadhu; CC BY-SA 4.0. Large: 960 × 641, 167,988 bytes; small: 33,038 bytes.
- `yellowstone-national-park-480.webp`, `yellowstone-national-park-960.webp` ← `yellowstone-national-park.jpg`. Rhododendrites; CC BY-SA 4.0. Large: 960 × 1164, 355,000 bytes; small: 78,106 bytes.

Combined originals: 3,229,773 bytes. Combined 960px derivatives: 2,331,594 bytes. Combined 480px derivatives: 510,900 bytes. These are asset totals, not a measured page-transfer or Lighthouse result.

`public/images/earth-space/earth-hero-medium.webp`: 800 × 800, 92,510 bytes, quality 82, method 6. Proportional derivative of the existing `earth-hero.webp`; no crop, composite, or added content. It inherits the NASA Earth image source and permitted educational reuse/credit recorded in `docs/archive/PHASE1_EARTH_ASSETS.md`. Parent integration selects this 800px option through responsive image metadata; the original Earth image remains unchanged.
