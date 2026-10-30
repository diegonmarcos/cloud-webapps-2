import { defineConfig } from 'vitest/config';

// Unit tests of the desktop view model (pure TS over the pinned generated nav). The site's e2e is Playwright (tests/).
export default defineConfig({
  test: { include: ['sites/*/src/**/*.test.ts'], environment: 'node' },
});
