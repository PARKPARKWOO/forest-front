# Forest Public Home Draft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first clickable Forest public-home draft with a five-item navigation, regional-brand hero, task-first home sections, and deterministic Playwright coverage without touching production data.

**Architecture:** Keep `UserHome` as the React Query coordinator and extract presentational home and navigation components behind stable props. Add a preview-only flag, semantic Forest color tokens, and Playwright route mocks so the draft is reproducible without the backend. Preserve current routes and API envelopes; only the API base URL becomes environment-overridable with the current DEV/production defaults unchanged.

**Tech Stack:** React 18, React Router 7.4, TanStack Query 5, Tailwind CSS 3.4, Vite 6, Playwright Chromium, `@axe-core/playwright`

## Global Constraints

- Run every `npm`, `npx`, `node`, and `git` command in this plan with tool working directory `/Users/park/Desktop/project/cms-react-project`. Before Task 1, run `git status --short`, `git branch --show-current`, and `git rev-parse HEAD`; stop on overlapping unrelated changes and record the exact starting commit as `PUBLIC_DRAFT_BASE_SHA` in the execution notes.
- Keep `src/assets/logo.png` unchanged.
- Use `#166534` for `forest-primary`, `#14532d` for `forest-strong`, `#f8faf5` for `forest-surface`, and `#b45309` for `forest-accent`.
- Keep body text at 18px/1.7 or larger and every primary interactive target at least 48×48px.
- Test 1440×900 desktop, 768×1024 tablet, and 390×844 mobile; also test 200% zoom reflow and reduced motion.
- Use only current banner assets or `public/draft/forest-hero-placeholder.svg`; do not introduce an unapproved regional photograph.
- Do not invent program target, location, current-applicant, or remaining-seat values. The first draft may show status, event date, application period, and maximum participants only.
- The first public review covers `/`, the common header, and link arrival at existing `/programs/participate`, `/news/notice`, and `/news/activities`; it does not claim those destination pages were redesigned.
- Show `로컬 초안` whenever `VITE_DRAFT_MODE=true`.
- Do not send write requests to any backend. Playwright must fulfill every `/api/v1/**` request locally and fail on an unhandled API route.
- Do not modify `gradle.properties`, push, create a PR, or deploy.

---

## File Structure

### Create

- `playwright.config.js` — three Chromium viewport projects and the local Vite web server.
- `.env.draft` — non-secret preview flag and loopback API URL.
- `public/draft/forest-hero-placeholder.svg` — rights-safe local hero placeholder.
- `src/components/DraftModeBadge.jsx` — visible local-draft marker.
- `src/components/ui/ActionLink.jsx` — accessible primary/secondary/quiet link primitive.
- `src/components/ui/SectionHeading.jsx` — consistent section title and optional action.
- `src/navigation/publicNavigation.js` — five top-level entries plus dynamic-board mapping.
- `src/components/layout/DesktopNav.jsx` — desktop navigation with active-parent and keyboard behavior.
- `src/components/layout/MobileNav.jsx` — focus-trapped recursive mobile navigation.
- `src/components/home/PublicHomeHero.jsx` — simplified public hero that preserves the banner data contract.
- `src/components/home/HomeProgramSection.jsx` — program cards using existing API fields only.
- `src/components/home/HomeNoticeSection.jsx` — compact, two-line notice list.
- `src/components/home/HomeActivitySection.jsx` — recent activity cards.
- `src/components/home/HomeParticipationSection.jsx` — separate donation and volunteer actions.
- `src/components/home/HomeCommunitySection.jsx` — compact preservation of dynamic-board content.
- `src/utils/homeContent.js` — pure sorting, thumbnail, and available-field selection helpers.
- `src/pages/NotFoundPage.jsx` — explicit invalid-route recovery.
- `tests/e2e/fixtures/publicHomeData.js` — frozen API responses.
- `tests/e2e/fixtures/publicTest.js` — mandatory API and page-quality fixture for every public spec.
- `tests/draft/publicApiResponses.js` — shared deterministic response resolver.
- `tests/draft/draftApiPlugin.js` — Vite middleware for a manually clickable draft.
- `tests/e2e/support/mockForestApi.js` — strict Playwright API router.
- `tests/e2e/support/pageQuality.js` — unexpected console/request failure collector.
- `tests/e2e/support/publicReady.js` — shared shell/home readiness and text-legibility assertions.
- `tests/e2e/public-home.spec.js` — home, navigation, responsiveness, and accessibility coverage.
- `tests/e2e/public-home-states.spec.js` — loading/error/empty recovery coverage.

### Modify

- `package.json`, `package-lock.json` — Playwright dependencies and scripts.
- `vite.config.js` — keep port 3000 and mount the draft API only in draft mode.
- `eslint.config.js` — Node globals for Playwright and draft-server files.
- `index.html` — approved green theme color and no Vite favicon.
- `src/axiosInstance.js` — support `VITE_API_BASE_URL` with unchanged safe defaults.
- `src/contexts/AuthContext.jsx` — do not log an initial anonymous 401/403 as an unexpected console error.
- `src/services/userService.js` — remove its duplicate anonymous-session error log.
- `.gitignore` — ignore Playwright-generated reports and result directories.
- `tailwind.config.cjs`, `src/index.css` — semantic brand tokens and skip-link styles.
- `src/components/Layout.jsx` — navigation orchestration, skip link, draft badge, and extracted nav components.
- `src/pages/user/UserHome.jsx` — query coordination and approved section order.
- `src/routes.jsx` — explicit `NotFoundPage` instead of silent home redirect.

---

### Task 1: Install Playwright and lock a production-safe draft harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/axiosInstance.js:8-15`
- Modify: `src/contexts/AuthContext.jsx:21-51`
- Modify: `src/services/userService.js`
- Modify: `.gitignore`
- Create: `.env.draft`
- Create: `playwright.config.js`
- Create: `tests/e2e/fixtures/publicHomeData.js`
- Create: `tests/e2e/fixtures/publicTest.js`
- Create: `tests/draft/publicApiResponses.js`
- Create: `tests/draft/draftApiPlugin.js`
- Create: `tests/e2e/support/mockForestApi.js`
- Create: `tests/e2e/support/pageQuality.js`
- Create: `tests/e2e/support/publicReady.js`
- Create: `tests/e2e/public-home.spec.js`
- Modify: `vite.config.js`
- Modify: `eslint.config.js`

**Interfaces:**
- Produces: `installPublicApiMocks(page, overrides = {}) -> Promise<{ setData, fail, recover, assertHandled }>`.
- Produces: `watchPageQuality(page) -> { allowConsoleError(pattern), assertClean(): void }`.
- Produces: `VITE_API_BASE_URL`, defaulting to the current DEV/production URLs when absent.

- [ ] **Step 1: Install and record the allowed test dependencies**

Run:

```bash
npm install --save-dev @playwright/test @axe-core/playwright
npx playwright install chromium
```

Expected: `package.json` and `package-lock.json` contain both packages and Chromium installation finishes successfully. If the browser download needs network approval, request it at execution time using the already-approved Playwright scope.

- [ ] **Step 2: Add exact scripts and the three-project Playwright config**

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "draft": "vite --host 127.0.0.1 --mode draft",
    "test:e2e:public": "playwright test tests/e2e/public-home.spec.js tests/e2e/public-home-states.spec.js",
    "test:e2e:public:update": "playwright test tests/e2e/public-home.spec.js --update-snapshots"
  }
}
```

Create `.env.draft`:

```dotenv
VITE_DRAFT_MODE=true
VITE_API_BASE_URL=/api/v1
```

Create `playwright.config.js`:

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    { name: 'tablet', use: { browserName: 'chromium', viewport: { width: 768, height: 1024 } } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'npm run draft',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
```

- [ ] **Step 3: Add frozen fixture data and a strict API router**

Create `tests/e2e/fixtures/publicHomeData.js` with this public shape:

```js
const image = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="700"%3E%3Crect width="1200" height="700" fill="%23166534"/%3E%3C/svg%3E';

export const publicHomeData = {
  userStatus: 403,
  categories: [
    { id: '101', name: '숲 이야기', children: [
      { id: '111', name: '지역 숲 기록', children: [] },
    ] },
    { id: '102', name: '시민 게시판', children: [] },
  ],
  banner: {
    banners: [{
      badgeText: '전북의 숲, 시민과 함께',
      title: '숲을 지키는 가장 가까운 방법',
      description: '전북생명의숲의 활동과 시민 참여 프로그램을 만나보세요.',
      backgroundImageUrl: image,
      sideImageUrl: image,
      titleColor: '#FFFFFF',
      descriptionColor: '#F0FDF4',
      badgeTextColor: '#F0FDF4',
      primaryButtonText: '단체 소개',
      primaryButtonLink: '/intro',
      secondaryButtonText: '프로그램 참여',
      secondaryButtonLink: '/programs/participate',
      sideTitle: '',
      sideDescription: '',
    }],
    autoSlideSeconds: 5,
  },
  programs: [{
    id: 'program-1',
    title: '전북 숲길 시민 프로그램',
    content: '<p>숲길을 함께 걸어요.</p>',
    category: 'PARTICIPATE',
    status: 'IN_PROGRESS',
    applyStartDate: '2026-07-01T09:00:00',
    applyEndDate: '2026-07-30T18:00:00',
    eventDate: '2026-08-02T10:00:00',
    maxParticipants: 20,
  }],
  notices: [{
    id: 'notice-1',
    title: '여름 숲 프로그램 참가 안내와 준비물 공지',
    authorName: '전북생명의숲',
    updatedAt: '2026-07-18T10:00:00',
    dynamicFields: { important: true },
  }],
  activities: [{
    id: 'activity-1',
    title: '시민과 함께한 전북 숲 돌봄 활동',
    content: `<p><img src="${image}" alt="" /></p>`,
    thumbnail: image,
    updatedAt: '2026-07-17T10:00:00',
  }],
  boardPosts: {
    '101': [{ id: 'post-101', title: '숲 이야기 첫 글', updatedAt: '2026-07-16T10:00:00', content: '' }],
    '111': [{ id: 'post-111', title: '지역 숲 기록 첫 글', updatedAt: '2026-07-15T10:00:00', content: '' }],
    '102': [],
  },
};
```

Create `tests/draft/publicApiResponses.js` so the manual draft and Playwright use one contract:

```js
import { publicHomeData } from '../e2e/fixtures/publicHomeData.js';

export function resolvePublicDraftResponse(method, rawUrl, overrides = {}) {
  const data = { ...publicHomeData, ...overrides };
  const url = new URL(rawUrl, 'http://draft.local');
  const path = url.pathname.replace(/^\/api\/v1/, '');
  if (method !== 'GET') return { status: 405, body: { message: `draft blocks ${method} ${path}` } };
  if (path === '/users') return { status: data.userStatus, body: { message: 'anonymous' } };
  if (path === '/categories') return { status: 200, body: { data: data.categories } };
  if (path === '/home-banner') return { status: 200, body: { data: data.banner } };
  if (path === '/program/information') {
    return { status: 200, body: { data: { contents: data.programs, hasNextPage: false, totalCount: data.programs.length } } };
  }
  const programId = path.match(/^\/program\/information\/([^/]+)$/)?.[1];
  if (programId) {
    const program = data.programs.find(({ id }) => id === programId);
    return program
      ? { status: 200, body: { data: program } }
      : { status: 404, body: { message: 'program not found' } };
  }
  if (path.startsWith('/program/form/program/')) return { status: 200, body: { data: null } };
  if (path === '/notice') {
    return { status: 200, body: { data: { contents: data.notices, hasNextPage: false, totalCount: 0 } } };
  }
  const noticeId = path.match(/^\/notice\/([^/]+)$/)?.[1];
  if (noticeId) {
    const notice = data.notices.find(({ id }) => id === noticeId);
    return notice
      ? { status: 200, body: { data: notice } }
      : { status: 404, body: { message: 'notice not found' } };
  }
  if (path === '/posts/0') {
    return { status: 200, body: { data: { contents: data.activities, hasNextPage: false, totalCount: 0 } } };
  }
  const boardMatch = path.match(/^\/posts\/(\d+)$/);
  if (boardMatch) {
    const posts = data.boardPosts[boardMatch[1]] || [];
    return { status: 200, body: { data: { contents: posts, hasNextPage: false, totalCount: 0 } } };
  }
  const detailMatch = path.match(/^\/posts\/detail\/(\d+)\/([^/]+)$/);
  if (detailMatch) {
    const [, categoryId, postId] = detailMatch;
    const post = (categoryId === '0' ? data.activities : data.boardPosts[categoryId] || [])
      .find(({ id }) => id === postId);
    return post
      ? { status: 200, body: { data: { ...post, categoryId } } }
      : { status: 404, body: { message: 'post not found' } };
  }
  return { status: 501, body: { message: `unhandled draft API: ${path}` } };
}
```

Create `tests/draft/draftApiPlugin.js`:

```js
import { resolvePublicDraftResponse } from './publicApiResponses.js';

export function draftApiPlugin() {
  return {
    name: 'forest-draft-api',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!request.url?.startsWith('/api/v1/')) return next();
        const result = resolvePublicDraftResponse(request.method, request.url);
        response.statusCode = result.status;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.end(JSON.stringify(result.body));
      });
    },
  };
}
```

Replace `vite.config.js` with a mode-aware config that does not mount this middleware in normal development or production:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { draftApiPlugin } from './tests/draft/draftApiPlugin.js';

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'draft' ? [draftApiPlugin()] : [])],
  server: {
    port: 3000,
    strictPort: true,
    proxy: mode === 'draft' ? undefined : {
      '/api': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
    },
  },
  define: { global: 'globalThis' },
  resolve: { alias: { crypto: 'crypto-browserify' } },
}));
```

Create `tests/e2e/support/mockForestApi.js`:

```js
import { expect } from '@playwright/test';
import { resolvePublicDraftResponse } from '../../draft/publicApiResponses.js';

export async function installPublicApiMocks(page, overrides = {}) {
  let currentData = { ...overrides };
  const failures = new Map();
  const unhandled = [];
  const writeAttempts = [];
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
```

Create `tests/e2e/fixtures/publicTest.js` so no public spec can forget the quality or unhandled-route checks:

```js
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
```

Extend `eslint.config.js` with a Node-specific block after the existing browser block so Node globals win for these files:

```js
{
  files: ['playwright.config.js', 'vite.config.js', 'tests/**/*.{js,mjs}'],
  languageOptions: { globals: { ...globals.node, ...globals.browser } },
},
```

Also extend ESLint ignores to `['dist', 'playwright-report', 'test-results']` and add `/playwright-report/` plus `/test-results/` to `.gitignore`.

Create `tests/e2e/support/pageQuality.js`:

```js
import { expect } from '@playwright/test';

export function watchPageQuality(page) {
  const errors = [];
  const allowedConsoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push({ type: 'console', text: message.text() });
  });
  page.on('pageerror', (error) => errors.push({ type: 'pageerror', text: error.message }));
  page.on('requestfailed', (request) => errors.push({ type: 'requestfailed', text: request.url() }));
  return {
    allowConsoleError(pattern) {
      if (!(pattern instanceof RegExp)) throw new TypeError('console allowlist entry must be a RegExp');
      allowedConsoleErrors.push(pattern);
    },
    assertClean() {
      const unexpected = errors.filter(({ type, text }) => (
        type !== 'console' || !allowedConsoleErrors.some((pattern) => pattern.test(text))
      ));
      expect(unexpected, unexpected.map(({ type, text }) => `${type}: ${text}`).join('\n')).toEqual([]);
    },
  };
}
```

Create `tests/e2e/support/publicReady.js`:

```js
import { expect } from '@playwright/test';

export async function waitForPublicShellReady(page) {
  await expect(page.getByRole('heading', { level: 1, name: '숲을 지키는 가장 가까운 방법' })).toBeVisible();
}

export async function waitForPublicHomeReady(page) {
  await waitForPublicShellReady(page);
  await expect(page.getByRole('article', { name: '전북 숲길 시민 프로그램' })).toBeVisible();
  await expect(page.getByText('여름 숲 프로그램 참가 안내와 준비물 공지')).toBeVisible();
  await expect(page.getByRole('article', { name: '시민과 함께한 전북 숲 돌봄 활동' })).toBeVisible();
  await expect(page.getByText('숲 이야기 첫 글')).toBeVisible();
}

export async function expectReadableText(locator) {
  const metrics = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return { fontSize: Number.parseFloat(style.fontSize), lineHeight: Number.parseFloat(style.lineHeight) };
  });
  expect(metrics.fontSize).toBeGreaterThanOrEqual(18);
  expect(metrics.lineHeight / metrics.fontSize).toBeGreaterThanOrEqual(1.7);
}
```

- [ ] **Step 4: Write the first failing anonymous-home quality test**

Create the initial `tests/e2e/public-home.spec.js`; importing `pageQuality` activates the automatic assertion:

```js
import { test, expect } from './fixtures/publicTest.js';
import { waitForPublicShellReady } from './support/publicReady.js';

test('anonymous visitor sees the home without unexpected errors', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  await page.goto('/');
  await waitForPublicShellReady(page);
});
```

- [ ] **Step 5: Run the test and verify the expected failure**

Run:

```bash
npm run test:e2e:public -- --project=desktop --grep "anonymous visitor"
```

Expected: FAIL because the initial anonymous `/users` 403 is logged with `console.error` by `AuthContext`.

- [ ] **Step 6: Make API URL injection and anonymous logging minimal and safe**

Replace the Axios base URL expression in `src/axiosInstance.js` with:

```js
const defaultApiBaseUrl = import.meta.env.DEV
  ? 'http://localhost:8080/api/v1'
  : 'https://forest.platformholder.site/api/v1';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl,
  withCredentials: true,
});
```

In `AuthContext.jsx`, replace the unconditional error log in the catch block with:

```js
const isSessionExpired = [401, 403].includes(error.response?.status);
if (!isSessionExpired) {
  console.error('사용자 정보 로드 실패:', error);
}
```

Keep all existing state resets and expired-session redirect logic unchanged.

Also remove the duplicate `try/catch` from `getCurrentUser` in `src/services/userService.js`; service callers own expected-session logging:

```js
export const getCurrentUser = async () => {
  const response = await axiosInstance.get('/users');
  return response.data.data;
};
```

- [ ] **Step 7: Run the focused test and the production build**

Run:

```bash
npm run test:e2e:public -- --project=desktop --grep "anonymous visitor"
npm run build
```

Expected: the focused Playwright test PASSes and Vite reports a successful production build.

- [ ] **Step 8: Commit the harness**

```bash
git add package.json package-lock.json .env.draft .gitignore playwright.config.js vite.config.js eslint.config.js src/axiosInstance.js src/contexts/AuthContext.jsx src/services/userService.js tests
git commit -m "test: add isolated Forest public UI harness"
```

---

### Task 2: Add measurable brand tokens and the visible draft boundary

**Files:**
- Modify: `tailwind.config.cjs:7-22`
- Modify: `src/index.css:5-41`
- Modify: `src/components/Layout.jsx:277-331`
- Modify: `index.html:5,36`
- Create: `src/components/DraftModeBadge.jsx`
- Create: `src/components/ui/ActionLink.jsx`
- Create: `src/components/ui/SectionHeading.jsx`
- Create: `public/draft/forest-hero-placeholder.svg`
- Modify: `tests/e2e/public-home.spec.js`

**Interfaces:**
- Produces: `ActionLink({ to, href, variant, children, className, ...props })`.
- Produces: `SectionHeading({ id, title, description, actionLabel, actionTo })`.
- Produces: `DraftModeBadge()` which renders only for `VITE_DRAFT_MODE=true`.

- [ ] **Step 1: Add a failing token and draft-marker test**

Append:

```js
test('draft exposes its boundary and uses the approved primary color', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  await page.goto('/');
  await expect(page.getByText('로컬 초안', { exact: true })).toBeVisible();
  const cta = page.getByRole('link', { name: '프로그램 참여' }).first();
  await expect(cta).toHaveCSS('background-color', 'rgb(22, 101, 52)');
  expect((await cta.boundingBox()).height).toBeGreaterThanOrEqual(48);
});
```

- [ ] **Step 2: Verify it fails**

Run: `npm run test:e2e:public -- --project=desktop --grep "draft exposes"`

Expected: FAIL because the draft badge and semantic primary CTA do not exist.

- [ ] **Step 3: Add the exact semantic tokens**

Extend `tailwind.config.cjs`:

```js
forest: {
  primary: '#166534',
  strong: '#14532d',
  surface: '#f8faf5',
  accent: '#b45309',
},
```

Add to `:root` in `src/index.css`:

```css
:root {
  --color-brand-primary: #166534;
  --color-brand-strong: #14532d;
  --color-brand-surface: #f8faf5;
  --color-accent: #b45309;
  --color-border-subtle: #dbe5d8;
  --color-focus-ring: #166534;
}

.skip-link {
  position: fixed;
  left: 1rem;
  top: 1rem;
  z-index: 100;
  transform: translateY(-200%);
  border-radius: 0.5rem;
  background: var(--color-brand-strong);
  color: #fff;
  padding: 0.75rem 1rem;
}

.skip-link:focus { transform: translateY(0); }

:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Replace the existing hard-coded `#15803d` focus outline with `var(--color-focus-ring)` so the declared token is actually used.

- [ ] **Step 4: Create the primitives and badge**

Create `src/components/DraftModeBadge.jsx`:

```jsx
export default function DraftModeBadge() {
  if (import.meta.env.VITE_DRAFT_MODE !== 'true') return null;
  return (
    <div className="fixed bottom-4 left-4 z-[90] rounded-full bg-amber-700 px-4 py-2 text-lg font-bold leading-[1.7] text-white shadow-lg" role="status">
      로컬 초안
    </div>
  );
}
```

Create `src/components/ui/ActionLink.jsx`:

```jsx
import { Link } from 'react-router-dom';

const variants = {
  primary: 'bg-forest-primary text-white hover:bg-forest-strong',
  secondary: 'border-2 border-forest-primary bg-white text-forest-strong hover:bg-green-50',
  quiet: 'text-forest-strong underline decoration-2 underline-offset-4 hover:text-green-700',
};

export default function ActionLink({ to, href, variant = 'primary', className = '', children, ...props }) {
  const classes = `accessible-touch-target inline-flex items-center justify-center rounded-xl px-6 py-3 text-lg font-bold ${variants[variant]} ${className}`.trim();
  if (href) return <a href={href} className={classes} {...props}>{children}</a>;
  return <Link to={to} className={classes} {...props}>{children}</Link>;
}
```

Create `src/components/ui/SectionHeading.jsx`:

```jsx
import ActionLink from './ActionLink';

export default function SectionHeading({ id, title, description, actionLabel, actionTo }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id={id} className="text-3xl font-bold leading-tight text-gray-950">{title}</h2>
        {description && <p className="mt-2 max-w-3xl text-lg leading-[1.7] text-gray-700">{description}</p>}
      </div>
      {actionLabel && <ActionLink to={actionTo} variant="quiet">{actionLabel}</ActionLink>}
    </div>
  );
}
```

Add `<DraftModeBadge />` once inside Layout's outermost container.

Remove the Vite favicon line from `index.html` and change the existing theme color to:

```html
<meta name="theme-color" content="#166534" />
```

- [ ] **Step 5: Add the rights-safe SVG placeholder**

Create `public/draft/forest-hero-placeholder.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-labelledby="title desc">
  <title id="title">전북 숲 활동 사진 자리</title>
  <desc id="desc">승인된 지역 활동 사진으로 교체할 로컬 초안용 배경</desc>
  <rect width="1600" height="900" fill="#14532d"/>
  <path d="M0 650 280 390 520 610 790 300 1080 620 1320 420 1600 690V900H0Z" fill="#166534"/>
  <circle cx="1280" cy="190" r="90" fill="#f8faf5" opacity=".78"/>
</svg>
```

- [ ] **Step 6: Run and commit**

Run:

```bash
npm run test:e2e:public -- --project=desktop --grep "draft exposes"
npm run lint
```

Expected: PASS and ESLint exits with zero warnings.

```bash
git add tailwind.config.cjs src/index.css index.html src/components/DraftModeBadge.jsx src/components/ui src/components/Layout.jsx public/draft/forest-hero-placeholder.svg tests/e2e/public-home.spec.js
git commit -m "feat: add Forest draft design foundations"
```

---

### Task 3: Reduce public navigation to five task-oriented groups

**Files:**
- Create: `src/navigation/publicNavigation.js`
- Create: `src/components/layout/DesktopNav.jsx`
- Create: `src/components/layout/MobileNav.jsx`
- Modify: `src/components/Layout.jsx:19-176,331-699`
- Modify: `tests/e2e/public-home.spec.js`

**Interfaces:**
- Produces: `buildPublicNavigation(dynamicCategories = []) -> Array<{id,name,path,children}>`.
- Produces: `DesktopNav({ items, pathname })`.
- Produces: `MobileNav({ isOpen, items, pathname, isLoading, auth, onClose, onLogin, onLogout, triggerRef })`.
- Keeps: `Layout({ children, showLoginModal, setShowLoginModal })` unchanged.

- [ ] **Step 1: Write failing navigation tests**

Append:

```js
test('desktop navigation has five groups, keyboard submenu access, and active parent', async ({ page, forestApi, pageQuality }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop navigation only');
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  await page.goto('/news/notice');
  const nav = page.getByRole('navigation', { name: '주요 메뉴' });
  await expect(nav.locator(':scope > ul > li > a')).toHaveCount(5);
  const news = nav.getByRole('link', { name: '소식', exact: true });
  await expect(news).toHaveAttribute('aria-current', 'page');
  await news.focus();
  await page.keyboard.press('Tab');
  await expect(nav.getByRole('link', { name: '공지사항' })).toBeFocused();
  expect((await nav.getByRole('link', { name: '공지사항' }).boundingBox()).height).toBeGreaterThanOrEqual(48);
});

test('mobile keyboard menu preserves nested boards and restores focus', async ({ page, forestApi, pageQuality }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile drawer only');
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  await page.goto('/');
  await waitForPublicShellReady(page);
  const trigger = page.getByRole('button', { name: '전체 메뉴 열기' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const newsToggle = page.getByRole('button', { name: '소식 하위 메뉴 펼치기' });
  await newsToggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: '숲 이야기' })).toBeVisible();
  const boardToggle = page.getByRole('button', { name: '숲 이야기 하위 메뉴 펼치기' });
  await boardToggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: '지역 숲 기록' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('skip link moves keyboard focus to main content', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  await page.goto('/');
  await waitForPublicShellReady(page);
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: '본문으로 건너뛰기' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});
```

- [ ] **Step 2: Verify both fail**

Run: `npm run test:e2e:public -- --project=desktop --project=mobile --grep "navigation|mobile keyboard menu|skip link"`

Expected: FAIL because the desktop still renders six static groups plus dynamic top-level entries.

- [ ] **Step 3: Create the single navigation source of truth**

Create `src/navigation/publicNavigation.js`:

```js
const BASE = [
  { id: 'intro', name: '단체소개', path: '/intro', children: [
    { id: 'intro-greeting', name: '인사말', path: '/intro/greeting' },
    { id: 'intro-declaration', name: '창립선언문', path: '/intro/declaration' },
    { id: 'intro-people', name: '함께하는이들', path: '/intro/people' },
    { id: 'intro-activities', name: '주요활동', path: '/intro/activities' },
    { id: 'intro-location', name: '오시는 길', path: '/intro/location' },
  ] },
  { id: 'programs', name: '참여 프로그램', path: '/programs', children: [
    { id: 'programs-participate', name: '참여 프로그램', path: '/programs/participate' },
    { id: 'programs-guide', name: '숲 해설가 양성교육', path: '/programs/guide' },
    { id: 'programs-volunteer', name: '자원봉사활동 신청', path: '/programs/volunteer' },
  ] },
  { id: 'news', name: '소식', path: '/news', children: [
    { id: 'news-notice', name: '공지사항', path: '/news/notice' },
    { id: 'news-activities', name: '전북생명의숲 활동보기', path: '/news/activities' },
  ] },
  { id: 'resources', name: '자료실', path: '/resources', children: [
    { id: 'resources-documents', name: '문서자료실', path: '/resources/documents' },
    { id: 'resources-jbforest', name: '전북생명의숲자료실', path: '/resources/jbforest' },
  ] },
  { id: 'donation', name: '후원하기', path: '/donation', children: [
    { id: 'donation-individual', name: '후원 신청', path: '/donation/individual' },
    { id: 'esg-activities', name: '기업 사회공헌활동', path: '/esg/activities' },
    { id: 'esg-report', name: '기업 ESH 보고서', path: '/esg/report' },
  ] },
];

export const isNavigationItemActive = (item, pathname) => (
  pathname === item.path
  || pathname.startsWith(`${item.path}/`)
  || item.children?.some((child) => isNavigationItemActive(child, pathname))
);

const mapDynamicCategory = (category) => ({
  id: `board-${category.id}`,
  name: category.name,
  path: `/category/${category.id}`,
  children: Array.isArray(category.children) ? category.children.map(mapDynamicCategory) : [],
});

export function buildPublicNavigation(dynamicCategories = []) {
  return BASE.map((item) => item.id === 'news' ? {
    ...item,
    children: [
      ...item.children,
      ...dynamicCategories.map(mapDynamicCategory),
    ],
  } : item);
}
```

- [ ] **Step 4: Extract desktop and mobile rendering without changing auth behavior**

Move the complete desktop `<nav>` tree currently inside `Layout` into `DesktopNav.jsx`, including submenu visibility on both pointer hover and `focus-within`. Remove the old static-category and second dynamic-category loops and render the supplied recursive `items` only. Top-level links use:

```jsx
aria-current={isNavigationItemActive(item, pathname) ? 'page' : undefined}
```

Every desktop top-level and submenu anchor uses `min-h-12 px-4 text-lg`; submenu containers have a visible border and do not close while focus remains inside. Recursive active state comes only from `isNavigationItemActive`.

Move the complete existing mobile overlay, panel, close button, auth actions, body scroll lock, and recursive category item into `MobileNav.jsx`. Give the panel `role="dialog"`, `aria-modal="true"`, and `aria-label="전체 메뉴"`. The recursive item renders a 48px link and, when children exist, a separate 48px expand button labeled `<name> 하위 메뉴 펼치기/접기`; it calls itself for every nested `children` array. Use the supplied `items` once and remove the second dynamic loop.

Export `DesktopNav({ items, pathname })` and `MobileNav({ isOpen, items, pathname, isLoading, auth, onClose, onLogin, onLogout, triggerRef })`. Inside `MobileNav`, create `containerRef` and `closeRef`, call `useFocusTrap({ containerRef, initialFocusRef: closeRef, isActive: isOpen, onEscape: onClose })`, and rely on the hook's captured trigger focus for restoration. Return `null` when closed only after the exit transition is removed; the approved reduced-motion CSS makes the remaining transitions effectively immediate for reduced-motion users.

- [ ] **Step 5: Wire Layout and add the skip link**

In Layout:

```jsx
const navigationItems = useMemo(
  () => buildPublicNavigation(Array.isArray(categories) ? categories : []),
  [categories],
);
```

Render before the fixed header:

```jsx
<a href="#main-content" className="skip-link">본문으로 건너뛰기</a>
```

Replace both old navigation loops with `DesktopNav` and `MobileNav`, then change main to:

```jsx
<main id="main-content" tabIndex="-1" className={mainClassName}>{children}</main>
```

- [ ] **Step 6: Run desktop/mobile tests and commit**

Run:

```bash
npm run test:e2e:public -- --project=desktop --project=mobile --grep "navigation|mobile keyboard menu|skip link"
npm run lint
```

Expected: all focused tests PASS and lint has zero warnings.

```bash
git add src/navigation src/components/layout src/components/Layout.jsx tests/e2e/public-home.spec.js
git commit -m "feat: simplify Forest public navigation"
```

---

### Task 4: Replace the auto-rotating hero with a calm task-first hero

**Files:**
- Create: `src/components/home/PublicHomeHero.jsx`
- Modify: `src/pages/user/UserHome.jsx:17-32,134-245`
- Modify: `tests/e2e/public-home.spec.js`

**Interfaces:**
- Produces: `PublicHomeHero({ banners })`.
- Consumes the existing banner fields without changing `HomeBannerHero({ banner, isPreview, className })`, so the admin preview remains isolated.

- [ ] **Step 1: Add failing hero behavior tests**

Append:

```js
test('hero makes program participation primary and never auto-advances', async ({ page, forestApi, pageQuality }) => {
  expect(pageQuality).toBeDefined();
  forestApi.setData({
    banner: { ...publicHomeData.banner, banners: [
      publicHomeData.banner.banners[0],
      { ...publicHomeData.banner.banners[0], title: '두 번째 배너' },
    ] },
  });
  await page.goto('/');
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toHaveText(/숲을 지키는/);
  await expectReadableText(page.getByText('전북생명의숲의 활동과 시민 참여 프로그램을 만나보세요.'));
  await page.waitForTimeout(5500);
  await expect(heading).toHaveText(/숲을 지키는/);
  await expect(page.getByRole('link', { name: '프로그램 참여' }).first()).toHaveAttribute('href', '/programs/participate');
  await page.getByRole('button', { name: '다음 배너' }).click();
  await expect(heading).toHaveText('두 번째 배너');
});
```

At the top of the test file, add the fixture import and replace the existing readiness import so only names first used by this task are present:

```js
import { publicHomeData } from './fixtures/publicHomeData.js';
import { expectReadableText, waitForPublicShellReady } from './support/publicReady.js';
```

- [ ] **Step 2: Verify the auto-advance failure**

Run: `npm run test:e2e:public -- --project=desktop --grep "hero makes"`

Expected: FAIL after 5.5 seconds because the current interval advances automatically and program participation is secondary.

- [ ] **Step 3: Create the complete public-only hero**

Create `PublicHomeHero.jsx` exactly as a manual-only component; it contains no effect, interval, or timeout:

```jsx
import { useState } from 'react';
import ActionLink from '../ui/ActionLink';

const configuredActions = (banner) => [
  { text: banner.primaryButtonText, link: banner.primaryButtonLink },
  { text: banner.secondaryButtonText, link: banner.secondaryButtonLink },
].filter((action) => action.text && action.link);

const selectActions = (banner) => {
  const actions = configuredActions(banner);
  const primary = actions.find(({ link }) => link.startsWith('/programs'))
    || { text: '프로그램 참여', link: '/programs/participate' };
  return { primary, secondary: actions.find(({ link }) => link !== primary.link) };
};

export default function PublicHomeHero({ banners = [] }) {
  const items = Array.isArray(banners) && banners.length ? banners : [{
    badgeText: '전북의 숲, 시민과 함께',
    title: '숲을 지키는 가장 가까운 방법',
    description: '전북생명의숲의 활동과 시민 참여 프로그램을 만나보세요.',
    backgroundImageUrl: '/draft/forest-hero-placeholder.svg',
  }];
  const [requestedIndex, setRequestedIndex] = useState(0);
  const index = Math.min(requestedIndex, items.length - 1);
  const banner = items[index];
  const { primary, secondary } = selectActions(banner);
  const selectRelative = (offset) => setRequestedIndex((current) => (
    (Math.min(current, items.length - 1) + offset + items.length) % items.length
  ));

  return (
    <div>
      <section aria-labelledby="home-hero-title" className="overflow-hidden rounded-3xl bg-forest-strong text-white shadow-xl">
        <div className="relative min-h-[31rem]">
          <img className="absolute inset-0 h-full w-full object-cover" alt="" src={banner.backgroundImageUrl || '/draft/forest-hero-placeholder.svg'} />
          <div className="absolute inset-0 bg-gradient-to-r from-green-950/90 via-green-900/75 to-green-800/45" />
          <div className="relative max-w-3xl px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
            {banner.badgeText && <p className="text-lg font-bold text-green-100">{banner.badgeText}</p>}
            <h1 id="home-hero-title" className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">{banner.title}</h1>
            {banner.description && <p className="mt-5 text-xl leading-[1.7] text-green-50">{banner.description}</p>}
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <ActionLink to={primary.link}>{primary.text}</ActionLink>
              {secondary && <ActionLink to={secondary.link} variant="quiet" className="text-white hover:text-green-100">{secondary.text}</ActionLink>}
            </div>
          </div>
        </div>
      </section>
      {items.length > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3" aria-label="대표 배너 선택">
          <button type="button" className="accessible-touch-target rounded-lg border-2 border-forest-primary px-4 text-lg font-bold text-forest-strong" onClick={() => selectRelative(-1)} aria-label="이전 배너">이전</button>
          {items.map((item, itemIndex) => (
            <button
              type="button"
              key={`${item.title}-${itemIndex}`}
              className="accessible-touch-target min-w-12 rounded-full border-2 border-forest-primary px-3 text-lg font-bold text-forest-strong"
              aria-label={`${itemIndex + 1}번 배너 보기`}
              aria-pressed={itemIndex === index}
              onClick={() => setRequestedIndex(itemIndex)}
            >
              {itemIndex + 1}
            </button>
          ))}
          <button type="button" className="accessible-touch-target rounded-lg border-2 border-forest-primary px-4 text-lg font-bold text-forest-strong" onClick={() => selectRelative(1)} aria-label="다음 배너">다음</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Replace UserHome's carousel state**

Delete `REDUCED_MOTION_QUERY`, `prefersReducedMotion`, `currentBannerIndex`, `isBannerVisible`, `moveToBanner`, and both carousel effects from `UserHome`. Keep the banner normalization and render:

```jsx
<div className="mb-12">
  <PublicHomeHero banners={homeBanners} />
</div>
```

- [ ] **Step 5: Run and commit**

Run:

```bash
npm run test:e2e:public -- --project=desktop --grep "hero makes"
npm run lint
```

Expected: PASS and zero lint warnings.

```bash
git add src/components/home/PublicHomeHero.jsx src/pages/user/UserHome.jsx tests/e2e/public-home.spec.js
git commit -m "feat: add calm task-first Forest hero"
```

---

### Task 5: Recompose the home around programs, notices, activities, and participation

**Files:**
- Create: `src/utils/homeContent.js`
- Create: `src/components/home/HomeProgramSection.jsx`
- Create: `src/components/home/HomeNoticeSection.jsx`
- Create: `src/components/home/HomeActivitySection.jsx`
- Create: `src/components/home/HomeParticipationSection.jsx`
- Create: `src/components/home/HomeCommunitySection.jsx`
- Modify: `src/pages/user/UserHome.jsx`
- Modify: `tests/e2e/public-home.spec.js`
- Create: `tests/e2e/public-home-states.spec.js`

**Interfaces:**
- Produces: `selectActivePrograms`, `sortHomeNotices`, `extractPostThumbnail`, `getCollectionStatus`, `formatCapacity`, and `HOME_IMAGE_FALLBACK`.
- Produces each section as a presentational component receiving data plus `status`, `onRetry`, and `isRetrying`; no section fetches directly.

- [ ] **Step 1: Write failing order, available-field, error, and empty-state tests**

Replace the existing readiness import with the home-complete helper only now, immediately before these tests first use it:

```js
import { expectReadableText, waitForPublicHomeReady, waitForPublicShellReady } from './support/publicReady.js';
```

Append:

```js
test('home presents the approved task order and only available program facts', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  await page.goto('/');
  await waitForPublicHomeReady(page);
  const headings = await page.locator('main h2').allTextContents();
  expect(headings.slice(0, 4)).toEqual([
    '진행 중인 프로그램',
    '중요 공지',
    '최근 활동과 소식',
    '함께 참여하기',
  ]);
  const program = page.getByRole('article', { name: '전북 숲길 시민 프로그램' });
  await expect(program.getByText('행사 일시')).toBeVisible();
  await expect(program.getByText('최대 20명')).toBeVisible();
  await expect(program.getByText(/장소|잔여/)).toHaveCount(0);
});

test('zero maximum participants is described as unlimited', async ({ page, forestApi, pageQuality }) => {
  expect(pageQuality).toBeDefined();
  forestApi.setData({
    programs: [{ ...publicHomeData.programs[0], maxParticipants: 0 }],
  });
  await page.goto('/');
  await expect(page.getByRole('article', { name: '전북 숲길 시민 프로그램' }).getByText('정원 제한 없음')).toBeVisible();
});
```

Create `tests/e2e/public-home-states.spec.js` before changing `UserHome`:

```js
import { test, expect } from './fixtures/publicTest.js';

test('home distinguishes empty program and notice collections', async ({ page, forestApi, pageQuality }) => {
  expect(pageQuality).toBeDefined();
  forestApi.setData({ programs: [], notices: [] });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '등록된 프로그램이 없습니다' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '등록된 공지가 없습니다' })).toBeVisible();
});

test('program error remains until the visitor explicitly retries', async ({ page, forestApi, pageQuality }) => {
  pageQuality.allowConsoleError(/^Error fetching programs:/);
  forestApi.fail('/program/information', 500);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '프로그램을 불러오지 못했습니다' })).toBeVisible();
  forestApi.recover('/program/information');
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByRole('article', { name: '전북 숲길 시민 프로그램' })).toBeVisible();
});
```

- [ ] **Step 2: Verify it fails**

Run: `npm run test:e2e:public -- --project=desktop --grep "approved task order|zero maximum participants|home distinguishes|program error remains"`

Expected: FAIL because the order/capacity output and exact error/empty headings are not implemented yet.

- [ ] **Step 3: Add pure selectors using only contract-backed fields**

Create `src/utils/homeContent.js`:

```js
import { sortProgramsByStatus } from './programStatus';

export const HOME_IMAGE_FALLBACK = '/draft/forest-hero-placeholder.svg';

export const selectActivePrograms = (programs) => sortProgramsByStatus(
  Array.isArray(programs) ? programs : [],
).filter(({ status }) => status === 'IN_PROGRESS').slice(0, 3);

export const sortHomeNotices = (notices) => [...(Array.isArray(notices) ? notices : [])]
  .sort((a, b) => {
    const important = Number(Boolean(b.dynamicFields?.important)) - Number(Boolean(a.dynamicFields?.important));
    return important || new Date(b.updatedAt) - new Date(a.updatedAt);
  })
  .slice(0, 5);

export const extractPostThumbnail = (post) => {
  if (post?.thumbnail) return post.thumbnail;
  return post?.content?.match(/<img[^>]+src=['"]([^'"]+)['"]/i)?.[1] || null;
};

export const getCollectionStatus = ({ isLoading, isError, value }) => {
  if (isLoading) return 'loading';
  if (isError || !Array.isArray(value)) return 'error';
  return value.length === 0 ? 'empty' : 'success';
};

export const formatCapacity = (value) => {
  const capacity = Number(value);
  if (!Number.isFinite(capacity) || capacity < 0) return '정원 상세에서 확인';
  if (capacity === 0) return '정원 제한 없음';
  return `최대 ${capacity}명`;
};
```

- [ ] **Step 4: Create the five complete presentational sections**

Create `HomeProgramSection.jsx`:

```jsx
import AsyncState from '../AsyncState';
import ActionLink from '../ui/ActionLink';
import SectionHeading from '../ui/SectionHeading';
import { formatKoreanDateRange, formatKoreanDateTime } from '../../utils/dateFormat';
import { formatCapacity } from '../../utils/homeContent';
import { getProgramStatusInfo } from '../../utils/programStatus';

export default function HomeProgramSection({ programs, status, onRetry, isRetrying }) {
  return (
    <section aria-labelledby="home-programs-title" className="py-12">
      <SectionHeading id="home-programs-title" title="진행 중인 프로그램" description="지금 참여할 수 있는 숲 활동을 먼저 확인해 보세요." actionLabel="프로그램 전체 보기" actionTo="/programs/participate" />
      {status !== 'success' ? (
        <AsyncState
          status={status}
          title={status === 'error' ? '프로그램을 불러오지 못했습니다' : status === 'empty' ? '등록된 프로그램이 없습니다' : undefined}
          onRetry={onRetry}
          isRetrying={isRetrying}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {programs.map((program) => {
            const statusInfo = getProgramStatusInfo(program.status);
            return (
              <article key={program.id} aria-label={program.title} className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <span className={`w-fit rounded-full px-3 py-1 text-lg font-bold leading-[1.7] ${statusInfo.className}`}>{statusInfo.text}</span>
                <h3 className="mt-4 text-2xl font-bold leading-snug text-gray-950">{program.title}</h3>
                <dl className="mt-5 space-y-3 text-lg leading-[1.7] text-gray-700">
                  <div><dt className="font-bold text-gray-950">신청 기간</dt><dd>{formatKoreanDateRange(program.applyStartDate, program.applyEndDate)}</dd></div>
                  <div><dt className="font-bold text-gray-950">행사 일시</dt><dd>{formatKoreanDateTime(program.eventDate) || '상세에서 확인'}</dd></div>
                  <div><dt className="font-bold text-gray-950">정원</dt><dd>{formatCapacity(program.maxParticipants)}</dd></div>
                </dl>
                <ActionLink to={`/programs/detail/${program.id}`} className="mt-6 w-full">자세히 보기</ActionLink>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

Create `HomeNoticeSection.jsx`:

```jsx
import { Link } from 'react-router-dom';
import AsyncState from '../AsyncState';
import SectionHeading from '../ui/SectionHeading';
import { formatKoreanDate } from '../../utils/dateFormat';

export default function HomeNoticeSection({ notices, status, onRetry, isRetrying }) {
  return (
    <section aria-labelledby="home-notices-title" className="py-12">
      <SectionHeading id="home-notices-title" title="중요 공지" actionLabel="공지 전체 보기" actionTo="/news/notice" />
      {status !== 'success' ? (
        <AsyncState
          status={status}
          title={status === 'error' ? '공지를 불러오지 못했습니다' : status === 'empty' ? '등록된 공지가 없습니다' : undefined}
          onRetry={onRetry}
          isRetrying={isRetrying}
        />
      ) : (
        <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white px-5">
          {notices.map((notice) => (
            <li key={notice.id}>
              <Link to={`/news/notice/${notice.id}`} className="group flex min-h-16 items-center justify-between gap-4 py-4">
                <span className="line-clamp-2 text-lg font-semibold leading-snug text-gray-950 group-hover:text-forest-strong">{notice.title}</span>
                <time className="shrink-0 text-lg leading-[1.7] text-gray-600" dateTime={notice.updatedAt}>{formatKoreanDate(notice.updatedAt)}</time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

Create `HomeActivitySection.jsx`:

```jsx
import { Link } from 'react-router-dom';
import AsyncState from '../AsyncState';
import SectionHeading from '../ui/SectionHeading';
import { formatKoreanDate } from '../../utils/dateFormat';
import { extractPostThumbnail, HOME_IMAGE_FALLBACK } from '../../utils/homeContent';

export default function HomeActivitySection({ posts, status, onRetry, isRetrying }) {
  return (
    <section aria-labelledby="home-activities-title" className="py-12">
      <SectionHeading id="home-activities-title" title="최근 활동과 소식" actionLabel="활동 전체 보기" actionTo="/news/activities" />
      {status !== 'success' ? <AsyncState status={status} onRetry={onRetry} isRetrying={isRetrying} /> : (
        <div className="grid gap-6 lg:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <article key={post.id} aria-label={post.title} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <img className="aspect-[4/3] w-full object-cover" src={extractPostThumbnail(post) || HOME_IMAGE_FALLBACK} alt={extractPostThumbnail(post) ? `활동 사진: ${post.title}` : ''} />
              <div className="p-6">
                <p className="text-lg font-bold leading-[1.7] text-forest-primary">활동 소식</p>
                <h3 className="mt-2 line-clamp-2 text-2xl font-bold leading-snug text-gray-950">{post.title}</h3>
                <time className="mt-3 block text-lg leading-[1.7] text-gray-600" dateTime={post.updatedAt}>{formatKoreanDate(post.updatedAt)}</time>
                <Link to={`/post/0/${post.id}`} className="accessible-touch-target mt-5 inline-flex items-center text-lg font-bold text-forest-strong underline underline-offset-4">활동 자세히 보기</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
```

Create `HomeParticipationSection.jsx`:

```jsx
import ActionLink from '../ui/ActionLink';
import SectionHeading from '../ui/SectionHeading';

const ACTIONS = [
  { title: '숲을 위한 후원', description: '꾸준한 숲 보전 활동을 함께 만들어 주세요.', label: '후원 신청', to: '/donation/individual' },
  { title: '시민 자원봉사', description: '전북의 숲을 돌보는 현장 활동에 참여해 주세요.', label: '자원봉사 보기', to: '/programs/volunteer' },
];

export default function HomeParticipationSection() {
  return (
    <section aria-labelledby="home-participation-title" className="py-12">
      <SectionHeading id="home-participation-title" title="함께 참여하기" description="원하는 방식 하나를 선택해 천천히 확인해 보세요." />
      <div className="grid gap-6 md:grid-cols-2">
        {ACTIONS.map((action) => (
          <article key={action.to} className="rounded-2xl bg-forest-surface p-7">
            <h3 className="text-2xl font-bold text-gray-950">{action.title}</h3>
            <p className="mt-3 text-lg leading-[1.7] text-gray-700">{action.description}</p>
            <ActionLink to={action.to} className="mt-6">{action.label}</ActionLink>
          </article>
        ))}
      </div>
    </section>
  );
}
```

Create `HomeCommunitySection.jsx`:

```jsx
import { Link } from 'react-router-dom';
import AsyncState from '../AsyncState';
import ActionLink from '../ui/ActionLink';
import SectionHeading from '../ui/SectionHeading';
import { formatKoreanDate } from '../../utils/dateFormat';

export default function HomeCommunitySection({ categories, postsByCategory, status, onRetry, isRetrying }) {
  return (
    <section aria-labelledby="home-community-title" className="py-12">
      <SectionHeading id="home-community-title" title="커뮤니티 게시판" description="전북의 숲 이야기를 게시판별로 확인하세요." />
      {status !== 'success' ? <AsyncState status={status} onRetry={onRetry} isRetrying={isRetrying} /> : (
        <div className="grid gap-6 lg:grid-cols-3">
          {categories.map((category) => (
            <article key={category.id} className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="text-2xl font-bold text-gray-950">{category.name}</h3>
              <ul className="mt-4 divide-y divide-gray-200">
                {(postsByCategory[category.id] || []).slice(0, 3).map((post) => (
                  <li key={post.id}><Link className="flex min-h-14 items-center justify-between gap-3 py-3 text-lg leading-[1.7]" to={`/post/${category.id}/${post.id}`}><span className="line-clamp-2 font-semibold">{post.title}</span><time className="shrink-0 text-lg leading-[1.7] text-gray-600">{formatKoreanDate(post.updatedAt)}</time></Link></li>
                ))}
              </ul>
              <ActionLink to={`/category/${category.id}`} variant="quiet" className="mt-4">{category.name} 전체 보기</ActionLink>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Make UserHome a coordinator and render the exact order**

Keep current query keys and service calls. Import the helpers and derive every status before render:

```js
const activePrograms = selectActivePrograms(programContents);
const sortedNotices = sortHomeNotices(noticeContents);
const programStatus = getCollectionStatus({ isLoading: programsLoading, isError: programsUnavailable, value: activePrograms });
const noticeStatus = getCollectionStatus({ isLoading: noticesLoading, isError: noticesUnavailable, value: sortedNotices });
const newsStatus = getCollectionStatus({ isLoading: newsLoading, isError: newsUnavailable, value: newsPosts });
const communityStatus = getCollectionStatus({
  isLoading: categoriesLoading || categoryPosts.isLoading,
  isError: categoriesUnavailable || categoryPosts.isError,
  value: topCategories,
});
const retryCommunity = categoriesUnavailable ? refetchCategories : categoryPosts.refetch;
```

Remove local duplicate thumbnail/sort logic and render:

```jsx
<PublicHomeHero banners={homeBanners} />
<HomeProgramSection programs={activePrograms} status={programStatus} onRetry={refetchPrograms} isRetrying={programsFetching} />
<HomeNoticeSection notices={sortedNotices} status={noticeStatus} onRetry={refetchNotices} isRetrying={noticesFetching} />
<HomeActivitySection posts={newsPosts || []} status={newsStatus} onRetry={refetchNews} isRetrying={newsFetching} />
<HomeParticipationSection />
<HomeCommunitySection categories={topCategories} postsByCategory={categoryPosts.data || {}} status={communityStatus} onRetry={retryCommunity} isRetrying={categoriesFetching || categoryPosts.isFetching} />
```

- [ ] **Step 6: Satisfy the prewritten deterministic state tests**

Give program/notice `AsyncState` the exact titles asserted in Step 1. Keep a forced failure active until `recover`, so React Query's built-in retry cannot turn the intended error case into a success. Do not alter or weaken the already-red tests.

- [ ] **Step 7: Run and commit**

Run:

```bash
npm run test:e2e:public -- --project=desktop --grep "approved task order|zero maximum participants|home distinguishes|program error remains"
npm run lint
```

Expected: all focused tests PASS and lint exits cleanly.

```bash
git add src/utils/homeContent.js src/components/home src/pages/user/UserHome.jsx tests/e2e
git commit -m "feat: prioritize Forest home tasks"
```

---

### Task 6: Close invalid routes and complete responsive/accessibility evidence

**Files:**
- Create: `src/pages/NotFoundPage.jsx`
- Modify: `src/routes.jsx:102-105`
- Modify: `tests/e2e/public-home.spec.js`
- Create: Playwright snapshot files under `tests/e2e/public-home.spec.js-snapshots/`

**Interfaces:**
- Produces: explicit not-found page with links to `/` and `/programs/participate`.

- [ ] **Step 1: Add complete not-found, destination, axe, reflow, and reduced-motion checks**

The spec already imports `test`/`expect` from `publicTest.js`; add only the Axe import and these tests:

```js
import AxeBuilder from '@axe-core/playwright';

test('invalid route explains the error instead of silently redirecting', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  await page.goto('/does-not-exist');
  await expect(page).toHaveURL(/does-not-exist/);
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeVisible();
  await expect(page.getByRole('link', { name: /전북생명의숲/ }).first()).toBeVisible();
  await expect(page.getByText('로컬 초안', { exact: true })).toBeVisible();
});

test('home links arrive at the three approved existing destinations', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  await page.goto('/');
  await waitForPublicHomeReady(page);
  await page.getByRole('link', { name: '프로그램 참여' }).first().click();
  await expect(page).toHaveURL(/\/programs\/participate$/);
  await expect(page.getByRole('heading', { level: 1, name: '참여 프로그램' })).toBeVisible();
  await expect(page.getByText('전북 숲길 시민 프로그램')).toBeVisible();
  await page.goto('/');
  await waitForPublicHomeReady(page);
  await page.getByRole('link', { name: '공지 전체 보기' }).click();
  await expect(page).toHaveURL(/\/news\/notice$/);
  await expect(page.getByRole('heading', { level: 1, name: '공지사항' })).toBeVisible();
  await expect(page.getByText('여름 숲 프로그램 참가 안내와 준비물 공지')).toBeVisible();
  await page.goto('/');
  await waitForPublicHomeReady(page);
  await page.getByRole('link', { name: '활동 전체 보기' }).click();
  await expect(page).toHaveURL(/\/news\/activities$/);
  await expect(page.getByRole('heading', { level: 1, name: '전북생명의숲 활동보기' })).toBeVisible();
  await expect(page.getByText('시민과 함께한 전북 숲 돌봄 활동')).toBeVisible();
});

test('home has no critical or serious axe findings', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  await page.goto('/');
  await waitForPublicHomeReady(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(({ impact }) => ['critical', 'serious'].includes(impact))).toEqual([]);
});

test('desktop content reflows at the 720 CSS pixel equivalent of 200 percent zoom', async ({ page, forestApi, pageQuality }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', '1440 desktop at 200 percent is 720 CSS pixels');
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  await page.setViewportSize({ width: 720, height: 900 });
  await page.goto('/');
  await waitForPublicHomeReady(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
});

test('mobile drawer honors reduced motion', async ({ page, forestApi, pageQuality }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile drawer only');
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await waitForPublicShellReady(page);
  await page.getByRole('button', { name: '전체 메뉴 열기' }).click();
  const panel = page.getByRole('dialog', { name: '전체 메뉴' });
  const milliseconds = await panel.evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration) * 1000);
  expect(milliseconds).toBeLessThanOrEqual(0.01);
});

test('public draft matches the reviewed responsive baseline', async ({ page, forestApi, pageQuality }, testInfo) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  await page.goto('/');
  await waitForPublicHomeReady(page);
  await expect(page).toHaveScreenshot(`forest-public-home-${testInfo.project.name}.png`, { fullPage: true, animations: 'disabled' });
});
```

- [ ] **Step 2: Verify the not-found test fails**

Run: `npm run test:e2e:public -- --project=desktop --grep "invalid route"`

Expected: FAIL because the wildcard route redirects to `/`.

- [ ] **Step 3: Add the explicit recovery page**

Create `NotFoundPage.jsx`:

```jsx
import ActionLink from '../components/ui/ActionLink';

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm sm:p-12" aria-labelledby="not-found-title">
      <p className="font-bold text-forest-primary">404</p>
      <h1 id="not-found-title" className="mt-2 text-3xl font-bold text-gray-950">페이지를 찾을 수 없습니다</h1>
      <p className="mt-4 text-lg leading-[1.7] text-gray-700">주소가 바뀌었거나 삭제된 페이지입니다. 안전한 메뉴에서 다시 시작해 주세요.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <ActionLink to="/">홈으로 이동</ActionLink>
        <ActionLink to="/programs/participate" variant="secondary">프로그램 보기</ActionLink>
      </div>
    </section>
  );
}
```

Import `NotFoundPage`, add `{ path: '*', element: <NotFoundPage /> }` as the final child of the existing `path: '/'` route, and delete the outer top-level wildcard route. This keeps invalid paths inside `App`/`Layout`, so the common header, skip link, footer, and `로컬 초안` badge remain available.

- [ ] **Step 4: Generate and inspect visual evidence**

Run the snapshot test already added in Step 1:

```bash
npm run test:e2e:public:update
```

Expected: desktop, tablet, and mobile snapshot files are created. Inspect each image for clipped text, controls over text, horizontal overflow, and unreadable section order. Also perform one manual Chromium 200% browser-zoom check because the 720px automated proxy cannot perfectly emulate browser chrome and OS text scaling.

- [ ] **Step 5: Run the complete public gate**

Run:

```bash
npm run lint
npm run build
npm run test:e2e:public
```

Expected: lint and build exit 0; all three Playwright projects PASS with no unexpected console or request failures.

- [ ] **Step 6: Commit**

```bash
git add src/pages/NotFoundPage.jsx src/routes.jsx tests/e2e
git commit -m "test: complete Forest public draft gate"
```

---

### Task 7: Record sync inputs and prepare the no-deploy review handoff

**Files:**
- Modify only if required by the sync: `../prd/forest/requirements.md`
- Modify only if required by the sync: `../prd/forest/api-spec.md`
- Create outside git only: local screenshots/report artifacts generated by Playwright.

- [ ] **Step 1: Record the cumulative PRD-sync inputs without running sync yet**

Record the public-home order, five-item navigation, draft-only behavior, explicit 404, and Playwright gate. Do not claim program fields the API does not provide. The user asked to synchronize after all public/admin/integration work is finished, so the single `source-command-prd-sync` call is deferred to Task 10 of the isolated real-API plan.

- [ ] **Step 2: Verify the final tree and commit any required PRD changes in the owning repository only**

Run:

```bash
git status --short
git log -7 --oneline
git diff --check
rg -n "T[O]DO|T[B]D|implement lat[e]r|simi[l]ar|existing JS[X]|code goes her[e]|one-shot overrid[e]" docs/superpowers/plans/2026-07-18-forest-public-home-draft.md
```

Expected: only intended public-draft files are changed; `gradle.properties` is absent; `git diff --check` prints nothing; the plan scan has no unresolved implementation marker. Record the starting SHA printed by `git rev-parse HEAD` before Task 1 and compare `git diff --name-only <recorded-starting-SHA>..HEAD` during this step so committed files are included. If PRD files live outside this repository, report them separately rather than force-adding them here.

- [ ] **Step 3: Start the local draft and capture the review URLs**

Run: `npm run draft`

Expected: `http://127.0.0.1:3000/` shows `로컬 초안`; no deployment occurs.

- [ ] **Step 4: Hand the user the clickable draft and three viewport captures**

Report passed commands, screenshot paths, known mock-only behavior, destination pages not redesigned, and the fact that nothing was pushed or deployed. Stop for explicit visual approval before starting the administrator plan.
