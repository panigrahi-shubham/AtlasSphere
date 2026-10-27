# SkyAtlas homepage integration

The supplied standalone homepage informed the navy navigation, image-led search hero, weather invitation, discovery cards, GeoGuess promotion and featured places. The production page uses existing search, weather, atlas, favorites and game logic instead of the prototype's sample responses. The Explorer Lab links in the concept were omitted because the 18 lab missions are not implemented.

Three bundled landmark photographs and an existing lake hero photograph load locally. Photographer and license links remain visible in the featured gallery and atlas. The invitation hides after a city is selected and returns when the city is cleared. Discovery links for countries and landmarks open the lazy atlas before scrolling to the requested content.

The homepage is a Vite multipage site served together with the Phase 2 Express API. Run `npm run build` and `npm start` to serve pages and `/api/v1/*` from one origin. Upload source to GitHub and deploy as a Node web service using `render.yaml`. See `docs/PHASE2.md` for API and deployment details. Do not commit `node_modules`, `dist`, test outputs or local archives.

Checks: `npm test`, `npm run test:v2 -- --workers=1`, `npm run test:ui -- --workers=1`, `npm run test:bugs -- --workers=1`, and `npm run test:release`. Live weather needs an internet connection when used; automated tests stub the external responses.
