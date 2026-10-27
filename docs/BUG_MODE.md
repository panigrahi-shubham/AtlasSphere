# Development-only Bug Mode

Bug Mode is disabled by default. Run `npm run dev` and visit:

```
http://127.0.0.1:5173/?bugMode=1&bugs=TEMP-001
```

The practice panel lists all known defect IDs. Select/unselect a checkbox to reload
with that defect enabled/disabled. Multiple IDs can be comma-separated in `bugs`.
`?bugMode=1` with no `bugs` displays the panel and uses isolated storage without
injecting a defect. Unknown IDs are ignored. Exit practice mode removes both URL
parameters and reloads the normal application.

| ID | Intentional behavior | How to observe |
| --- | --- | --- |
| TEMP-001 | Fahrenheit conversion omits +32 | Select a city, switch to Fahrenheit and compare the displayed conversion |
| HUM-001 | Humidity displays Not available despite a valid response | Select a city with humidity in the mocked/live payload |
| FAV-001 | Duplicate favorite records can be added | Select a city and press Save favorite twice |
| SEARCH-001 | Empty/short query bypasses validation | Submit an empty field and inspect the geocoding request |
| TIME-001 | Hourly labels use UTC while the location timezone label remains unchanged | Select a location outside UTC and compare forecast labels |

Use mocked data for repeatable exercises. Never expect a fixed live temperature.

## Isolation

All reads/writes through the storage helper are redirected from normal keys to
`earthscope:practice:` plus the original key. Normal favorites and unit preferences
are not read or changed. This applies even when the practice panel has no selected
defects and when removing/clearing practice favorites. The practice namespace can
persist in that browser, but the activation flag is URL-only. Leaving practice mode
restores access to normal data. No defect is allowed to write normal storage.

## Production guarantee

The development gate is compiled by Vite. Production builds do not display the
practice panel or activate any defect, including when all known URL flags are
supplied. `npm run test:release` builds the app and tests those flags against the
untouched built assets. A plain static source server does not enable Bug Mode.

The server-free test fixture emulates the Vite development flag only while serving
the raw practice source module. Production tests serve dist files without rewriting
anything. These modes are explicitly separated.

## Commands

```powershell
npm run test:bugs
npm run test:bugs:memory
npm run test:release
npm run report:bugs
npm run report:release
```

Practice tests assert the intentionally wrong behavior and the storage boundary.
They are excluded from normal UI regression and are not expected-failure tests.
Normal regression runs with no injected defects. Production checks assert correct
behavior even when defect flags are present.
# GeoGuess practice defects

In Vite development only, visit `/geoguess?mode=landmark&seed=42&start=1&bugMode=1&bugs=GG-BUG-1` to reproduce incorrect Fahrenheit scoring. `GG-BUG-1` uses the converted mile number as kilometres for points; the correct code scores from kilometres regardless of display units.

Use `mode=outline&bugs=GG-BUG-2` to see the countdown continue for three seconds after a submitted answer. Both are off by default and blocked in production. Their expected-failure Playwright checks are in `tests/bugs/geoguess.spec.ts`.

