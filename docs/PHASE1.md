# Phase 1 — visual refresh

Implemented on 26 October 2026, preserving the v2 application and its test IDs.

## Delivered

- Shared color/surface/spacing/radius/shadow tokens and light/dark themes.
- Saved browser preference, system preference on first visit, and safe session-only
  operation when storage is unavailable. No account synchronization is claimed.
- Photographic landscape hero with visible Pexels credit and a gradient fallback.
- Three featured geography photos and all 16 landmark photos with author, source
  and license links; images are local, sized, and secondary photos lazy-load.
- Responsive navigation with mobile menu, Escape-to-close and focus restoration.
- Wider cards, refreshed dashboard and numerical presentation, improved mobile layout.
- Page colors based on fetched WMO condition and day/night. No dawn/dusk is inferred
  without sunrise/sunset data. Weather story describes current conditions only.
- All appearance transitions respect reduced-motion preferences.
- The map/globe/forecasts/favorites remain functional and retain their stable IDs.

## Validation

| Suite | Passed |
| --- | ---: |
| Node/service/unit regression | 41 |
| Original Chromium UI, normal Vite server | 69 |
| Built-asset design and exploration Chromium tests | 25 |
| Live API contracts | 11 |
| Isolated development Bug Mode | 7 |
| Built-production protection checks | 3 |
| Total | 156 |

Production build passed. Test commands remain documented in README.md. New browser
checks are tests/v2/design.spec.ts, included in npm run test:v2. The build retains
the existing advisory for the optional Three.js chunk exceeding 500 KB uncompressed.

Screenshots captured locally under docs/screenshots/: phase1-before-desktop.png,
phase1-before-mobile.png, phase1-after-desktop.png, phase1-after-mobile.png and an
alternate-theme mobile capture. These are internal visual QA artifacts.

A real-browser check caught an image-error event arriving before module startup;
initial failed images are now checked as well as later error events. Landmark
source assertions now select the UNESCO link explicitly alongside photo credits.

## Scope and limitations

No backend, AQI, image API credentials, authentication, Android, cookie banner,
command palette, external fonts, or new icon dependency was added. These are outside
this focused visual phase. Existing weather icons are preserved. Photos are bundled
reference imagery; they do not dynamically match arbitrary cities or weather.

No Lighthouse 90+ or complete WCAG compliance claim is made. Firefox/WebKit,
screen readers and real touch-device behavior were not audited in this phase.
The source folder has no configured Git repository; no commit was created.

Photo credits and licenses: PHOTO_CREDITS.md; machine-readable metadata:
src/data/photos.json. Asset files: public/images/. Backend work begins only in Phase 2.
