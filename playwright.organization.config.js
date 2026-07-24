import { defineConfig } from '@playwright/test';
import process from 'node:process';
import baseConfig from './playwright.config.js';

const previewMode = process.env.FOREST_E2E_PREVIEW === 'true';

export default defineConfig({
  ...baseConfig,
  metadata: {
    ...baseConfig.metadata,
    organizationPreviewMode: previewMode,
  },
  testMatch: /(?:organization-directory-.*|home-hero-admin-save)\.spec\.js/,
  webServer: {
    ...baseConfig.webServer,
    command: previewMode ? 'npm run draft:organization-preview' : 'npm run draft:organization',
  },
});
