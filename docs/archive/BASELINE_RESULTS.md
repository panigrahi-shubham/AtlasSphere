# Baseline results — 26 October 2026

Captured before the new roadmap Phase 1 implementation. No baseline failures were fixed.

| Suite | Passed | Failed | Skipped | Runtime |
| --- | ---: | ---: | ---: | --- |
| Node service/unit | 41 | 0 | 0 | 5.97 s |
| Original Chromium UI (raw source routing) | 69 | 0 | 0 | 47.2 s |
| Design/exploration Chromium (production assets) | 25 | 0 | 0 | 1.1 min |
| Development Bug Mode | 7 | 0 | 0 | 13.6 s |
| Production protection journeys | 3 | 0 | 0 | 8.7 s |
| Total | 145 | 0 | 0 | |

Production build passed. Live API tests were not rerun: upstream domains are outside
the current execution network allowlist. Earlier validation remains historical,
not evidence of a new live run. Raw-source/built-asset routing is explicitly noted;
normal Vite-server verification will be attempted separately after implementation.
