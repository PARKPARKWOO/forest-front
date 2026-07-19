import { test as base, expect } from '@playwright/test';
import { installOrganizationApiMocks } from '../support/mockOrganizationApi.js';
import { watchPageQuality } from '../support/pageQuality.js';

export const test = base.extend({
  organizationApi: [async ({ page }, use) => {
    const api = await installOrganizationApiMocks(page);
    await use(api);
    api.assertHandled();
  }, { auto: true }],
  pageQuality: [async ({ page }, use) => {
    const quality = watchPageQuality(page);
    await use(quality);
    quality.assertClean();
  }, { auto: true }],
});

export { expect };
