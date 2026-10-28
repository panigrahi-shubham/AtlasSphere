# Framework refactor baseline

Baseline taken on 28 October 2026 from GitHub `main` at `a9bb599` before refactor changes. No production credentials or data were used.

| Command | Result |
| --- | --- |
| `npm test` | 70 passed |
| `npm run typecheck:api` | passed |
| `npm run test:accounts:local` | 25 passed, command exited successfully |
| `npm run test:ui` | 94 passed, one skipped, six failed in the hidden-folder checkout |
| `npm run test:smoke` | one passed, one failed in the hidden-folder checkout |
| `npm run test:a11y` | one passed |
| `npm run test:bugs` | nine passed |
| `npm run test:release` | five passed |
| `npm run test:v2` | 39 passed |
| `npm run test:home` | 20 passed, eight production-only scenarios skipped |
| `npm run test:home:unit` | five passed |
| `npm run lint:home` | passed |

The original UI failures affected two GeoGuess tests, two Journeys tests and two Test Lab tests. The smoke failure was the Test Lab route. In the hidden Windows checkout, the development server logged file-serving errors for Test Lab; some other browser actions timed out under the default worker count. An unchanged checkout at a normal path with two workers subsequently produced 100 passed and one existing production-only skip in UI, and two passed in smoke. This diagnostic run does not erase the original failures or prove their individual causes.

Before renaming, the selected lists contained two `@smoke` tests, one `@a11y` test and 13 live-provider tests. Following the first feature-folder moves, smoke and accessibility still selected the same titles; the built explorer suite remained at 39 and UI at 101 selected tests. The first moved-suite run exposed shared Test Lab rate limiting, addressed by giving each test worker a distinct local request identity without changing server limits or assertions. A subsequent normal-path run passed 100 UI tests with the same one skip and both smoke tests.
