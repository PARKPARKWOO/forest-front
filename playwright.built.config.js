import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  // 빌드 산출물이 있어야만 의미가 있는 스펙만 여기서 돌린다.
  testMatch: /(design-system-production-boundary|prerender)\.spec\.js/,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview:built',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
