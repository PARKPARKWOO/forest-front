import { test as base, expect } from '@playwright/test';
import { installPublicApiMocks } from '../support/mockForestApi.js';
import { watchPageQuality } from '../support/pageQuality.js';

export const test = base.extend({
  forestApi: [async ({ page }, use) => {
    const api = await installPublicApiMocks(page);
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
