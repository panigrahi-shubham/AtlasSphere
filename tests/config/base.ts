import type { PlaywrightTestConfig } from '@playwright/test';

/** Shared browser diagnostics; assertions and scenario-specific settings remain in each suite. */
export const browserDiagnostics = {
  trace: 'retain-on-failure', screenshot: 'only-on-failure', serviceWorkers: 'block',
} as const;

/** Suite-specific report folders with zero retries and an additional JUnit artifact on CI. */
export function suiteBase(name: string): PlaywrightTestConfig {
  const junitName = name === 'home' && process.env.HOME_PRODUCTION === '1' ? 'home-production' : name;
  return {
    forbidOnly: Boolean(process.env.CI), retries: 0,
    outputDir: `test-results/${name}`,
    reporter: [
      ['list'], ['html', { outputFolder: `playwright-report/${name}`, open: 'never' }],
      ...(process.env.CI ? [['junit', { outputFile: `test-results/junit/${junitName}.xml` }] as [string, Record<string, string>]] : []),
    ],
    use: browserDiagnostics,
  };
}

/** Configure a local server while retaining each suite's command, port and environment. */
export function localWebServer(command: string, url: string, timeout: number, reuseExistingServer = !process.env.CI): NonNullable<PlaywrightTestConfig['webServer']> {
  return { command, url, timeout, reuseExistingServer };
}
