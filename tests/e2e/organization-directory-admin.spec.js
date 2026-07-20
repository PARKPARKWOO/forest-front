import { test, expect } from './fixtures/organizationTest.js';
import {
  copyOrganization,
  organizationFixture,
  organizationGroupIds,
} from './fixtures/organizationDirectoryData.js';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const API_500 = /^Failed to load resource: the server responded with a status of 500 \(Internal Server Error\)$/;
const MANAGE_API_URL = /\/api\/v1\/organization\/manage(?:[?#].*)?$/;

const ADMIN_USER_RESPONSE = {
  status: 200,
  body: {
    data: {
      userId: 'organization-admin',
      role: 'ROLE_ADMIN',
      canManageContent: true,
      hasMaxAccess: false,
    },
  },
};

async function openOrganizationEditor(page, organizationApi, url = '/admin?section=intro') {
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  await page.goto(url);
  const peopleRow = page.getByRole('row').filter({ hasText: '함께하는이들' });
  await peopleRow.getByRole('button', { name: '조직도 관리' }).click();
  await expect(page.getByRole('heading', { name: '함께하는이들 조직도 관리' })).toBeVisible();
}

test('the people row opens a reloadable editor route and back preserves unrelated query state', async ({
  page,
  organizationApi,
}) => {
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  await page.goto('/admin?section=intro&campaign=forest');

  for (const label of ['인사말', '창립선언문', '주요활동', '오시는 길']) {
    const row = page.getByRole('row').filter({ hasText: label });
    await expect(row.getByRole('button', { name: '수정' })).toBeVisible();
  }
  const peopleRow = page.getByRole('row').filter({ hasText: '함께하는이들' });
  await expect(peopleRow.getByRole('button', { name: '조직도 관리' })).toBeVisible();
  await expect(peopleRow.getByRole('button', { name: '수정' })).toHaveCount(0);

  await peopleRow.getByRole('button', { name: '조직도 관리' }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get('section')).toBe('intro');
  await expect.poll(() => new URL(page.url()).searchParams.get('item')).toBe('people');
  await expect.poll(() => new URL(page.url()).searchParams.get('campaign')).toBe('forest');
  await expect(page.getByRole('heading', { name: '함께하는이들 조직도 관리' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: '함께하는이들 조직도 관리' })).toBeVisible();
  await page.getByRole('button', { name: '소개글 목록으로 돌아가기' }).click();
  await expect(page.getByRole('heading', { name: '소개(정적 카테고리) 편집' })).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.get('item')).toBeNull();
  await expect.poll(() => new URL(page.url()).searchParams.get('campaign')).toBe('forest');
});

test('group edits stay in an unsaved preview and only move siblings', async ({ page, organizationApi }) => {
  await openOrganizationEditor(page, organizationApi);
  const tree = page.getByRole('tree', { name: '조직 그룹 편집' });
  const preview = page.getByRole('region', { name: '저장 전 조직도 미리보기' });

  await page.getByRole('button', { name: '최상위 조직 추가' }).click();
  const createdRoot = tree.getByRole('treeitem', { name: /새 조직/ });
  const rootId = await createdRoot.getAttribute('data-group-id');
  expect(rootId).toMatch(UUID_V4_PATTERN);
  await expect(createdRoot).toHaveAttribute('data-parent-id', 'root');

  await page.getByLabel('그룹 이름').fill('새 루트 조직');
  await page.getByLabel('그룹 설명').fill('저장 전 설명');
  await expect(preview.getByText('새 루트 조직')).toBeVisible();
  await expect(preview.getByText('저장 전 설명')).toBeVisible();

  await tree.getByRole('button', { name: '새 루트 조직 위로 이동' }).click();
  const topLevelNames = await tree.locator('[role="treeitem"][data-parent-id="root"] [data-group-name]').allTextContents();
  expect(topLevelNames.map((name) => name.trim())).toEqual(['새 루트 조직', '운영위원회']);
  await expect(tree.locator(`[data-group-id="${organizationGroupIds.child}"]`))
    .toHaveAttribute('data-parent-id', organizationGroupIds.root);

  await tree.getByRole('button', { name: '운영위원회 선택' }).click();
  await page.getByRole('button', { name: '운영위원회 하위 조직 추가' }).click();
  const createdChild = tree.getByRole('treeitem', { name: /새 조직/ });
  const childId = await createdChild.getAttribute('data-group-id');
  expect(childId).toMatch(UUID_V4_PATTERN);
  expect(childId).not.toBe(rootId);
  await expect(createdChild).toHaveAttribute('data-parent-id', organizationGroupIds.root);

  await page.getByLabel('그룹 이름').fill('새 하위 조직');
  await tree.getByRole('button', { name: '새 하위 조직 위로 이동' }).click();
  const childNames = await tree.locator(`[role="treeitem"][data-parent-id="${organizationGroupIds.root}"] [data-group-name]`).allTextContents();
  expect(childNames.map((name) => name.trim())).toEqual([
    '새 하위 조직',
    '숲교육분과 이름이 길어도 줄바꿈됩니다',
  ]);

  await page.getByLabel('상위 그룹').selectOption(rootId);
  await expect(tree.locator(`[data-group-id="${childId}"]`)).toHaveAttribute('data-parent-id', rootId);
  await page.getByRole('checkbox', { name: '공개', exact: true }).uncheck();
  await expect(preview.getByText('새 하위 조직')).toBeVisible();
  await expect(preview.getByText('비공개', { exact: true })).toBeVisible();
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('parent choices prevent cycles and guarded deletion only removes an empty group', async ({ page, organizationApi }) => {
  await openOrganizationEditor(page, organizationApi);
  const tree = page.getByRole('tree', { name: '조직 그룹 편집' });

  await tree.getByRole('button', { name: '운영위원회 선택' }).click();
  const parentOptions = await page.getByLabel('상위 그룹').locator('option').allTextContents();
  expect(parentOptions).not.toContain('운영위원회');
  expect(parentOptions).not.toContain('숲교육분과 이름이 길어도 줄바꿈됩니다');

  await Promise.all([
    page.waitForEvent('dialog').then(async (dialog) => {
      expect(dialog.type()).toBe('alert');
      expect(dialog.message()).toContain('하위 조직');
      await dialog.accept();
    }),
    tree.getByRole('button', { name: '운영위원회 삭제' }).click(),
  ]);
  await expect(tree.locator(`[data-group-id="${organizationGroupIds.root}"]`)).toBeVisible();

  await tree.getByRole('button', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다 선택' }).click();
  await Promise.all([
    page.waitForEvent('dialog').then(async (dialog) => {
      expect(dialog.type()).toBe('alert');
      expect(dialog.message()).toContain('구성원 연결');
      await dialog.accept();
    }),
    tree.getByRole('button', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다 삭제' }).click(),
  ]);
  await expect(tree.locator(`[data-group-id="${organizationGroupIds.child}"]`)).toBeVisible();

  await page.getByRole('button', { name: '최상위 조직 추가' }).click();
  const emptyGroup = tree.getByRole('treeitem', { name: /새 조직/ });
  const emptyGroupId = await emptyGroup.getAttribute('data-group-id');
  await Promise.all([
    page.waitForEvent('dialog').then(async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    }),
    tree.getByRole('button', { name: '새 조직 삭제' }).click(),
  ]);
  await expect(tree.locator(`[data-group-id="${emptyGroupId}"]`)).toHaveCount(0);
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('dirty editor navigation requires explicit confirmation', async ({ page, organizationApi }) => {
  await openOrganizationEditor(page, organizationApi, '/admin?section=intro&campaign=forest');
  await page.getByLabel('그룹 이름').fill('저장하지 않은 운영위원회');

  const beforeUnloadWasPrevented = await page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(beforeUnloadWasPrevented).toBe(true);

  await Promise.all([
    page.waitForEvent('dialog').then(async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('저장하지 않은 변경사항');
      await dialog.dismiss();
    }),
    page.getByRole('button', { name: '소개글 목록으로 돌아가기' }).click(),
  ]);
  await expect(page.getByRole('heading', { name: '함께하는이들 조직도 관리' })).toBeVisible();

  await Promise.all([
    page.waitForEvent('dialog').then((dialog) => dialog.accept()),
    page.getByRole('button', { name: '소개글 목록으로 돌아가기' }).click(),
  ]);
  await expect(page.getByRole('heading', { name: '소개(정적 카테고리) 편집' })).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.get('campaign')).toBe('forest');
});

test('background refetch keeps a dirty draft until the administrator accepts the latest revision', async ({
  page,
  organizationApi,
}) => {
  await openOrganizationEditor(page, organizationApi);
  const nameInput = page.getByLabel('그룹 이름');
  await nameInput.fill('로컬에서 편집 중인 이름');

  organizationApi.setOrganization(copyOrganization({
    revision: organizationFixture.revision + 1,
    groups: organizationFixture.groups.map((group) => (
      group.id === organizationGroupIds.root ? { ...group, name: '서버의 최신 이름' } : { ...group }
    )),
  }));
  await page.getByRole('button', { name: '서버 변경 확인' }).click();
  await expect.poll(() => (
    organizationApi.getRequests().filter((request) => request === 'GET /organization/manage').length
  )).toBeGreaterThan(1);

  await expect(nameInput).toHaveValue('로컬에서 편집 중인 이름');
  await expect(page.getByRole('alert').getByText('다른 관리자가 먼저 저장했습니다.')).toBeVisible();

  await Promise.all([
    page.waitForEvent('dialog').then((dialog) => dialog.accept()),
    page.getByRole('button', { name: '최신 내용 불러오기' }).click(),
  ]);
  await expect(nameInput).toHaveValue('서버의 최신 이름');
  await expect(page.getByText('서버 내용과 동일')).toBeVisible();

  await nameInput.fill('전환 상태를 확인 중인 로컬 이름');
  organizationApi.setOrganization(copyOrganization({
    revision: organizationFixture.revision + 1,
    legacyContentDrift: true,
    groups: organizationFixture.groups.map((group) => (
      group.id === organizationGroupIds.root ? { ...group, name: '서버의 최신 이름' } : { ...group }
    )),
  }));
  await page.getByRole('button', { name: '서버 변경 확인' }).click();
  await expect(nameInput).toHaveValue('전환 상태를 확인 중인 로컬 이름');
  await expect(page.getByRole('alert')).toContainText('전환 상태가 바뀌었습니다');
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('a failed background refetch reports the error without hiding a dirty draft', async ({
  page,
  organizationApi,
  pageQuality,
}) => {
  await openOrganizationEditor(page, organizationApi);
  const nameInput = page.getByLabel('그룹 이름');
  await nameInput.fill('실패해도 남아야 하는 로컬 이름');
  organizationApi.fail('/organization/manage', 500);
  pageQuality.allowConsoleError(API_500, MANAGE_API_URL);

  await page.getByRole('button', { name: '서버 변경 확인' }).click();

  await expect(nameInput).toHaveValue('실패해도 남아야 하는 로컬 이름');
  await expect(page.getByRole('alert')).toContainText('서버 변경 확인에 실패했습니다');
  expect(organizationApi.getPutRequests()).toEqual([]);
});
