# Forest Administrator CMS Draft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the second clickable draft: an accessible task-oriented administrator home, stable program management, and unified post/notice management with verified edit/delete flows.

**Architecture:** Reuse the public plan's semantic tokens, Playwright harness, `ActionLink`, `SectionHeading`, and preview boundary. Make the administrator URL query string the single state source, extract the stable program block from `AdminDashboard`, and build a new content panel that adapts the existing program/post/notice services without inventing a unified backend API. Use Node's built-in test runner for pure routing/filter logic and Playwright mocks for component and workflow TDD.

**Tech Stack:** React 18, React Router 7.4, TanStack Query 5, Tailwind CSS 3.4, Node `node:test`, Playwright Chromium, existing Quill editor

## Global Constraints

- Execute only after the public-home draft is visually approved.
- Run every `npm`, `npx`, `node`, and `git` command in this plan with tool working directory `/Users/park/Desktop/project/cms-react-project`. Before Task 1, run `git status --short`, `git branch --show-current`, and `git rev-parse HEAD`; stop on overlapping unrelated changes and record the exact starting commit as `ADMIN_DRAFT_BASE_SHA` in the execution notes.
- Reuse `#166534`, `#14532d`, `#f8faf5`, and `#b45309`; retain 18px body text and 48×48px primary targets.
- Test 1440×900 desktop, 768×1024 tablet, 390×844 mobile, 200% zoom reflow, keyboard navigation, and reduced motion.
- Preserve existing program, post, notice, category, and auth endpoint paths and payloads.
- Program search/status/date filters are client-side over the currently loaded response; the backend currently ignores page/size and returns a complete list, so the UI label is `현재 불러온 목록 내 검색` rather than a guaranteed count.
- Content search is client-side over the selected board response.
- Do not invent a published/visibility value; display `상태 API 미제공`.
- INFORMATION rows do not support full editing, but existing deletion is supported; show `편집 준비 중`, a detail action, and a separately confirmed delete action.
- Content rows label `updatedAt` as `최근 수정일`; the API does not provide `createdAt`.
- Post/Notice JSON update does not support attachment mutation. Existing attachments remain read-only; new images use the existing inline editor upload only.
- Program edit keeps separate existing files, new files, and deleted file IDs.
- Mock UI CRUD tests are not actual backend integration tests.
- Do not modify `gradle.properties`, push, create a PR, or deploy.

---

## File Structure

### Create

- `src/utils/adminRouteState.js` — canonical section/filter parsing and safe return URLs.
- `src/utils/programFilters.js` — contract-backed client filtering and pagination.
- `src/utils/adminContent.js` — post/notice/information row normalization.
- `src/hooks/useUnsavedChanges.js` — reload and in-app navigation guard.
- `src/components/RouteAccessState.jsx` — explicit authentication/authorization state.
- `src/components/ui/Button.jsx`, `IconButton.jsx`, `FormField.jsx`, `StatusBadge.jsx` — accessible actions and fields.
- `src/components/ui/AccessibleDialog.jsx` — focus-trapped dialog.
- `src/components/ui/ResponsiveDataView.jsx` — mobile cards and desktop table.
- `src/components/admin/AdminShell.jsx`, `AdminNav.jsx`, `AdminHomePanel.jsx` — administrator shell and task entry.
- `src/components/admin/ProgramPanel.jsx` — program filters, rows/cards, applicants, form actions.
- `src/components/admin/ContentPanel.jsx` — notices, activities, and selected dynamic-board content.
- `tests/unit/adminRouteState.test.js`, `programFilters.test.js`, `adminContent.test.js`, `adminApiResponses.test.js` — pure contract and draft-adapter tests.
- `.env.admin-draft` — local admin persona with the same draft API.
- `tests/e2e/fixtures/adminData.js` — frozen admin fixtures.
- `tests/e2e/support/mockAdminApi.js` — stateful mock CRUD and request audit.
- `tests/e2e/fixtures/adminTest.js` — mandatory persona/API/page-quality fixture.
- `tests/e2e/admin-shell.spec.js`, `admin-programs.spec.js`, `admin-content.spec.js`, `admin-editors.spec.js`, `admin-crud-regression.spec.js`.

### Modify

- `package.json` — unit/admin E2E/admin draft scripts.
- `vite.config.js`, `tests/draft/draftApiPlugin.js`, `tests/draft/publicApiResponses.js` — admin-draft persona and stateful responses.
- `src/components/Layout.jsx` — administrator links point to `?section=home`.
- `src/components/ProtectedRoute.jsx`, `AuthenticatedRoute.jsx`, `src/utils/pendingNavigation.js` — explicit access and safe return preservation.
- `src/services/categoryService.js` — load `/categories/manage` so POST and INFORMATION board types are not guessed.
- `src/services/userService.js` — make token revoke a local no-op only when draft mode is explicitly active.
- `src/pages/admin/AdminDashboard.jsx` — URL-driven shell and extracted panels; legacy sections remain.
- `src/pages/program/ProgramCreate.jsx`, `ProgramEdit.jsx`, `ProgramDetail.jsx` — return state, invalidation, pending/error/dirty handling.
- `src/pages/post/PostWrite.jsx`, `PostEdit.jsx`, `PostDetail.jsx` — return state and editor behavior.
- `src/pages/notice/NoticeWrite.jsx`, `NoticeEdit.jsx`, `src/pages/static/Notice.jsx` — return state and editor behavior.

---

### Task 1: Make administrator route state canonical and access failures explicit

**Files:**
- Create: `src/utils/adminRouteState.js`
- Create: `tests/unit/adminRouteState.test.js`
- Create: `src/components/RouteAccessState.jsx`
- Create: `tests/e2e/fixtures/adminData.js`
- Create: `tests/e2e/fixtures/adminTest.js`
- Create: `tests/e2e/support/mockAdminApi.js`
- Modify: `package.json`
- Modify: `src/utils/pendingNavigation.js:1-62`
- Modify: `src/components/ProtectedRoute.jsx`
- Modify: `src/components/AuthenticatedRoute.jsx`
- Modify: `src/components/Layout.jsx:361-367,628-639`
- Modify: `src/pages/admin/AdminDashboard.jsx:77-176`

**Interfaces:**
- Produces: `readAdminRouteState(searchParams, { hasMaxAccess })`.
- Produces: `patchAdminSearchParams(searchParams, patch)`.
- Produces: `buildAdminReturnTo(searchParams)`.
- Produces: `getSafeReturnTo(candidate, fallback)`.
- Exports: `isSafeInternalPath(path)` from `pendingNavigation.js`.

- [ ] **Step 1: Add the unit script and failing URL-state tests**

Add to `package.json`:

```json
{
  "scripts": {
    "test:unit": "node --test",
    "draft:admin": "vite --host 127.0.0.1 --mode admin-draft",
    "test:e2e:admin": "playwright test tests/e2e/admin-*.spec.js",
    "test:e2e:admin:update": "playwright test tests/e2e/admin-*.spec.js --update-snapshots"
  }
}
```

Create `tests/unit/adminRouteState.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAdminReturnTo,
  getSafeReturnTo,
  patchAdminSearchParams,
  readAdminRouteState,
} from '../../src/utils/adminRouteState.js';

test('admin defaults to home and preserves scoped filters', () => {
  const input = new URLSearchParams('programQuery=숲&programStatus=accepting');
  const state = readAdminRouteState(input, { hasMaxAccess: false });
  assert.equal(state.section, 'home');
  assert.equal(state.program.query, '숲');
  assert.equal(state.program.status, 'accepting');
});

test('non MAX user cannot canonicalize into a MAX section', () => {
  const state = readAdminRouteState(new URLSearchParams('section=users'), { hasMaxAccess: false });
  assert.equal(state.section, 'home');
});

test('patch merges without deleting filters and blank values remove keys', () => {
  const next = patchAdminSearchParams(
    new URLSearchParams('section=programs&programQuery=숲&programPage=3'),
    { section: 'content', contentType: 'notice', programPage: '' },
  );
  assert.equal(next.get('programQuery'), '숲');
  assert.equal(next.get('programPage'), null);
  assert.equal(next.get('contentType'), 'notice');
});

test('return paths reject external and protocol-relative targets', () => {
  assert.equal(getSafeReturnTo('https://evil.example', '/admin?section=home'), '/admin?section=home');
  assert.equal(getSafeReturnTo('//evil.example', '/admin?section=home'), '/admin?section=home');
  assert.equal(getSafeReturnTo('/admin?section=programs', '/'), '/admin?section=programs');
  assert.equal(buildAdminReturnTo(new URLSearchParams('section=content&contentType=notice')), '/admin?section=content&contentType=notice');
});
```

- [ ] **Step 2: Verify the unit failure**

Run: `node --test tests/unit/adminRouteState.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `adminRouteState.js`.

- [ ] **Step 3: Implement exact route-state behavior**

Create `src/utils/adminRouteState.js`:

```js
import { isSafeInternalPath } from './pendingNavigation.js';

const ADMIN_SECTIONS = new Set(['home', 'programs', 'content', 'donations', 'intro', 'homeBanner', 'categories', 'users', 'mail']);
const MAX_ONLY = new Set(['categories', 'users']);
const PROGRAM_STATUSES = new Set(['all', 'accepting', 'upcoming', 'ended']);
const PROGRAM_CATEGORIES = new Set(['all', 'participate', 'guide', 'volunteer']);
const CONTENT_TYPES = new Set(['notice', 'activity', 'board']);

const positivePage = (value) => Math.max(1, Number.parseInt(value || '1', 10) || 1);

export function readAdminRouteState(searchParams, { hasMaxAccess = false } = {}) {
  const requested = searchParams.get('section') || 'home';
  const section = ADMIN_SECTIONS.has(requested) && (hasMaxAccess || !MAX_ONLY.has(requested)) ? requested : 'home';
  const requestedStatus = searchParams.get('programStatus') || 'all';
  const requestedContent = searchParams.get('contentType') || 'notice';
  return {
    section,
    program: {
      query: searchParams.get('programQuery') || '',
      category: PROGRAM_CATEGORIES.has(searchParams.get('programCategory')) ? searchParams.get('programCategory') : 'all',
      status: PROGRAM_STATUSES.has(requestedStatus) ? requestedStatus : 'all',
      from: searchParams.get('programFrom') || '',
      to: searchParams.get('programTo') || '',
      page: positivePage(searchParams.get('programPage')),
    },
    content: {
      type: CONTENT_TYPES.has(requestedContent) ? requestedContent : 'notice',
      board: /^\d+$/.test(searchParams.get('contentBoard') || '') ? searchParams.get('contentBoard') : '',
      query: searchParams.get('contentQuery') || '',
      page: positivePage(searchParams.get('contentPage')),
    },
  };
}

export function patchAdminSearchParams(searchParams, patch) {
  const next = new URLSearchParams(searchParams);
  Object.entries(patch).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) next.delete(key);
    else next.set(key, String(value));
  });
  return next;
}

export const buildAdminReturnTo = (searchParams) => `/admin${searchParams.toString() ? `?${searchParams}` : '?section=home'}`;

export const getSafeReturnTo = (candidate, fallback) => (isSafeInternalPath(candidate) ? candidate : fallback);
```

Export the existing `isSafeInternalPath` from `pendingNavigation.js`; do not maintain two validators.

- [ ] **Step 4: Run the pure tests**

Run: `node --test tests/unit/adminRouteState.test.js`

Expected: four tests PASS.

- [ ] **Step 5: Create the minimal safe persona fixture and failing access tests**

Create `tests/e2e/fixtures/adminData.js`:

```js
export const adminPersonas = Object.freeze({
  ANONYMOUS: null,
  USER: { userId: 'user-1', role: 'ROLE_USER', email: 'user@example.test', name: '일반 사용자', canManageContent: false, hasMaxAccess: false },
  ADMIN: { userId: 'admin-1', role: 'ROLE_ADMIN', email: 'admin@example.test', name: '콘텐츠 관리자', canManageContent: true, hasMaxAccess: false },
  MAX: { userId: 'max-1', role: 'ROLE_USER', email: 'max@example.test', name: '최고 관리자', canManageContent: true, hasMaxAccess: true },
});
```

Create the first `mockAdminApi.js` by registering a broad HTTP guard first, then the public mock, then the `/users` override so Playwright's last-registered route wins:

```js
import { expect } from '@playwright/test';
import { adminPersonas } from '../fixtures/adminData.js';
import { installPublicApiMocks } from './mockForestApi.js';

export async function installAdminApiMocks(page) {
  let persona = 'ADMIN';
  const requests = [];
  const blockedExternalWrites = [];
  await page.route(/^https?:\/\//, async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' && url.port === '3000') return route.fallback();
    if (route.request().method() !== 'GET') blockedExternalWrites.push(`${route.request().method()} ${url.origin}${url.pathname}`);
    return route.abort('blockedbyclient');
  });
  const publicApi = await installPublicApiMocks(page);
  await page.route('**/api/v1/users', async (route) => {
    const user = adminPersonas[persona];
    await route.fulfill({
      status: user ? 200 : 403,
      contentType: 'application/json',
      body: JSON.stringify(user ? { data: user } : { message: 'anonymous' }),
    });
  });
  return {
    requests,
    setPersona(next) { persona = next; },
    publicApi,
    assertSafe() {
      publicApi.assertHandled();
      expect(blockedExternalWrites, blockedExternalWrites.join('\n')).toEqual([]);
    },
  };
}
```

Create `adminTest.js`:

```js
import { test as base, expect } from '@playwright/test';
import { watchPageQuality } from '../support/pageQuality.js';
import { installAdminApiMocks } from '../support/mockAdminApi.js';

export const test = base.extend({
  adminApi: [async ({ page }, use) => {
    const api = await installAdminApiMocks(page);
    await use(api);
    api.assertSafe();
  }, { auto: true }],
  pageQuality: [async ({ page }, use) => {
    const quality = watchPageQuality(page);
    await use(quality);
    quality.assertClean();
  }, { auto: true }],
});

export { expect };
```

Create `admin-shell.spec.js`:

```js
import { test, expect } from './fixtures/adminTest.js';

test('ordinary user sees an explicit administrator access message', async ({ page, adminApi, pageQuality }) => {
  expect(pageQuality).toBeDefined();
  adminApi.setPersona('USER');
  await page.goto('/admin?section=home');
  await expect(page.getByRole('heading', { name: '관리자 권한이 필요합니다' })).toBeVisible();
});

test('anonymous admin deep link redirects to login and preserves return path', async ({ page, adminApi, pageQuality }) => {
  expect(pageQuality).toBeDefined();
  adminApi.setPersona('ANONYMOUS');
  await page.goto('/admin?section=programs&programStatus=accepting');
  await expect(page).toHaveURL(/\/login$/);
  const saved = await page.evaluate(() => sessionStorage.getItem('forest:pending-navigation'));
  expect(saved).toContain('/admin?section=programs&programStatus=accepting');
});
```

- [ ] **Step 6: Make guards and Dashboard URL-driven**

Create `RouteAccessState.jsx` with an `h1`, explanation, and safe `ActionLink` actions. In `ProtectedRoute`, import `Navigate` and `useLocation`, import `savePendingNavigation`, create `const location = useLocation()`, then use:

```jsx
if (!isAuthenticated) {
  savePendingNavigation({ returnTo: `${location.pathname}${location.search}${location.hash}` });
  return <Navigate to="/login" replace />;
}
if (!isAdmin) return <RouteAccessState title="관리자 권한이 필요합니다" description="콘텐츠 관리 권한이 있는 계정으로 로그인해 주세요." />;
if (requireMaxAccess && !hasMaxAccess) return <Navigate to="/admin?section=home" replace />;
return children;
```

Apply the same safe pending-navigation storage to `AuthenticatedRoute` without changing its USER access policy.

At the top of `revokeToken` in `userService.js`, add `if (import.meta.env.VITE_DRAFT_MODE === 'true') return { draft: true };`. This compile-time draft branch prevents manual preview logout from calling the hard-coded external auth URL; normal development and production behavior is unchanged.

In `AdminDashboard`, derive `state` from `searchParams` on every render and canonicalize invalid/missing sections with a replace effect. Remove the independent `activeMenu` state. Select a section with:

```js
const selectAdminSection = (section) => {
  setSearchParams(patchAdminSearchParams(searchParams, { section }), { replace: false });
};
```

Change both Layout administrator links to `/admin?section=home`.

- [ ] **Step 7: Run and commit**

Run:

```bash
node --test tests/unit/adminRouteState.test.js
npx playwright test tests/e2e/admin-shell.spec.js --project=desktop --grep "ordinary user|anonymous admin"
npm run lint
```

Expected: all focused tests PASS and lint exits 0.

```bash
git add package.json src/utils/adminRouteState.js src/utils/pendingNavigation.js src/components/RouteAccessState.jsx src/components/ProtectedRoute.jsx src/components/AuthenticatedRoute.jsx src/components/Layout.jsx src/pages/admin/AdminDashboard.jsx src/services/userService.js tests/unit tests/e2e/fixtures/adminData.js tests/e2e/fixtures/adminTest.js tests/e2e/support/mockAdminApi.js tests/e2e/admin-shell.spec.js
git commit -m "feat: make Forest admin routing explicit"
```

---

### Task 2: Add common administrator controls and the task home

**Files:**
- Create: `src/components/ui/Button.jsx`
- Create: `src/components/ui/IconButton.jsx`
- Create: `src/components/ui/FormField.jsx`
- Create: `src/components/ui/StatusBadge.jsx`
- Create: `src/components/ui/AccessibleDialog.jsx`
- Create: `src/components/ui/ResponsiveDataView.jsx`
- Create: `src/components/admin/AdminNav.jsx`
- Create: `src/components/admin/AdminShell.jsx`
- Create: `src/components/admin/AdminHomePanel.jsx`
- Modify: `src/pages/admin/AdminDashboard.jsx`
- Modify: `tests/e2e/admin-shell.spec.js`

**Interfaces:**
- Produces the exact component props documented in the approved design: `Button`, `IconButton`, `FormField`, `StatusBadge`, `AccessibleDialog`, `ResponsiveDataView`.
- Produces: `AdminShell({ activeSection, hasMaxAccess, onSelectSection, title, children })`.

- [ ] **Step 1: Add failing task-home and mobile-shell tests**

Append complete tests to `admin-shell.spec.js`:

```js
test('admin entry opens five real tasks and browser history restores home', async ({ page, adminApi, pageQuality }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop side navigation only');
  expect(adminApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  await page.goto('/admin');
  await expect(page).toHaveURL(/section=home/);
  await expect(page.getByRole('heading', { name: '관리자 홈' })).toBeVisible();
  await expect(page.getByRole('link', { name: /프로그램 관리/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /신청자 관리/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /활동 소식 관리/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /공지 관리/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /후원 요청/ })).toBeVisible();
  await expect(page.getByRole('link', { name: '사용자 관리' })).toHaveCount(0);
  await page.getByRole('link', { name: /프로그램 관리/ }).click();
  await expect(page).toHaveURL(/section=programs/);
  await page.goBack();
  await expect(page.getByRole('heading', { name: '관리자 홈' })).toBeVisible();
});

test('mobile admin drawer traps focus and restores its trigger', async ({ page, adminApi, pageQuality }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile drawer only');
  expect(adminApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  await page.goto('/admin?section=home');
  const trigger = page.getByRole('button', { name: '관리 메뉴 열기' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: '관리 메뉴' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `npx playwright test tests/e2e/admin-shell.spec.js --project=desktop --project=mobile --grep "admin entry|mobile admin drawer"`

Expected: FAIL because `section=home` and the new shell do not exist.

- [ ] **Step 3: Create the action primitives**

Use `Button` as the only common action control:

```jsx
import { forwardRef } from 'react';

const variants = {
  primary: 'bg-forest-primary text-white hover:bg-forest-strong',
  secondary: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
  danger: 'bg-red-700 text-white hover:bg-red-800',
  ghost: 'bg-transparent text-forest-strong hover:bg-green-50',
};

const Button = forwardRef(function Button({ variant = 'primary', isPending = false, pendingLabel = '처리 중…', disabled, children, className = '', ...props }, ref) {
  return (
    <button
      ref={ref}
      {...props}
      disabled={disabled || isPending}
      aria-busy={isPending || undefined}
      className={`accessible-touch-target inline-flex items-center justify-center rounded-lg px-5 py-3 text-lg font-bold ${variants[variant]} ${className}`}
    >
      {isPending ? pendingLabel : children}
    </button>
  );
});

export default Button;
```

Create `IconButton.jsx`:

```jsx
import { forwardRef } from 'react';
import Button from './Button';

const IconButton = forwardRef(function IconButton({ label, children, className = '', ...props }, ref) {
  if (!label?.trim()) throw new Error('IconButton requires a label');
  return <Button ref={ref} {...props} aria-label={label} title={label} className={`min-w-12 px-3 ${className}`}>{children}</Button>;
});

export default IconButton;
```

Create `FormField.jsx`:

```jsx
import { cloneElement, useId } from 'react';

export default function FormField({ label, hint, error, required = false, children }) {
  const generatedId = useId();
  const inputId = children.props.id || `field-${generatedId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-lg font-bold text-gray-950">{label}{required && <span aria-hidden="true" className="ml-1 text-red-700">*</span>}</label>
      {cloneElement(children, { id: inputId, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy, required })}
      {hint && <p id={hintId} className="text-lg leading-[1.7] text-gray-600">{hint}</p>}
      {error && <p id={errorId} className="text-lg font-semibold leading-[1.7] text-red-800" role="alert">{error}</p>}
    </div>
  );
}
```

Create `StatusBadge.jsx`:

```jsx
const tones = {
  neutral: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-900',
  warning: 'bg-amber-100 text-amber-900',
  danger: 'bg-red-100 text-red-900',
  info: 'bg-blue-100 text-blue-900',
};

export default function StatusBadge({ tone = 'neutral', children }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-lg font-bold leading-[1.7] ${tones[tone]}`}>{children}</span>;
}
```

- [ ] **Step 4: Create AccessibleDialog and ResponsiveDataView**

Create the complete `AccessibleDialog.jsx`:

```jsx
import { useEffect, useId, useRef } from 'react';
import useFocusTrap from '../../hooks/useFocusTrap';
import IconButton from './IconButton';

export default function AccessibleDialog({ isOpen, onClose, title, description, children, footer }) {
  const titleId = useId();
  const descriptionId = useId();
  const containerRef = useRef(null);
  const closeRef = useRef(null);
  useFocusTrap({ containerRef, initialFocusRef: closeRef, isActive: isOpen, onEscape: onClose, version: title });
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={containerRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex="-1" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><h2 id={titleId} className="text-2xl font-bold text-gray-950">{title}</h2>{description && <p id={descriptionId} className="mt-2 text-lg text-gray-700">{description}</p>}</div>
          <IconButton ref={closeRef} label="대화상자 닫기" variant="ghost" onClick={onClose}>×</IconButton>
        </div>
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-8 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
```

Create the complete `ResponsiveDataView.jsx`:

```jsx
export default function ResponsiveDataView({ items, getKey, renderCard, columns, caption, emptyState }) {
  if (items.length === 0) return emptyState;
  return (
    <>
      <div className="space-y-4 lg:hidden">{items.map((item) => <div key={getKey(item)}>{renderCard(item)}</div>)}</div>
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-gray-200">
          <caption className="sr-only">{caption}</caption>
          <thead><tr>{columns.map((column) => <th key={column.key} scope="col" className="px-4 py-3 text-left text-lg">{column.header}</th>)}</tr></thead>
          <tbody>{items.map((item) => <tr key={getKey(item)}>{columns.map((column) => <td key={column.key} className="px-4 py-4 text-lg">{column.render(item)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
```

- [ ] **Step 5: Build AdminShell and AdminHomePanel**

Create `AdminNav.jsx` with these groups and a real button for each section:

```js
const primary = [['home', '관리자 홈'], ['programs', '프로그램 관리'], ['content', '게시글·공지 관리'], ['donations', '후원 요청']];
const settings = [['intro', '소개글 관리'], ['homeBanner', '홈 배너 관리'], ['mail', '메일 발송']];
const maxOnly = [['categories', '카테고리 관리'], ['users', '사용자 관리']];
```

```jsx
export default function AdminNav({ activeSection, hasMaxAccess, onSelectSection }) {
  const renderGroup = (label, entries) => (
    <div className="space-y-2" aria-label={label}>
      {entries.map(([id, name]) => (
        <button type="button" key={id} onClick={() => onSelectSection(id)} aria-current={activeSection === id ? 'page' : undefined} className={`accessible-touch-target flex w-full items-center rounded-lg px-4 text-left text-lg font-bold ${activeSection === id ? 'bg-forest-primary text-white' : 'text-gray-800 hover:bg-green-50'}`}>{name}</button>
      ))}
    </div>
  );
  return <nav aria-label="관리자 메뉴" className="space-y-6">{renderGroup('주요 업무', primary)}{renderGroup('설정', settings)}{hasMaxAccess && renderGroup('최고 관리자', maxOnly)}</nav>;
}
```

Create `AdminHomePanel.jsx`:

```jsx
import ActionLink from '../ui/ActionLink';

const tasks = [
  { title: '프로그램 관리', description: '프로그램 등록·수정·삭제 상태를 확인합니다.', to: '/admin?section=programs' },
  { title: '신청자 관리', description: '프로그램을 선택해 신청자 목록과 상세를 확인합니다.', to: '/admin?section=programs&programStatus=accepting' },
  { title: '활동 소식 관리', description: '전북생명의숲 활동 게시글을 관리합니다.', to: '/admin?section=content&contentType=activity' },
  { title: '공지 관리', description: '중요 공지의 작성·수정·삭제를 관리합니다.', to: '/admin?section=content&contentType=notice' },
  { title: '후원 요청', description: '접수된 후원 요청을 확인합니다.', to: '/admin?section=donations' },
];

export default function AdminHomePanel() {
  return (
    <section aria-labelledby="admin-home-title">
      <h1 id="admin-home-title" className="text-3xl font-bold text-gray-950">관리자 홈</h1>
      <p className="mt-3 text-lg text-gray-700">처리할 업무를 선택해 주세요. 제공되지 않는 통계는 표시하지 않습니다.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {tasks.map((task) => <article key={task.to} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-bold text-gray-950">{task.title}</h2><p className="mt-3 text-lg leading-[1.7] text-gray-700">{task.description}</p><ActionLink to={task.to} className="mt-6 w-full">{task.title} 열기</ActionLink></article>)}
      </div>
    </section>
  );
}
```

Create `AdminShell.jsx` with `useState(false)`, `triggerRef`, `panelRef`, and `closeRef`. It renders a persistent `aside` at `lg`, a mobile header button named `관리 메뉴 열기`, and when open a panel with `role="dialog"`, `aria-modal="true"`, and `aria-label="관리 메뉴"`. Call `useFocusTrap({ containerRef: panelRef, initialFocusRef: closeRef, isActive: open, onEscape: close })`, lock body scroll, call `onSelectSection` then close on mobile, and render the current `title` as a non-heading status label above `<main>{children}</main>` so each panel owns exactly one `h1`. All nav controls use `AdminNav` and 48px primitives.

Wrap legacy panels with `AdminShell`, render `AdminHomePanel` only for `state.section === 'home'`, and do not mount data-fetching legacy panels until their section is active.

- [ ] **Step 6: Run and commit**

Run:

```bash
npx playwright test tests/e2e/admin-shell.spec.js --project=desktop --project=mobile --grep "admin entry|mobile admin drawer"
npm run lint
npm run build
```

Expected: focused E2E, lint, and build PASS.

```bash
git add src/components/ui src/components/admin src/pages/admin/AdminDashboard.jsx tests/e2e/admin-shell.spec.js
git commit -m "feat: add accessible Forest admin shell"
```

---

### Task 3: Extract and harden program management

**Files:**
- Create: `src/utils/programFilters.js`
- Create: `tests/unit/programFilters.test.js`
- Create: `src/components/admin/ProgramPanel.jsx`
- Modify: `src/pages/admin/AdminDashboard.jsx:184-238,296-311,552-567,751-1047`
- Modify: `src/pages/program/ProgramCreate.jsx:10-127`
- Modify: `src/pages/program/ProgramDetail.jsx:38-50,158-175`
- Create: `tests/e2e/admin-programs.spec.js`

**Interfaces:**
- Produces: `filterPrograms(programs, filters)` and `paginate(items, page, pageSize)`.
- Produces: `ProgramPanel({ routeState, searchParams, setSearchParams })`.

- [ ] **Step 1: Write failing filter contract tests**

Create `programFilters.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { filterPrograms, paginate } from '../../src/utils/programFilters.js';

const programs = [
  { id: 'done', title: '종료 숲길', category: 'PARTICIPATE', status: 'DONE', eventDate: '2026-07-01T10:00:00' },
  { id: 'active', title: '시민 숲길', category: 'PARTICIPATE', status: 'IN_PROGRESS', eventDate: '2026-07-20T10:00:00' },
  { id: 'closed', title: '마감 교육', category: 'GUIDE', status: 'CLOSED', eventDate: '2026-07-10T10:00:00' },
  { id: 'upcoming', title: '예정 봉사', category: 'VOLUNTEER', status: 'UPCOMING', eventDate: 'invalid' },
];

test('status groups map accepting, upcoming, and ended exactly', () => {
  assert.deepEqual(filterPrograms(programs, { query: '', category: 'all', status: 'accepting', from: '', to: '' }).map(({ id }) => id), ['active']);
  assert.deepEqual(filterPrograms(programs, { query: '', category: 'all', status: 'upcoming', from: '', to: '' }).map(({ id }) => id), ['upcoming']);
  assert.deepEqual(new Set(filterPrograms(programs, { query: '', category: 'all', status: 'ended', from: '', to: '' }).map(({ id }) => id)), new Set(['closed', 'done']));
});

test('search, category, and inclusive date bounds use contract fields', () => {
  const result = filterPrograms(programs, { query: '시민', category: 'participate', status: 'all', from: '2026-07-20', to: '2026-07-20' });
  assert.deepEqual(result.map(({ id }) => id), ['active']);
  assert.equal(filterPrograms(programs, { query: '', category: 'all', status: 'all', from: '', to: '2026-12-31' }).some(({ id }) => id === 'upcoming'), false);
});

test('pagination clamps to a real page', () => {
  assert.deepEqual(paginate([1, 2, 3], 99, 2), { items: [3], page: 2, totalPages: 2 });
});
```

- [ ] **Step 2: Verify failure**

Run: `node --test tests/unit/programFilters.test.js`

Expected: FAIL because `programFilters.js` does not exist.

- [ ] **Step 3: Implement pure filtering**

Create:

```js
import { sortProgramsByStatus } from './programStatus.js';

const STATUS_GROUPS = {
  accepting: new Set(['IN_PROGRESS']),
  upcoming: new Set(['UPCOMING']),
  ended: new Set(['CLOSED', 'DONE']),
};

const matchesStatus = (status, selected) => selected === 'all' || STATUS_GROUPS[selected]?.has(status) === true;
const dateOnly = (value) => String(value || '').match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || '';

export function filterPrograms(programs, filters) {
  const query = filters.query.trim().toLocaleLowerCase('ko-KR');
  return sortProgramsByStatus(programs).filter((program) => {
    const eventDate = dateOnly(program.eventDate);
    const dateMatches = (!filters.from && !filters.to) || (
      Boolean(eventDate)
      && (!filters.from || eventDate >= filters.from)
      && (!filters.to || eventDate <= filters.to)
    );
    return (!query || program.title.toLocaleLowerCase('ko-KR').includes(query))
      && (filters.category === 'all' || program.category?.toLowerCase() === filters.category.toLowerCase())
      && matchesStatus(program.status, filters.status)
      && dateMatches;
  });
}

export function paginate(items, page, pageSize = 10) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return { items: items.slice((safePage - 1) * pageSize, safePage * pageSize), page: safePage, totalPages };
}
```

- [ ] **Step 4: Add failing program workflow E2E**

Extend `adminData.js` with two program fixtures, an applicant-count map, one applicant detail, and an empty form. Extend `mockAdminApi` with exact GET routes for program list/detail, apply counts/list/detail, and program form, plus stateful POST/PUT/DELETE program routes. Add persistent `fail(method, path, status)` and `recover(method, path)` controls checked before normal routing. Add deterministic `hold(method, path)` and `release(method, path)` controls: a held method/path pair awaits a controller-owned promise before returning, `release` resolves it once, and fixture teardown fails if any hold remains unresolved. Method-scoped keys are required because each editor loads and updates the same pathname with GET and PUT; a forced PUT failure must not break the initial GET. Parse multipart text fields from the request boundary into a map; record filenames separately and never decode file bytes into logs. POST assigns `program-${state.sequences.program++}`, PUT merges only submitted fields, and DELETE removes only the matching ID. Return the existing `{ data: ... }` and paginated `{ data: { contents, hasNextPage, totalCount } }` envelopes, and expose the shared `requests` audit array on the fixture controller.

Implement request gates exactly once in the shared controller:

```js
const controlKey = (method, path) => `${method.toUpperCase()} ${path}`;
const holds = new Map();
const awaitHold = async (method, path) => {
  const key = controlKey(method, path);
  if (holds.has(key)) await holds.get(key).promise;
};
const hold = (method, path) => {
  const key = controlKey(method, path);
  if (holds.has(key)) throw new Error(`route already held: ${key}`);
  let release;
  const promise = new Promise((resolve) => { release = resolve; });
  holds.set(key, { promise, release });
};
const release = (method, path) => {
  const key = controlKey(method, path);
  const gate = holds.get(key);
  if (!gate) throw new Error(`route is not held: ${key}`);
  holds.delete(key);
  gate.release();
};
```

After recording the request and applying a forced failure override, call `await awaitHold(path)` immediately before the normal response/mutation. `assertSafe()` also requires `holds.size === 0`.

Create `admin-programs.spec.js` with custom `adminTest` imports. The primary test performs these exact assertions:

```js
test('program filters, history, and delete dialog preserve a single request', async ({ page, adminApi, pageQuality }) => {
  expect(pageQuality).toBeDefined();
  await page.goto('/admin?section=programs');
  await expect(page.getByText('현재 불러온 목록 내 검색')).toBeVisible();
  await page.getByLabel('프로그램 제목 검색').fill('시민');
  await page.getByLabel('접수 상태').selectOption('accepting');
  await expect(page).toHaveURL(/programQuery=%EC%8B%9C%EB%AF%BC/);
  await expect(page).toHaveURL(/programStatus=accepting/);
  const deleteButton = page.getByRole('button', { name: '시민 숲길 프로그램 삭제' });
  await deleteButton.focus();
  await deleteButton.click();
  const dialog = page.getByRole('dialog', { name: '프로그램 삭제 확인' });
  await expect(dialog).toBeVisible();
  expect((await dialog.getByRole('button', { name: '삭제' }).boundingBox()).height).toBeGreaterThanOrEqual(48);
  await page.keyboard.press('Escape');
  await expect(deleteButton).toBeFocused();
  await deleteButton.click();
  const confirm = page.getByRole('dialog', { name: '프로그램 삭제 확인' }).getByRole('button', { name: '삭제' });
  await confirm.dblclick();
  await expect(page.getByText('시민 숲길 프로그램')).toHaveCount(0);
  expect(adminApi.requests.filter(({ method, path }) => method === 'DELETE' && path === '/program/information/program-1')).toHaveLength(1);
});
```

Add separate named tests for loading, empty, persistent 500 followed by explicit retry, applicant list/detail, failed delete retaining the row, edit return state, and create invalidation. Each failure remains active until the test calls `adminApi.recover(method, path)` so React Query retries cannot hide the state. Before the intentional list-500 navigation call `pageQuality.allowConsoleError(/^Error fetching programs:/)`; before the intentional delete-500 mutation call `pageQuality.allowConsoleError(/^Error deleting program:/)`. Do not disable the automatic quality fixture or allow generic `AxiosError` text.

- [ ] **Step 5: Extract the proven program block**

Move the current program queries, applicant-count query, delete mutation, form-builder state, applicant-detail state, mobile cards, desktop table, and existing program dialogs into `ProgramPanel`. Keep service calls, but render list/card variants through `ResponsiveDataView` at `lg` instead of retaining the old `2xl` breakpoint. Use `FormField`, `Button`, `IconButton`, `StatusBadge`, and `AccessibleDialog` throughout; no new `text-sm` or sub-48px action remains.

`ProgramPanel` owns one level-1 heading with exact text `프로그램 관리`.

Use these exact query rules:

```js
queryKey: ['programs', routeState.category]
queryFn: () => fetchPrograms(1, 100, routeState.category === 'all' ? null : routeState.category)
```

Only client-filter the returned array. On any filter other than page changing, patch `programPage: 1`. Disable delete while `isPending`; use `AccessibleDialog` instead of `window.confirm`.

Render status options exactly `전체(all)`, `접수 중(accepting)`, `예정(upcoming)`, and `종료(ended)`. Label the date controls `행사일 시작` and `행사일 종료`, the search input `프로그램 제목 검색`, and the four-value category select `카테고리`. Display `현재 불러온 목록 내 검색` beside the filters. Program card/table actions are explicit links/buttons named `<title> 상세 보기`, `<title> 수정`, `<title> 신청자 보기`, and `<title> 삭제`; use the same names on mobile and desktop.

Make every program editor control programmatically labelled, not just visually adjacent to a `<label>`: `프로그램 제목`, `신청 시작일시`, `신청 마감일시`, `행사 일시`, `외부 신청 링크`, `프로그램 참고 링크`, `모집 인원`, `카테고리`, `상태` (edit only), `본문`, and `첨부 파일`. `본문` is the accessible name on Quill's contenteditable surface. Create submit is exactly `등록`/`등록 중…`; edit submit is exactly `수정`/`수정 중…`. Program detail renders an edit `Link` named `<title> 수정` and a delete button named `<title> 삭제`; its dialog is `프로그램 삭제 확인` with `취소`, `삭제`, and pending `삭제 중…`.

In `ProgramCreate`, invalidate `['programs']` on success and navigate to the safe `returnTo`. In `ProgramDetail`, pass the originating `returnTo` to edit and use it after admin deletion; retain the current public fallback when no state exists.

- [ ] **Step 6: Run and commit**

Run:

```bash
node --test tests/unit/programFilters.test.js
npx playwright test tests/e2e/admin-programs.spec.js --project=desktop --project=mobile
npm run lint
```

Expected: all program tests PASS; no duplicate delete or malformed count request appears in the request audit.

```bash
git add src/utils/programFilters.js tests/unit/programFilters.test.js src/components/admin/ProgramPanel.jsx src/pages/admin/AdminDashboard.jsx src/pages/program/ProgramCreate.jsx src/pages/program/ProgramDetail.jsx tests/e2e/admin-programs.spec.js
git commit -m "feat: stabilize Forest program management"
```

---

### Task 4: Add unified, contract-honest content management

**Files:**
- Create: `src/utils/adminContent.js`
- Create: `tests/unit/adminContent.test.js`
- Create: `src/components/admin/ContentPanel.jsx`
- Modify: `src/services/categoryService.js`
- Modify: `src/pages/admin/AdminDashboard.jsx`
- Create: `tests/e2e/admin-content.spec.js`

**Interfaces:**
- Produces: `fetchManageCategories() -> CategoryManageDto[]` from `/categories/manage`.
- Produces: `normalizeNoticeRows`, `normalizePostRows`, `filterContentRows`, `paginateContentRows`.
- Produces: `ContentPanel({ routeState, searchParams, setSearchParams })`.

- [ ] **Step 1: Write failing row-normalization tests**

Create `adminContent.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { filterContentRows, normalizeNoticeRows, normalizePostRows, paginateContentRows } from '../../src/utils/adminContent.js';

const item = { id: 42, title: '숲 소식', updatedAt: '2026-07-18T10:00:00' };

test('notice and post routes preserve string IDs and modification date semantics', () => {
  const [notice] = normalizeNoticeRows([item]);
  const [post] = normalizePostRows({ items: [item], board: { id: '0', name: '활동 소식', type: 'POST' } });
  assert.equal(notice.id, '42');
  assert.equal(notice.detailTo, '/news/notice/42');
  assert.equal(post.detailTo, '/post/0/42');
  assert.equal(post.dateLabel, '최근 수정일');
  assert.equal(post.visibility, 'unknown');
});

test('information is edit-disabled but delete-supported with an honest title', () => {
  const [information] = normalizePostRows({ items: [{ ...item, title: '' }], board: { id: '77', name: '사진 자료', type: 'INFORMATION' } });
  assert.equal(information.title, '이미지 자료 #42');
  assert.equal(information.canEdit, false);
  assert.equal(information.canDelete, true);
  assert.equal(information.editTo, null);
});

test('content search is case-insensitive over normalized titles only', () => {
  const rows = normalizeNoticeRows([item, { ...item, id: 43, title: '다른 공지' }]);
  assert.deepEqual(filterContentRows(rows, '숲').map(({ id }) => id), ['42']);
});

test('content pagination clamps to an existing URL page', () => {
  const rows = Array.from({ length: 12 }, (_, index) => ({ id: String(index + 1) }));
  assert.deepEqual(paginateContentRows(rows, 9, 10), { items: rows.slice(10), page: 2, totalPages: 2 });
});
```

- [ ] **Step 2: Verify failure**

Run: `node --test tests/unit/adminContent.test.js`

Expected: FAIL because `adminContent.js` does not exist.

- [ ] **Step 3: Implement the normalizers**

Add `fetchManageCategories`:

```js
export const fetchManageCategories = async () => {
  const response = await axiosInstance.get('/categories/manage');
  return response.data.data;
};
```

Use this exact row factory and complete normalizers:

```js
const row = ({ kind, boardId, boardLabel, item, canEdit, canDelete, detailTo, editTo }) => ({
  key: `${kind}:${item.id}`,
  id: String(item.id),
  kind,
  boardId: boardId == null ? null : String(boardId),
  boardLabel,
  title: item.title?.trim() || `이미지 자료 #${item.id}`,
  updatedAt: item.updatedAt,
  dateLabel: '최근 수정일',
  visibility: 'unknown',
  canEdit,
  canDelete,
  detailTo,
  editTo,
});

export const normalizeNoticeRows = (items) => items.map((item) => row({
  kind: 'notice', boardId: null, boardLabel: '공지사항', item,
  canEdit: true, canDelete: true,
  detailTo: `/news/notice/${item.id}`, editTo: `/news/notice/edit/${item.id}`,
}));

export const normalizePostRows = ({ items, board }) => items.map((item) => row({
  kind: board.type === 'INFORMATION' ? 'information' : board.id === '0' ? 'activity' : 'post',
  boardId: board.id,
  boardLabel: board.name,
  item,
  canEdit: board.type !== 'INFORMATION',
  canDelete: true,
  detailTo: `/post/${board.id}/${item.id}`,
  editTo: board.type === 'INFORMATION' ? null : `/category/${board.id}/edit/${item.id}`,
}));

export const filterContentRows = (items, query) => {
  const normalized = query.trim().toLocaleLowerCase('ko-KR');
  return normalized ? items.filter(({ title }) => title.toLocaleLowerCase('ko-KR').includes(normalized)) : items;
};

export function paginateContentRows(items, page, pageSize = 10) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return { items: items.slice((safePage - 1) * pageSize, safePage * pageSize), page: safePage, totalPages };
}
```

Use `/categories/manage` only for the authenticated content selector because public `/categories` omits `type`; never infer INFORMATION from a name or ID.

- [ ] **Step 4: Add failing source-switch and deletion E2E**

Extend admin fixtures/mocks with `/categories/manage`, at least twelve notices, notice list/detail, post list/detail, and stateful notice/post mutation routes. Assert that notice requests only `/notice?page=1`, activity requests only `/posts/0`, and board requests only selected `/posts/:id`. Test URL persistence, loading, empty, persistent 500 then retry, `상태 API 미제공`, INFORMATION without edit but with confirmed delete, exact return state, and cancel/failure/success deletion. Navigate to `contentPage=2`, edit a row from that page, and assert the exact page-2 URL and edited row are restored on return. Before intentional notice-list, post-list, or notice-delete 500s allow only `/^공지사항 목록 조회 중 오류:/`, `/^Error fetching posts:/`, or `/^공지사항 삭제 중 오류:/` respectively. Do not allow a console pattern for a service path that does not log, and never use a broad Axios allowlist.

- [ ] **Step 5: Build ContentPanel without a fake combined API**

Use three mutually exclusive query branches controlled by `routeState.type`. Load management categories once for the board selector; fetch posts only for selected board. Set `enabled` so inactive notice/post queries never execute. Filter rows, then call `paginateContentRows(filteredRows, routeState.page, 10)` and render only its `items`; render 48px 이전/다음 controls named `이전 콘텐츠 페이지` and `다음 콘텐츠 페이지`, plus exact current-page text `<page> / <totalPages> 페이지`. Changing content type, board, or query patches `contentPage: 1`; an out-of-range page is replaced with the clamped page. Use `ResponsiveDataView`, `AsyncState`, `StatusBadge`, and `AccessibleDialog`. Call `deleteNotice(id)` for notice rows and `deletePost(boardId, id)` for activity/POST/INFORMATION rows, then invalidate only the matching list query. Table/card columns are 제목, 게시판, 최근 수정일, 상태, 작업; no `작성일` or invented visibility appears.

The controls and actions use these exact accessible names in both responsive variants: `콘텐츠 유형`, `게시판`, `게시글·공지 제목 검색`, `<title> 상세 보기`, `<title> 수정`, and `<title> 삭제`. The confirmed delete dialog is `게시글·공지 삭제 확인`, with `취소`, `삭제`, and pending `삭제 중…`. Add create links named `공지사항 작성`, `활동 소식 작성`, or `<board name> 게시글 작성`; do not render create/edit for INFORMATION. Every create/detail/edit link, including the program links above, passes `state={{ returnTo: buildAdminReturnTo(searchParams) }}`. This is required for `contentPage=2` restoration; consuming `location.state` in an editor cannot restore a state that the originating link never supplied.

`ContentPanel` owns one level-1 heading with exact text `게시글·공지 관리`.

The visibility cell must always render:

```jsx
<StatusBadge tone="neutral">상태 API 미제공</StatusBadge>
```

INFORMATION rows render `편집 준비 중`, a detail action, and the same confirmed danger delete action; they never render an edit link.

- [ ] **Step 6: Run and commit**

Run:

```bash
node --test tests/unit/adminContent.test.js
npx playwright test tests/e2e/admin-content.spec.js --project=desktop --project=mobile
npm run lint
```

Expected: tests PASS and the request audit proves one active source at a time.

```bash
git add src/utils/adminContent.js tests/unit/adminContent.test.js src/services/categoryService.js src/components/admin/ContentPanel.jsx src/pages/admin/AdminDashboard.jsx tests/e2e/fixtures/adminData.js tests/e2e/support/mockAdminApi.js tests/e2e/admin-content.spec.js
git commit -m "feat: add Forest content management panel"
```

---

### Task 5: Preserve editor work and return to the exact list state

**Files:**
- Create: `src/hooks/useUnsavedChanges.js`
- Create: `src/components/admin/UnsavedChangesDialog.jsx`
- Modify: `src/pages/program/ProgramEdit.jsx`
- Modify: `src/pages/post/PostEdit.jsx`
- Modify: `src/pages/post/PostDetail.jsx`
- Modify: `src/pages/notice/NoticeEdit.jsx`
- Modify: `src/pages/notice/NoticeDetail.jsx`
- Modify: `src/pages/program/ProgramCreate.jsx`
- Modify: `src/pages/post/PostWrite.jsx`
- Modify: `src/pages/notice/NoticeWrite.jsx`
- Create: `tests/e2e/admin-editors.spec.js`

**Interfaces:**
- Produces: `useUnsavedChanges(isDirty) -> { isBlocked, stay, leave, allowNextNavigation }`.
- Every editor consumes `location.state?.returnTo` through `getSafeReturnTo` and keeps its current public fallback.

- [ ] **Step 1: Add failing editor E2E**

Test program, post, and notice editors separately: modify one field, attempt in-app navigation, cancel in the accessible dialog and retain values, confirm and navigate, simulate persistent PUT 500 and retain values, recover and retry, then return to the exact admin URL. Hold one save request open, attempt browser/layout navigation, assert the page remains and the discard action is disabled, then release the request and verify success navigation. Submit twice and assert one request in the audit. Add a program file comparison case and a first-invalid-field focus case.

- [ ] **Step 2: Verify failure**

Run: `npx playwright test tests/e2e/admin-editors.spec.js --project=desktop`

Expected: FAIL because Post/Notice ignore `returnTo`, no common dirty guard exists, and several failures use alerts only.

- [ ] **Step 3: Add the navigation guard**

Create `useUnsavedChanges.js`:

```js
import { useCallback, useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';

export default function useUnsavedChanges(isDirty) {
  const allowNavigationRef = useRef(false);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => (
    Boolean(isDirty)
    && !allowNavigationRef.current
    && `${currentLocation.pathname}${currentLocation.search}${currentLocation.hash}` !== `${nextLocation.pathname}${nextLocation.search}${nextLocation.hash}`
  ));
  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (!isDirty || allowNavigationRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);
  const stay = useCallback(() => blocker.state === 'blocked' && blocker.reset(), [blocker]);
  const leave = useCallback(() => {
    if (blocker.state !== 'blocked') return;
    allowNavigationRef.current = true;
    blocker.proceed();
  }, [blocker]);
  const allowNextNavigation = useCallback(() => { allowNavigationRef.current = true; }, []);
  return { isBlocked: blocker.state === 'blocked', stay, leave, allowNextNavigation };
}
```

Create `UnsavedChangesDialog.jsx`:

```jsx
import AccessibleDialog from '../ui/AccessibleDialog';
import Button from '../ui/Button';

export default function UnsavedChangesDialog({ isOpen, onStay, onLeave, isPending = false }) {
  return (
    <AccessibleDialog
      isOpen={isOpen}
      onClose={onStay}
      title="저장하지 않은 변경사항"
      description="입력한 내용을 버리고 이 페이지를 나갈까요?"
      footer={<><Button variant="secondary" onClick={onStay}>계속 작성</Button><Button variant="danger" onClick={onLeave} disabled={isPending}>{isPending ? '저장 완료를 기다려 주세요' : '변경사항 버리고 나가기'}</Button></>}
    ><p className="text-lg text-gray-700">{isPending ? '저장 요청을 처리 중입니다. 완료된 뒤 이동해 주세요.' : '나가면 저장하지 않은 입력은 복구되지 않습니다.'}</p></AccessibleDialog>
  );
}
```

- [ ] **Step 4: Apply the shared editor contract**

For every editor:

1. Save the loaded initial values.
2. Compute `isDirty` by comparing the editable scalar values and file lists with that snapshot.
3. Call `useUnsavedChanges(isDirty || isPending)` and render `UnsavedChangesDialog` with the same `isPending`. While saving, keep navigation and `beforeunload` protection active, allow `계속 작성`/Escape to cancel only the navigation attempt, and disable the destructive leave action.
4. Resolve `returnTo` with `getSafeReturnTo` and the current public fallback.
5. Render errors in a `role="alert"` region without clearing fields.
6. Disable submit while pending and show a pending label through `Button`.
7. On success, invalidate detail and list keys, call `allowNextNavigation()` synchronously, then navigate to `returnTo`; do not rely on a dirty-state render completing first.
8. Put the first invalid field in a ref and focus it after validation.

Use exact programmatic labels rather than sibling-only visual labels. Post write/edit exposes `제목`, `본문`, and `이미지 첨부`; notice write/edit exposes `제목`, `본문`, `이미지 첨부`, and checkbox `중요 공지로 설정`. `본문` labels Quill's contenteditable surface. Post and notice detail edit links are exactly `<title> 수정`. Create buttons are `등록`/`등록 중…`, edit buttons are `수정`/`수정 중…`, and any failed mutation renders the exact live-region text `저장하지 못했습니다. 다시 시도해 주세요.` without logging an uncaught error or clearing any field. Missing details render a `role="alert"` with exact text `프로그램을 찾을 수 없습니다.`, `게시글을 찾을 수 없습니다.`, or `공지사항을 찾을 수 없습니다.` respectively.

Program create/edit uses a serialized snapshot of scalar fields, sorted existing bucket IDs, sorted deleted IDs, and new file `name:size:lastModified` tuples. Headings separate `기본 정보`, `본문`, `기존 첨부`, and `새 첨부`; labels/actions use text-lg and 48px controls.

Post write/edit compares title, editor HTML, and dynamic fields; notice write/edit compares title, editor HTML, and important flag. Existing images are shown under `현재 첨부 — 이번 수정 화면에서는 교체할 수 없습니다` and are not falsely added to the update payload. New body images continue through the inline editor upload path. Each screen owns its initial snapshot only after detail loading succeeds.

Implement in three reviewable substeps and run the focused spec after each: (A) ProgramCreate/ProgramEdit, (B) PostWrite/PostEdit/PostDetail return state, (C) NoticeWrite/NoticeEdit/Notice list return state. Each substep must include its own failing E2E before implementation.

- [ ] **Step 5: Run and commit**

Run:

```bash
npx playwright test tests/e2e/admin-editors.spec.js --project=desktop --project=mobile
npm run lint
npm run build
```

Expected: all editor flows PASS, including failed-save value retention and exact return URLs.

```bash
git add src/hooks/useUnsavedChanges.js src/components/admin/UnsavedChangesDialog.jsx src/pages/program src/pages/post src/pages/notice tests/e2e/admin-editors.spec.js
git commit -m "feat: preserve Forest editor work and return state"
```

---

### Task 6: Replace remaining inaccessible administrator dialogs and row clicks

**Files:**
- Modify: `src/pages/admin/AdminDashboard.jsx:1437-1739`
- Modify: `src/pages/program/ProgramDetail.jsx`
- Modify: `src/pages/post/PostDetail.jsx`
- Modify: `src/pages/static/Notice.jsx`
- Modify: `tests/e2e/admin-shell.spec.js`
- Create: `tests/e2e/admin-delete-dialogs.spec.js`
- Modify: `tests/e2e/fixtures/adminData.js`
- Modify: `tests/e2e/support/mockAdminApi.js`

- [ ] **Step 1: Add exact intro/supporter fixtures and failing legacy accessibility tests**

Extend `adminData.js` with all five `intro-*` keys as `{ key, title, content }` values and a supporter page envelope containing one named supporter. Extend `mockAdminApi.js` before writing the UI assertions with exact stateful handlers for `GET /static-content/:key`, `PUT /static-content/:key`, `GET /forest/supporters?page=:page&size=:size`, and `PATCH /forest/supports/mark/:id`; record each mutation and return 404 for an unknown key/ID. Test the intro editor and supporter detail for role/name, Escape close, Tab containment, trigger focus restoration, 48px actions, and a dedicated `<후원자명> 후원 상세보기` button that works by keyboard. At mobile width, assert supporter items are cards and no table is visible. In `admin-delete-dialogs.spec.js`, write red tests for administrator deletion from existing program detail, post detail, and notice list routes: cancel, Escape, trigger-focus restoration, held-request pending state, persistent 500 retaining the item, recovery, and exactly one audited DELETE after double activation.

- [ ] **Step 2: Verify failure**

Run: `npx playwright test tests/e2e/admin-shell.spec.js tests/e2e/admin-delete-dialogs.spec.js --project=desktop --project=mobile --grep "intro dialog|supporter dialog|delete dialog"`

Expected: FAIL because both current overlays lack dialog semantics/focus trapping, supporter rows are mouse-click targets, and the three legacy delete flows still use native confirms.

- [ ] **Step 3: Migrate both overlays**

Wrap existing intro and supporter content in `AccessibleDialog`; remove click behavior from `<tr>` and add an explicit `Button variant="ghost" aria-label={`${supporter.name} 후원 상세보기`}>상세보기</Button>` in the action column/card. Render supporter desktop rows and mobile cards through `ResponsiveDataView`. Replace `text-xs` status/action classes with `text-lg leading-[1.7]` for controls and secondary metadata, and ensure every action uses `Button` or `IconButton`.

Replace `window.confirm` in `ProgramDetail`, `PostDetail`, and `Notice` with `AccessibleDialog`. Keep the original delete service and success navigation/invalidation contracts. Use exact dialog names `프로그램 삭제 확인`, `게시글·공지 삭제 확인`, and `게시글·공지 삭제 확인` respectively, with actions `취소`, `삭제`, and pending `삭제 중…`. Detail/list triggers retain the exact `<title> 삭제` name. The danger action uses `Button isPending`, cannot issue a second mutation, failure closes neither the dialog nor the underlying row/detail, Escape/cancel restores focus to the exact delete trigger, and only server success removes/navigates. A caught delete failure keeps the dialog and item visible and renders `role="alert"` text `삭제하지 못했습니다. 다시 시도해 주세요.` without an uncaught console error.

- [ ] **Step 4: Run and commit**

Run:

```bash
npx playwright test tests/e2e/admin-shell.spec.js tests/e2e/admin-delete-dialogs.spec.js --project=desktop --project=mobile --grep "intro dialog|supporter dialog|delete dialog"
npm run lint
```

Expected: PASS and zero lint warnings.

```bash
git add src/pages/admin/AdminDashboard.jsx src/pages/program/ProgramDetail.jsx src/pages/post/PostDetail.jsx src/pages/static/Notice.jsx tests/e2e/admin-shell.spec.js tests/e2e/admin-delete-dialogs.spec.js tests/e2e/fixtures/adminData.js tests/e2e/support/mockAdminApi.js
git commit -m "fix: make Forest admin dialogs keyboard accessible"
```

---

### Task 7: Complete stateful mock CRUD and the administrator draft gate

**Files:**
- Create: `.env.admin-draft`
- Create: `tests/draft/adminApiResponses.js`
- Create: `tests/draft/draftApiPlugin.test.js`
- Create: `tests/unit/adminApiResponses.test.js`
- Modify: `tests/e2e/fixtures/adminData.js`
- Modify: `tests/e2e/support/mockAdminApi.js`
- Modify: `tests/draft/draftApiPlugin.js`
- Modify: `vite.config.js`
- Create: `tests/e2e/admin-crud-regression.spec.js`
- Create: `tests/e2e/admin-visual.spec.js`
- Create: Playwright snapshots under `tests/e2e/*-snapshots/`

**Interfaces:**
- Produces: `installAdminApiMocks(page) -> { requests, state, setPersona, fail(method, path, status), recover(method, path), hold(method, path), release(method, path), assertSafe }`.
- Produces: `parseRequestFields({ method, rawUrl, headers, body }) -> Promise<{ textFields, fileNames }>`.
- Produces: `resolveAdminDraftRequest({ state, persona, method, rawUrl, headers, body, forcedStatus }) -> Promise<{ status, body, audit }>`.
- Produces a draft-only mutable state object for program/post/notice create, update, and delete.

- [ ] **Step 1: Add exact admin persona data**

Create `.env.admin-draft`:

```dotenv
VITE_DRAFT_MODE=true
VITE_DRAFT_PERSONA=admin
VITE_API_BASE_URL=/api/v1
```

Finish `tests/e2e/fixtures/adminData.js` with a concrete export before any resolver imports it. Keep the `adminPersonas` export from Task 2 and append this block; prose-only fixture descriptions are not sufficient:

```js
const noticeFixtures = Array.from({ length: 12 }, (_, index) => ({
  id: `notice-${index + 1}`,
  authorId: 'admin-1',
  authorName: '콘텐츠 관리자',
  title: index === 0 ? '공지 회귀 기준 01' : `공지 회귀 기준 ${String(index + 1).padStart(2, '0')}`,
  content: `<p>공지 본문 ${index + 1}</p>`,
  images: [],
  dynamicFields: { important: index === 0 },
  updatedAt: `2026-07-${String(17 - index).padStart(2, '0')}T09:00:00`,
}));

export const adminData = {
  personas: adminPersonas,
  categories: [{ id: '0', name: '활동 소식' }, { id: '1', name: '숲 정보' }],
  manageCategories: [
    { id: '0', name: '활동 소식', type: 'POST' },
    { id: '1', name: '숲 정보', type: 'INFORMATION' },
  ],
  homeBanner: {
    badgeText: '2026 숲과 함께하는 시민 활동',
    title: '전북생명의숲에 오신 것을 환영합니다',
    description: '숲을 통해 생명의 가치를 전합니다.',
    backgroundImageUrl: '', sideImageUrl: '', titleColor: '#FFFFFF', descriptionColor: '#ECFDF5',
    badgeTextColor: '#ECFDF5', primaryButtonText: '소개 보기', primaryButtonLink: '/intro',
  },
  staticContents: Object.fromEntries([
    ['intro-greeting', '인사말'], ['intro-declaration', '창립선언문'], ['intro-people', '함께하는이들'],
    ['intro-activities', '주요활동'], ['intro-location', '오시는 길'],
  ].map(([key, title]) => [key, { key, title, content: `<p>${title} 기준 본문</p>` }])),
  programs: [
    { id: 'program-1', title: '시민 숲길 프로그램', content: '<p>숲길 본문</p>', applyStartDate: '2026-07-20T09:00:00', applyEndDate: '2026-07-31T18:00:00', eventDate: '2026-08-10T10:00:00', applyUrl: null, programUrl: null, maxParticipants: 20, category: 'PARTICIPATE', status: 'IN_PROGRESS', files: [], updatedAt: '2026-07-18T09:00:00' },
    { id: 'program-2', title: '도시숲 안내 프로그램', content: '<p>안내 본문</p>', applyStartDate: '2026-08-01T09:00:00', applyEndDate: '2026-08-15T18:00:00', eventDate: '2026-08-20T10:00:00', applyUrl: null, programUrl: null, maxParticipants: 15, category: 'GUIDE', status: 'UPCOMING', files: [], updatedAt: '2026-07-17T09:00:00' },
  ],
  programApplyCounts: { 'program-1': 1, 'program-2': 0 },
  programAppliesByProgram: { 'program-1': [{ id: 'apply-1', programId: 'program-1', proposer: '김숲', userId: 'user-1', createdAt: '2026-07-18T09:00:00', formResponses: [] }], 'program-2': [] },
  programAppliesById: { 'apply-1': { id: 'apply-1', programId: 'program-1', proposer: '김숲', userId: 'user-1', createdAt: '2026-07-18T09:00:00', formResponses: [] } },
  programFormsByProgram: { 'program-1': null, 'program-2': null },
  postsByCategory: {
    0: [{ id: 'post-1', authorId: 'admin-1', authorName: '콘텐츠 관리자', title: '숲길 활동 기준 게시글', content: '<p>활동 기준 본문</p>', images: [], thumbnail: null, dynamicFields: {}, updatedAt: '2026-07-18T09:00:00' }],
    1: [{ id: 'post-info-1', authorId: 'admin-1', authorName: '콘텐츠 관리자', title: '숲 정보 기준 게시글', content: '<p>정보 기준 본문</p>', images: [], thumbnail: null, dynamicFields: {}, updatedAt: '2026-07-18T09:00:00' }],
  },
  notices: noticeFixtures,
  supporters: [{ id: 'supporter-1', name: '박후원', phoneNumber: '010-1111-2222', isCompleted: false, createdAt: '2026-07-18T09:00:00' }],
};
```

Refactor `vite.config.js` to derive `const isDraftMode = ['draft', 'admin-draft'].includes(mode)`. Mount the draft plugin only when `isDraftMode`, set `server.strictPort: true`, and set `server.proxy: undefined` for both modes; only normal development may retain the localhost backend proxy. The plugin returns an ADMIN `/users` response only for admin-draft; normal draft remains guest. It rejects every non-GET method unless the mode is exactly `admin-draft`.

Add a Vite middleware test that starts admin-draft with a deliberately unreachable proxy target, sends an unregistered `POST /api/v1/unregistered`, and expects local `501` plus no upstream request. Also send the same request in normal draft and expect local `405`. This fail-closed test must be red before the config/plugin change and green before any CRUD mock work continues.

- [ ] **Step 2: Write failing multipart/parser and resolver unit tests**

Create `tests/unit/adminApiResponses.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { adminData } from '../e2e/fixtures/adminData.js';
import {
  createAdminDraftState,
  parseRequestFields,
  resolveAdminDraftRequest,
} from '../draft/adminApiResponses.js';

async function encodeFormData(url, formData) {
  const request = new Request(`http://draft.local${url}`, { method: 'POST', body: formData });
  return {
    headers: { 'content-type': request.headers.get('content-type') },
    body: Buffer.from(await request.arrayBuffer()),
  };
}

test('multipart parser decodes dynamic_fields JSON and never records binary bytes', async () => {
  const formData = new FormData();
  formData.append('title', '중요 공지');
  formData.append('deleteFiles', '9001');
  formData.append('deleteFiles', '9002');
  formData.append('dynamic_fields', new Blob(
    [JSON.stringify({ important: true })],
    { type: 'application/json' },
  ));
  formData.append('images', new Blob(['img'], { type: 'image/jpeg' }), 'leaf.jpg');
  const encoded = await encodeFormData('/api/v1/notice', formData);

  const result = await parseRequestFields({
    method: 'POST',
    rawUrl: '/api/v1/notice',
    ...encoded,
  });

  assert.equal(result.textFields.title, '중요 공지');
  assert.deepEqual(result.textFields.deleteFiles, ['9001', '9002']);
  assert.deepEqual(result.textFields.dynamic_fields, { important: true });
  assert.deepEqual(result.fileNames, [
    { field: 'images', name: 'leaf.jpg', size: 3, type: 'image/jpeg' },
  ]);
  assert.equal(JSON.stringify(result).includes('img'), false);
});

test('notice create resolver preserves the important flag and returns the backend envelope', async () => {
  const state = createAdminDraftState(adminData);
  const formData = new FormData();
  formData.append('title', '초안 공지 회귀');
  formData.append('content', '<p>본문</p>');
  formData.append('dynamic_fields', new Blob(
    [JSON.stringify({ important: true })],
    { type: 'application/json' },
  ));
  const encoded = await encodeFormData('/api/v1/notice', formData);

  const result = await resolveAdminDraftRequest({
    state,
    persona: 'ADMIN',
    method: 'POST',
    rawUrl: '/api/v1/notice',
    ...encoded,
  });

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { success: true, data: null });
  assert.deepEqual(state.notices.at(-1).dynamicFields, { important: true });
  assert.equal(result.audit.path, '/notice');
});

test('unregistered route is fail-closed and cannot mutate state', async () => {
  const state = createAdminDraftState(adminData);
  const before = structuredClone(state);
  const result = await resolveAdminDraftRequest({
    state,
    persona: 'ADMIN',
    method: 'POST',
    rawUrl: '/api/v1/unregistered',
    headers: { 'content-type': 'application/json' },
    body: Buffer.from('{}'),
  });
  assert.equal(result.status, 501);
  assert.deepEqual(state, before);
});
```

Run: `node --test tests/unit/adminApiResponses.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `adminApiResponses.js`.

- [ ] **Step 3: Implement stateful mock operations with an audit log**

Create `adminApiResponses.js` with the exact exports named in the Task 7 interface. The Vite middleware reads the request stream into a Buffer and passes the same request object that Playwright's adapter creates from `request.postDataBuffer()`. Both adapters record only the resolver's `{ method, path, textFields, fileNames }` audit object and never store binary bodies.

Start `tests/draft/adminApiResponses.js` with this Node 20 parser. JSON request bodies remain camel-case objects. Multipart `dynamic_fields` is a JSON `Blob` in `NoticeWrite`; decode only that named `application/json` part. Every other `Blob`/`File` is binary and contributes filename metadata only:

```js
const append = (target, key, value) => {
  if (!(key in target)) target[key] = value;
  else target[key] = Array.isArray(target[key]) ? [...target[key], value] : [target[key], value];
};

const getHeader = (headers, name) => {
  if (typeof headers?.get === 'function') return headers.get(name) || '';
  const entry = Object.entries(headers || {}).find(([key]) => key.toLowerCase() === name);
  return entry?.[1] || '';
};

export async function parseRequestFields({ method, rawUrl, headers = {}, body }) {
  if (!body?.length) return { textFields: {}, fileNames: [] };
  const contentType = getHeader(headers, 'content-type');
  if (contentType.includes('application/json')) {
    return { textFields: JSON.parse(body.toString('utf8')), fileNames: [] };
  }
  if (!contentType.includes('multipart/form-data')) throw new Error(`unsupported draft content type for ${method} ${rawUrl}`);
  const request = new Request(new URL(rawUrl, 'http://draft.local'), { method, headers: { 'content-type': contentType }, body });
  const formData = await request.formData();
  const textFields = {};
  const fileNames = [];
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') append(textFields, key, value);
    else if (key === 'dynamic_fields' && value.type === 'application/json') {
      append(textFields, key, JSON.parse(await value.text()));
    } else {
      fileNames.push({ field: key, name: value.name, size: value.size, type: value.type });
    }
  }
  return { textFields, fileNames };
}

export function createAdminDraftState(fixtures) {
  const value = structuredClone(fixtures);
  return {
    ...value,
    sequences: {
      program: value.programs.length + 1,
      post: Object.values(value.postsByCategory).flat().length + 1,
      notice: value.notices.length + 1,
    },
  };
}

const scalar = (value) => (Array.isArray(value) ? value.at(-1) : value);
const array = (value) => (value === undefined ? [] : Array.isArray(value) ? value : [value]);
const asDynamicFields = (value) => {
  const normalized = scalar(value);
  if (!normalized) return {};
  return typeof normalized === 'string' ? JSON.parse(normalized) : normalized;
};
const apiPath = (pathname) => pathname.replace(/^\/api\/v1(?=\/|$)/, '') || '/';
const succeeded = (data = null) => ({ status: 200, body: { success: true, data } });
const paginated = (contents) => succeeded({ contents, hasNextPage: false, totalCount: contents.length });
const failed = (status, code, message) => ({ status, body: { success: false, code, message } });
const mutationTimestamp = '2026-07-18T12:00:00';
const storedImages = (fileNames) => fileNames
  .filter(({ field }) => field === 'images')
  .map(({ name, type }) => `data:${type};name=${encodeURIComponent(name)},draft`);
const storedProgramFiles = (fileNames, offset = 0) => fileNames
  .filter(({ field }) => field === 'files')
  .map(({ name, type }, index) => ({
    bucketId: String(9000 + offset + index),
    fileName: name,
    url: `data:${type};name=${encodeURIComponent(name)},draft`,
  }));

export async function resolveAdminDraftRequest({
  state,
  persona = 'ADMIN',
  method,
  rawUrl,
  headers = {},
  body,
  forcedStatus,
}) {
  const url = new URL(rawUrl, 'http://draft.local');
  const path = apiPath(url.pathname);
  const { textFields, fileNames } = await parseRequestFields({ method, rawUrl, headers, body });
  const audit = { method, path: `${path}${url.search}`, textFields, fileNames };
  if (forcedStatus) {
    return { ...failed(forcedStatus, 'DRAFT_FORCED_FAILURE', `forced draft failure: ${path}`), audit };
  }

  if (method === 'GET' && path === '/users') {
    const user = state.personas?.[persona] ?? null;
    const response = user
      ? succeeded(user)
      : failed(403, 'UNAUTHENTICATED', 'anonymous');
    return { ...response, audit };
  }
  if (method === 'GET' && path === '/categories') return { ...succeeded(state.categories), audit };
  if (method === 'GET' && path === '/categories/manage') return { ...succeeded(state.manageCategories), audit };
  if (method === 'GET' && path === '/home-banner') return { ...succeeded(state.homeBanner), audit };

  const staticMatch = path.match(/^\/static-content\/([^/]+)$/);
  if (staticMatch) {
    const key = decodeURIComponent(staticMatch[1]);
    if (!(key in state.staticContents)) return { ...failed(404, 'NOT_FOUND_STATIC_CONTENT', 'content not found'), audit };
    if (method === 'GET') return { ...succeeded(state.staticContents[key]), audit };
    if (method === 'PUT') {
      state.staticContents[key] = { ...state.staticContents[key], ...textFields, updatedAt: mutationTimestamp };
      return { ...succeeded(state.staticContents[key]), audit };
    }
  }

  if (method === 'GET' && path === '/program/information') {
    const category = url.searchParams.get('category')?.toUpperCase();
    const programs = category
      ? state.programs.filter((program) => program.category === category)
      : state.programs;
    return { ...paginated(programs), audit };
  }
  if (method === 'GET' && path === '/program/apply/counts') {
    const counts = Object.fromEntries(url.searchParams.getAll('programIds').map((id) => [
      id,
      Number(state.programApplyCounts[id] || 0),
    ]));
    return { ...succeeded(counts), audit };
  }
  const applyDetailMatch = path.match(/^\/program\/apply\/([^/]+)$/);
  if (method === 'GET' && applyDetailMatch) {
    const item = state.programAppliesById[applyDetailMatch[1]];
    return item ? { ...succeeded(item), audit } : { ...failed(404, 'NOT_FOUND_APPLY', 'apply not found'), audit };
  }
  const appliesMatch = path.match(/^\/program\/([^/]+)\/apply$/);
  if (method === 'GET' && appliesMatch) {
    return { ...succeeded(state.programAppliesByProgram[appliesMatch[1]] || []), audit };
  }
  const formMatch = path.match(/^\/program\/form\/program\/([^/]+)$/);
  if (method === 'GET' && formMatch) return { ...succeeded(state.programFormsByProgram[formMatch[1]] || null), audit };

  if (method === 'POST' && path === '/program/information') {
    const required = ['title', 'content', 'applyStartDate', 'eventDate', 'maxParticipants'];
    if (required.some((key) => scalar(textFields[key]) === undefined || scalar(textFields[key]) === '')) {
      return { ...failed(400, 'INVALID_PROGRAM', `${required.join(', ')} are required`), audit };
    }
    const id = `program-${state.sequences.program++}`;
    const created = {
      id,
      title: scalar(textFields.title),
      content: scalar(textFields.content),
      applyStartDate: scalar(textFields.applyStartDate),
      applyEndDate: scalar(textFields.applyEndDate) || null,
      eventDate: scalar(textFields.eventDate),
      applyUrl: scalar(textFields.applyUrl) || null,
      programUrl: scalar(textFields.programUrl) || null,
      maxParticipants: Number(scalar(textFields.maxParticipants)),
      category: String(scalar(textFields.category) || 'participate').toUpperCase(),
      status: 'UPCOMING',
      files: storedProgramFiles(fileNames, state.sequences.program * 10),
      updatedAt: mutationTimestamp,
    };
    state.programs.push(created);
    return { ...succeeded(), audit };
  }
  const programMatch = path.match(/^\/program\/information\/([^/]+)$/);
  if (programMatch) {
    const id = programMatch[1];
    const index = state.programs.findIndex((program) => String(program.id) === id);
    if (index < 0) return { ...failed(404, 'NOT_FOUND_PROGRAM', 'program not found'), audit };
    if (method === 'GET') return { ...succeeded(state.programs[index]), audit };
    if (method === 'PUT') {
      const current = state.programs[index];
      const deletedIds = new Set(array(textFields.deleteFiles).map(String));
      const next = {
        ...current,
        ...Object.fromEntries([
          'title', 'content', 'applyStartDate', 'applyEndDate', 'eventDate', 'applyUrl', 'programUrl', 'status',
        ].filter((key) => textFields[key] !== undefined).map((key) => [key, scalar(textFields[key])])),
        ...(textFields.maxParticipants === undefined ? {} : { maxParticipants: Number(scalar(textFields.maxParticipants)) }),
        ...(textFields.category === undefined ? {} : { category: String(scalar(textFields.category)).toUpperCase() }),
        files: [
          ...(current.files || []).filter(({ bucketId }) => !deletedIds.has(String(bucketId))),
          ...storedProgramFiles(fileNames, state.sequences.program * 10),
        ],
        updatedAt: mutationTimestamp,
      };
      state.programs[index] = next;
      return { ...succeeded(), audit };
    }
    if (method === 'DELETE') {
      state.programs.splice(index, 1);
      return { ...succeeded(), audit };
    }
  }

  const postDetailMatch = path.match(/^\/posts\/detail\/(\d+)\/([^/]+)$/);
  if (method === 'GET' && postDetailMatch) {
    const [, categoryId, postId] = postDetailMatch;
    const post = (state.postsByCategory[categoryId] || []).find(({ id }) => String(id) === postId);
    return post ? { ...succeeded({ ...post, categoryId: Number(categoryId) }), audit } : { ...failed(404, 'NOT_FOUND_POST', 'post not found'), audit };
  }
  const postListMatch = path.match(/^\/posts\/(\d+)$/);
  if (method === 'GET' && postListMatch) return { ...paginated(state.postsByCategory[postListMatch[1]] || []), audit };
  if (method === 'POST' && path === '/posts') {
    const categoryId = String(scalar(textFields.category_id));
    if (!/^\d+$/.test(categoryId)) return { ...failed(400, 'INVALID_CATEGORY', 'category_id is required'), audit };
    if (!String(scalar(textFields.title) || '').trim() || textFields.content === undefined) {
      return { ...failed(400, 'INVALID_POST', 'title and content are required'), audit };
    }
    const id = `post-${state.sequences.post++}`;
    const created = {
      id,
      authorId: 'admin-1',
      authorName: '콘텐츠 관리자',
      title: scalar(textFields.title) || '',
      content: scalar(textFields.content) || '',
      images: storedImages(fileNames),
      thumbnail: storedImages(fileNames)[0] || null,
      updatedAt: mutationTimestamp,
      dynamicFields: asDynamicFields(textFields.dynamic_fields),
    };
    (state.postsByCategory[categoryId] ||= []).push(created);
    return { ...succeeded(), audit };
  }
  const postMutationMatch = path.match(/^\/posts\/(\d+)\/([^/]+)$/);
  if (postMutationMatch) {
    const [, categoryId, postId] = postMutationMatch;
    const posts = state.postsByCategory[categoryId] || [];
    const index = posts.findIndex(({ id }) => String(id) === postId);
    if (index < 0) return { ...failed(404, 'NOT_FOUND_POST', 'post not found'), audit };
    if (method === 'PUT') {
      posts[index] = {
        ...posts[index],
        ...Object.fromEntries(['title', 'content', 'dynamicFields']
          .filter((key) => textFields[key] !== undefined)
          .map((key) => [key, textFields[key]])),
        updatedAt: mutationTimestamp,
      };
      return { ...succeeded(), audit };
    }
    if (method === 'DELETE') {
      posts.splice(index, 1);
      return { ...succeeded(), audit };
    }
  }

  if (method === 'GET' && path === '/notice') return { ...paginated(state.notices), audit };
  if (method === 'POST' && path === '/notice') {
    if (!scalar(textFields.title) || !scalar(textFields.content)) {
      return { ...failed(400, 'INVALID_NOTICE', 'title and content are required'), audit };
    }
    state.notices.push({
      id: `notice-${state.sequences.notice++}`,
      authorId: 'admin-1',
      authorName: '콘텐츠 관리자',
      title: scalar(textFields.title),
      content: scalar(textFields.content),
      images: storedImages(fileNames),
      updatedAt: mutationTimestamp,
      dynamicFields: asDynamicFields(textFields.dynamic_fields),
    });
    return { ...succeeded(), audit };
  }
  const noticeMatch = path.match(/^\/notice\/([^/]+)$/);
  if (noticeMatch) {
    const id = noticeMatch[1];
    const index = state.notices.findIndex((notice) => String(notice.id) === id);
    if (index < 0) return { ...failed(404, 'NOT_FOUND_NOTICE', 'notice not found'), audit };
    if (method === 'GET') return { ...succeeded(state.notices[index]), audit };
    if (method === 'PUT') {
      state.notices[index] = {
        ...state.notices[index],
        ...Object.fromEntries(['title', 'content', 'dynamicFields']
          .filter((key) => textFields[key] !== undefined)
          .map((key) => [key, textFields[key]])),
        updatedAt: mutationTimestamp,
      };
      return { ...succeeded(), audit };
    }
    if (method === 'DELETE') {
      state.notices.splice(index, 1);
      return { ...succeeded(), audit };
    }
  }

  if (method === 'GET' && path === '/forest/supporters') return { ...paginated(state.supporters), audit };
  const markSupportMatch = path.match(/^\/forest\/supports\/mark\/([^/]+)$/);
  if (method === 'PATCH' && markSupportMatch) {
    const supporter = state.supporters.find(({ id }) => String(id) === markSupportMatch[1]);
    if (!supporter) return { ...failed(404, 'NOT_FOUND_SUPPORTER', 'supporter not found'), audit };
    supporter.isCompleted = true;
    return { ...succeeded(), audit };
  }
  const deleteSupportMatch = path.match(/^\/forest\/supports\/([^/]+)$/);
  if (method === 'DELETE' && deleteSupportMatch) {
    const index = state.supporters.findIndex(({ id }) => String(id) === deleteSupportMatch[1]);
    if (index < 0) return { ...failed(404, 'NOT_FOUND_SUPPORTER', 'supporter not found'), audit };
    state.supporters.splice(index, 1);
    return { ...succeeded(), audit };
  }

  return { ...failed(501, 'UNHANDLED_DRAFT_ROUTE', `unhandled draft API: ${method} ${path}`), audit };
}
```

Keep `adminData` schema exact across both adapters: `personas` contains the frozen persona map; `categories`, `manageCategories`, `programs`, `notices`, and `supporters` are arrays; `postsByCategory` is keyed by numeric-string category ID; `staticContents` is keyed by the five intro keys; and `programApplyCounts`, `programAppliesByProgram`, `programAppliesById`, and `programFormsByProgram` retain their owning IDs. Generated IDs are `program-${state.sequences.program++}`, `post-${state.sequences.post++}`, and `notice-${state.sequences.notice++}` only in the mock layer.

Replace the preliminary `installAdminApiMocks` body with this complete Playwright adapter. It owns only persona/failure/hold/test-safety controls; all route-specific behavior stays in the resolver:

```js
import { expect } from '@playwright/test';
import { adminData } from '../fixtures/adminData.js';
import { createAdminDraftState, resolveAdminDraftRequest } from '../../draft/adminApiResponses.js';

const controlPath = (rawUrl) => new URL(rawUrl, 'http://draft.local')
  .pathname.replace(/^\/api\/v1(?=\/|$)/, '') || '/';
const controlKey = (method, rawUrl) => `${method.toUpperCase()} ${controlPath(rawUrl)}`;

export async function installAdminApiMocks(page) {
  const state = createAdminDraftState(adminData);
  const requests = [];
  const unhandled = [];
  const blockedExternalWrites = [];
  const failures = new Map();
  const holds = new Map();
  let persona = 'ADMIN';

  await page.route(/^https?:\/\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname === '127.0.0.1' && url.port === '3000') return route.fallback();
    if (request.method() !== 'GET') blockedExternalWrites.push(`${request.method()} ${url.origin}${url.pathname}`);
    return route.abort('blockedbyclient');
  });

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = controlPath(request.url());
    const key = controlKey(request.method(), request.url());
    const gate = holds.get(key);
    if (gate) await gate.promise;
    const result = await resolveAdminDraftRequest({
      state,
      persona,
      method: request.method(),
      rawUrl: request.url(),
      headers: request.headers(),
      body: request.postDataBuffer(),
      forcedStatus: failures.get(key),
    });
    requests.push(result.audit);
    if (result.status === 501) unhandled.push(`${request.method()} ${path}`);
    return route.fulfill({
      status: result.status,
      contentType: 'application/json',
      body: JSON.stringify(result.body),
    });
  });

  return {
    requests,
    state,
    setPersona(next) {
      if (!(next in state.personas)) throw new Error(`unknown admin persona: ${next}`);
      persona = next;
    },
    fail(method, path, status = 500) { failures.set(controlKey(method, path), status); },
    recover(method, path) { failures.delete(controlKey(method, path)); },
    hold(method, path) {
      const key = controlKey(method, path);
      if (holds.has(key)) throw new Error(`route already held: ${key}`);
      let release;
      const promise = new Promise((resolve) => { release = resolve; });
      holds.set(key, { promise, release });
    },
    release(method, path) {
      const key = controlKey(method, path);
      const gate = holds.get(key);
      if (!gate) throw new Error(`route is not held: ${key}`);
      holds.delete(key);
      gate.release();
    },
    assertSafe() {
      expect(unhandled, unhandled.join('\n')).toEqual([]);
      expect(blockedExternalWrites, blockedExternalWrites.join('\n')).toEqual([]);
      expect([...holds.keys()], 'all held requests must be released').toEqual([]);
    },
  };
}
```

Replace `tests/draft/draftApiPlugin.js` with this complete Vite adapter. It never calls `next()` for an `/api/v1` request, so neither an unknown route nor a rejected write can reach a proxy:

```js
import { adminData } from '../e2e/fixtures/adminData.js';
import { createAdminDraftState, resolveAdminDraftRequest } from './adminApiResponses.js';

const readBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return chunks.length ? Buffer.concat(chunks) : null;
};

const writeJson = (response, status, body) => {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
};

export function draftApiPlugin({ mode }) {
  const state = createAdminDraftState(adminData);
  const persona = mode === 'admin-draft' ? 'ADMIN' : 'ANONYMOUS';
  return {
    name: 'forest-draft-api',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (!request.url?.match(/^\/api\/v1(?:\/|\?|$)/)) return next();
        const method = request.method || 'GET';
        if (mode !== 'admin-draft' && method !== 'GET') {
          return writeJson(response, 405, {
            success: false,
            code: 'DRAFT_WRITE_DISABLED',
            message: 'writes are disabled outside admin-draft',
          });
        }
        try {
          const result = await resolveAdminDraftRequest({
            state,
            persona,
            method,
            rawUrl: request.url,
            headers: request.headers,
            body: await readBody(request),
          });
          return writeJson(response, result.status, result.body);
        } catch (error) {
          return writeJson(response, 400, {
            success: false,
            code: 'INVALID_DRAFT_REQUEST',
            message: error.message,
          });
        }
      });
    },
  };
}
```

Use one draft-mode predicate for both plugin mounting and proxy removal in `vite.config.js`:

```js
export default defineConfig(({ mode }) => {
  const isDraftMode = ['draft', 'admin-draft'].includes(mode);
  return {
    plugins: [react(), ...(isDraftMode ? [draftApiPlugin({ mode })] : [])],
    server: {
      port: 3000,
      strictPort: true,
      proxy: isDraftMode ? undefined : {
        '/api': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
      },
    },
    define: { global: 'globalThis' },
    resolve: { alias: { crypto: 'crypto-browserify' } },
  };
});
```

Create `tests/draft/draftApiPlugin.test.js` so the boundary is executable without a real backend:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer as createViteServer } from 'vite';

async function withDraftServer(mode, run) {
  const server = await createViteServer({
    mode,
    server: { host: '127.0.0.1', port: 0, strictPort: true },
  });
  await server.listen();
  try {
    const address = server.httpServer.address();
    assert(address && typeof address !== 'string');
    assert.equal(server.config.server.proxy, undefined);
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await server.close();
  }
}

test('admin-draft answers an unknown write locally with 501', async () => {
  await withDraftServer('admin-draft', async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/unregistered`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(response.status, 501);
    assert.equal((await response.json()).code, 'UNHANDLED_DRAFT_ROUTE');
  });
});

test('normal draft rejects every write locally with 405', async () => {
  await withDraftServer('draft', async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/unregistered`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(response.status, 405);
    assert.equal((await response.json()).code, 'DRAFT_WRITE_DISABLED');
  });
});
```

Run: `node --test tests/unit/adminApiResponses.test.js tests/draft/draftApiPlugin.test.js`

Expected: all parser, resolver, and fail-closed adapter tests PASS. POST/PUT/DELETE mutate only the per-test or per-server in-memory clone. Any unregistered `/api/v1/**` route returns 501, is appended to `unhandled` in Playwright, and fails fixture teardown. Persistent failure overrides run before normal routing.

The registered mutation paths are:

```text
GET /users
GET /categories
GET /categories/manage
GET /home-banner
GET /static-content/:key
PUT /static-content/:key
GET /program/information[/:id]
GET /program/apply/counts
GET /program/:id/apply
GET /program/apply/:id
GET /program/form/program/:programId
POST /program/information
PUT,DELETE /program/information/:id
GET /posts/:categoryId
GET /posts/detail/:categoryId/:postId
POST /posts
PUT,DELETE /posts/:categoryId/:postId
GET /notice[/:noticeId]
POST /notice
PUT,DELETE /notice/:noticeId
GET /forest/supporters
PATCH /forest/supports/mark/:supporterId
DELETE /forest/supports/:supporterId
```

The implementation above is the route source of truth. Program multipart names match `programService.js`; post create reads `title`, `content`, optional `dynamic_fields`, and `category_id`; notice create reads `title`, `content`, and the decoded `dynamic_fields`. JSON PUT bodies merge only `title`, `content`, and `dynamicFields`. List responses use `{ success: true, data: { contents, hasNextPage: false, totalCount } }`; the draft deliberately reports the in-memory `contents.length` so client-side pagination can be exercised, even where a current post/notice backend response reports zero metadata. Do not describe that metadata as an exact backend mirror. Detail responses use `{ success: true, data: item }`; successful mutations use `{ success: true, data: null }`. IDs are strings in every JSON response.

- [ ] **Step 4: Add executable CRUD regression tests**

The fixture IDs/titles used below are mandatory: `program-1` / `시민 숲길 프로그램`, category `0` post `post-1` / `숲길 활동 기준 게시글`, and `notice-1` / `공지 회귀 기준 01`. Create `admin-crud-regression.spec.js` with this compilable skeleton; fill in no alternate selectors and do not import base Playwright:

```js
import { test, expect } from './fixtures/adminTest.js';

test.describe.configure({ mode: 'serial' });

const count = (requests, method, path) => requests
  .filter((request) => request.method === method && request.path === path).length;

async function heldMutation({ page, adminApi, method, path, start, pending, scope = page }) {
  const before = count(adminApi.requests, method, path);
  adminApi.hold(method, path);
  await scope.getByRole('button', { name: start, exact: true }).dblclick();
  await expect(scope.getByRole('button', { name: pending, exact: true })).toBeDisabled();
  adminApi.release(method, path);
  await expect.poll(() => count(adminApi.requests, method, path)).toBe(before + 1);
}

const cases = [
  {
    name: 'program', title: '초안 프로그램 회귀', createUrl: '/programs/create',
    createPath: '/program/information', listUrl: '/admin?section=programs', listLink: '초안 프로그램 회귀 상세 보기',
    detailUrl: (id) => `/programs/detail/${id}`, editPath: (id) => `/program/information/${id}`,
    dialog: '프로그램 삭제 확인', editedTitle: '초안 프로그램 회귀',
    find: (state, title) => state.programs.find((item) => item.title === title),
    exists: (state, id) => state.programs.some((item) => item.id === id),
    fillCreate: async (page) => {
      await page.getByLabel('프로그램 제목', { exact: true }).fill('초안 프로그램 회귀');
      await page.getByLabel('신청 시작일시', { exact: true }).fill('2026-08-01T09:00');
      await page.getByLabel('행사 일시', { exact: true }).fill('2026-08-10T10:00');
      await page.getByLabel('모집 인원', { exact: true }).fill('20');
      await page.getByLabel('카테고리', { exact: true }).selectOption('participate');
      await page.getByLabel('본문', { exact: true }).fill('프로그램 회귀 본문');
    },
    fillEdit: async (page) => page.getByLabel('모집 인원', { exact: true }).fill('25'),
    assertEdited: (item) => expect(item.maxParticipants).toBe(25),
  },
  {
    name: 'activity', title: '초안 활동 회귀', createUrl: '/category/0/write',
    createPath: '/posts', listUrl: '/news/activities', listLink: '초안 활동 회귀',
    detailUrl: (id) => `/post/0/${id}`, editPath: (id) => `/posts/0/${id}`,
    dialog: '게시글·공지 삭제 확인', editedTitle: '초안 활동 회귀 수정',
    find: (state, title) => state.postsByCategory['0'].find((item) => item.title === title),
    exists: (state, id) => state.postsByCategory['0'].some((item) => item.id === id),
    fillCreate: async (page) => {
      await page.getByLabel('제목', { exact: true }).fill('초안 활동 회귀');
      await page.getByLabel('본문', { exact: true }).fill('활동 회귀 본문');
    },
    fillEdit: async (page) => {
      await page.getByLabel('제목', { exact: true }).fill('초안 활동 회귀 수정');
      await page.getByLabel('본문', { exact: true }).fill('활동 회귀 수정 본문');
    },
    assertEdited: (item) => expect(item.content).toContain('활동 회귀 수정 본문'),
  },
  {
    name: 'notice', title: '초안 공지 회귀', createUrl: '/news/notice/write',
    createPath: '/notice', listUrl: '/news/notice', listLink: '초안 공지 회귀', deleteUrl: () => '/news/notice',
    detailUrl: (id) => `/news/notice/${id}`, editPath: (id) => `/notice/${id}`,
    dialog: '게시글·공지 삭제 확인', editedTitle: '초안 공지 회귀 수정',
    find: (state, title) => state.notices.find((item) => item.title === title),
    exists: (state, id) => state.notices.some((item) => item.id === id),
    fillCreate: async (page) => {
      await page.getByLabel('제목', { exact: true }).fill('초안 공지 회귀');
      await page.getByLabel('본문', { exact: true }).fill('공지 회귀 본문');
      await page.getByLabel('중요 공지로 설정', { exact: true }).check();
    },
    fillEdit: async (page) => {
      await page.getByLabel('제목', { exact: true }).fill('초안 공지 회귀 수정');
      await page.getByLabel('본문', { exact: true }).fill('공지 회귀 수정 본문');
      await page.getByLabel('중요 공지로 설정', { exact: true }).uncheck();
    },
    assertEdited: (item) => expect(item.dynamicFields).toEqual({}),
  },
];

for (const resource of cases) {
  test(`${resource.name} create, read, update, delete is stateful and single-flight`, async ({ page, adminApi }) => {
    await page.goto(resource.createUrl);
    await resource.fillCreate(page);
    await heldMutation({ page, adminApi, method: 'POST', path: resource.createPath, start: '등록', pending: '등록 중…' });
    const created = resource.find(adminApi.state, resource.title);
    expect(created).toBeDefined();

    await page.goto(resource.listUrl);
    await expect(page.getByRole('link', { name: resource.listLink, exact: true })).toBeVisible();
    await page.goto(resource.deleteUrl?.(created.id) ?? resource.detailUrl(created.id));
    await expect(page.getByRole('heading', { name: resource.title, exact: true })).toBeVisible();
    await page.getByRole('link', { name: `${resource.title} 수정`, exact: true }).click();
    await resource.fillEdit(page);
    await heldMutation({ page, adminApi, method: 'PUT', path: resource.editPath(created.id), start: '수정', pending: '수정 중…' });
    const edited = resource.find(adminApi.state, resource.editedTitle);
    expect(edited).toBeDefined();
    resource.assertEdited(edited);

    await page.goto(resource.detailUrl(created.id));
    await page.getByRole('button', { name: `${resource.editedTitle} 삭제`, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: resource.dialog, exact: true });
    await heldMutation({ page, adminApi, method: 'DELETE', path: resource.editPath(created.id), start: '삭제', pending: '삭제 중…', scope: dialog });
    expect(resource.exists(adminApi.state, created.id)).toBe(false);
  });
}

const missing = [
  ['/programs/detail/missing', '프로그램을 찾을 수 없습니다.'],
  ['/post/0/missing', '게시글을 찾을 수 없습니다.'],
  ['/news/notice/missing', '공지사항을 찾을 수 없습니다.'],
];
for (const [url, message] of missing) {
  test(`404 ${url} is explicit`, async ({ page }) => {
    await page.goto(url);
    await expect(page.getByRole('alert')).toHaveText(message);
  });
}

const failedEdits = [
  { url: '/programs/edit/program-1', path: '/program/information/program-1', label: '프로그램 제목', value: '실패 유지 프로그램', read: (s) => s.programs.find((x) => x.id === 'program-1') },
  { url: '/category/0/edit/post-1', path: '/posts/0/post-1', label: '제목', value: '실패 유지 게시글', read: (s) => s.postsByCategory['0'].find((x) => x.id === 'post-1') },
  { url: '/news/notice/edit/notice-1', path: '/notice/notice-1', label: '제목', value: '실패 유지 공지', read: (s) => s.notices.find((x) => x.id === 'notice-1') },
];
for (const item of failedEdits) {
  test(`PUT 500 retains ${item.url} input until explicit recovery`, async ({ page, adminApi }) => {
    await page.goto(item.url);
    const input = page.getByLabel(item.label, { exact: true });
    await input.fill(item.value);
    adminApi.fail('PUT', item.path, 500);
    await page.getByRole('button', { name: '수정', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('저장하지 못했습니다. 다시 시도해 주세요.');
    await expect(input).toHaveValue(item.value);
    expect(item.read(adminApi.state).title).not.toBe(item.value);
    adminApi.recover('PUT', item.path);
    await page.getByRole('button', { name: '수정', exact: true }).click();
    await expect.poll(() => item.read(adminApi.state).title).toBe(item.value);
    expect(count(adminApi.requests, 'PUT', item.path)).toBe(2);
  });
}
```

Task 6's `admin-delete-dialogs.spec.js` remains the executable persistent-DELETE-500 row-retention/recovery coverage for all three resources. Together the two specs cover 404, retained editor input, retained delete target/dialog, explicit recovery, state mutation, and the exact POST/PUT/DELETE audit counts; do not duplicate those cases as prose-only TODOs.

- [ ] **Step 5: Add responsive, Axe, overflow, console, and visual checks**

Create `admin-visual.spec.js` exactly as follows. `adminData` must expose the representative strings used here:

```js
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures/adminTest.js';

const visualCases = [
  { name: 'home', url: '/admin?section=home', heading: '관리자 홈', role: 'link', representative: '프로그램 관리 열기' },
  { name: 'programs', url: '/admin?section=programs', heading: '프로그램 관리', role: 'link', representative: '시민 숲길 프로그램 상세 보기' },
  { name: 'content', url: '/admin?section=content&contentType=notice', heading: '게시글·공지 관리', role: 'link', representative: '공지 회귀 기준 01 상세 보기' },
];

for (const item of visualCases) {
  test(`${item.name} has no serious Axe findings and matches its baseline`, async ({ page }, testInfo) => {
    await page.goto(item.url);
    await expect(page.getByRole('heading', { level: 1, name: item.heading, exact: true })).toBeVisible();
    await expect(page.getByRole(item.role, { name: item.representative, exact: true })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious');
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    await expect(page).toHaveScreenshot(`forest-admin-${item.name}-${testInfo.project.name}.png`, {
      fullPage: true, animations: 'disabled', caret: 'hide',
    });
  });

  test(`${item.name} has no horizontal overflow at 720px`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only intermediate-width gate');
    await page.setViewportSize({ width: 720, height: 900 });
    await page.goto(item.url);
    await expect(page.getByRole('heading', { level: 1, name: item.heading, exact: true })).toBeVisible();
    await expect(page.getByRole(item.role, { name: item.representative, exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
```

The automatic `adminTest` quality fixture is active in every case, so unexpected console errors and failed requests already fail teardown. Before approval, manually set browser zoom to 200% for each of the three URLs at 1440×900 and record PASS only when headings, filters, row actions, dialogs, and focus indicators remain visible with no horizontal page scroll; this manual result is not claimed by the automated spec.

- [ ] **Step 6: Run nonvisual gates and generate review baselines**

Run:

```bash
npm run test:unit
npm run lint
npm run build
npm run test:e2e:public
npm run test:e2e:admin:update
```

Expected: unit tests and the shared public regression PASS, and the update command creates all nine administrator baselines. Stop here, inspect every generated image for clipping/overlap/state correctness, and perform the manual browser 200% zoom check. Do not continue or commit if any baseline is unapproved.

- [ ] **Step 7: Run the no-update comparison after inspection**

Run:

```bash
npm run test:e2e:admin
```

Expected: all three administrator viewport projects PASS against the inspected baselines; no snapshot is regenerated.

- [ ] **Step 8: Commit**

```bash
git add .env.admin-draft vite.config.js tests/draft tests/unit/adminApiResponses.test.js tests/e2e package.json package-lock.json
git commit -m "test: complete Forest administrator draft gate"
```

---

### Task 8: Record PRD inputs and hand off the administrator draft without deployment

- [ ] **Step 1: Record the final sync inputs without running sync yet**

Record the new home/content sections, client-only filter limits, INFORMATION edit-disabled/delete-supported behavior, attachment limits, return-state behavior, and mock E2E status. Do not call mock E2E an API integration test. Defer the one cumulative `source-command-prd-sync` invocation until Task 10 of the isolated real-API plan, after all code work is complete as the user requested.

- [ ] **Step 2: Verify the final scope**

Run:

```bash
git status --short
git diff --check
git log -10 --oneline
rg -n "T[O]DO|T[B]D|implement lat[e]r|simi[l]ar|existing JS[X]|code goes her[e]|one-shot overrid[e]" docs/superpowers/plans/2026-07-18-forest-admin-cms-draft.md
```

Expected: only approved administrator/public shared files are present; no `gradle.properties`, deployment file, secret, or production credential is changed; diff check and implementation-marker scan print nothing. Record the starting SHA before Task 1 and compare its committed file list with `git diff --name-only <recorded-starting-SHA>..HEAD` so local commits are included.

- [ ] **Step 3: Start the local administrator draft**

Run: `npm run draft:admin`

Expected: `http://127.0.0.1:3000/admin?section=home` shows `로컬 초안` and the admin persona; every mutation stays in memory.

- [ ] **Step 4: Present the clickable draft and stop**

Provide desktop/tablet/mobile captures, passed test evidence, known client-filter/API limits, and confirmation that nothing was pushed or deployed. Wait for explicit administrator visual approval before executing the integration-E2E plan.
