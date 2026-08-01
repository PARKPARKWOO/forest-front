import { test, expect } from './fixtures/organizationTest.js';

const AUTH_REVOKE_URL = /\/api\/v1\/auth\/token\/revoke(?:[?#].*)?$/;
const USERS_API_URL = /\/api\/v1\/users(?:[?#].*)?$/;
const AUTH_CONTEXT_URL = /\/src\/contexts\/AuthContext\.jsx/;
const API_500 = /^Failed to load resource: the server responded with a status of 500 \(Internal Server Error\)$/;
const API_401 = /^Failed to load resource: the server responded with a status of 401 \(Unauthorized\)$/;
const API_403 = /^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/;
const NETWORK_FAILED = /^Failed to load resource: net::ERR_FAILED$/;
const LOGOUT_ALERT = '로그아웃하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.';
const AUTHENTICATED_USER_RESPONSE = {
  status: 200,
  body: {
    data: {
      userId: 'logout-admin',
      name: '테스트 관리자',
      role: 'ROLE_ADMIN',
      canManageContent: true,
      hasMaxAccess: false,
    },
  },
};
const CORS_HEADERS = {
  'access-control-allow-origin': 'http://127.0.0.1:3000',
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers': 'Content-Type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

async function installRevokeRoute(page, configuredOutcomes) {
  const outcomes = [...configuredOutcomes];
  const posts = [];
  await page.route(AUTH_REVOKE_URL, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    if (request.method() !== 'POST') throw new Error(`unexpected revoke method: ${request.method()}`);
    const outcome = outcomes.shift();
    if (!outcome) throw new Error('no configured revoke outcome remains');
    posts.push({ method: request.method(), postData: request.postData() });
    if (outcome.type === 'network-error') {
      await route.abort('failed');
      return;
    }
    if (outcome.status === 204) {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    await route.fulfill({
      status: outcome.status,
      headers: {
        ...CORS_HEADERS,
        'content-type': outcome.contentType ?? 'application/json',
      },
      body: outcome.body ?? '',
    });
  });
  return posts;
}

async function seedLogoutStorage(page) {
  await page.evaluate(async () => {
    const { writeProgramApplicationDraft } = await import('/src/utils/programApplicationDraft.js');
    const { savePendingNavigation } = await import('/src/utils/pendingNavigation.js');
    writeProgramApplicationDraft('logout-program', 'logout-admin', { answer: '첫 번째 초안' }, { privacy: true });
    writeProgramApplicationDraft('other-program', 'other-user', { answer: '두 번째 초안' }, { privacy: false });
    savePendingNavigation({ returnTo: '/program/logout-program', action: 'apply', programId: 'logout-program' });
    window.sessionStorage.setItem('forest:test:unrelated', 'keep');
  });
}

async function readLogoutStorage(page) {
  return page.evaluate(async () => {
    const { readProgramApplicationDraft } = await import('/src/utils/programApplicationDraft.js');
    const { readPendingNavigation } = await import('/src/utils/pendingNavigation.js');
    return {
      firstDraft: readProgramApplicationDraft('logout-program', 'logout-admin'),
      secondDraft: readProgramApplicationDraft('other-program', 'other-user'),
      pendingNavigation: readPendingNavigation(),
      unrelated: window.sessionStorage.getItem('forest:test:unrelated'),
    };
  });
}

async function openAuthenticatedControls(page, projectName) {
  await page.waitForLoadState('networkidle');
  if (projectName === 'mobile') {
    await page.getByRole('button', { name: '전체 메뉴 열기' }).click();
    const menu = page.getByRole('dialog', { name: '전체 메뉴' });
    await expect(menu.getByText('테스트 관리자님')).toBeVisible();
    await expect(menu.getByRole('link', { name: '관리자' })).toBeVisible();
    return menu.getByRole('button', { name: '로그아웃' });
  }
  const header = page.locator('header');
  await expect(header.getByText('테스트 관리자님')).toBeVisible();
  await expect(header.getByRole('link', { name: '관리자' })).toBeVisible();
  return header.getByRole('button', { name: '로그아웃' });
}

async function expectSignedOut(page, projectName) {
  await expect.poll(() => new URL(page.url()).pathname).toBe('/');
  if (projectName === 'mobile') {
    await page.getByRole('button', { name: '전체 메뉴 열기' }).click();
    const menu = page.getByRole('dialog', { name: '전체 메뉴' });
    await expect(menu.getByRole('button', { name: '로그인' })).toBeVisible();
    await expect(menu.getByRole('button', { name: '로그아웃' })).toHaveCount(0);
    await expect(menu.getByRole('link', { name: '관리자' })).toHaveCount(0);
    return;
  }
  const header = page.locator('header');
  await expect(header.getByRole('button', { name: '로그인' })).toBeVisible();
  await expect(header.getByRole('button', { name: '로그아웃' })).toHaveCount(0);
  await expect(header.getByRole('link', { name: '관리자' })).toHaveCount(0);
}

test('Preview auth session client accepts empty 200 and 204 while propagating HTTP and network failures', async ({
  page,
  organizationApi,
  pageQuality,
}, testInfo) => {
  test.skip(!testInfo.config.metadata.organizationPreviewMode || testInfo.project.name !== 'desktop', 'single-project Preview transport contract');
  organizationApi.setUser(AUTHENTICATED_USER_RESPONSE);
  pageQuality.allowConsoleError(API_401, AUTH_REVOKE_URL);
  pageQuality.allowConsoleError(API_500, AUTH_REVOKE_URL);
  pageQuality.allowConsoleError(NETWORK_FAILED, AUTH_REVOKE_URL);
  pageQuality.allowRequestFailure(AUTH_REVOKE_URL);
  const posts = await installRevokeRoute(page, [
    { status: 200, contentType: 'text/plain', body: '' },
    { status: 204 },
    { status: 401, body: JSON.stringify({ message: 'forced unauthenticated revoke' }) },
    { status: 500, body: JSON.stringify({ message: 'forced revoke failure' }) },
    { type: 'network-error' },
  ]);
  await page.goto('/');

  const attempts = await page.evaluate(async () => {
    const { revokeToken } = await import('/src/services/userService.js');
    const settled = [];
    for (let index = 0; index < 5; index += 1) {
      try {
        const value = await revokeToken();
        settled.push({ state: 'fulfilled', value: value ?? null });
      } catch (error) {
        settled.push({ state: 'rejected', status: error.response?.status ?? null });
      }
    }
    return settled;
  });

  expect(attempts).toEqual([
    { state: 'fulfilled', value: null },
    { state: 'fulfilled', value: null },
    { state: 'rejected', status: 401 },
    { state: 'rejected', status: 500 },
    { state: 'rejected', status: null },
  ]);
  expect(posts).toEqual(Array.from({ length: 5 }, () => ({ method: 'POST', postData: null })));
});

test('successful logout revokes once, signs out, clears Forest logout storage, and retains unrelated storage', async ({
  page,
  organizationApi,
}, testInfo) => {
  test.skip(!['desktop', 'mobile'].includes(testInfo.project.name), 'desktop and mobile logout controls only');
  organizationApi.setUser(AUTHENTICATED_USER_RESPONSE);
  const posts = await installRevokeRoute(page, [{ status: 204 }]);
  await page.goto('/admin?section=intro');
  await seedLogoutStorage(page);
  const logoutButton = await openAuthenticatedControls(page, testInfo.project.name);

  await logoutButton.click();

  await expectSignedOut(page, testInfo.project.name);
  expect(posts).toEqual([{ method: 'POST', postData: null }]);
  expect(await readLogoutStorage(page)).toEqual({
    firstDraft: null,
    secondDraft: null,
    pendingNavigation: null,
    unrelated: 'keep',
  });
});

test('failed revoke preserves the authenticated route and every logout-owned storage entry', async ({
  page,
  organizationApi,
  pageQuality,
}, testInfo) => {
  test.skip(!['desktop', 'mobile'].includes(testInfo.project.name), 'desktop and mobile logout controls only');
  await page.clock.install();
  organizationApi.setUser(AUTHENTICATED_USER_RESPONSE);
  pageQuality.allowConsoleError(API_500, AUTH_REVOKE_URL);
  pageQuality.allowConsoleError(/^서버 로그아웃 실패: AxiosError$/, AUTH_CONTEXT_URL);
  const posts = await installRevokeRoute(page, [
    { status: 500, body: JSON.stringify({ message: 'forced revoke failure' }) },
  ]);
  await page.goto('/admin?section=intro');
  const originalUrl = page.url();
  await seedLogoutStorage(page);
  const logoutButton = await openAuthenticatedControls(page, testInfo.project.name);

  const dialogPromise = page.waitForEvent('dialog');
  const clickPromise = logoutButton.click();
  const dialog = await dialogPromise;
  expect(dialog.message()).toBe(LOGOUT_ALERT);
  await dialog.accept();
  await clickPromise;

  expect(page.url()).toBe(originalUrl);
  const retryButton = await openAuthenticatedControls(page, testInfo.project.name);
  await expect(retryButton).toBeVisible();
  expect(posts).toEqual([{ method: 'POST', postData: null }]);
  const storage = await readLogoutStorage(page);
  expect(storage.firstDraft?.formResponses.answer).toBe('첫 번째 초안');
  expect(storage.secondDraft?.formResponses.answer).toBe('두 번째 초안');
  expect(storage.pendingNavigation).toMatchObject({
    returnTo: '/program/logout-program',
    action: 'apply',
    programId: 'logout-program',
  });
  expect(storage.unrelated).toBe('keep');
  const userRequestCount = organizationApi.getRequests()
    .filter((request) => request === 'GET /users').length;
  await page.clock.fastForward(60_000);
  await expect.poll(() => organizationApi.getRequests()
    .filter((request) => request === 'GET /users').length).toBe(userRequestCount + 1);
});
