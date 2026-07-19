import { defineConfig } from '@playwright/test';
import process from 'node:process';
import baseConfig from './playwright.config.js';

const previewMode = process.env.FOREST_E2E_PREVIEW === 'true';

export default defineConfig({
  ...baseConfig,
  testMatch: /organization-directory-.*\.spec\.js/,
  webServer: {
    ...baseConfig.webServer,
    command: previewMode ? 'npm run draft:organization-preview' : 'npm run draft:organization',
  },
});
