# Forest Organization Directory Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded Forest people page with the approved accessible C-type directory and add a complete, preview-safe administrator editor for groups, people, and memberships.

**Architecture:** Keep the backend organization snapshot as the only production fact source. A pure presentation resolver combines the structured endpoint with sanitized legacy `intro-people` according to configured/drift/error rules; the public directory is a controlled component shared by the live page and unsaved preview. The administrator editor owns one normalized draft and performs one revisioned PUT, while Vite injects an immutable write policy that disables both UI and service mutations in Vercel Preview and local draft mode.

**Tech Stack:** React 18, React Router 7.4, TanStack Query 5, Axios, Tailwind CSS 3.4, Vite 6, Node `node:test`, Playwright 1.61, Axe Playwright

## Global Constraints

- Execute in `/Users/park/Desktop/project/cms-react-project/.worktrees/forest-ui-draft-e2e` on branch `codex/forest-ui-draft-e2e`; preserve all existing user and public-home changes.
- Backend `GET /api/v1/organization` must already be deployed and smoke-verified before a Vercel Preview is created; local mocks are used until that external gate is approved.
- Do not push, merge, or deploy while implementing. Vercel Preview push is an external action requiring explicit confirmation after verification.
- Public source rules are exact: configured/no drift → C directory; configured/drift + meaningful legacy → legacy; configured/drift + empty legacy → C; unconfigured + meaningful legacy → legacy; unconfigured + empty legacy → C seed; organization 404 → legacy then hardcoded; organization 500/network → meaningful legacy else explicit error/retry.
- If the legacy request itself fails, configured/no-drift still uses C because legacy is irrelevant; unconfigured or drifted data shows error/retry because choosing C could silently hide legacy; organization 404 retains the approved hardcoded emergency fallback.
- Legacy HTML is sanitized with the existing `sanitizeRichText` before meaningful-content detection and rendering. Empty Quill markup such as `<p><br></p>` is empty.
- The public component receives only server-filtered data; it must not infer that disabled data is safe to expose.
- C-type public UI: 18px-or-larger primary text, 48px-or-larger group controls, two mobile columns at 390px, one column at 320px, desktop navigation/detail columns, vertical reflow at 720 CSS px, no horizontal overflow.
- Preserve `group=<stable UUID>` in the URL; invalid/private/missing values resolve to the first public group without forced focus movement.
- Administrator entry is `/admin?section=intro&item=people`; all other intro items keep their current Quill editor.
- The editor supports group add/delete/parent/order/enabled, person add/edit/delete/enabled, multi-group membership, role/order, and affiliation `inherit/hide/custom` tri-state.
- Client validation provides field paths and first-error focus; server 400 is a top alert only. All 400/403/409/500 failures retain the local draft.
- Vercel `VERCEL_ENV=preview` and local `draft` mode must compile organization writes off. UI save controls and service PUT each enforce the policy; only `organization-e2e` mode enables mocked writes.
- Preview/local draft must never mutate the real backend. E2E routes must record and fail unexpected writes or unhandled API requests.
- Keep body minimum width 320px, approved colors `#166534`, `#14532d`, `#f8faf5`, `#b45309`, existing reduced-motion behavior, and current auth/403 behavior.
- Do not add product facts, contact data, hidden people, new runtime dependencies, credentials, or `gradle.properties` changes.

---

## File Structure

### Create

- `build/organizationWritePolicy.js` — pure build-mode write policy.
- `src/config/organizationDeployment.js` — immutable browser write capability.
- `src/services/organizationDirectoryService.js` — public/manage GET and guarded PUT.
- `src/utils/organizationDirectory.js` — public sorting, tree, selection, affiliation display, and source resolution.
- `src/utils/organizationDirectoryDraft.js` — immutable editor operations and client validation.
- `src/hooks/useUnsavedChanges.js` — beforeunload and in-app navigation guard.
- `src/components/organization/OrganizationDirectory.jsx` — approved C-type controlled UI.
- `src/components/organization/OrganizationMemberList.jsx` — member rows and empty state.
- `src/components/organization/LegacyOrganizationDirectory.jsx` — unchanged hardcoded emergency fallback extracted from `Intro.jsx`.
- `src/components/admin/organization/OrganizationDirectoryEditor.jsx` — query/draft/save/conflict orchestrator.
- `src/components/admin/organization/OrganizationGroupTree.jsx`
- `src/components/admin/organization/OrganizationGroupForm.jsx`
- `src/components/admin/organization/OrganizationMembershipEditor.jsx`
- `src/components/admin/organization/OrganizationPeopleDirectory.jsx`
- `src/components/admin/organization/OrganizationDirectoryPreview.jsx`
- `src/components/admin/organization/OrganizationSaveConfirmation.jsx` — focus-trapped legacy cutover confirmation.
- `tests/unit/organizationWritePolicy.test.js`
- `tests/unit/organizationDirectory.test.js`
- `tests/unit/organizationDirectoryDraft.test.js`
- `.env.organization-e2e`
- `playwright.organization.config.js`
- `tests/e2e/fixtures/organizationDirectoryData.js`
- `tests/e2e/fixtures/organizationTest.js`
- `tests/e2e/support/mockOrganizationApi.js`
- `tests/e2e/organization-directory-public.spec.js`
- `tests/e2e/organization-directory-admin.spec.js`
- `tests/e2e/organization-directory-failures.spec.js`

### Modify

- `package.json` — focused unit/draft/E2E scripts.
- `vite.config.js` — draft API mode plus compile-time write flag.
- `eslint.config.js` — read-only compile-time global.
- `tests/draft/publicApiResponses.js` — public organization and static-content draft responses.
- `tests/e2e/fixtures/publicHomeData.js` — import the synthetic organization fixture, not production facts.
- `src/pages/static/Intro.jsx` — structured query and exact source resolver; remove inline legacy JSX.
- `src/pages/admin/AdminDashboard.jsx` — `item=people` route and editor boundary; other Quill paths unchanged.

---

## Execution Setup Before Task 1

- [ ] Work only in `/Users/park/Desktop/project/cms-react-project/.worktrees/forest-ui-draft-e2e`; run `git branch --show-current` and `git status --short`. Expected: branch `codex/forest-ui-draft-e2e` and no uncommitted files after this plan commit.
- [ ] Run `npm run lint`, `npm run build`, and `npm run test:e2e:public -- --project=desktop` before the first feature edit. Expected: the existing frontend baseline passes. If it does not, stop and report the pre-existing failure instead of mixing it with organization work.
- [ ] Confirm `git merge-base --is-ancestor 9b677e70983cb4de2266d0c36ebfc115e0d5b674 HEAD`. Expected: exit 0, proving the implementation stays on the approved C-type design lineage.

---

### Task 1: Lock the API contract, source resolver, validation, and write policy

**Files:**
- Create: `build/organizationWritePolicy.js`
- Create: `src/config/organizationDeployment.js`
- Create: `src/services/organizationDirectoryService.js`
- Create: `src/utils/organizationDirectory.js`
- Create: `src/utils/organizationDirectoryDraft.js`
- Create: `tests/unit/organizationWritePolicy.test.js`
- Create: `tests/unit/organizationDirectory.test.js`
- Create: `tests/unit/organizationDirectoryDraft.test.js`
- Modify: `package.json`
- Modify: `vite.config.js`
- Modify: `eslint.config.js`

**Interfaces:**
- `getPublicOrganizationDirectory()`, `getManagedOrganizationDirectory()`, `updateManagedOrganizationDirectory(request)`.
- `choosePeopleSource({ organization, organizationStatus, organizationErrorStatus, legacyStatus, hasLegacy })`.
- `parseOrganizationSnapshot(value, { managed })` validates the response boundary before UI use.
- `hasMeaningfulLegacyPeopleHtml(sanitizedHtml)` checks nonblank text or an allowed image with a nonblank `src`.
- `flattenOrganizationGroups(groups)`, `resolveSelectedGroupId(groups, requestedId)`, `resolveMembershipAffiliation(membership, person)`, `projectOrganizationDraftForPreview(snapshot)`.
- `validateOrganizationDraft(snapshot): Array<{ path, message }>`.
- `moveGroup`, `moveMembership`, `canDeleteGroup`, `canDeletePerson`, `getParentCandidates`, `createUuid`.
- `ORGANIZATION_WRITES_ENABLED` is a boolean literal replaced at build time.

- [ ] **Step 1: Add focused scripts and failing write-policy tests**

Add scripts:

```json
{
  "test:unit:organization": "node --test tests/unit/organization*.test.js",
  "draft:organization": "vite --host 127.0.0.1 --mode organization-e2e",
  "draft:organization-preview": "VERCEL_ENV=preview vite --host 127.0.0.1",
  "test:e2e:organization": "playwright test --config=playwright.organization.config.js",
  "test:e2e:organization:preview": "FOREST_E2E_PREVIEW=true playwright test --config=playwright.organization.config.js tests/e2e/organization-directory-admin.spec.js"
}
```

Create:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveOrganizationWritesEnabled } from '../../build/organizationWritePolicy.js';

test('Vercel Preview and local draft compile writes off', () => {
  assert.equal(resolveOrganizationWritesEnabled({ mode: 'production', vercelEnv: 'preview' }), false);
  assert.equal(resolveOrganizationWritesEnabled({ mode: 'organization-e2e', vercelEnv: 'preview' }), false);
  assert.equal(resolveOrganizationWritesEnabled({ mode: 'draft', vercelEnv: undefined }), false);
});

test('production enables writes and only explicit organization E2E enables local mocked writes', () => {
  assert.equal(resolveOrganizationWritesEnabled({ mode: 'production', vercelEnv: 'production' }), true);
  assert.equal(resolveOrganizationWritesEnabled({ mode: 'organization-e2e', vercelEnv: undefined }), true);
});
```

- [ ] **Step 2: Verify policy RED**

Run: `node --test tests/unit/organizationWritePolicy.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `build/organizationWritePolicy.js`.

- [ ] **Step 3: Implement the build policy and guarded service**

```js
export function resolveOrganizationWritesEnabled({ mode, vercelEnv }) {
  if (vercelEnv === 'preview') return false;
  if (mode === 'organization-e2e') return true;
  return mode !== 'draft';
}
```

In `vite.config.js`, define `const usesDraftApi = mode === 'draft' || mode === 'organization-e2e'`, use it both to install `draftApiPlugin()` and to set `server.proxy` to `undefined`, then compute the write policy once and define:

```js
const writesEnabled = resolveOrganizationWritesEnabled({ mode, vercelEnv: process.env.VERCEL_ENV });
define: {
  global: 'globalThis',
  __FOREST_ORGANIZATION_WRITES_ENABLED__: JSON.stringify(writesEnabled),
},
```

This prevents the organization E2E mode from falling through to `http://localhost:8080`. Add the compile-time name as a read-only ESLint browser global. Export:

```js
export const ORGANIZATION_WRITES_ENABLED = __FOREST_ORGANIZATION_WRITES_ENABLED__;
```

The service must unwrap `response.data?.data`, reject incomplete snapshots, and guard before Axios:

```js
export function parseOrganizationSnapshot(value, { managed }) {
  if (
    value === null
    || typeof value !== 'object'
    || value.schemaVersion !== 1
    || typeof value.configured !== 'boolean'
    || !Number.isInteger(value.revision)
    || value.revision < 0
    || typeof value.legacyContentDrift !== 'boolean'
    || !(value.updatedAt === null || typeof value.updatedAt === 'string')
    || !Array.isArray(value.groups)
    || !Array.isArray(value.people)
    || !Array.isArray(value.memberships)
    || validateOrganizationDraft(value).length > 0
    || (managed && !/^sha256:[0-9a-f]{64}$/.test(value.legacyContentFingerprint))
    || (!managed && Object.prototype.hasOwnProperty.call(value, 'legacyContentFingerprint'))
  ) {
    throw new TypeError('조직도 응답 형식이 올바르지 않습니다.');
  }
  return value;
}

export async function getPublicOrganizationDirectory() {
  const response = await axiosInstance.get('/organization');
  return parseOrganizationSnapshot(response.data?.data, { managed: false });
}

export async function getManagedOrganizationDirectory() {
  const response = await axiosInstance.get('/organization/manage');
  return parseOrganizationSnapshot(response.data?.data, { managed: true });
}

export async function updateManagedOrganizationDirectory(request) {
  if (!ORGANIZATION_WRITES_ENABLED) {
    const error = new Error('조직도 저장은 현재 미리보기에서 비활성화되어 있습니다.');
    error.code = 'ORGANIZATION_WRITES_DISABLED';
    throw error;
  }
  const response = await axiosInstance.put('/organization/manage', request);
  return parseOrganizationSnapshot(response.data?.data, { managed: true });
}
```

Place `parseOrganizationSnapshot` in `src/utils/organizationDirectory.js`, import `validateOrganizationDraft` there from the pure draft utility, and import the parser into the service. This keeps Node unit tests away from the browser-only Axios instance.

- [ ] **Step 4: Write failing source/selection/affiliation unit tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  choosePeopleSource,
  hasMeaningfulLegacyPeopleHtml,
  parseOrganizationSnapshot,
  projectOrganizationDraftForPreview,
  resolveMembershipAffiliation,
  resolveSelectedGroupId,
} from '../../src/utils/organizationDirectory.js';

const configured = (isConfigured, legacyContentDrift = false) => ({
  configured: isConfigured,
  legacyContentDrift,
  groups: [],
  people: [],
  memberships: [],
});

const ORG_G1 = '11111111-1111-4111-8111-111111111111';
const ORG_G2 = '22222222-2222-4222-8222-222222222222';
const ORG_G3 = '33333333-3333-4333-8333-333333333333';
const ORG_P1 = '44444444-4444-4444-8444-444444444444';
const ORG_P2 = '55555555-5555-4555-8555-555555555555';
const ORG_M1 = '66666666-6666-4666-8666-666666666666';
const ORG_M2 = '77777777-7777-4777-8777-777777777777';
const ORG_M3 = '88888888-8888-4888-8888-888888888888';

const groups = [
  { id: ORG_G1, name: '첫째', parentGroupId: null, displayOrder: 10 },
  { id: ORG_G2, name: '둘째', parentGroupId: null, displayOrder: 20 },
];

const validPublicResponse = {
  schemaVersion: 1,
  configured: true,
  revision: 1,
  legacyContentDrift: false,
  groups: [],
  people: [],
  memberships: [],
  updatedAt: null,
};

test('response parser accepts valid public and managed snapshots', () => {
  assert.equal(parseOrganizationSnapshot(validPublicResponse, { managed: false }), validPublicResponse);
  const managed = { ...validPublicResponse, legacyContentFingerprint: `sha256:${'a'.repeat(64)}` };
  assert.equal(parseOrganizationSnapshot(managed, { managed: true }), managed);
});

test('response parser rejects leaks malformed metadata and malformed items', () => {
  assert.throws(() => parseOrganizationSnapshot({ ...validPublicResponse, legacyContentFingerprint: `sha256:${'a'.repeat(64)}` }, { managed: false }), TypeError);
  assert.throws(() => parseOrganizationSnapshot({ ...validPublicResponse, legacyContentFingerprint: 'bad' }, { managed: true }), TypeError);
  assert.throws(() => parseOrganizationSnapshot({ ...validPublicResponse, revision: -1 }, { managed: false }), TypeError);
  assert.throws(() => parseOrganizationSnapshot({ ...validPublicResponse, configured: undefined }, { managed: false }), TypeError);
  assert.throws(() => parseOrganizationSnapshot({ ...validPublicResponse, groups: [{ id: 'bad' }] }, { managed: false }), TypeError);
});

test('source resolver implements configured drift legacy 404 and 500 rules', () => {
  assert.equal(choosePeopleSource({ organization: configured(false), organizationStatus: 'success', legacyStatus: 'success', hasLegacy: true }), 'legacy');
  assert.equal(choosePeopleSource({ organization: configured(false), organizationStatus: 'success', legacyStatus: 'success', hasLegacy: false }), 'organization');
  assert.equal(choosePeopleSource({ organization: configured(true, false), organizationStatus: 'success', legacyStatus: 'loading', hasLegacy: false }), 'organization');
  assert.equal(choosePeopleSource({ organization: configured(true, true), organizationStatus: 'success', legacyStatus: 'success', hasLegacy: true }), 'legacy');
  assert.equal(choosePeopleSource({ organization: configured(true, true), organizationStatus: 'success', legacyStatus: 'success', hasLegacy: false }), 'organization');
  assert.equal(choosePeopleSource({ organizationStatus: 'error', organizationErrorStatus: 404, legacyStatus: 'success', hasLegacy: false }), 'hardcoded');
  assert.equal(choosePeopleSource({ organizationStatus: 'error', organizationErrorStatus: 500, legacyStatus: 'success', hasLegacy: false }), 'error');
});

test('configured data does not wait for or fail with an irrelevant legacy request', () => {
  assert.equal(choosePeopleSource({ organization: configured(true, false), organizationStatus: 'success', legacyStatus: 'error', hasLegacy: false }), 'organization');
});

test('legacy request failure is fail-safe when source choice depends on legacy', () => {
  assert.equal(choosePeopleSource({ organization: configured(false), organizationStatus: 'success', legacyStatus: 'error', hasLegacy: false }), 'error');
  assert.equal(choosePeopleSource({ organization: configured(true, true), organizationStatus: 'success', legacyStatus: 'error', hasLegacy: false }), 'error');
  assert.equal(choosePeopleSource({ organizationStatus: 'error', organizationErrorStatus: 404, legacyStatus: 'error', hasLegacy: false }), 'hardcoded');
});

test('sanitized legacy content is meaningful only for text or an image with a source', () => {
  assert.equal(hasMeaningfulLegacyPeopleHtml('<p><br></p>'), false);
  assert.equal(hasMeaningfulLegacyPeopleHtml('<img>'), false);
  assert.equal(hasMeaningfulLegacyPeopleHtml('<img src="/people.png">'), true);
  assert.equal(hasMeaningfulLegacyPeopleHtml('<p>기존 조직도</p>'), true);
});

test('selection uses a stable requested id or the first sorted group', () => {
  assert.equal(resolveSelectedGroupId(groups, groups[1].id), groups[1].id);
  assert.equal(resolveSelectedGroupId(groups, 'missing'), groups[0].id);
});

test('affiliation tri-state inherits hides and overrides', () => {
  assert.equal(resolveMembershipAffiliation({ affiliationOverride: null }, { affiliation: '기본' }), '기본');
  assert.equal(resolveMembershipAffiliation({ affiliationOverride: '' }, { affiliation: '기본' }), '');
  assert.equal(resolveMembershipAffiliation({ affiliationOverride: '별도' }, { affiliation: '기본' }), '별도');
});

test('preview projection mirrors server visibility without teaching the public component about private data', () => {
  const projected = projectOrganizationDraftForPreview({
    schemaVersion: 1,
    groups: [
      { id: ORG_G1, name: '공개', parentGroupId: null, displayOrder: 10, enabled: true },
      { id: ORG_G2, name: '비공개', parentGroupId: null, displayOrder: 20, enabled: false },
      { id: ORG_G3, name: '숨은 자식', parentGroupId: ORG_G2, displayOrder: 10, enabled: true },
    ],
    people: [
      { id: ORG_P1, name: '공개 인물', affiliation: '', enabled: true },
      { id: ORG_P2, name: '비공개 인물', affiliation: '', enabled: false },
    ],
    memberships: [
      { id: ORG_M1, groupId: ORG_G1, personId: ORG_P1, roleLabel: '', affiliationOverride: null, displayOrder: 10 },
      { id: ORG_M2, groupId: ORG_G1, personId: ORG_P2, roleLabel: '', affiliationOverride: null, displayOrder: 20 },
      { id: ORG_M3, groupId: ORG_G3, personId: ORG_P1, roleLabel: '', affiliationOverride: null, displayOrder: 10 },
    ],
  });
  assert.deepEqual(projected.groups.map(({ id }) => id), [ORG_G1]);
  assert.deepEqual(projected.people.map(({ id }) => id), [ORG_P1]);
  assert.deepEqual(projected.memberships.map(({ id }) => id), [ORG_M1]);
});
```

- [ ] **Step 5: Write failing draft validation/operation tests**

Cover exact server-visible constraints and immutable operations:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canDeleteGroup,
  canDeletePerson,
  createUuid,
  getParentCandidates,
  moveGroup,
  moveMembership,
  validateOrganizationDraft,
} from '../../src/utils/organizationDirectoryDraft.js';

const G1 = '11111111-1111-4111-8111-111111111111';
const G2 = '22222222-2222-4222-8222-222222222222';
const G3 = '33333333-3333-4333-8333-333333333333';
const P1 = '44444444-4444-4444-8444-444444444444';
const P2 = '55555555-5555-4555-8555-555555555555';
const M1 = '66666666-6666-4666-8666-666666666666';
const M2 = '77777777-7777-4777-8777-777777777777';
const M3 = '88888888-8888-4888-8888-888888888888';

const baseDraft = {
  schemaVersion: 1,
  groups: [
    { id: G1, name: '첫째', description: '', parentGroupId: null, displayOrder: 10, enabled: true },
    { id: G2, name: '둘째', description: '', parentGroupId: null, displayOrder: 20, enabled: true },
    { id: G3, name: '첫째 하위', description: '', parentGroupId: G1, displayOrder: 10, enabled: true },
  ],
  people: [
    { id: P1, name: '홍길동', affiliation: '숲 교육팀', enabled: true },
    { id: P2, name: '김길동', affiliation: '', enabled: true },
  ],
  memberships: [
    { id: M1, groupId: G1, personId: P1, roleLabel: '위원장', affiliationOverride: null, displayOrder: 10 },
  ],
};

test('draft validation reports deterministic field paths', () => {
  const invalid = {
    schemaVersion: 1,
    groups: [
      { id: G1, name: '<b>조직</b>', description: '', parentGroupId: G2, displayOrder: 10, enabled: true },
      { id: G2, name: '둘째', description: '', parentGroupId: G1, displayOrder: 20, enabled: true },
    ],
    people: [{ id: P1, name: '', affiliation: '', enabled: true }],
    memberships: [
      { id: M1, groupId: G1, personId: P2, roleLabel: '', affiliationOverride: '   ', displayOrder: 10 },
      { id: M2, groupId: G1, personId: P2, roleLabel: '', affiliationOverride: null, displayOrder: 20 },
    ],
  };
  assert.deepEqual(
    validateOrganizationDraft(invalid).map(({ path }) => path),
    ['groups.0.name', 'groups.0.parentGroupId', 'people.0.name', 'memberships.0.personId', 'memberships.0.affiliationOverride', 'memberships.1.personId', 'memberships.1.groupId'],
  );
});

test('moving a group changes only siblings and normalizes orders by tens', () => {
  const moved = moveGroup(baseDraft, G2, 'up');
  assert.deepEqual(moved.groups.filter(({ parentGroupId }) => parentGroupId === null).map(({ id, displayOrder }) => [id, displayOrder]), [[G2, 10], [G1, 20]]);
  assert.deepEqual(moved.groups.filter(({ parentGroupId }) => parentGroupId === G1).map(({ id, displayOrder }) => [id, displayOrder]), [[G3, 10]]);
});

test('moving a membership changes only the selected group and normalizes orders by tens', () => {
  const membershipDraft = {
    ...baseDraft,
    memberships: [
      { id: M1, groupId: G1, personId: P1, roleLabel: '위원장', affiliationOverride: null, displayOrder: 10 },
      { id: M2, groupId: G1, personId: P2, roleLabel: '위원', affiliationOverride: null, displayOrder: 20 },
      { id: M3, groupId: G2, personId: P1, roleLabel: '다른 조직', affiliationOverride: null, displayOrder: 10 },
    ],
  };
  const moved = moveMembership(membershipDraft, G1, M2, 'up');
  assert.deepEqual(moved.memberships.filter(({ groupId }) => groupId === G1).map(({ id, displayOrder }) => [id, displayOrder]), [[M2, 10], [M1, 20]]);
  assert.deepEqual(moved.memberships.filter(({ groupId }) => groupId === G2).map(({ id, displayOrder }) => [id, displayOrder]), [[M3, 10]]);
});

test('deletion guards return exact blocking references', () => {
  assert.deepEqual(canDeleteGroup(baseDraft, G1), { allowed: false, childGroupIds: [G3], membershipIds: [M1] });
  assert.deepEqual(canDeletePerson(baseDraft, P1), { allowed: false, membershipIds: [M1] });
});

test('parent candidates exclude self and every descendant', () => {
  assert.deepEqual(getParentCandidates(baseDraft.groups, G1).map(({ id }) => id), [G2]);
});

test('UUID creation returns version four IDs', () => {
  assert.match(createUuid(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
```

The implementation must return errors in the deterministic group/person/membership traversal order shown above.

- [ ] **Step 6: Verify utility RED**

Run: `npm run test:unit:organization`

Expected: FAIL because both utility modules do not exist.

- [ ] **Step 7: Implement pure utilities**

`choosePeopleSource` must return only `loading`, `organization`, `legacy`, `hardcoded`, or `error`. `hasMeaningfulLegacyPeopleHtml` receives only sanitized HTML and remains Node-testable without a DOM dependency:

```js
export function hasMeaningfulLegacyPeopleHtml(sanitizedHtml = '') {
  if (stripHtmlToText(sanitizedHtml)) return true;
  return (sanitizedHtml.match(/<img\b[^>]*>/gi) ?? []).some((tag) => {
    const match = tag.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    return Boolean((match?.[1] ?? match?.[2] ?? match?.[3] ?? '').trim());
  });
}
```

Import the existing `stripHtmlToText`; because the caller sanitizes first, every matched image is already an allowed sanitized element. `flattenOrganizationGroups` recursively visits roots and children sorted by `(displayOrder, name, id)` while recording depth. `projectOrganizationDraftForPreview` mirrors the backend projector: keep only enabled groups whose complete ancestor chain is enabled, then memberships in those groups for enabled people, then only people referenced by those memberships. Draft validation mirrors backend limits, treats missing/null override as inherit, empty as hide, rejects whitespace-only override, and never treats duplicate names as duplicate people.

- [ ] **Step 8: Run unit tests and commit**

Run: `npm run test:unit:organization`

Expected: all organization unit tests PASS.

```bash
git add package.json vite.config.js eslint.config.js build/organizationWritePolicy.js src/config/organizationDeployment.js src/services/organizationDirectoryService.js src/utils/organizationDirectory.js src/utils/organizationDirectoryDraft.js tests/unit/organizationWritePolicy.test.js tests/unit/organizationDirectory.test.js tests/unit/organizationDirectoryDraft.test.js
git commit -m "feat: add Forest organization frontend contract"
```

---

### Task 2: Build the public C-type directory with exact legacy fallback

**Files:**
- Create: `src/components/organization/OrganizationDirectory.jsx`
- Create: `src/components/organization/OrganizationMemberList.jsx`
- Create: `src/components/organization/LegacyOrganizationDirectory.jsx`
- Create: `.env.organization-e2e`
- Create: `playwright.organization.config.js`
- Create: `tests/e2e/fixtures/organizationDirectoryData.js`
- Create: `tests/e2e/fixtures/organizationTest.js`
- Create: `tests/e2e/support/mockOrganizationApi.js`
- Create: `tests/e2e/organization-directory-public.spec.js`
- Modify: `tests/draft/publicApiResponses.js`
- Modify: `tests/e2e/fixtures/publicHomeData.js`
- Modify: `src/pages/static/Intro.jsx`

**Interfaces:**
- `OrganizationDirectory({ snapshot, selectedGroupId, onSelectGroup, ariaLabel })` is controlled and router-independent.
- `OrganizationMemberList({ group, peopleById, memberships })` renders no empty affiliation row.
- `LegacyOrganizationDirectory` contains the current lines 182–353 fallback unchanged.
- `mockOrganizationApi` supports `setOrganization`, `setLegacyHtml`, `fail`, `recover`, and request audit.

- [ ] **Step 1: Add a synthetic fixture and failing public source tests**

The fixture must use non-production people and valid UUID v4 values:

```js
export const organizationFixture = Object.freeze({
  schemaVersion: 1,
  configured: true,
  revision: 2,
  legacyContentDrift: false,
  groups: [
    { id: '11111111-1111-4111-8111-111111111111', name: '운영위원회', description: '운영 설명', parentGroupId: null, displayOrder: 10, enabled: true },
    { id: '22222222-2222-4222-8222-222222222222', name: '숲교육분과 이름이 길어도 줄바꿈됩니다', description: '', parentGroupId: '11111111-1111-4111-8111-111111111111', displayOrder: 10, enabled: true },
  ],
  people: [
    { id: '33333333-3333-4333-8333-333333333333', name: '김테스트', affiliation: '기본 소속', enabled: true },
    { id: '44444444-4444-4444-8444-444444444444', name: '이테스트이름이길어도줄바꿈됩니다', affiliation: '', enabled: true },
  ],
  memberships: [
    { id: '55555555-5555-4555-8555-555555555555', groupId: '11111111-1111-4111-8111-111111111111', personId: '33333333-3333-4333-8333-333333333333', roleLabel: '운영위원장', affiliationOverride: null, displayOrder: 10 },
    { id: '66666666-6666-4666-8666-666666666666', groupId: '22222222-2222-4222-8222-222222222222', personId: '33333333-3333-4333-8333-333333333333', roleLabel: '분과장', affiliationOverride: '', displayOrder: 10 },
    { id: '77777777-7777-4777-8777-777777777777', groupId: '22222222-2222-4222-8222-222222222222', personId: '44444444-4444-4444-8444-444444444444', roleLabel: '분과위원', affiliationOverride: '별도 소속 문구', displayOrder: 20 },
  ],
  updatedAt: '2026-07-19T12:00:00+09:00',
});
```

Create E2E tests for every source-rule row in Global Constraints. Assertions must target visible headings/content, not internal React state.
Include the three legacy-request error branches: configured/no-drift C success, configured=false error/retry, and configured/drift error/retry.

- [ ] **Step 2: Verify public E2E RED**

Run: `npm run test:e2e:organization -- tests/e2e/organization-directory-public.spec.js --project=desktop`

Expected: FAIL because `/organization` is unhandled and the C-type controls do not exist.

- [ ] **Step 3: Extend draft responses and stateful route mocks**

`.env.organization-e2e`:

```dotenv
VITE_DRAFT_MODE=true
VITE_API_BASE_URL=/api/v1
```

`resolvePublicDraftResponse` must handle:

```js
if (path === '/organization') return { status: 200, body: { data: data.organization } };
const staticKey = path.match(/^\/static-content\/([^/]+)$/)?.[1];
if (staticKey) return { status: 200, body: { data: data.staticContents?.[staticKey] ?? null } };
```

The organization fixture installs public mocks first, then more-specific `/users`, `/organization/manage`, and organization PUT routes so Playwright's last registered route wins. Audit every request; unexpected write or unhandled response fails teardown.

`playwright.organization.config.js` reuses the current projects and switches the server command without changing test code:

```js
import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config.js';

const previewMode = process.env.FOREST_E2E_PREVIEW === 'true';

export default defineConfig({
  ...baseConfig,
  testMatch: /organization-directory-.*\.spec\.js/,
  webServer: {
    ...baseConfig.webServer,
    command: previewMode ? 'npm run draft:organization-preview' : 'npm run draft:organization',
  },
});
```

- [ ] **Step 4: Extract the hardcoded fallback and implement controlled C UI**

Move the existing `people` fallback JSX unchanged into `LegacyOrganizationDirectory`. Build the new directory with:

```jsx
<div className="grid gap-6 lg:grid-cols-[minmax(14rem,20rem)_minmax(0,1fr)]">
  <nav aria-label={ariaLabel} className="grid grid-cols-2 gap-3 max-[320px]:grid-cols-1 lg:grid-cols-1">
    {groups.map(({ group, depth }) => (
      <button
        key={group.id}
        type="button"
        aria-current={group.id === selectedGroupId ? 'true' : undefined}
        className={`accessible-touch-target min-w-0 break-words rounded-xl border-2 border-l-8 px-4 py-3 text-left text-lg font-bold focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-green-800 ${depth > 0 ? 'ms-3' : ''} ${group.id === selectedGroupId ? 'border-green-800 bg-green-50 text-green-950' : 'border-green-200 border-l-transparent bg-white text-green-900'}`}
        onClick={() => onSelectGroup(group.id)}
      >
        {group.name}
      </button>
    ))}
  </nav>
  <section aria-labelledby={`organization-group-${selected.id}`} className="min-w-0 rounded-2xl border border-green-200 bg-white p-5 sm:p-7">
    <h2 id={`organization-group-${selected.id}`} className="break-words text-2xl font-bold text-green-900">{selected.name}</h2>
    <OrganizationMemberList group={selected} peopleById={peopleById} memberships={selectedMemberships} />
  </section>
</div>
```

Add a visually hidden `aria-live="polite"` selection status. Display the selected group's member count from `selectedMemberships.length` only. Render name, role, and resolved affiliation in separate semantic elements; omit role or affiliation elements when their resolved values are empty.

- [ ] **Step 5: Wire Intro queries and URL selection**

For `subCategory === 'people'`, run both organization and legacy queries. Change the existing generic dynamic-content short circuit to `activeSubCategory !== 'people' && hasDynamicIntroContent` so the structured resolver always owns this route. Sanitize legacy first, evaluate it with `hasMeaningfulLegacyPeopleHtml`, call `choosePeopleSource`, and render `AsyncState` for loading/error. Retry only refetches organization and legacy as applicable.

For structured display, read `searchParams.get('group')`; selecting a group copies the existing search params and sets `group`. After a successful structured response, a `useEffect` compares the requested value with `resolveSelectedGroupId`. If missing/private/unknown, copy all current search params, set the resolved stable UUID, and call `setSearchParams(next, { replace: true })`; skip the update when values already match to prevent a navigation loop. This URL correction must not call `.focus()` or announce a route change. Use `max-w-6xl` for people and retain `max-w-4xl` for other intro pages.

- [ ] **Step 6: Verify public behavior, accessibility, and responsive layout**

Tests must assert:

- two group columns at 390px and one at 320px;
- no document horizontal overflow at 320, 390, 720, 768, and 1440;
- URL selection survives reload/back and invalid group self-corrects;
- member affiliation inheritance/hide/custom rendering;
- selected-group member count equals the actually rendered public membership rows;
- empty member group and empty group collection states;
- keyboard focus ring and no forced detail-heading focus;
- Axe has no critical/serious findings;
- page-quality watcher has no unapproved console/page/request failure.

Run: `npm run test:e2e:organization -- tests/e2e/organization-directory-public.spec.js`

Expected: all three Playwright projects PASS.

- [ ] **Step 7: Commit Task 2**

```bash
git add .env.organization-e2e playwright.organization.config.js tests/draft/publicApiResponses.js tests/e2e/fixtures/publicHomeData.js tests/e2e/fixtures/organizationDirectoryData.js tests/e2e/fixtures/organizationTest.js tests/e2e/support/mockOrganizationApi.js tests/e2e/organization-directory-public.spec.js src/components/organization/OrganizationDirectory.jsx src/components/organization/OrganizationMemberList.jsx src/components/organization/LegacyOrganizationDirectory.jsx src/pages/static/Intro.jsx
git commit -m "feat: add accessible Forest organization directory"
```

---

### Task 3: Add administrator entry and group editing

**Files:**
- Create: `src/hooks/useUnsavedChanges.js`
- Create: `src/components/admin/organization/OrganizationDirectoryEditor.jsx`
- Create: `src/components/admin/organization/OrganizationGroupTree.jsx`
- Create: `src/components/admin/organization/OrganizationGroupForm.jsx`
- Create: `tests/e2e/organization-directory-admin.spec.js`
- Modify: `src/pages/admin/AdminDashboard.jsx`

**Interfaces:**
- `OrganizationDirectoryEditor({ onBack })` owns server snapshot, draft, selection, dirty, and save status.
- `OrganizationGroupTree({ groups, selectedGroupId, onSelect, onAddRoot, onAddChild, onMove, onToggleEnabled, onDelete })`.
- `OrganizationGroupForm({ group, parentOptions, errors, onChange })`.

- [ ] **Step 1: Write failing route/group editor E2E**

Prove:

```text
/admin?section=intro shows “조직도 관리” for 함께하는이들 and “수정” for every other intro item
clicking it canonicalizes to /admin?section=intro&item=people
reload restores the editor
back returns to the intro list without touching other query state
root and child group creation use UUID v4
name/description/parent/enabled edits update the unsaved preview model only
up/down changes siblings only
parent options exclude self and descendants
delete is blocked when a child or membership exists and succeeds otherwise
```

- [ ] **Step 2: Verify admin RED**

Run: `npm run test:e2e:organization -- tests/e2e/organization-directory-admin.spec.js --project=desktop`

Expected: FAIL because the organization editor entry does not exist.

- [ ] **Step 3: Add the AdminDashboard boundary**

Keep existing Quill state and mutation for all items except `intro-people`. When `searchParams.get('item') === 'people'`, render:

```jsx
<OrganizationDirectoryEditor onBack={() => {
  const next = new URLSearchParams(searchParams);
  next.set('section', 'intro');
  next.delete('item');
  setSearchParams(next, { replace: true });
}} />
```

The people row action copies the current `URLSearchParams`, sets `section=intro` and `item=people`, and preserves unrelated query keys; it must never call `handleOpenIntroEditor`. No organization draft state is added to `AdminDashboard`.

- [ ] **Step 4: Implement group editor state and dirty guard**

`OrganizationDirectoryEditor` uses query key `['organizationDirectory', 'manage']`, clones only `schemaVersion/groups/people/memberships`, and compares a stable JSON serialization to the last accepted server snapshot. Initialize the draft only on the first successful load, a successful own save, or the user's confirmed `최신 내용 불러오기`; never use an effect that replaces a dirty draft on background refetch/window focus. If a background response has a different revision while dirty, retain the draft and enter the revision-conflict state. If only the legacy fingerprint/drift changes, retain the draft and update the pending cutover warning without treating the new fingerprint as approved. `useUnsavedChanges` registers `beforeunload` and React Router `useBlocker`; blocked in-app navigation uses an explicit confirmation before `proceed()` or `reset()`.

Group add must use `crypto.randomUUID()`, default name `새 조직`, empty description, selected parent or null, last sibling order +10, enabled true. Delete helpers and validation are the pure Task 1 functions.

- [ ] **Step 5: Verify group editor E2E and commit**

Run: `npm run test:e2e:organization -- tests/e2e/organization-directory-admin.spec.js --project=desktop`

Expected: all group/route tests PASS and mock audit reports zero PUTs before save.

```bash
git add src/hooks/useUnsavedChanges.js src/components/admin/organization/OrganizationDirectoryEditor.jsx src/components/admin/organization/OrganizationGroupTree.jsx src/components/admin/organization/OrganizationGroupForm.jsx src/pages/admin/AdminDashboard.jsx tests/e2e/organization-directory-admin.spec.js
git commit -m "feat: add Forest organization group editor"
```

---

### Task 4: Add people, memberships, and shared unsaved preview

**Files:**
- Create: `src/components/admin/organization/OrganizationMembershipEditor.jsx`
- Create: `src/components/admin/organization/OrganizationPeopleDirectory.jsx`
- Create: `src/components/admin/organization/OrganizationDirectoryPreview.jsx`
- Modify: `src/components/admin/organization/OrganizationDirectoryEditor.jsx`
- Modify: `tests/e2e/organization-directory-admin.spec.js`
- Modify: `tests/unit/organizationDirectoryDraft.test.js`

**Interfaces:**
- `OrganizationMembershipEditor({ group, memberships, people, errors, onAddExisting, onCreateAndAdd, onChange, onMove, onRemove })`.
- `OrganizationPeopleDirectory({ people, memberships, errors, onAdd, onChange, onDelete, onBack })`.
- Preview passes `projectOrganizationDraftForPreview(unsavedDraft)` through the same `OrganizationDirectory` component, so that component still receives only public-safe data.

- [ ] **Step 1: Add failing membership/people/preview tests**

Prove exact workflows:

- create a person, connect to two groups, and give different role labels;
- prevent duplicate group/person pair;
- choose `기본 소속 사용`, `소속 숨김`, and `다른 소속 입력`, then verify preview output for all three;
- move memberships within only the selected group;
- block deleting a referenced person and list linked group names;
- allow deleting an unreferenced person;
- create two people with the same name but distinct UUIDs/affiliations and keep both independently selectable;
- disable a person and show affected connections in admin while public preview hides them;
- preview changes without any PUT and returns focus to its trigger on close.

- [ ] **Step 2: Verify RED**

Run: `npm run test:e2e:organization -- tests/e2e/organization-directory-admin.spec.js --project=desktop`

Expected: new people/membership tests FAIL because those controls do not exist.

- [ ] **Step 3: Implement editor panels**

Use actual `<label>` elements and 48px controls. At 390px every administrator editor surface is a single column with no horizontal overflow; wider breakpoints may add columns. The affiliation radio group maps exactly:

```js
const toOverride = ({ mode, customValue }) => {
  if (mode === 'inherit') return null;
  if (mode === 'hide') return '';
  return customValue;
};
```

Show duplicate names with affiliation and linked group names; never merge by name. Membership add generates a separate UUID v4. The preview is a `role="dialog"` surface using `useFocusTrap`; it owns only `selectedGroupId`, closes on Escape, restores trigger focus, and never resets the draft.

- [ ] **Step 4: Run unit and E2E tests**

Run:

```bash
npm run test:unit:organization
npm run test:e2e:organization -- tests/e2e/organization-directory-admin.spec.js --project=desktop
```

Expected: all selected tests PASS; mock state revision is unchanged before the explicit save test.

Repeat the administrator editor and unsaved preview at a 390×844 viewport and assert a single-column form, 48px primary controls, usable focus order, and `document.documentElement.scrollWidth <= window.innerWidth`.

- [ ] **Step 5: Commit Task 4**

```bash
git add src/components/admin/organization/OrganizationMembershipEditor.jsx src/components/admin/organization/OrganizationPeopleDirectory.jsx src/components/admin/organization/OrganizationDirectoryPreview.jsx src/components/admin/organization/OrganizationDirectoryEditor.jsx tests/e2e/organization-directory-admin.spec.js tests/unit/organizationDirectoryDraft.test.js
git commit -m "feat: edit Forest organization memberships"
```

---

### Task 5: Make saves, conflicts, legacy cutover, and preview mode safe

**Files:**
- Create: `src/components/admin/organization/OrganizationSaveConfirmation.jsx`
- Create: `tests/e2e/organization-directory-failures.spec.js`
- Modify: `src/components/admin/organization/OrganizationDirectoryEditor.jsx`
- Modify: `src/components/admin/organization/OrganizationDirectoryPreview.jsx`
- Modify: `tests/e2e/support/mockOrganizationApi.js`
- Modify: `playwright.organization.config.js`

**Interfaces:**
- One save sends `{ schemaVersion, revision, legacyContentFingerprint, groups, people, memberships }`.
- Confirmation returns `onConfirm`/`onCancel`, traps focus with `useFocusTrap`, closes on Escape, and restores trigger focus.
- Error handling branches on HTTP status and response `code`.

- [ ] **Step 1: Write failing save and failure-state E2E**

Tests must prove:

```text
client validation focuses the first [data-field-path] error and sends no PUT
one double-click while pending produces one PUT
successful PUT replaces revision/fingerprint, clears dirty, invalidates public/manage query keys
configured=false + meaningful legacy requires confirmation and preserves legacy content
configured=true + legacyContentDrift requires acknowledgement before save
configured=false or drift=true blocks save while the legacy query is loading/failed and retries it without a PUT
server 400 focuses a top role=alert and retains the draft
403 advises login/permission and retains the draft
ORGANIZATION_REVISION_CONFLICT retains draft and disables save until latest structure is loaded
ORGANIZATION_LEGACY_CONTENT_CONFLICT refetches fingerprint/legacy and requires renewed confirmation
background manage refetch with a changed revision/fingerprint never overwrites a dirty draft
500 retains draft and enables explicit retry
```

- [ ] **Step 2: Verify failure RED**

Run: `npm run test:e2e:organization -- tests/e2e/organization-directory-failures.spec.js --project=desktop`

Expected: FAIL because no save/conflict flow exists.

- [ ] **Step 3: Implement save/confirmation/error behavior**

The editor runs a separate `['staticContent', 'intro-people']` query through `getStaticContent`, sanitizes it, and evaluates it with `hasMeaningfulLegacyPeopleHtml`; it does not reuse or mutate the parent dashboard's bulk intro cache. Use this state for the persistent configured=false legacy warning, configured=true drift warning, and cutover confirmation. When `configured=false` or `legacyContentDrift=true`, disable save until this query succeeds; a loading/error state must never be interpreted as empty legacy content, and retry refetches without sending a PUT.

Before mutate, call client validation. Escape the returned path for a selector and focus its exact `[data-field-path]` element (for example, `groups.0.name` maps to `[data-field-path="groups.0.name"]`); if none exists, focus the top alert. If meaningful legacy would be replaced or drift acknowledged, open the focus-trapped confirmation. Disable save while pending, after revision conflict, and whenever `ORGANIZATION_WRITES_ENABLED` is false.

On success:

```js
queryClient.setQueryData(['organizationDirectory', 'manage'], saved);
queryClient.invalidateQueries({ queryKey: ['organizationDirectory', 'public'] });
queryClient.invalidateQueries({ queryKey: ['staticContent', 'intro-people'] });
```

Do not auto-retry PUT. For revision conflict, only `최신 내용 불러오기` may replace the local draft after a separate discard confirmation.

For `ORGANIZATION_LEGACY_CONTENT_CONFLICT`, fetch the latest managed snapshot and `intro-people` content without running the editor's draft-initialization path. Preserve the draft and its base revision. If the fetched revision also differs from the draft's base revision, transition to the revision-conflict state and do not adopt either the fetched revision or structure. If the revision is unchanged, retain only the refreshed legacy fingerprint/content in a separate pending-cutover state, require the legacy confirmation again, and use that refreshed fingerprint on the next explicit save. Never copy a newer revision onto an older local draft.

- [ ] **Step 4: Verify preview/local draft read-only at both layers**

In the Preview-mode server, assert the save button says `미리보기에서는 저장할 수 없습니다` and is disabled. Then use `page.evaluate` to dynamically import `/src/services/organizationDirectoryService.js`, call `updateManagedOrganizationDirectory` with a valid fixture request, capture the thrown `error.code`, and assert it is `ORGANIZATION_WRITES_DISABLED`. The route audit must confirm no PUT was sent; do not add a test-only production component or button.

Run: `npm run test:e2e:organization:preview`

Expected: preview-focused admin tests PASS with zero organization PUT attempts.

- [ ] **Step 5: Run all focused E2E and commit**

Run: `npm run test:e2e:organization`

Expected: public/admin/failure specs PASS across desktop, tablet, and mobile projects; no unexpected console/page/request failures.

```bash
git add src/components/admin/organization/OrganizationSaveConfirmation.jsx src/components/admin/organization/OrganizationDirectoryEditor.jsx src/components/admin/organization/OrganizationDirectoryPreview.jsx tests/e2e/organization-directory-failures.spec.js tests/e2e/support/mockOrganizationApi.js playwright.organization.config.js
git commit -m "feat: make Forest organization saves conflict safe"
```

---

### Task 6: Run regression, visual, build, and Preview handoff gates

**Files:**
- Modify only if tests expose a verified issue in files already owned by Tasks 1–5.
- Modify through `source-command-prd-sync` after final verification: `/Users/park/Desktop/project/prd/forest/requirements.md`.
- Recheck through `source-command-prd-sync`: `/Users/park/Desktop/project/prd/forest/api-spec.md`; change it only if the verified frontend implementation changes an API fact.

**Interfaces:**
- Produces a local verified frontend branch only.
- Does not push or deploy.

- [ ] **Step 1: Run complete frontend verification**

Run fresh:

```bash
npm run test:unit:organization
npm run lint
npm run build
VERCEL_ENV=preview npm run build
npm run test:e2e:public
npm run test:e2e:organization
npm run test:e2e:organization:preview
git diff --check
```

Expected: every command exits 0. The Preview build compiles the write flag false; normal build compiles successfully. Existing public-home E2E remains green.

- [ ] **Step 2: Capture and inspect the approved visual states**

Capture public C-type at 1440×900, 768×1024, 390×844, 320px, and 720px reflow plus administrator edit/people/preview screens. Inspect long Korean names, group hierarchy, selected state, focus ring, empty affiliation omission, modal focus, and horizontal overflow.

- [ ] **Step 3: Review the complete frontend diff**

Run:

```bash
git diff --stat 9b677e70983cb4de2266d0c36ebfc115e0d5b674..HEAD
git diff 9b677e70983cb4de2266d0c36ebfc115e0d5b674..HEAD -- src tests package.json vite.config.js eslint.config.js playwright.organization.config.js
git status --short
```

Verify there is no production API mutation in draft/Preview, no production fact fixture, no unrelated homepage/program/post change, no secret, and no generated Playwright report committed.

- [ ] **Step 4: Request code review and re-run all affected commands**

Use `superpowers:requesting-code-review`. Resolve only verified findings. Re-run the complete Step 1 command set after the final edit.

- [ ] **Step 5: Invoke `source-command-prd-sync` once for the frontend work unit**

Sync only verified public C-type behavior, administrator editing/preview behavior, legacy source priority, and Preview read-only behavior into Forest requirements. Recheck the API spec against the implemented service contract without inventing or copying deployment status. Run the skill-required checks plus:

```bash
git diff --check -- prd/forest/requirements.md prd/forest/api-spec.md
```

Commit PRD changes in `/Users/park/Desktop/project`, which owns those documents; do not mix them into the frontend repository.

- [ ] **Step 6: Prepare real-backend smoke checks without mutation**

After backend deployment is separately approved and complete, test only:

```text
GET /api/v1/organization returns success and configured state
unauthenticated GET /api/v1/organization/manage is blocked
old public frontend still renders /intro/people
Vercel Preview reads the deployed public endpoint
Preview administrator save remains disabled and sends no PUT
```

Do not create test organization data in production.

- [ ] **Step 7: Stop and request explicit branch push / Vercel Preview confirmation**

Report commit SHA range, exact unit/lint/build/E2E counts, screenshots, backend smoke result, and known unverified real-admin mutation scope. Do not push until the user approves. After approval, push only `codex/forest-ui-draft-e2e`; do not merge main or deploy production.
