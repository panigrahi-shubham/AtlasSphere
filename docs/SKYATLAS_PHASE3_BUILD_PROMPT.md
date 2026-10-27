# SkyAtlas: Phase 3 website build prompt

You are working in the existing SkyAtlas repository. Read `AGENTS.md`, `README.md`, `docs/ROADMAP.md`, `docs/PHASE2.md`, the source and the current tests before editing. SkyAtlas is a non-commercial geography and weather QA portfolio project. Implement **Phase 3 only: website accounts, PostgreSQL persistence and synchronized favorites**. The owner has chosen to finish the website first. Do not scaffold Android, build an APK, or begin Phase 4 without approval.

## Baseline to preserve

- The Vite multipage website includes the photo-led homepage, city search, current/hourly/seven-day weather, browser location, favorites, units, themes, atlas, landmark stories, Three.js globe, GeoGuess and news. Preserve existing functionality, credits, responsive design, keyboard behavior and stable `data-testid` values.
- The Express/TypeScript server serves the built website and `/api/v1/weather`, `/api/v1/geocode`, `/api/v1/news`, `/api/v1/health`, `/docs/` and `/openapi.json` from one origin. Keep fixture mode limited to `APP_ENV=test` with `FIXTURES=1` and unavailable in public production.
- Inspect current test commands and run a baseline. Record fresh counts and blockers. Preserve the existing anonymous favorites and GeoGuess scores in browser storage.

## Phase 3 implementation

1. Write `docs/AUTH.md` first: API contract, data model, validation, token/cookie lifetimes, account lockout, reset flow, local-to-account favorites merge rules, threat boundaries and deployment configuration. Implement PostgreSQL with Prisma migrations and a reproducible local/CI setup. Document a safe `.env.example`; never commit credentials. Use PostgreSQL across development, tests, CI and production once introduced.
2. Implement accessible registration and login with normalized/validated email, duplicate handling and a minimum eight-character password with uppercase, lowercase, digit and symbol. Hash with Argon2 or bcrypt. Do not leak whether an account exists through error wording where that would expose private data.
3. Use a 15-minute access token kept in memory, and a refresh token in an HttpOnly, Secure, SameSite cookie. Rotate refresh tokens, detect reuse, revoke on logout, validate authorization on every user resource, and lock an account for 15 minutes after five failed login attempts. Document practical local HTTPS/cookie handling.
4. Provide password reset via a six-digit single-use code valid for 10 minutes, with request and verification rate limits. Fake inbox and test code access exist only in development/test. In production, configure server-side email delivery or clearly disable reset until configured. Never return or log reset codes as part of a public response.
5. Add favorite add/remove/list/sync for authenticated users, maximum 20 distinct places, and synchronized theme preference. Anonymous visitors keep working browser-local favorites and theme. Define and implement deterministic conflict handling when they sign in and when two browser contexts edit the same account. Avoid cross-account data leaks.
6. Add accessible sign-up, sign-in, reset, account and sign-out states that fit the existing SkyAtlas website. Use stable kebab-case IDs for new interactive controls. Preserve all existing navigation and journeys. Update API documentation and README setup/deployment instructions.

## Acceptance and handoff

Add meaningful deterministic tests for validation boundaries, duplicate accounts, password security, lockout and unlock, expired and reused access/refresh tokens and reset codes, logout, cross-user authorization, favorites sync across two browser contexts, anonymous fallback, and production absence of fake inbox/test routes. Isolate user/data per Playwright worker; never reset a shared parallel database. Keep live weather tests separately tagged `@live`.

Run the existing unit, API, Playwright UI, GeoGuess, defect and built-production regressions plus new Phase 3 tests, migrations and typechecks. Report actual pass/fail/skip counts, blocked checks and any changed tests. If Git metadata is writable, work on a Phase 3 branch and commit accepted work; otherwise produce an updated clean source ZIP without claiming a commit or tag. Document any remaining setup in `docs/PHASE3.md` and stop after Phase 3 acceptance.

**Roadmap after Phase 3:** Phase 4 website product journeys; Phase 5 isolated web Test Lab; Phase 6 web automation, CI and hosted-web readiness. Android is deferred until the owner explicitly authorizes it after Phase 5 or 6. Do not start it as part of this prompt.
