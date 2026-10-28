# AtlasSphere asset attribution

Phase 1 Earth & Space redesign. Sources verified 28 October 2026. No agency endorsement is implied.

## Earth imagery



- `public/images/earth-space/earth-texture.webp`: optimized WebP of NASA SVS `bluemarble-2048.png` (2048 × 1024), used only after the visitor activates 3D. Original: https://svs.gsfc.nasa.gov/vis/a000000/a002900/a002915/bluemarble-2048.png
- `public/images/earth-space/earth-hero.webp`: 1100 × 1100 WebP of NASA/NOAA's eastern-hemisphere Blue Marble 2012, the immediate static hero/fallback. Original: https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001788/GSFC_20171208_Archive_e001788~large.jpg
- `public/images/earth-space/earth-hero-small.webp`: 640 × 640 responsive derivative of the same image.

Texture source record and requested credit: [NASA SVS 2915](https://svs.gsfc.nasa.gov/2915/), NASA/Goddard Space Flight Center Scientific Visualization Studio; Blue Marble data courtesy Reto Stöckli (NASA/GSFC) and NASA Earth Observatory. Hero source record: [Eastern Hemisphere — Blue Marble 2012](https://science.nasa.gov/image-detail/amf-gsfc_20171208_archive_e001788/), credit NASA/NOAA, compiled by NASA Goddard scientist Norman Kuring from six Suomi NPP VIIRS orbits on January 23, 2012. These are historical satellite composites, not current observations. The site makes no live illumination or live cloud claim.

[NASA SVS reuse FAQ](https://svs.gsfc.nasa.gov/help/) states its content is in the public domain unless otherwise noted. No third-party copyright exception is marked on the texture item. The NASA/NOAA hero is supplied for reuse under [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/); [NASA Earth science reuse FAQ](https://science.nasa.gov/earth/faq/) permits reuse where no copyright notice applies and requests credit. Credit is included next to the globe, no NASA logo is used, and no endorsement is implied. Derivatives only resize/re-encode; geographic content is unchanged.


## Space imagery



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


## Existing geographic photographs

The existing local files are unchanged. Display frames may crop the view; the files retain their source licenses. Share-alike obligations remain applicable.

### Taj Mahal

- File: `public/images/taj-mahal.jpg`
- Source: https://commons.wikimedia.org/wiki/File:Taj_Mahal_(Edited).jpeg
- Author: Yann; edited by Jim Carter
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Attribution: retain author, source and linked license.

### Great Wall

- File: `public/images/great-wall.jpg`
- Source: https://commons.wikimedia.org/wiki/File:The_Great_Wall_of_China_at_Jinshanling-edit.jpg
- Author: Severin.stalder
- License: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)
- Attribution: retain author, source and linked license.

### Western Ghats

- File: `public/images/western-ghats.jpg`
- Source: https://commons.wikimedia.org/wiki/File:AnaimudiPeak_DSC_4834.jpg
- Author: Mdmadhu
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Attribution: retain author, source and linked license.

### Machu Picchu

- File: `public/images/machu-picchu.jpg`
- Source: https://commons.wikimedia.org/wiki/File:Machu_Picchu,_2023_(012).jpg
- Author: Draceane
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Attribution: retain author, source and linked license.

### Serengeti National Park

- File: `public/images/serengeti-national-park.jpg`
- Source: https://commons.wikimedia.org/wiki/File:Serengeti-Landscape-2012.JPG
- Author: Bjørn Christian Tørrissen
- License: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)
- Attribution: retain author, source and linked license.

### Yellowstone National Park

- File: `public/images/yellowstone-national-park.jpg`
- Source: https://commons.wikimedia.org/wiki/File:Grand_Canyon_of_the_Yellowstone_Lower_Falls_(95819p).jpg
- Author: Rhododendrites
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Attribution: retain author, source and linked license.

### Grand Canyon National Park

- File: `public/images/grand-canyon-national-park.jpg`
- Source: https://commons.wikimedia.org/wiki/File:Canyon_River_Tree_(165872763).jpeg
- Author: Lennart Sikkema
- License: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0)
- Attribution: retain author, source and linked license.

### Great Barrier Reef

- File: `public/images/great-barrier-reef.jpg`
- Source: https://commons.wikimedia.org/wiki/File:ISS-45_StoryOfWater,_Great_Barrier_Reef,_Australia.jpg
- Author: NASA/Kjell Lindgren
- License: [Public domain](https://commons.wikimedia.org/wiki/File:ISS-45_StoryOfWater,_Great_Barrier_Reef,_Australia.jpg)
- Attribution: retain author, source and linked license.

### Fujisan

- File: `public/images/fujisan.jpg`
- Source: https://commons.wikimedia.org/wiki/File:View_of_Mount_Fuji_from_%C5%8Cwakudani_20211202.jpg
- Author: Suicasmo
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Attribution: retain author, source and linked license.

### Swiss Alps Jungfrau-Aletsch

- File: `public/images/swiss-alps-jungfrau-aletsch.jpg`
- Source: https://commons.wikimedia.org/wiki/File:Switzerland,_Bettmeralp_(19505442736).jpg
- Author: Robert J Heath
- License: [CC BY 2.0](https://creativecommons.org/licenses/by/2.0)
- Attribution: retain author, source and linked license.

### Pyramids of Giza

- File: `public/images/pyramids-of-giza.jpg`
- Source: https://commons.wikimedia.org/wiki/File:Pyramids_of_the_Giza_Necropolis.jpg
- Author: KennyOMG
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Attribution: retain author, source and linked license.

### Central Amazon Conservation Complex

- File: `public/images/central-amazon-conservation-complex.jpg`
- Source: https://commons.wikimedia.org/wiki/File:Jau_National_Park.jpg
- Author: Diego Lezama
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Attribution: retain author, source and linked license.

### Mont-Saint-Michel and its Bay

- File: `public/images/mont-saint-michel-and-its-bay.jpg`
- Source: https://commons.wikimedia.org/wiki/File:Mont-Saint-Michel_vu_du_ciel.jpg
- Author: Amaustan
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Attribution: retain author, source and linked license.

### The Dolomites

- File: `public/images/the-dolomites.jpg`
- Source: https://commons.wikimedia.org/wiki/File:Faloria_Cortina_d%27Ampezzo_10.jpg
- Author: kallerna
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Attribution: retain author, source and linked license.

### Sagarmatha National Park

- File: `public/images/sagarmatha-national-park.jpg`
- Source: https://commons.wikimedia.org/wiki/File:Mt._Everest_from_Gokyo_Ri_November_5,_2012.jpg
- Author: Rdevany
- License: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)
- Attribution: retain author, source and linked license.

### Los Glaciares National Park

- File: `public/images/los-glaciares-national-park.jpg`
- Source: https://commons.wikimedia.org/wiki/File:Perito_Moreno_Glacier_2023.jpg
- Author: Fernando
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Attribution: retain author, source and linked license.

## Existing landscape image

- File: `public/images/alpine-lake.jpg`
- Source: https://www.pexels.com/photo/calm-body-of-lake-between-mountains-346529/
- Author: Bri Schneiter
- License: Pexels License, https://www.pexels.com/license/
- Attribution is retained in the existing explorer, although the Pexels license does not require it.

## Fonts, datasets and icons

- Manrope Variable, locally bundled through `@fontsource-variable/manrope`: https://github.com/sharanda/manrope — Mikhail Sharanda, SIL Open Font License 1.1; retain the license bundled in the package.
- Lucide icons: https://lucide.dev/license — ISC license; retain package license.
- Natural Earth through `world-atlas`: https://www.naturalearthdata.com/about/terms-of-use/ — public domain geographic boundaries.
- Country metadata: https://github.com/mledoze/countries — ODbL, original license preserved in `docs/licenses/countries-LICENSE.txt`.
- Weather and search: https://open-meteo.com/ — linked “Weather data by Open-Meteo.com” attribution retained; geocoding uses GeoNames. No upstream terms or budgets are expanded by this phase.

Scientific content references are recorded in `docs/PHASE1_SCIENCE_SOURCES.md` and displayed on `/sources`. All new downloaded image files have explicit dimensions and locally encoded WebP renditions.

## Responsive derivatives

The new `public/images/discovery/*-480.webp` and `*-960.webp` files are proportional WebP encodings of the original 17 photographs. Their authors, source URLs and licenses (including ShareAlike obligations) are inherited unchanged. The exact filename mapping and encoding details are recorded in `docs/PHASE1_SCIENCE_SOURCES.md`; the frontend manifest is `src/home/data/photoRenditions.ts`. Original JPG files remain intact.

`public/images/earth-space/earth-hero-medium.webp` is an 800 × 800 proportional derivative of the credited NASA/NOAA Earth hero, without added or composited features. Its source and credit are the same as the original hero in `docs/PHASE1_EARTH_ASSETS.md`.
