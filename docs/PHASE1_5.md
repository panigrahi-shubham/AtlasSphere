# Phase 1.5 — GeoGuess implementation record

Implemented 26 October 2026 against the attached GeoGuess PRD/SRS. Phase 2 and GitHub upload have not started.

## Scope and review decisions

- The existing Vite multi-page setup has no client router. `/geoguess` rewrites to a separate Vite entry in development and preview; the built entry is also routed by the deterministic test harness. The main nav links to it.
- GeoGuess loads only when that route is opened. It reuses `world-atlas`, the 250-country snapshot and 16 landmarks. There are no new dependencies, remote game APIs, or photographs.
- Both five-round modes, seeded PRNG, 30-second clock, keyboard controls, feedback, results, share link, local scores, optional dev hook and two practice defects are implemented. A click within 50 km of a landmark counts as exact because one rendered world-map pixel can cover tens of kilometres.
- The optional Daily Challenge, hint and streak are deferred. Count-up and confetti from the visual design notes were not implemented; results and new-best text are present, with reduced-motion-safe feedback animation.
- Local leaderboard and best scores are per mode. Clearing a mode asks for confirmation and clears its best as well. The browser continues to play if storage is denied.

## Checks

| Suite | Result |
| --- | --- |
| Node regression and GeoGuess pure logic | 46 passed |
| Normal Vite Chromium UI | 75 passed, 1 production-only skip in the full 76-case run; the subsequently added deterministic-round case passed separately |
| Built-asset v2/Phase 1 Chromium | 36 passed |
| Bug Mode | 9 expected results: 7 ordinary passes and 2 intentional `test.fail()` cases demonstrating GG-BUG-1/2 |
| Production build and journeys | 4 passed, including GeoGuess and absent production hook |

The normal UI run on port 5181 printed all 75 active cases passing, then its process did not exit cleanly and had to be interrupted. The new seeded-round case and the dark-theme map case each passed in focused runs. Earlier port 5173 became unavailable during a combined run; the Playwright configurations now accept `EARTHSCOPE_PORT` to use a free local port. A direct Vite preview request returned HTTP 200 for `/geoguess` with and without game query parameters.

The game route test recorded zero page errors in the focused perfect-guess case. Mobile at 375 px has no horizontal page overflow and stacked options. The production test confirms `window.__geoguess` is absent and Bug Mode flags are inert.

## Pending acceptance

- Lighthouse Accessibility 90+ on `/geoguess` is unverified: Lighthouse is not installed or cached and the registry is outside this environment's network allowlist. A full screen-reader/manual audit is also outstanding.
- The requested `feat(geoguess): Phase 1.5 geography game` commit could not be made. `.git` is read-only here; `git add .` fails creating `.git/index.lock` with Permission denied. Review and commit in a writable Git checkout before uploading to GitHub.
- No live Open-Meteo tests were rerun because this phase introduces no external API and upstream domains are outside the current allowlist.
