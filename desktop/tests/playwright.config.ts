import { defineConfig } from '@playwright/test';

// Desktop = 1440x900 (plan C.3: the desktop project, cloudy-h-webdesktop only) + a 1280x800 laptop.
const PORT = 4174;
export default defineConfig({
  testDir: './e2e',
  outputDir: './results/artifacts',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: './results/report', open: 'never' }]],
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure', reducedMotion: 'reduce', timezoneId: 'UTC', locale: 'en-US' },
  webServer: { command: 'node tests/serve.mjs', cwd: '..', port: PORT, reuseExistingServer: false, env: { PORT: String(PORT) } },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
    { name: 'laptop', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 } },
  ],
});
