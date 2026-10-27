# Test Lab answer key

Available only with `APP_ENV=development` or `APP_ENV=test`. Open `/test-lab` and select a defect; the API endpoint `/api/v1/test-lab/scenario` accepts one or more `X-SkyAtlas-Defects` IDs per request. Production returns 404. These scenarios simulate data problems in an isolated practice payload; they never alter real weather, favorites or news.

| Flag | Expected | Planted result | Severity |
| --- | --- | --- | --- |
| `wrong-units` | Celsius | Fahrenheit is shown instead | High |
| `missing-news` | A sample headline | Empty news array | Medium |
| `stale-cache` | `fresh` | `stale` | Medium |
| `duplicate-favorite` | Tokyo once | Tokyo twice | Medium |
| `day-offset` | Forecast day 1 | Forecast day 2 | High |

Failure modes: `delay` waits 250 ms; `timeout` waits 2500 ms (the client times out at 1000 ms); `upstream-500` returns HTTP 502; `offline` returns HTTP 503; `malformed-json` serves invalid JSON. Changing the scenario back to normal and retrying must recover. These are per-request controls with no global chaos flag, suitable for parallel test workers. Browser practice includes native alert/confirm/prompt, iframe, open and closed shadow controls, upload/download, drag/drop, a dynamic table, bounded infinite scroll and a toast. Closed shadow tests assert its user-visible effect.
