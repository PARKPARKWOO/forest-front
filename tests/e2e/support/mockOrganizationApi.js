import { expect } from '@playwright/test';
import { installPublicApiMocks } from './mockForestApi.js';
import { organizationFixture } from '../fixtures/organizationDirectoryData.js';

export async function installOrganizationApiMocks(page) {
  let organization = organizationFixture;
  let legacyHtml = '';
  let managedFingerprint = `sha256:${'a'.repeat(64)}`;
  let nextSavedFingerprint = null;
  let userResponse = { status: 403, body: { message: 'anonymous' } };
  let expectedPutCount = 0;
  let nextPutFailure = null;
  let nextManageGetFailure = null;
  let nextManageGetGate = null;
  let deferredManageGetGate = null;
  let nextPutGate = null;
  let deferredPutGate = null;
  let nextPutResponseGate = null;
  let deferredPutResponseGate = null;
  let nextLegacyGate = null;
  let deferredLegacyGate = null;
  const failures = new Map();
  const requests = [];
  const unhandled = [];
  const putRequests = [];

  const publicApi = await installPublicApiMocks(page, {
    organization,
    staticContents: { 'intro-people': null },
  });
  const setPublicOrganization = (next) => {
    const { legacyContentFingerprint: _managedOnly, ...publicOrganization } = next;
    publicApi.setData({ organization: publicOrganization });
  };

  await page.route(/\/api\/v1\/static-content\/intro-people(?:[?#].*)?$/, async (route) => {
    const request = route.request();
    const method = request.method();
    requests.push(`${method} /static-content/intro-people`);
    if (method !== 'GET') {
      unhandled.push(`${method} /static-content/intro-people`);
      return route.fulfill({ status: 405, contentType: 'application/json', body: JSON.stringify({ message: 'method not allowed' }) });
    }
    if (nextLegacyGate) {
      const gate = nextLegacyGate;
      nextLegacyGate = null;
      await gate.promise;
    }
    const forcedStatus = failures.get('/static-content/intro-people');
    if (forcedStatus) {
      return route.fulfill({
        status: forcedStatus,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'forced organization test failure: /static-content/intro-people' }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: legacyHtml ? { key: 'intro-people', content: legacyHtml } : null,
      }),
    });
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
      const capturedSnapshot = { ...organization, legacyContentFingerprint: managedFingerprint };
      if (nextManageGetGate) {
        const gate = nextManageGetGate;
        nextManageGetGate = null;
        await gate.promise;
      }
      if (nextManageGetFailure) {
        const status = nextManageGetFailure;
        nextManageGetFailure = null;
        return route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'forced next organization GET failure' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: capturedSnapshot }),
      });
    }
    if (method === 'PUT') {
      const requestBody = request.postDataJSON();
      putRequests.push(requestBody);
      if (nextPutGate) {
        const gate = nextPutGate;
        nextPutGate = null;
        await gate.promise;
      }
      if (nextPutFailure) {
        const response = nextPutFailure;
        nextPutFailure = null;
        return route.fulfill({
          status: response.status,
          contentType: 'application/json',
          body: JSON.stringify(response.body),
        });
      }
      if (nextSavedFingerprint) {
        managedFingerprint = nextSavedFingerprint;
        nextSavedFingerprint = null;
      }
      const { legacyContentFingerprint: _submittedFingerprint, ...editableRequest } = requestBody;
      organization = {
        ...organization,
        ...editableRequest,
        configured: true,
        revision: organization.revision + 1,
        legacyContentDrift: false,
        updatedAt: '2026-07-19T12:10:00+09:00',
      };
      setPublicOrganization(organization);
      const committedResponse = { ...organization, legacyContentFingerprint: managedFingerprint };
      if (nextPutResponseGate) {
        const gate = nextPutResponseGate;
        nextPutResponseGate = null;
        gate.markCommitted();
        await gate.promise;
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: committedResponse }),
      });
    }
    unhandled.push(`${method} /organization/manage`);
    return route.fulfill({ status: 405, contentType: 'application/json', body: JSON.stringify({ message: 'method not allowed' }) });
  });

  return {
    setOrganization(next) {
      organization = next;
      setPublicOrganization(organization);
    },
    setLegacyHtml(next) {
      legacyHtml = next;
      publicApi.setData({
        staticContents: {
          'intro-people': legacyHtml ? { key: 'intro-people', content: legacyHtml } : null,
        },
      });
    },
    getLegacyHtml() {
      return legacyHtml;
    },
    setManagedFingerprint(next) {
      managedFingerprint = next;
    },
    setNextSavedFingerprint(next) {
      nextSavedFingerprint = next;
    },
    failNextPut(status, code, message = 'forced organization PUT failure') {
      nextPutFailure = {
        status,
        body: { ...(code ? { code } : {}), message },
      };
    },
    failNextManageGet(status = 500) {
      nextManageGetFailure = status;
    },
    deferNextManageGet() {
      if (nextManageGetGate) throw new Error('an organization GET is already deferred');
      let release;
      const promise = new Promise((resolve) => { release = resolve; });
      nextManageGetGate = { promise, release };
      deferredManageGetGate = nextManageGetGate;
    },
    releaseDeferredManageGet() {
      if (!deferredManageGetGate) throw new Error('no deferred organization GET');
      deferredManageGetGate.release();
      deferredManageGetGate = null;
    },
    deferNextPut() {
      if (nextPutGate) throw new Error('an organization PUT is already deferred');
      let release;
      const promise = new Promise((resolve) => { release = resolve; });
      nextPutGate = { promise, release };
      deferredPutGate = nextPutGate;
    },
    releaseDeferredPut() {
      if (!deferredPutGate) throw new Error('no deferred organization PUT');
      deferredPutGate.release();
      deferredPutGate = null;
    },
    deferNextPutResponse() {
      if (nextPutResponseGate) throw new Error('an organization PUT response is already deferred');
      let release;
      let markCommitted;
      const promise = new Promise((resolve) => { release = resolve; });
      const committed = new Promise((resolve) => { markCommitted = resolve; });
      nextPutResponseGate = { promise, release, committed, markCommitted };
      deferredPutResponseGate = nextPutResponseGate;
      return committed;
    },
    releaseDeferredPutResponse() {
      if (!deferredPutResponseGate) throw new Error('no deferred organization PUT response');
      deferredPutResponseGate.release();
      deferredPutResponseGate = null;
    },
    deferNextLegacyGet() {
      if (nextLegacyGate) throw new Error('an intro-people GET is already deferred');
      let release;
      const promise = new Promise((resolve) => { release = resolve; });
      nextLegacyGate = { promise, release };
      deferredLegacyGate = nextLegacyGate;
    },
    releaseDeferredLegacyGet() {
      if (!deferredLegacyGate) throw new Error('no deferred intro-people GET');
      deferredLegacyGate.release();
      deferredLegacyGate = null;
    },
    setUser(response) {
      userResponse = response;
    },
    fail(path, status = 500) {
      if (path === '/users' || path === '/organization/manage' || path === '/static-content/intro-people') failures.set(path, status);
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
