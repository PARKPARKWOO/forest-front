import { expect } from '@playwright/test';
import { installPublicApiMocks } from './mockForestApi.js';
import { organizationFixture } from '../fixtures/organizationDirectoryData.js';

const managedFingerprint = `sha256:${'a'.repeat(64)}`;

export async function installOrganizationApiMocks(page) {
  let organization = organizationFixture;
  let legacyHtml = '';
  let userResponse = { status: 403, body: { message: 'anonymous' } };
  let expectedPutCount = 0;
  const failures = new Map();
  const requests = [];
  const unhandled = [];
  const putRequests = [];

  const publicApi = await installPublicApiMocks(page, {
    organization,
    staticContents: { 'intro-people': null },
  });

  await page.route(/\/api\/v1\/users(?:[?#].*)?$/, async (route) => {
    const request = route.request();
    requests.push(`${request.method()} /users`);
    if (request.method() !== 'GET') {
      unhandled.push(`${request.method()} /users`);
      return route.fulfill({ status: 405, contentType: 'application/json', body: JSON.stringify({ message: 'method not allowed' }) });
    }
    const forcedStatus = failures.get('/users');
    const response = forcedStatus
      ? { status: forcedStatus, body: { message: 'forced organization test failure: /users' } }
      : userResponse;
    return route.fulfill({ status: response.status, contentType: 'application/json', body: JSON.stringify(response.body) });
  });

  await page.route(/\/api\/v1\/organization\/manage(?:[?#].*)?$/, async (route) => {
    const request = route.request();
    const method = request.method();
    requests.push(`${method} /organization/manage`);
    const forcedStatus = failures.get('/organization/manage');
    if (forcedStatus) {
      return route.fulfill({
        status: forcedStatus,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'forced organization test failure: /organization/manage' }),
      });
    }
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { ...organization, legacyContentFingerprint: managedFingerprint } }),
      });
    }
    if (method === 'PUT') {
      const requestBody = request.postDataJSON();
      putRequests.push(requestBody);
      organization = {
        ...organization,
        ...requestBody,
        configured: true,
        revision: organization.revision + 1,
        legacyContentDrift: false,
        updatedAt: '2026-07-19T12:10:00+09:00',
      };
      publicApi.setData({ organization });
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { ...organization, legacyContentFingerprint: managedFingerprint } }),
      });
    }
    unhandled.push(`${method} /organization/manage`);
    return route.fulfill({ status: 405, contentType: 'application/json', body: JSON.stringify({ message: 'method not allowed' }) });
  });

  return {
    setOrganization(next) {
      organization = next;
      publicApi.setData({ organization });
    },
    setLegacyHtml(next) {
      legacyHtml = next;
      publicApi.setData({
        staticContents: {
          'intro-people': legacyHtml ? { key: 'intro-people', content: legacyHtml } : null,
        },
      });
    },
    setUser(response) {
      userResponse = response;
    },
    fail(path, status = 500) {
      if (path === '/users' || path === '/organization/manage') failures.set(path, status);
      else publicApi.fail(path, status);
    },
    recover(path) {
      failures.delete(path);
      publicApi.recover(path);
    },
    expectPutCount(count) {
      expectedPutCount = count;
    },
    getRequests() {
      return [...requests];
    },
    getPutRequests() {
      return [...putRequests];
    },
    assertHandled() {
      publicApi.assertHandled();
      expect(unhandled, unhandled.join('\n')).toEqual([]);
      expect(putRequests, 'unexpected organization PUT request count').toHaveLength(expectedPutCount);
    },
  };
}
