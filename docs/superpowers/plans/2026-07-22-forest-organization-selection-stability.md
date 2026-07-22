# Forest Organization Selection Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공개 C형 조직도에서 부서 선택 시 URL·브라우저 history·스크롤 위치를 유지하고 선택 표시와 오른쪽 상세만 갱신한다.

**Architecture:** `Intro`의 URL query 기반 선택을 로컬 React state 기반 controlled selection으로 교체한다. 공개 `OrganizationDirectory`와 관리자 편집·미리보기 경계는 유지하고, 공개 E2E가 legacy `group` query 무시·URL/history/scroll 불변·상세 교체·포커스 유지를 계약으로 고정한다.

**Tech Stack:** React 18, React Router 7, TanStack Query 5, Vite 6, Playwright 1.61, Node test runner, ESLint

## Global Constraints

- 대상은 `/intro/people`의 공개 C형 조직도이며 관리자 편집기·관리자 미리보기·백엔드 API는 변경하지 않는다.
- 첫 진입에서는 정렬된 첫 공개 그룹을 선택하고 기존 `?group=` 값은 선택에 사용하지 않는다.
- 클릭 전후 pathname, query string, hash를 포함한 전체 URL과 브라우저 history를 변경하지 않는다.
- 프로그램 방식의 스크롤·포커스 이동과 상세 영역 내부 스크롤을 추가하지 않는다.
- 마우스와 Enter/Space 선택 후 가능한 문서 범위에서 `window.scrollY`와 조작 버튼 포커스를 유지한다.
- 자연스러운 상세·문서 높이 변화는 허용하며 고정 높이로 맞추지 않는다.
- `gradle.properties`를 수정하지 않는다.
- 별도 승인 없이 branch push, `main` 병합 또는 프론트 운영 배포를 하지 않는다.

---

## File Structure

- Modify: `src/pages/static/Intro.jsx` — 공개 조직 snapshot과 로컬 선택 state를 조정하고 공개 조직도 props를 만든다.
- Modify: `tests/e2e/organization-directory-public.spec.js` — URL query 기반 선택 계약을 로컬 선택 안정성 계약으로 교체한다.
- Verify only: `src/components/organization/OrganizationDirectory.jsx` — 기존 controlled selection, `aria-current`, live region과 상세 렌더링을 그대로 사용한다.
- Verify only: `src/components/admin/organization/OrganizationDirectoryPreview.jsx` — 기존 관리자 로컬 선택 패턴이 회귀하지 않는지 전체 E2E로 확인한다.
- Synchronize if required by `source-command-prd-sync`: `/Users/park/Desktop/project/prd/forest/requirements.md` — 공개 조직도 탐색 요구사항을 구현 사실에 맞춘다.
- Verify only: `/Users/park/Desktop/project/prd/forest/api-spec.md` — API 변경이 없음을 확인하며 계약을 임의로 바꾸지 않는다.

---

### Task 1: 공개 조직도 로컬 선택 계약

**Files:**
- Modify: `tests/e2e/organization-directory-public.spec.js:267-325`
- Modify: `src/pages/static/Intro.jsx:1-90`
- Verify: `src/components/organization/OrganizationDirectory.jsx:1-56`

**Interfaces:**
- Consumes: `resolveSelectedGroupId(groups, requestedId)` from `src/utils/organizationDirectory.js`, where `groups` is the public group array and the result is a valid group ID or `null`.
- Produces: local `selectedGroupId: string | null`, `resolvedSelectedGroupId: string | null`, and `selectOrganizationGroup(groupId: string): void` without Router navigation.
- Preserves: `OrganizationDirectory({ snapshot, selectedGroupId, onSelectGroup, ariaLabel })` props and all admin callers.

- [ ] **Step 1: Write failing E2E tests for ignored legacy query and stable local selection**

Replace the URL reload/back test with these two tests. Reuse the existing `openPeople`, `organizationGroupIds`, `organizationFixture`, `allowAnonymousRequest`, and `expect` definitions in the same file.

```js
test('legacy group query is ignored without rewriting the requested URL', async ({ page, organizationApi }) => {
  const requestedUrl = `/intro/people?campaign=forest&group=${organizationGroupIds.child}`;
  await openPeople(page, organizationApi, { url: requestedUrl });

  await expect(page.getByRole('button', { name: '운영위원회' })).toHaveAttribute('aria-current', 'true');
  await expect(page.getByRole('heading', { name: '운영위원회', level: 2 })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`campaign=forest&group=${organizationGroupIds.child}$`));
});

test('group selection changes only the directory detail while preserving URL history scroll and focus', async ({ page, organizationApi }) => {
  organizationApi.setOrganization(organizationFixture);
  organizationApi.setLegacyHtml(emptyLegacyPeopleHtml);
  await page.goto('/intro/greeting');
  await page.goto('/intro/people?campaign=forest#directory');

  await expect(page.getByRole('heading', { name: '운영위원회', level: 2 })).toBeVisible();
  const originalUrl = page.url();
  await page.evaluate(() => window.scrollTo(0, Math.min(80, document.documentElement.scrollHeight - window.innerHeight)));
  const originalScrollY = await page.evaluate(() => window.scrollY);
  const childButton = page.getByRole('button', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다' });

  await childButton.click();

  await expect(childButton).toHaveAttribute('aria-current', 'true');
  await expect(childButton).toBeFocused();
  await expect(page.getByRole('heading', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다', level: 2 })).toBeVisible();
  await expect(page.locator('section[aria-labelledby^="organization-group-"]').getByText('구성원 2명')).toBeVisible();
  expect(page.url()).toBe(originalUrl);
  expect(await page.evaluate(() => window.scrollY)).toBe(originalScrollY);

  await page.goBack();
  await expect(page).toHaveURL(/\/intro\/greeting$/);
});
```

In the existing keyboard/reflow test, capture the exact URL and `window.scrollY` immediately before `childButton.press('Enter')`, then assert both values are unchanged after the child heading is visible. Repeat the same contract with Space on the root button.

```js
  const keyboardUrl = page.url();
  const keyboardScrollY = await page.evaluate(() => window.scrollY);
  await childButton.press('Enter');
  await expect(page.getByRole('heading', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다', level: 2 })).toBeVisible();
  expect(page.url()).toBe(keyboardUrl);
  expect(await page.evaluate(() => window.scrollY)).toBe(keyboardScrollY);
  await expect(childButton).toBeFocused();

  const rootButton = page.getByRole('button', { name: '운영위원회' });
  await rootButton.focus();
  const spaceUrl = page.url();
  const spaceScrollY = await page.evaluate(() => window.scrollY);
  await rootButton.press('Space');
  await expect(page.getByRole('heading', { name: '운영위원회', level: 2 })).toBeVisible();
  expect(page.url()).toBe(spaceUrl);
  expect(await page.evaluate(() => window.scrollY)).toBe(spaceScrollY);
  await expect(rootButton).toBeFocused();
```

- [ ] **Step 2: Run the focused public tests and confirm the current URL implementation fails**

Run:

```bash
npx playwright test --config=playwright.organization.config.js tests/e2e/organization-directory-public.spec.js --grep "legacy group query|group selection changes only|group controls keep"
```

Expected: all three browser projects fail at least one new URL assertion because the current `setSearchParams` path reads or writes `group`. The failure must occur before editing `Intro.jsx`; a passing run means the regression test is not exercising the reported behavior and must be corrected before proceeding.

- [ ] **Step 3: Replace public URL selection with local React state**

Update the imports at the top of `Intro.jsx`:

```jsx
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
```

Create the local state immediately after `activeContentKey` is derived:

```jsx
  const [selectedGroupId, setSelectedGroupId] = useState(null);
```

Replace `requestedGroupId`, the URL-based `selectedGroupId`, the URL correction effect, and the `setSearchParams` callback with this derived selection and state synchronization:

```jsx
  const resolvedSelectedGroupId = useMemo(
    () => resolveSelectedGroupId(organizationQuery.data?.groups, selectedGroupId),
    [organizationQuery.data?.groups, selectedGroupId],
  );

  useEffect(() => {
    if (!isPeoplePage) {
      setSelectedGroupId(null);
      return;
    }
    if (peopleSource !== 'organization') return;
    setSelectedGroupId((current) => (
      current === resolvedSelectedGroupId ? current : resolvedSelectedGroupId ?? null
    ));
  }, [isPeoplePage, peopleSource, resolvedSelectedGroupId]);

  const selectOrganizationGroup = (groupId) => {
    setSelectedGroupId(groupId);
  };
```

Pass `resolvedSelectedGroupId` to the public directory so the first group has correct selected semantics on the initial organization render:

```jsx
      <OrganizationDirectory
        snapshot={organizationQuery.data}
        selectedGroupId={resolvedSelectedGroupId}
        onSelectGroup={selectOrganizationGroup}
        ariaLabel="조직 선택"
      />
```

Do not change `OrganizationDirectory`, `OrganizationDirectoryPreview`, Router configuration, legacy fallback, or organization API services.

- [ ] **Step 4: Run the focused tests and confirm the local selection contract passes**

Run:

```bash
npx playwright test --config=playwright.organization.config.js tests/e2e/organization-directory-public.spec.js --grep "legacy group query|group selection changes only|group controls keep"
```

Expected: 9 passed, 0 failed across desktop, tablet, and mobile projects. The tests must show exact URL and scroll equality, selected child detail, retained focus, and one-step back navigation to `/intro/greeting`.

- [ ] **Step 5: Run the organization unit and full public organization suites**

Run:

```bash
npm run test:unit:organization
npx playwright test --config=playwright.organization.config.js tests/e2e/organization-directory-public.spec.js
git diff --check
```

Expected: unit tests and every public organization E2E project pass with 0 failures; `git diff --check` exits 0 without output.

- [ ] **Step 6: Commit the isolated behavior fix**

```bash
git add src/pages/static/Intro.jsx tests/e2e/organization-directory-public.spec.js
git commit -m "fix: keep Forest organization selection in place"
```

Expected: one commit containing only the public selection implementation and its E2E regression tests.

---

### Task 2: Full regression, product fact sync, and Preview readiness

**Files:**
- Verify: all frontend source and tests affected by public organization selection
- Synchronize if required: `/Users/park/Desktop/project/prd/forest/requirements.md`
- Verify only: `/Users/park/Desktop/project/prd/forest/api-spec.md`

**Interfaces:**
- Consumes: the local selection behavior and tests from Task 1.
- Produces: verified frontend commit(s), synchronized Forest requirements, and a clean branch ready for explicit push approval.
- Preserves: backend API schema and deployed backend behavior.

- [ ] **Step 1: Run static checks and both production build modes**

```bash
npm run lint
npm run build
VERCEL_ENV=preview npm run build
git diff --check
```

Expected: every command exits 0. Existing Browserslist age or chunk-size warnings may be recorded but must not be reported as failures.

- [ ] **Step 2: Run the complete organization and public-home E2E suites**

```bash
npm run test:e2e:organization
npm run test:e2e:organization:preview
npm run test:e2e:public
```

Expected: all non-intentionally-skipped tests pass with 0 failures. Preview tests must send 0 real organization PUT requests.

- [ ] **Step 3: Inspect the final diff and request code review**

```bash
git status --short --branch
git diff HEAD^ -- src/pages/static/Intro.jsx tests/e2e/organization-directory-public.spec.js
git log -2 --oneline --decorate
```

Expected: no uncommitted application or test changes; the latest behavior commit is separate from the design and implementation-plan documentation commits. Invoke `superpowers:requesting-code-review` and resolve every supported blocking finding before completion.

- [ ] **Step 4: Synchronize Forest PRD facts once**

Invoke `source-command-prd-sync` for the completed public organization selection change. Update `requirements.md` so it no longer promises `group` query, reload, or back-button restoration and instead states local selection, URL/history/scroll stability, and first-group default. Confirm `api-spec.md` remains unchanged because no endpoint or payload changed.

Expected: no stale public requirement contradicts the code or E2E contract; no API contract is invented.

- [ ] **Step 5: Run final verification before any completion or deployment claim**

Invoke `superpowers:verification-before-completion`, then run:

```bash
git status --short --branch
git diff --check
git log -3 --oneline --decorate
```

Expected: the feature branch is clean and ahead of its current upstream only by reviewed local commits. Report exact test counts from the fresh commands in Steps 1 and 2. Do not push or deploy until the user explicitly approves that external action.
