import { test, expect } from './fixtures/publicTest.js';
import { waitForPublicShellReady } from './support/publicReady.js';

test('anonymous visitor sees the home without unexpected errors', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(/^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/);
  await page.goto('/');
  await waitForPublicShellReady(page);
});
