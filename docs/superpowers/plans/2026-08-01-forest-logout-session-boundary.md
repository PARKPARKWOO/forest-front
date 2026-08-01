# Forest Logout Session Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Forest의 Preview·로컬·운영 환경에서 실제 SSO 세션 revoke가 동작하도록 고치고, 실패 시 로그인 상태를 보존하며, 로그아웃 전에 시작된 사용자 조회가 세션을 되살리거나 `/login`으로 이동시키지 못하게 한다.

**Architecture:** 일반 콘텐츠 API와 같은 base URL·credential 계약을 쓰되 mutation/401 interceptor가 없는 전용 Axios 세션 클라이언트를 둔다. `AuthContext`는 사용자 조회 세대 번호로 오래된 응답을 폐기하고, 일반 Axios 401 interceptor는 `/users`를 `AuthContext`의 책임으로 남긴다. Playwright는 실제 Layout 버튼, 60초 폴링, 지연된 `/users` 응답까지 브라우저 경계에서 검증한다.

**Tech Stack:** React 18, Axios 1.8, Vite 6, Playwright 1.61, Node.js `node:test`, React Router 7

## Global Constraints

- Preview와 로컬 draft에서 GET/HEAD/OPTIONS 이외의 **콘텐츠 mutation**은 계속 네트워크 전에 차단한다.
- `POST /auth/token/revoke`는 콘텐츠 mutation 정책의 예외가 아니라 별도의 인증 세션 클라이언트 경계로 실행한다.
- 세션 클라이언트는 `baseURL: API_BASE_URL`, `withCredentials: true`만 사용하고 request/response interceptor, 토큰 read/write, reissue를 추가하지 않는다.
- revoke 성공은 빈 body를 포함한 모든 HTTP 2xx로 판정하며 응답 JSON을 읽지 않는다.
- revoke의 네트워크 오류·4xx·5xx는 삼키지 않고 호출자에게 전달하며, 실패 시 인증 state·초안·pending navigation·현재 경로를 유지한다.
- revoke 성공 직후 기존 `/users` 요청 세대를 무효화한 다음 사용자·관리자·MAX 상태와 폴링을 정리한다.
- 로그아웃 전에 시작된 `/users` 200·401·403은 성공한 로그아웃 뒤 state, pending navigation, URL을 변경하지 않는다.
- 공유 `.platformholder.site` HttpOnly 쿠키가 삭제되어 동일 브라우저의 PlatformHolder SSO 서비스가 함께 로그아웃되는 현재 계약을 유지한다.
- Auth 서버, Gateway, Forest 백엔드, 쿠키 속성, React Query 전역 캐시는 변경하지 않는다.
- 새 런타임 의존성을 추가하지 않는다.
- 실제 검증 결과가 나오기 전에는 PRD에 통과 수치나 완료 상태를 기록하지 않는다.
- push, `main` 병합, Vercel Production 배포는 이 계획의 범위 밖이며 실행 직전 별도 사용자 승인이 필요하다.

---

### Task 1: Dedicated auth-session transport and logout UI contract

**Files:**
- Create: `src/config/apiBaseUrl.js`
- Create: `src/authSessionClient.js`
- Create: `tests/unit/authSessionClientBoundary.test.js`
- Create: `tests/e2e/auth-logout.spec.js`
- Modify: `src/axiosInstance.js:1-18`
- Modify: `src/services/userService.js:1-2,57-81`
- Modify: `tests/e2e/organization-directory-admin.spec.js:163-248`
- Modify: `playwright.organization.config.js:11`
- Modify: `package.json:19`

**Interfaces:**
- Consumes: 기존 `VITE_API_BASE_URL`, Vite `import.meta.env.DEV`, `Layout.handleLogout()`, `AuthContext.logout()`, `organizationApi.setUser(response)`.
- Produces: `API_BASE_URL: string`, interceptor가 없는 default-export Axios instance `authSessionClient`, `revokeToken(): Promise<void>`, 실제 로그아웃 브라우저 회귀 파일 `auth-logout.spec.js`.

- [ ] **Step 1: Write the source-boundary test before creating the client**

Create `tests/unit/authSessionClientBoundary.test.js` with this complete content:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const srcDirectory = fileURLToPath(new URL('../../src/', import.meta.url));

async function listJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listJavaScriptFiles(path);
    return /\.(?:js|jsx)$/.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

test('the auth session client has credentials but no content or navigation interceptors', async () => {
  const source = await readFile(join(srcDirectory, 'authSessionClient.js'), 'utf8');
  assert.match(source, /baseURL:\s*API_BASE_URL/);
  assert.match(source, /withCredentials:\s*true/);
  assert.doesNotMatch(source, /interceptors\./);
  assert.doesNotMatch(source, /Authorization|accessToken|refreshToken|reissue/i);
});

test('only userService imports the dedicated auth session client', async () => {
  const importPattern = /from\s+['"][^'"]*authSessionClient(?:\.js)?['"]/;
  const importers = [];

  for (const path of await listJavaScriptFiles(srcDirectory)) {
    const source = await readFile(path, 'utf8');
    if (importPattern.test(source)) importers.push(relative(srcDirectory, path));
  }

  assert.deepEqual(importers.sort(), ['services/userService.js']);
});

test('revokeToken posts through the session client without a deployment guard or body parser', async () => {
  const source = await readFile(join(srcDirectory, 'services/userService.js'), 'utf8');
  assert.match(source, /await authSessionClient\.post\(['"]\/auth\/token\/revoke['"]\)/);
  assert.doesNotMatch(source, /FOREST_MUTATIONS_ENABLED|response\.json\(|\bfetch\s*\(/);
});
```

- [ ] **Step 2: Run the new unit test and verify the missing boundary is RED**

Run:

```bash
node --test tests/unit/authSessionClientBoundary.test.js
```

Expected: FAIL with `ENOENT` for `src/authSessionClient.js`; the production files have not been created yet.

- [ ] **Step 3: Add browser tests for Preview transport, successful desktop/mobile logout, and fail-closed 500 behavior**

First change `playwright.organization.config.js` so the new file is discoverable:

```js
testMatch: /(?:organization-directory-.*|home-hero-admin-save|auth-logout)\.spec\.js/,
```

Change `package.json` so Preview explicitly includes the new file:

```json
"test:e2e:organization:preview": "FOREST_E2E_PREVIEW=true playwright test --config=playwright.organization.config.js tests/e2e/organization-directory-admin.spec.js tests/e2e/auth-logout.spec.js"
```

In `tests/e2e/organization-directory-admin.spec.js`, rename the Preview test to:

```js
test('preview deployment blocks content mutations before the network and keeps the organization double guard', async ({
```

Replace the tail beginning at `expect(globalErrorCode)` through the end of that test with this content. This removes the obsolete expectation that Preview blocks revoke while retaining both content guards:

```js
expect(globalErrorCode).toBe('FOREST_MUTATIONS_DISABLED');
expect(representativeMutationRouteCount).toBe(0);
await expect(page).toHaveURL(editorUrl);
});
```

Create `tests/e2e/auth-logout.spec.js` with this complete content:

```js
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
```

- [ ] **Step 4: Run the Preview transport test and verify the current guard is RED**

Run:

```bash
npm run test:e2e:organization:preview -- --project=desktop --grep "Preview auth session client"
```

Expected: FAIL because all five calls currently reject with `FOREST_MUTATIONS_DISABLED` and the revoke route receives zero POSTs.

- [ ] **Step 5: Implement the shared base URL and dedicated session client**

Create `src/config/apiBaseUrl.js`:

```js
const defaultApiBaseUrl = import.meta.env.DEV
  ? 'http://localhost:8080/api/v1'
  : 'https://forest.platformholder.site/api/v1';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl;
```

Create `src/authSessionClient.js`:

```js
import axios from 'axios';
import { API_BASE_URL } from './config/apiBaseUrl';

const authSessionClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default authSessionClient;
```

At the top of `src/axiosInstance.js`, add the shared configuration import and remove the local `defaultApiBaseUrl` declaration:

```js
import axios from 'axios';
import { isForestMutationMethod } from '../build/organizationWritePolicy';
import { API_BASE_URL } from './config/apiBaseUrl';
import { FOREST_MUTATIONS_ENABLED } from './config/organizationDeployment';
```

Construct the existing instance with the shared value:

```js
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
```

At the top of `src/services/userService.js`, replace the deployment flag import with:

```js
import axiosInstance from '../axiosInstance';
import authSessionClient from '../authSessionClient';
```

Replace `revokeToken()` with:

```js
export const revokeToken = async () => {
  await authSessionClient.post('/auth/token/revoke');
};
```

- [ ] **Step 6: Run focused tests and verify the transport and UI contract are GREEN**

Run:

```bash
node --test tests/unit/authSessionClientBoundary.test.js
npm run test:e2e:organization:preview -- --project=desktop --grep "Preview auth session client"
npm run test:e2e:organization:preview -- --project=desktop --project=mobile --grep "successful logout|failed revoke"
```

Expected: the unit file reports 3 passing tests; the Preview transport test reports 1 pass; success/failure UI tests pass in desktop and mobile with tablet excluded.

- [ ] **Step 7: Inspect and commit the dedicated session boundary**

Run:

```bash
git diff --check
git status --short
git diff -- src/config/apiBaseUrl.js src/authSessionClient.js src/axiosInstance.js src/services/userService.js tests/unit/authSessionClientBoundary.test.js tests/e2e/auth-logout.spec.js tests/e2e/organization-directory-admin.spec.js playwright.organization.config.js package.json
```

Expected: no whitespace errors; only Task 1 files are present; no token, cookie value, or credential is present.

Commit:

```bash
git add src/config/apiBaseUrl.js src/authSessionClient.js src/axiosInstance.js src/services/userService.js tests/unit/authSessionClientBoundary.test.js tests/e2e/auth-logout.spec.js tests/e2e/organization-directory-admin.spec.js playwright.organization.config.js package.json
git commit -m "fix: restore Forest logout session revocation"
```

---

### Task 2: Invalidate stale current-user responses at the logout boundary

**Files:**
- Modify: `tests/e2e/support/mockOrganizationApi.js:8-14,94-111,248-288`
- Modify: `tests/e2e/auth-logout.spec.js`
- Modify: `src/axiosInstance.js:29-47`
- Modify: `src/contexts/AuthContext.jsx:17-55,89-110`

**Interfaces:**
- Consumes: Task 1 `revokeToken(): Promise<void>`, existing 60,000 ms `AuthContext` polling interval, `organizationApi.setUser(response)`.
- Produces: `organizationApi.deferNextUserGet(response): Promise<void>`, `organizationApi.releaseDeferredUserGet(): Promise<void>`, request-generation invalidation in `AuthContext`, `/users` 401 ownership exclusion in the general Axios interceptor.

- [ ] **Step 1: Add a deterministic `/users` response gate to the organization mock**

Near the other gate variables in `tests/e2e/support/mockOrganizationApi.js`, add:

```js
let nextUserGetGate = null;
let deferredUserGetGate = null;
```

Replace the existing `/users` route with:

```js
await page.route(/\/api\/v1\/users(?:[?#].*)?$/, async (route) => {
  const request = route.request();
  requests.push(`${request.method()} /users`);
  if (request.method() !== 'GET') {
    unhandled.push(`${request.method()} /users`);
    return route.fulfill({ status: 405, contentType: 'application/json', body: JSON.stringify({ message: 'method not allowed' }) });
  }
  const forcedStatus = failures.get('/users');
  const gate = nextUserGetGate;
  const response = gate?.response ?? (forcedStatus
    ? { status: forcedStatus, body: { message: 'forced organization test failure: /users' } }
    : structuredClone(userResponse));
  if (gate) {
    nextUserGetGate = null;
    gate.markStarted();
    await gate.released;
  }
  try {
    await route.fulfill({ status: response.status, contentType: 'application/json', body: JSON.stringify(response.body) });
  } finally {
    gate?.markCompleted();
  }
});
```

Add these methods immediately before `setUser(response)` in the returned fixture API:

```js
deferNextUserGet(response = userResponse) {
  if (nextUserGetGate) throw new Error('a user GET is already deferred');
  let release;
  let markStarted;
  let markCompleted;
  const released = new Promise((resolve) => { release = resolve; });
  const started = new Promise((resolve) => { markStarted = resolve; });
  const completed = new Promise((resolve) => { markCompleted = resolve; });
  nextUserGetGate = {
    response: structuredClone(response),
    released,
    release,
    started,
    markStarted,
    completed,
    markCompleted,
  };
  deferredUserGetGate = nextUserGetGate;
  return started;
},
releaseDeferredUserGet() {
  if (!deferredUserGetGate) throw new Error('no deferred user GET');
  const { release, completed } = deferredUserGetGate;
  release();
  deferredUserGetGate = null;
  return completed;
},
```

- [ ] **Step 2: Add real polling races for stale 200, stale 401, and stale 403 responses**

Append this block to `tests/e2e/auth-logout.spec.js`:

```js
for (const scenario of [
  { label: '200', response: AUTHENTICATED_USER_RESPONSE, consoleError: null },
  { label: '401', response: { status: 401, body: { message: 'stale session expired' } }, consoleError: API_401 },
  { label: '403', response: { status: 403, body: { message: 'stale session forbidden' } }, consoleError: API_403 },
]) {
  test(`successful logout ignores a stale ${scenario.label} current-user response`, async ({
    page,
    organizationApi,
    pageQuality,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'single desktop race contract');
    await page.clock.install();
    organizationApi.setUser(AUTHENTICATED_USER_RESPONSE);
    const posts = await installRevokeRoute(page, [{ status: 204 }]);
    await page.goto('/admin?section=intro');
    const logoutButton = await openAuthenticatedControls(page, testInfo.project.name);
    if (scenario.consoleError) pageQuality.allowConsoleError(scenario.consoleError, USERS_API_URL);
    const userRequestStarted = organizationApi.deferNextUserGet(scenario.response);

    await page.clock.fastForward(60_000);
    await userRequestStarted;
    organizationApi.setUser({ status: 403, body: { message: 'anonymous after revoke' } });
    await logoutButton.click();
    await expectSignedOut(page, testInfo.project.name);
    const delayedResponse = page.waitForResponse((response) => (
      USERS_API_URL.test(response.url()) && response.status() === scenario.response.status
    ));
    await organizationApi.releaseDeferredUserGet();
    const response = await delayedResponse;
    await response.finished();
    await page.waitForLoadState('networkidle');
    await page.clock.fastForward(32);

    await expect.poll(() => new URL(page.url()).pathname).toBe('/');
    const header = page.locator('header');
    await expect(header.getByRole('button', { name: '로그인' })).toBeVisible();
    await expect(header.getByRole('button', { name: '로그아웃' })).toHaveCount(0);
    await expect(header.getByRole('link', { name: '관리자' })).toHaveCount(0);
    const pendingNavigation = await page.evaluate(async () => {
      const { readPendingNavigation } = await import('/src/utils/pendingNavigation.js');
      return readPendingNavigation();
    });
    expect(pendingNavigation).toBeNull();
    expect(posts).toEqual([{ method: 'POST', postData: null }]);
    const completedUserRequestCount = organizationApi.getRequests()
      .filter((request) => request === 'GET /users').length;
    await page.clock.fastForward(60_000);
    expect(organizationApi.getRequests().filter((request) => request === 'GET /users'))
      .toHaveLength(completedUserRequestCount);
  });
}
```

- [ ] **Step 3: Run the race tests and verify all three stale-response paths are RED**

Run:

```bash
npm run test:e2e:organization:preview -- --project=desktop --grep "stale (200|401|403) current-user"
```

Expected: the stale 200 case re-renders authenticated/admin UI; the stale 401 case changes the URL through the general Axios interceptor; the stale 403 case changes the URL through `AuthContext`. All three are failures required before the production change.

- [ ] **Step 4: Leave `/users` 401 navigation to AuthContext**

In `src/axiosInstance.js`, add this helper immediately before `axiosInstance.interceptors.response.use`:

```js
const isAuthContextUserRequest = (config) => {
  if (config?.method?.toLowerCase() !== 'get') return false;
  try {
    const requestUrl = new URL(axiosInstance.getUri(config));
    const currentUserUrl = new URL(axiosInstance.getUri({
      ...config,
      url: '/users',
      params: undefined,
    }));
    return requestUrl.origin === currentUserUrl.origin
      && requestUrl.pathname.replace(/\/+$/, '') === currentUserUrl.pathname.replace(/\/+$/, '');
  } catch {
    return false;
  }
};
```

Change the response rejection condition to:

```js
if (
  error.response?.status === 401
  && !isAuthContextUserRequest(error.config)
  && window.location.pathname !== '/login'
) {
```

Do not exempt any other URL or any content mutation. `AuthContext` already handles both 401 and 403 for this exact current-user request.

- [ ] **Step 5: Add request-generation invalidation to AuthContext**

In `src/contexts/AuthContext.jsx`, add the ref beside the existing interval/session refs:

```js
const authRequestGenerationRef = useRef(0);
```

At the first line of `fetchUserData`, capture the generation:

```js
const fetchUserData = useCallback(async () => {
  const requestGeneration = authRequestGenerationRef.current;
  try {
```

Immediately after `await getCurrentUser()` and before logging or setting any state, add:

```js
if (requestGeneration !== authRequestGenerationRef.current) return;
```

At the first line of `catch`, before computing `isSessionExpired`, add the same stale-response exit:

```js
} catch (error) {
  if (requestGeneration !== authRequestGenerationRef.current) return;
  const isSessionExpired = [401, 403].includes(error.response?.status);
```

In `logout()`, immediately after the successful `await revokeToken()` and before any state clear, invalidate all earlier requests:

```js
await revokeToken();
authRequestGenerationRef.current += 1;
```

Keep the increment outside the `catch` path: failed revoke must not invalidate the active session or its polling response.

- [ ] **Step 6: Run the race and existing auth-session tests until GREEN**

Run:

```bash
npm run test:e2e:organization:preview -- --project=desktop --grep "stale (200|401|403) current-user"
npm run test:e2e:organization:preview -- --project=desktop --project=mobile --grep "Preview auth session client|successful logout|failed revoke"
node --test tests/unit/authSessionClientBoundary.test.js
```

Expected: stale 200, 401, and 403 each pass once on desktop; the URL remains `/`, pending navigation stays empty, and all Task 1 transport/UI tests remain green.

- [ ] **Step 7: Inspect and commit stale-response protection**

Run:

```bash
git diff --check
git diff -- tests/e2e/support/mockOrganizationApi.js tests/e2e/auth-logout.spec.js src/axiosInstance.js src/contexts/AuthContext.jsx
```

Expected: the mock captures the `/users` response before waiting; release completes the exact deferred request; generation checks precede every success/error side effect; the generation increments only after revoke success.

Commit:

```bash
git add tests/e2e/support/mockOrganizationApi.js tests/e2e/auth-logout.spec.js src/axiosInstance.js src/contexts/AuthContext.jsx
git commit -m "fix: ignore stale auth checks after logout"
```

---

### Task 3: Full verification, code review, and Forest PRD synchronization

**Files:**
- Verify: all changed frontend files from Tasks 1-2
- Modify only if the implemented truth differs: `/Users/park/Desktop/project/prd/forest/requirements.md`
- Modify only if the implemented truth differs: `/Users/park/Desktop/project/prd/forest/api-spec.md`

**Interfaces:**
- Consumes: both implementation commits and their real test output.
- Produces: reviewed frontend branch with no uncommitted code changes, Forest requirements/API contract synchronized to verified behavior, no push or deployment.

- [ ] **Step 1: Run the complete proportional frontend verification matrix**

Run each command separately so a failure is attributable and no result is hidden:

```bash
npm run test:unit
npm run test:e2e:organization -- tests/e2e/auth-logout.spec.js --project=desktop --project=mobile
npm run test:e2e:organization:preview -- --project=desktop --project=mobile
npm run test:e2e:organization
npm run test:e2e:public:functional
npm run lint
npm run build
VERCEL_ENV=preview npm run build
git diff --check
```

Expected: every command exits 0. Record the actual passed/skipped totals from each Playwright run; do not reuse totals from an older PRD row. Existing non-blocking Vite chunk-size or Browserslist age warnings may be reported but must not be represented as failures.

- [ ] **Step 2: Review the two implementation commits against the approved design**

Read and execute `superpowers:requesting-code-review`, then inspect:

```bash
git show --stat --oneline HEAD~2..HEAD
git diff HEAD~2..HEAD -- src tests/e2e tests/unit playwright.organization.config.js package.json
git grep -n "authSessionClient" -- src
git grep -n "FOREST_MUTATIONS_ENABLED" -- src/services/userService.js
git status --short
```

Expected: reviewer finds no blocking issue; `authSessionClient` has exactly one production importer (`services/userService.js`); `userService.js` has no deployment mutation flag; worktree is clean. A blocking review finding invalidates this completion step: stop, revise this plan with the concrete regression and implementation, then resume from its RED test.

- [ ] **Step 3: Execute the required Forest PRD sync skill once**

Read and execute `/Users/park/Desktop/project/.agents/skills/source-command-prd-sync/SKILL.md` for service **Forest**, using the committed diff and verified results from Steps 1-2 as the only source of truth.

The synchronization must make these exact facts consistent without changing Platform/Auth documents because no backend contract changed:

- `/Users/park/Desktop/project/prd/forest/requirements.md`: F-AUTH-7 remains fail-closed; Preview/draft content writes remain disabled; explicit logout performs real credentialed revoke; successful logout clears Forest auth state, both classes of session data, and ignores stale current-user responses.
- `/Users/park/Desktop/project/prd/forest/api-spec.md`: Preview read-only wording applies to content mutations, not auth-session lifecycle; Forest calls relative `POST /api/v1/auth/token/revoke` through its API base URL; request body is absent; 2xx body is not interpreted; errors propagate.
- Verification rows use only totals produced in Step 1 and say explicitly that no push or Vercel deployment occurred.

Inspect the PRD-only diff:

```bash
git -C /Users/park/Desktop/project/prd diff --check
git -C /Users/park/Desktop/project/prd diff -- forest/requirements.md forest/api-spec.md
git -C /Users/park/Desktop/project/prd status --short
```

Expected: only `forest/requirements.md` and/or `forest/api-spec.md` contain relevant changes; existing unrelated PRD changes, if present, are preserved and excluded from this commit.

- [ ] **Step 4: Commit only the synchronized Forest documents when the skill changed them**

If Step 3 produced a relevant diff, run:

```bash
git -C /Users/park/Desktop/project/prd add forest/requirements.md forest/api-spec.md
git -C /Users/park/Desktop/project/prd commit -m "docs(forest): sync logout session contract"
```

If the skill correctly determines both documents already express the verified contract, do not create an empty commit; record that conclusion with the exact matching sections in the final report.

- [ ] **Step 5: Run final completion checks without publishing**

Read and execute `superpowers:verification-before-completion`, then run:

```bash
git status --short --branch
git log -3 --oneline
git -C /Users/park/Desktop/project/prd status --short --branch
git diff --check
```

Expected: frontend implementation and plan commits are present, no task-owned frontend changes are uncommitted, PRD changes are committed or explicitly unnecessary, and no push/deployment command has run. Report the branch name, commit IDs, actual verification totals, any pre-existing unrelated dirty files, and that deployment still requires separate confirmation.
