# Phase 1 Earth imagery and adapter

Verified 28 October 2026. No paid service, API key or runtime image service is required.

## Assets

- `public/images/earth-space/earth-texture.webp`: optimized WebP of NASA SVS `bluemarble-2048.png` (2048 × 1024), used only after the visitor activates 3D. Original: https://svs.gsfc.nasa.gov/vis/a000000/a002900/a002915/bluemarble-2048.png
- `public/images/earth-space/earth-hero.webp`: 1100 × 1100 WebP of NASA/NOAA's eastern-hemisphere Blue Marble 2012, the immediate static hero/fallback. Original: https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001788/GSFC_20171208_Archive_e001788~large.jpg
- `public/images/earth-space/earth-hero-small.webp`: 640 × 640 responsive derivative of the same image.
- `public/images/earth-space/earth-hero-medium.webp`: 800 × 800 responsive derivative of the same image, 92,510 bytes.

Texture source record and requested credit: [NASA SVS 2915](https://svs.gsfc.nasa.gov/2915/), NASA/Goddard Space Flight Center Scientific Visualization Studio; Blue Marble data courtesy Reto Stöckli (NASA/GSFC) and NASA Earth Observatory. Hero source record: [Eastern Hemisphere — Blue Marble 2012](https://science.nasa.gov/image-detail/amf-gsfc_20171208_archive_e001788/), credit NASA/NOAA, compiled by NASA Goddard scientist Norman Kuring from six Suomi NPP VIIRS orbits on January 23, 2012. These are historical satellite composites, not current observations. The site makes no live illumination or live cloud claim.

[NASA SVS reuse FAQ](https://svs.gsfc.nasa.gov/help/) states its content is in the public domain unless otherwise noted. No third-party copyright exception is marked on the texture item. The NASA/NOAA hero is supplied for reuse under [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/); [NASA Earth science reuse FAQ](https://science.nasa.gov/earth/faq/) permits reuse where no copyright notice applies and requests credit. Credit is included next to the globe, no NASA logo is used, and no endorsement is implied. Derivatives only resize/re-encode; geographic content is unchanged.

## Implementation

`src/home/globe/EarthGlobe.tsx` exports a default React component accepting `selected?: {name, latitude, longitude} | null` and `onSelect?: (place) => void`. Its renderer module and Three.js are dynamically imported only after `home-globe-activate` is pressed. The existing `src/components/globe.js` remains untouched for legacy features. The adapter reuses its sphere/marker coordinate convention, pointer rotation and keyboard interaction approach, with lifecycle-scoped DOM and resource cleanup.

The 3D renderer uses existing `world-atlas` polygons for pointer hover outlines/country selection and the bundled country dataset for a native keyboard/touch country chooser. Country borders and coordinates are generalized educational reference data. They are not navigation-grade boundaries or a political endorsement. Mouse, pen and touch drag rotate; arrow keys rotate; plus/minus zoom; Home resets the view. Reset view changes camera/rotation but preserves the selected marker, country choice and text. Buttons provide zoom, reset and optional rotation. Selected locations are both marked in 3D and exposed as text in `home-globe-selection`.

Rotation is opt-in and unavailable with reduced motion. Rendering stops when idle; rotation yields when hidden/offscreen. WebGL or texture load failures retain the NASA image and provide retry. Context loss returns to the same fallback. GPU geometry, materials, texture, events and observers are disposed on unmount. Scene lighting is explicitly illustrative.

## Test contracts

Stable IDs: `home-globe`, `home-globe-visual`, `home-globe-fallback`, `home-globe-host`, `home-globe-activate`, `home-globe-canvas`, `home-globe-status`, `home-globe-controls`, `home-globe-zoom-in`, `home-globe-zoom-out`, `home-globe-reset`, `home-globe-rotate`, `home-globe-country`, `home-globe-hover`, `home-globe-selection`.

## Executed focused verification

28 October 2026, local Vite at `http://127.0.0.1:5173`:

- Strict TypeScript check of both globe modules passed using ES2022, Bundler module resolution, React JSX, DOM libraries and Vite client types.
- `node test-results/home-globe-qa/check.mjs` passed in real Playwright Chromium with SwiftShader WebGL. Verified no renderer/Three request before activation, initial fallback, activation and canvas focus, India selection, keyboard arrows/zoom, selection-preserving reset, reduced-motion control, context loss and retry, and initial WebGL unavailability. No uncaught page errors were recorded.
- Axe WCAG A/AA checks scoped to the active globe found zero violations in both dark and light themes.
- At 375 × 812 with touch emulation, activation, native country selection and zoom buttons worked; the document had no horizontal overflow.
- A separate real-pointer check hovered and clicked South Sudan, confirmed a drag changes the rendered image, and selected Zimbabwe using the native select's End key.
- Dark/light 3D, light fallback and mobile screenshots were visually inspected. Ignored evidence is under `test-results/home-globe-qa/`.

These are scoped globe checks, not a claim of full-site accessibility conformance or real-device GPU compatibility. The overall Phase 1 report records integrated build and regression results.
