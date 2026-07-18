import { test, expect } from './fixtures/publicTest.js';
import { waitForPublicShellReady } from './support/publicReady.js';

test('anonymous visitor sees the home without unexpected errors', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(/^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/);
  await page.goto('/');
  await waitForPublicShellReady(page);
});

test('draft exposes its boundary and uses the approved primary color', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(/^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/);
  await page.goto('/');
  await expect(page.getByText('로컬 초안', { exact: true })).toBeVisible();
  const cta = page.getByRole('link', { name: '프로그램 참여' }).first();
  await expect(cta).toHaveCSS('background-color', 'rgb(22, 101, 52)');
  expect((await cta.boundingBox()).height).toBeGreaterThanOrEqual(48);
});
