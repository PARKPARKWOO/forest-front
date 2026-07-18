import { expect } from '@playwright/test';
import { resolvePublicDraftResponse } from '../../draft/publicApiResponses.js';

export async function installPublicApiMocks(page, overrides = {}) {
  let currentData = { ...overrides };
  const failures = new Map();
  const unhandled = [];
  const writeAttempts = [];
  await page.route('https://images.unsplash.com/**', async (route) => route.fulfill({
    status: 200,
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700"><rect width="1200" height="700" fill="#166534"/></svg>',
  }));
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api\/v1/, '');
    if (request.method() !== 'GET') writeAttempts.push(`${request.method()} ${path}`);
    const forcedStatus = failures.get(path);
    const result = forcedStatus
      ? { status: forcedStatus, body: { message: `forced draft failure: ${path}` } }
      : resolvePublicDraftResponse(request.method(), request.url(), currentData);
    if (result.status === 501) unhandled.push(`${request.method()} ${path}`);
    return route.fulfill({
      status: result.status,
      contentType: 'application/json',
      body: JSON.stringify(result.body),
    });
  });
  return {
    setData(next) { currentData = { ...currentData, ...next }; },
    fail(path, status = 500) { failures.set(path, status); },
    recover(path) { failures.delete(path); },
    assertHandled() {
      expect(writeAttempts, `public draft attempted API writes:\n${writeAttempts.join('\n')}`).toEqual([]);
      expect(unhandled, unhandled.join('\n')).toEqual([]);
    },
  };
}
