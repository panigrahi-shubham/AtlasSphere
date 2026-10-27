# EarthScope v2 release candidate

The current feature matrix, executed validation and remaining platform checks are
in [V2_VALIDATION.md](V2_VALIDATION.md). The v1 checklist below is retained only as
historical implementation context; its environment blockers have been superseded
by the v2 validation record.

---

# EarthScope v1.0 release candidate

All six implementation milestones are present. Release acceptance remains pending
the locally executable checks below; a passing mocked suite is not a passing live
integration run. This project is a website; the Android roadmap is unchanged.

| Check | Evidence / status |
| --- | --- |
| Deterministic service/unit regression | 34 passed |
| Normal Chromium UI regression | 69 passed using server-free source routing |
| Development defect and storage isolation | 7 passed, separate suite |
| Production build and built-asset journeys | Build plus 3 production tests passed |
| Bug flags ignored by production | Passed against untouched dist assets |
| Keyboard and responsive checks | Passed for tested flows; 320/375/768/1440px and dialog/forecast keys |
| Live public API contracts | 9 executed; sandbox DNS ENOTFOUND blocks verification |
| Normal Vite server/preview | Needs local confirmation for this final candidate |
| Firefox and WebKit | Matching binaries missing; compatibility not signed off |
| Screen reader/high contrast/real touch review | Manual review still recommended; not a complete WCAG audit |
| Git commit | Repository is not configured; no commit created |

## Local final check

```powershell
npm install
npx playwright install chromium
npm test
npm run test:ui
npm run test:bugs
npm run test:api
npm run test:release
npm run preview
```

Run server/report commands in their own terminal and keep them running while using
the browser. Preview is http://127.0.0.1:4173; development uses port 5173. Saved
preferences/favorites are scoped to the exact browser origin, so these ports do
not share saved locations. Stop a known server from its own terminal if it blocks
a required port; do not kill unidentified processes.

If the sandbox cannot reach a local server, the reproducible alternatives are:

```powershell
npm run test:ui:memory
npm run test:bugs:memory
npm run test:release
```

The first two serve actual source through browser routing. The source fixture
emulates Vite's development flag only for the practice module. The release command
rebuilds and tests real dist assets without rewriting their contents, using mocked
external APIs. It validates built code without claiming to validate live endpoints
or preview-server networking.

Optional browser compatibility:

```powershell
npx playwright install chromium firefox webkit
npm run test:ui:all
```

## Manual acceptance journey

1. Search Nashik and select the country-labelled result.
2. Check current values, model-valid-at time, hourly cards and geography.
3. Switch units, save a favorite, reload and reopen it.
4. Save another place; filter/sort, cancel clear-all, then confirm it and reload.
5. Refresh weather. Disconnect/reconnect and check status/retry behavior.
6. Use only the keyboard: skip link, search, suggestions, units, forecast End/Home,
   favorites and clear-all dialog. Check the controls at narrow width and zoom.
7. Open development Bug Mode using docs/BUG_MODE.md; exit and verify normal saved
   data is intact. Preview must ignore the same defect URL flags.

No fixed live temperature is expected. Provider/model availability and missing
optional geographic fields vary. Production deployment, hosting and APK creation
have not been performed or implied by these checks.
