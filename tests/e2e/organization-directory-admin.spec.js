import AxeBuilder from '@axe-core/playwright';
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

const getPeopleDirectory = (page) => (
  page.getByRole('heading', { name: '인물 관리', exact: true }).locator('xpath=ancestor::section[1]')
);
const getGroupList = (page) => page.getByRole('list', { name: '조직 그룹 편집' });
const getGroupItem = (page, selectButtonName) => getGroupList(page).locator('[data-group-id]').filter({
  has: page.getByRole('button', { name: selectButtonName }),
});

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

test('non-MAX administrators canonicalize only restricted menu URLs and preserve unrelated query state', async ({
  page,
  organizationApi,
}) => {
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  await page.route('**/api/v1/program/apply/counts?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { 'program-1': 0 } }),
    });
  });

  for (const restrictedSection of ['categories', 'users']) {
    await page.goto(`/admin?section=${restrictedSection}&item=people&campaign=forest`);
    await expect(page.getByRole('heading', { name: '프로그램 관리', level: 1 })).toBeVisible();
    await expect.poll(() => new URL(page.url()).searchParams.get('section')).toBe('programs');
    await expect.poll(() => new URL(page.url()).searchParams.get('item')).toBeNull();
    await expect.poll(() => new URL(page.url()).searchParams.get('campaign')).toBe('forest');
  }

  await page.goto('/admin?campaign=forest');
  await expect(page.getByRole('heading', { name: '프로그램 관리', level: 1 })).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.get('section')).toBeNull();

  await page.goto('/admin?section=unknown&campaign=forest');
  await expect(page.getByRole('heading', { name: '프로그램 관리', level: 1 })).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.get('section')).toBe('unknown');
});

test('group hierarchy uses list semantics and exposes keyboard selection on the selection button', async ({
  page,
  organizationApi,
}) => {
  await openOrganizationEditor(page, organizationApi);

  const groupList = getGroupList(page);
  await expect(page.getByRole('tree', { name: '조직 그룹 편집' })).toHaveCount(0);
  await expect(groupList.getByRole('listitem')).toHaveCount(2);
  await expect(groupList.locator(`[data-group-id="${organizationGroupIds.root}"]`)).toHaveAttribute('aria-level', '1');
  await expect(groupList.locator(`[data-group-id="${organizationGroupIds.child}"]`)).toHaveAttribute('aria-level', '2');

  const rootSelect = groupList.getByRole('button', { name: '운영위원회 선택' });
  const childSelect = groupList.getByRole('button', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다 선택' });
  await expect(rootSelect).toHaveAttribute('aria-current', 'true');
  await expect(childSelect).not.toHaveAttribute('aria-current');
  await childSelect.focus();
  await childSelect.press('Enter');
  await expect(childSelect).toBeFocused();
  await expect(childSelect).toHaveAttribute('aria-current', 'true');
  await expect(rootSelect).not.toHaveAttribute('aria-current');

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const serious = results.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious');
  expect(serious).toEqual([]);
});

test('preview deployment blocks every mutation before the network and keeps the organization double guard', async ({
  page,
  organizationApi,
}, testInfo) => {
  test.skip(!testInfo.config.metadata.organizationPreviewMode, 'preview deployment regression only');
  await openOrganizationEditor(page, organizationApi);

  const saveButton = page.getByRole('button', { name: '미리보기에서는 저장할 수 없습니다' });
  await expect(saveButton).toBeDisabled();

  const errorCode = await page.evaluate(async (request) => {
    const { updateManagedOrganizationDirectory } = await import('/src/services/organizationDirectoryService.js');
    try {
      await updateManagedOrganizationDirectory(request);
      return null;
    } catch (error) {
      return error.code;
    }
  }, {
    schemaVersion: organizationFixture.schemaVersion,
    revision: organizationFixture.revision,
    legacyContentFingerprint: `sha256:${'a'.repeat(64)}`,
    groups: organizationFixture.groups,
    people: organizationFixture.people,
    memberships: organizationFixture.memberships,
  });

  expect(errorCode).toBe('ORGANIZATION_WRITES_DISABLED');
  expect(organizationApi.getPutRequests()).toEqual([]);

  let representativeMutationRouteCount = 0;
  await page.route('**/api/v1/static-content/intro-greeting', async (route) => {
    representativeMutationRouteCount += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { key: 'intro-greeting', content: 'should not be reached' } }),
    });
  });
  const editorUrl = page.url();
  const globalErrorCode = await page.evaluate(async () => {
    const { default: axiosInstance } = await import('/src/axiosInstance.js');
    try {
      await axiosInstance.put('/static-content/intro-greeting', { content: 'blocked preview write' });
      return null;
    } catch (error) {
      return error.code;
    }
  });

  expect(globalErrorCode).toBe('FOREST_MUTATIONS_DISABLED');
  expect(representativeMutationRouteCount).toBe(0);
  await expect(page).toHaveURL(editorUrl);
});

test('group edits stay in an unsaved preview and only move siblings', async ({ page, organizationApi }) => {
  await openOrganizationEditor(page, organizationApi);
  const tree = getGroupList(page);

  await page.getByRole('button', { name: '최상위 조직 추가' }).click();
  const createdRoot = getGroupItem(page, /새 조직.*선택/);
  const rootId = await createdRoot.getAttribute('data-group-id');
  expect(rootId).toMatch(UUID_V4_PATTERN);
  await expect(createdRoot).toHaveAttribute('data-parent-id', 'root');

  await page.getByLabel('그룹 이름').fill('새 루트 조직');
  await page.getByLabel('그룹 설명').fill('저장 전 설명');
  await page.getByRole('button', { name: '저장 전 미리보기' }).click();
  let preview = page.getByRole('dialog', { name: '저장 전 조직도 미리보기' });
  await preview.getByRole('button', { name: '새 루트 조직' }).click();
  await expect(preview.getByRole('heading', { name: '새 루트 조직', level: 2 })).toBeVisible();
  await expect(preview.getByText('저장 전 설명', { exact: true })).toBeVisible();
  await preview.getByRole('button', { name: '미리보기 닫기' }).click();

  const descriptionInput = page.getByLabel('그룹 설명');
  await descriptionInput.fill('허용되지 않는 <설명');
  const descriptionErrorId = await descriptionInput.getAttribute('aria-describedby');
  expect(descriptionErrorId).toBeTruthy();
  await expect(page.locator(`#${descriptionErrorId}`)).toContainText('그룹 설명이 올바르지 않습니다');
  await descriptionInput.fill('저장 전 설명');

  await tree.getByRole('button', { name: '새 루트 조직 위로 이동' }).click();
  const topLevelNames = await tree.locator('[data-group-id][data-parent-id="root"] [data-group-name]').allTextContents();
  expect(topLevelNames.map((name) => name.trim())).toEqual(['새 루트 조직', '운영위원회']);
  await expect(tree.locator(`[data-group-id="${organizationGroupIds.child}"]`))
    .toHaveAttribute('data-parent-id', organizationGroupIds.root);

  await tree.getByRole('button', { name: '운영위원회 선택' }).click();
  await page.getByRole('button', { name: '운영위원회 하위 조직 추가' }).click();
  const createdChild = getGroupItem(page, /새 조직.*선택/);
  const childId = await createdChild.getAttribute('data-group-id');
  expect(childId).toMatch(UUID_V4_PATTERN);
  expect(childId).not.toBe(rootId);
  await expect(createdChild).toHaveAttribute('data-parent-id', organizationGroupIds.root);

  await page.getByLabel('그룹 이름').fill('새 하위 조직');
  await tree.getByRole('button', { name: '새 하위 조직 위로 이동' }).click();
  const childNames = await tree.locator(`[data-group-id][data-parent-id="${organizationGroupIds.root}"] [data-group-name]`).allTextContents();
  expect(childNames.map((name) => name.trim())).toEqual([
    '새 하위 조직',
    '숲교육분과 이름이 길어도 줄바꿈됩니다',
  ]);

  const parentInput = page.getByLabel('상위 그룹');
  await parentInput.evaluate((select) => {
    const invalidOption = document.createElement('option');
    invalidOption.value = 'invalid-parent';
    invalidOption.textContent = '유효하지 않은 상위 그룹';
    select.append(invalidOption);
    select.value = invalidOption.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const parentErrorId = await parentInput.getAttribute('aria-describedby');
  expect(parentErrorId).toBeTruthy();
  expect(parentErrorId).not.toBe(descriptionErrorId);
  await expect(page.locator(`#${parentErrorId}`)).toContainText('상위 그룹 ID가 올바르지 않습니다');

  await parentInput.selectOption(rootId);
  await expect(tree.locator(`[data-group-id="${childId}"]`)).toHaveAttribute('data-parent-id', rootId);
  await page.getByRole('checkbox', { name: '공개', exact: true }).uncheck();
  await page.getByRole('button', { name: '저장 전 미리보기' }).click();
  preview = page.getByRole('dialog', { name: '저장 전 조직도 미리보기' });
  await expect(preview.getByText('새 하위 조직')).toHaveCount(0);
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('parent choices prevent cycles and guarded deletion only removes an empty group', async ({ page, organizationApi }) => {
  await openOrganizationEditor(page, organizationApi);
  const tree = getGroupList(page);

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
  const emptyGroup = getGroupItem(page, /새 조직.*선택/);
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

test('dirty sidebar navigation keeps the editor mounted when dismissed and leaves only after acceptance', async ({
  page,
  organizationApi,
}) => {
  await openOrganizationEditor(page, organizationApi, '/admin?section=intro&campaign=forest');
  const nameInput = page.getByLabel('그룹 이름');
  const introMenu = page.getByRole('button', { name: '소개글 관리', exact: true });
  const mailMenu = page.getByRole('button', { name: '메일 발송', exact: true });
  await nameInput.fill('사이드바 이탈 전에 남아야 하는 이름');

  await Promise.all([
    page.waitForEvent('dialog').then(async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('저장하지 않은 변경사항');
      await dialog.dismiss();
    }),
    mailMenu.click(),
  ]);

  await expect(page.getByRole('heading', { name: '함께하는이들 조직도 관리' })).toBeVisible();
  await expect(nameInput).toHaveValue('사이드바 이탈 전에 남아야 하는 이름');
  await expect(introMenu).toHaveAttribute('aria-current', 'page');
  await expect(mailMenu).not.toHaveAttribute('aria-current');
  await expect.poll(() => new URL(page.url()).searchParams.get('section')).toBe('intro');
  await expect.poll(() => new URL(page.url()).searchParams.get('item')).toBe('people');
  await expect.poll(() => new URL(page.url()).searchParams.get('campaign')).toBe('forest');

  await Promise.all([
    page.waitForEvent('dialog').then((dialog) => dialog.accept()),
    mailMenu.click(),
  ]);

  await expect(page.getByRole('heading', { name: '메일 발송', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: '함께하는이들 조직도 관리' })).toHaveCount(0);
  await expect(mailMenu).toHaveAttribute('aria-current', 'page');
  await expect.poll(() => new URL(page.url()).searchParams.get('section')).toBe('mail');

  await page.goBack();
  await expect(page.getByRole('heading', { name: '함께하는이들 조직도 관리' })).toBeVisible();
  await expect(introMenu).toHaveAttribute('aria-current', 'page');
  await expect.poll(() => new URL(page.url()).searchParams.get('section')).toBe('intro');
  await expect.poll(() => new URL(page.url()).searchParams.get('item')).toBe('people');
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

test('a new group follows the greatest negative sibling order by ten', async ({ page, organizationApi }) => {
  organizationApi.setOrganization(copyOrganization({
    groups: [
      {
        id: '88888888-8888-4888-8888-888888888888',
        name: '음수 첫 조직',
        description: '',
        parentGroupId: null,
        displayOrder: -20,
        enabled: true,
      },
      {
        id: '99999999-9999-4999-8999-999999999999',
        name: '음수 둘째 조직',
        description: '',
        parentGroupId: null,
        displayOrder: -10,
        enabled: true,
      },
    ],
    people: [],
    memberships: [],
  }));
  await openOrganizationEditor(page, organizationApi);

  await page.getByRole('button', { name: '최상위 조직 추가' }).click();

  await expect(getGroupItem(page, /새 조직.*선택/)).toHaveAttribute('data-order', '0');
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('people remain UUID-distinct, referenced deletion lists groups, and unreferenced deletion succeeds', async ({
  page,
  organizationApi,
}) => {
  await openOrganizationEditor(page, organizationApi);
  await page.getByRole('button', { name: '인물 관리' }).click();
  await expect(page.getByRole('heading', { name: '인물 관리', exact: true })).toBeVisible();

  const peopleDirectory = getPeopleDirectory(page);
  const referencedPerson = peopleDirectory.locator('[data-person-id="33333333-3333-4333-8333-333333333333"]');
  await expect(referencedPerson.getByRole('button', { name: /김테스트.*기본 소속.*인물 삭제/ })).toBeVisible();
  await Promise.all([
    page.waitForEvent('dialog').then(async (dialog) => {
      expect(dialog.type()).toBe('alert');
      expect(dialog.message()).toContain('운영위원회');
      expect(dialog.message()).toContain('숲교육분과 이름이 길어도 줄바꿈됩니다');
      await dialog.accept();
    }),
    referencedPerson.getByRole('button', { name: '인물 삭제' }).click(),
  ]);
  await expect(referencedPerson).toBeVisible();

  const addPerson = async (affiliation) => {
    await peopleDirectory.getByLabel('새 인물 이름').fill('동명이인');
    await peopleDirectory.getByLabel('새 인물 소속').fill(affiliation);
    await peopleDirectory.getByRole('button', { name: '인물 추가' }).click();
  };
  await addPerson('첫 번째 소속');
  await addPerson('두 번째 소속');
  const duplicateCards = peopleDirectory.locator('[data-person-id]').filter({ hasText: '동명이인' });
  await expect(duplicateCards).toHaveCount(2);
  const duplicateIds = await duplicateCards.evaluateAll((cards) => cards.map((card) => card.dataset.personId));
  expect(duplicateIds[0]).toMatch(UUID_V4_PATTERN);
  expect(duplicateIds[1]).toMatch(UUID_V4_PATTERN);
  expect(duplicateIds[0]).not.toBe(duplicateIds[1]);

  await page.getByRole('button', { name: '조직 편집으로 돌아가기' }).click();
  const personOptions = page.getByLabel('기존 인물').locator('option');
  await expect(personOptions.filter({ hasText: '동명이인 · 첫 번째 소속' })).toHaveCount(1);
  await expect(personOptions.filter({ hasText: '동명이인 · 두 번째 소속' })).toHaveCount(1);
  expect(await personOptions.filter({ hasText: '동명이인' }).evaluateAll((options) => options.map((option) => option.value)))
    .toEqual(expect.arrayContaining(duplicateIds));

  await page.getByRole('button', { name: '인물 관리' }).click();
  const unreferencedPerson = peopleDirectory.locator(`[data-person-id="${duplicateIds[1]}"]`);
  await Promise.all([
    page.waitForEvent('dialog').then(async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    }),
    unreferencedPerson.getByRole('button', { name: '인물 삭제' }).click(),
  ]);
  await expect(unreferencedPerson).toHaveCount(0);
  await expect(peopleDirectory.locator(`[data-person-id="${duplicateIds[0]}"]`)).toBeVisible();
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('deleting a selected unreferenced person clears the hidden membership selection', async ({
  page,
  organizationApi,
}) => {
  await openOrganizationEditor(page, organizationApi);
  await page.getByRole('button', { name: '인물 관리' }).click();
  const peopleDirectory = getPeopleDirectory(page);
  await peopleDirectory.getByLabel('새 인물 이름').fill('삭제할 미연결 인물');
  await peopleDirectory.getByLabel('새 인물 소속').fill('임시 소속');
  await peopleDirectory.getByRole('button', { name: '인물 추가' }).click();
  const person = peopleDirectory.locator('[data-person-id]').filter({ hasText: '삭제할 미연결 인물' });
  const personId = await person.getAttribute('data-person-id');

  await page.getByRole('button', { name: '조직 편집으로 돌아가기' }).click();
  const memberships = page.getByRole('region', { name: '운영위원회 구성원 편집' });
  const existingPersonSelect = memberships.getByLabel('기존 인물');
  const connectButton = memberships.getByRole('button', { name: '기존 인물 연결' });
  await existingPersonSelect.selectOption(personId);
  await expect(connectButton).toBeEnabled();

  await page.getByRole('button', { name: '인물 관리' }).click();
  await Promise.all([
    page.waitForEvent('dialog').then((dialog) => dialog.accept()),
    person.getByRole('button', { name: '인물 삭제' }).click(),
  ]);
  await page.getByRole('button', { name: '조직 편집으로 돌아가기' }).click();

  await expect(existingPersonSelect).toHaveValue('');
  await expect(connectButton).toBeDisabled();
  await expect(memberships.locator('[data-membership-id]')).toHaveCount(1);
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('a created person joins two groups with distinct roles and memberships move only within one group', async ({
  page,
  organizationApi,
}) => {
  await openOrganizationEditor(page, organizationApi);
  await page.getByRole('button', { name: '인물 관리' }).click();
  const peopleDirectory = getPeopleDirectory(page);
  await peopleDirectory.getByLabel('새 인물 이름').fill('새 연결 인물');
  await peopleDirectory.getByLabel('새 인물 소속').fill('새 기본 소속');
  await peopleDirectory.getByRole('button', { name: '인물 추가' }).click();
  const createdPerson = peopleDirectory.locator('[data-person-id]').filter({ hasText: '새 연결 인물' });
  const personId = await createdPerson.getAttribute('data-person-id');
  expect(personId).toMatch(UUID_V4_PATTERN);
  await page.getByRole('button', { name: '조직 편집으로 돌아가기' }).click();

  const tree = getGroupList(page);
  const rootMemberships = page.getByRole('region', { name: '운영위원회 구성원 편집' });
  await rootMemberships.getByLabel('기존 인물').selectOption(personId);
  await rootMemberships.getByRole('button', { name: '기존 인물 연결' }).click();
  const rootConnection = rootMemberships.locator(`[data-person-id="${personId}"]`);
  const rootMembershipId = await rootConnection.getAttribute('data-membership-id');
  expect(rootMembershipId).toMatch(UUID_V4_PATTERN);
  await rootConnection.getByLabel('직책').fill('운영 역할');
  await expect(rootMemberships.getByLabel('기존 인물').locator(`option[value="${personId}"]`)).toBeDisabled();
  await expect(rootConnection).toHaveAttribute('data-order', '20');

  await tree.getByRole('button', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다 선택' }).click();
  const childMemberships = page.getByRole('region', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다 구성원 편집' });
  await childMemberships.getByLabel('기존 인물').selectOption(personId);
  await childMemberships.getByRole('button', { name: '기존 인물 연결' }).click();
  const childConnection = childMemberships.locator(`[data-person-id="${personId}"]`);
  const childMembershipId = await childConnection.getAttribute('data-membership-id');
  expect(childMembershipId).toMatch(UUID_V4_PATTERN);
  expect(childMembershipId).not.toBe(rootMembershipId);
  await childConnection.getByLabel('직책').fill('교육 역할');
  await childConnection.getByRole('button', { name: '연결 위로' }).click();

  const childOrder = await childMemberships.locator('[data-membership-id]').evaluateAll((cards) => (
    cards.map((card) => [card.dataset.personId, card.dataset.order])
  ));
  expect(childOrder).toEqual([
    ['33333333-3333-4333-8333-333333333333', '10'],
    [personId, '20'],
    ['44444444-4444-4444-8444-444444444444', '30'],
  ]);

  await tree.getByRole('button', { name: '운영위원회 선택' }).click();
  await expect(rootConnection.getByLabel('직책')).toHaveValue('운영 역할');
  await expect(rootConnection).toHaveAttribute('data-order', '20');
  await rootMemberships.getByLabel('새 인물 이름').fill('다른 그룹에 남으면 안 되는 입력');
  await rootMemberships.getByLabel('새 인물 기본 소속').fill('임시 소속');
  await tree.getByRole('button', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다 선택' }).click();
  await expect(childConnection.getByLabel('직책')).toHaveValue('교육 역할');
  await expect(childMemberships.getByLabel('새 인물 이름')).toHaveValue('');
  await expect(childMemberships.getByLabel('새 인물 기본 소속')).toHaveValue('');
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('tri-state affiliation and disabled people use the shared unsaved public preview', async ({
  page,
  organizationApi,
}) => {
  await openOrganizationEditor(page, organizationApi);
  const previewTrigger = page.getByRole('button', { name: '저장 전 미리보기' });
  const memberships = page.getByRole('region', { name: '운영위원회 구성원 편집' });
  const connection = memberships.locator('[data-person-id="33333333-3333-4333-8333-333333333333"]');

  await expect(connection.getByRole('radio', { name: /김테스트.*기본 소속 사용/ })).toBeChecked();
  await expect(connection.getByRole('button', { name: /김테스트.*연결 제거/ })).toBeVisible();
  await previewTrigger.click();
  let dialog = page.getByRole('dialog', { name: '저장 전 조직도 미리보기' });
  await expect(dialog.getByText('기본 소속', { exact: true })).toBeVisible();
  const childGroupButton = dialog.getByRole('button', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다' });
  await childGroupButton.click();
  await expect(childGroupButton).toBeFocused();
  await dialog.getByRole('button', { name: '미리보기 닫기' }).click();

  await connection.getByRole('radio', { name: '소속 숨김' }).check();
  await previewTrigger.click();
  dialog = page.getByRole('dialog', { name: '저장 전 조직도 미리보기' });
  await expect(dialog.getByText('기본 소속', { exact: true })).toHaveCount(0);
  await dialog.getByRole('button', { name: '미리보기 닫기' }).click();

  await connection.getByRole('radio', { name: '다른 소속 입력' }).check();
  await connection.getByRole('textbox', { name: /김테스트.*다른 소속/ }).fill('미리보기 전용 소속');
  await previewTrigger.click();
  dialog = page.getByRole('dialog', { name: '저장 전 조직도 미리보기' });
  await expect(dialog.getByText('미리보기 전용 소속', { exact: true })).toBeVisible();
  const closePreview = dialog.getByRole('button', { name: '미리보기 닫기' });
  await expect(closePreview).toBeFocused();
  const closeFocusStyle = await closePreview.evaluate((node) => ({
    outlineStyle: getComputedStyle(node).outlineStyle,
    outlineWidth: Number.parseFloat(getComputedStyle(node).outlineWidth),
  }));
  expect(closeFocusStyle.outlineStyle).not.toBe('none');
  expect(closeFocusStyle.outlineWidth).toBeGreaterThanOrEqual(4);
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.locator(':focus')).toBeVisible();
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(previewTrigger).toBeFocused();

  await page.getByRole('button', { name: '인물 관리' }).click();
  const person = getPeopleDirectory(page).locator('[data-person-id="33333333-3333-4333-8333-333333333333"]');
  await person.getByRole('checkbox', { name: '공개' }).uncheck();
  await expect(person.getByText('비공개', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '조직 편집으로 돌아가기' }).click();
  await expect(connection).toContainText('인물 비공개');

  await previewTrigger.click();
  dialog = page.getByRole('dialog', { name: '저장 전 조직도 미리보기' });
  await expect(dialog.getByText('김테스트', { exact: true })).toHaveCount(0);
  await expect(dialog.getByText('등록된 공개 구성원이 없습니다', { exact: true })).toBeVisible();
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('custom affiliation toggles restore the last real value without persisting display copy', async ({
  page,
  organizationApi,
}) => {
  await openOrganizationEditor(page, organizationApi);
  const tree = getGroupList(page);
  await tree.getByRole('button', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다 선택' }).click();
  const memberships = page.getByRole('region', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다 구성원 편집' });
  const connection = memberships.locator('[data-person-id="44444444-4444-4444-8444-444444444444"]');
  const customInput = connection.getByRole('textbox', { name: /이테스트이름이길어도줄바꿈됩니다.*다른 소속/ });

  await expect(customInput).toHaveValue('별도 소속 문구');
  await connection.getByRole('radio', { name: /이테스트이름이길어도줄바꿈됩니다.*소속 숨김/ }).check();
  await connection.getByRole('radio', { name: /이테스트이름이길어도줄바꿈됩니다.*다른 소속 입력/ }).check();
  await expect(customInput).toHaveValue('별도 소속 문구');

  await memberships.getByLabel('새 인물 이름').fill('빈 소속 인물');
  await memberships.getByRole('button', { name: '새 인물 만들고 연결' }).click();
  const emptyAffiliationConnection = memberships.locator('[data-person-id]').filter({ hasText: '빈 소속 인물' });
  await emptyAffiliationConnection.getByRole('radio', { name: /빈 소속 인물.*다른 소속 입력/ }).check();
  await expect(emptyAffiliationConnection.getByRole('textbox', { name: /빈 소속 인물.*다른 소속/ })).toHaveValue('');
  await expect(emptyAffiliationConnection).toContainText('다른 소속을 입력해 주세요');

  await page.getByRole('button', { name: '저장 전 미리보기' }).click();
  const dialog = page.getByRole('dialog', { name: '저장 전 조직도 미리보기' });
  await dialog.getByRole('button', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다' }).click();
  await expect(dialog.getByText('별도 소속 문구', { exact: true })).toBeVisible();
  await expect(dialog.getByText('다른 소속', { exact: true })).toHaveCount(0);
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('an empty custom-affiliation choice remains a guarded unsaved change', async ({
  page,
  organizationApi,
}) => {
  organizationApi.setOrganization(copyOrganization({
    memberships: organizationFixture.memberships.map((membership) => (
      membership.id === '77777777-7777-4777-8777-777777777777'
        ? { ...membership, affiliationOverride: null }
        : { ...membership }
    )),
  }));
  await openOrganizationEditor(page, organizationApi);
  await getGroupList(page)
    .getByRole('button', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다 선택' })
    .click();

  const connection = page
    .getByRole('region', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다 구성원 편집' })
    .locator('[data-person-id="44444444-4444-4444-8444-444444444444"]');
  const customMode = connection.getByRole('radio', {
    name: /이테스트이름이길어도줄바꿈됩니다.*다른 소속 입력/,
  });
  await customMode.check();

  await expect(connection.getByRole('textbox', {
    name: /이테스트이름이길어도줄바꿈됩니다.*다른 소속/,
  })).toHaveValue('');
  await expect(connection).toContainText('다른 소속을 입력해 주세요');
  await expect(page.getByRole('status').filter({ hasText: '저장하지 않은 변경사항 있음' }))
    .toBeVisible();
  await expect(page.getByRole('button', { name: '변경사항 저장' })).toBeEnabled();

  const beforeUnloadWasPrevented = await page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(beforeUnloadWasPrevented).toBe(true);

  await Promise.all([
    page.waitForEvent('dialog').then((dialog) => dialog.dismiss()),
    page.getByRole('button', { name: '소개글 목록으로 돌아가기' }).click(),
  ]);
  await expect(page.getByRole('heading', { name: '함께하는이들 조직도 관리' })).toBeVisible();
  await expect(customMode).toBeChecked();
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('custom affiliation memory survives a people-panel round trip', async ({
  page,
  organizationApi,
}) => {
  await openOrganizationEditor(page, organizationApi);
  const tree = getGroupList(page);
  await tree.getByRole('button', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다 선택' }).click();
  let memberships = page.getByRole('region', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다 구성원 편집' });
  let connection = memberships.locator('[data-person-id="44444444-4444-4444-8444-444444444444"]');

  await expect(connection.getByRole('textbox', { name: /이테스트이름이길어도줄바꿈됩니다.*다른 소속/ })).toHaveValue('별도 소속 문구');
  await connection.getByRole('radio', { name: /이테스트이름이길어도줄바꿈됩니다.*소속 숨김/ }).check();
  await page.getByRole('button', { name: '인물 관리' }).click();
  await page.getByRole('button', { name: '조직 편집으로 돌아가기' }).click();

  memberships = page.getByRole('region', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다 구성원 편집' });
  connection = memberships.locator('[data-person-id="44444444-4444-4444-8444-444444444444"]');
  await connection.getByRole('radio', { name: /이테스트이름이길어도줄바꿈됩니다.*다른 소속 입력/ }).check();
  await expect(connection.getByRole('textbox', { name: /이테스트이름이길어도줄바꿈됩니다.*다른 소속/ })).toHaveValue('별도 소속 문구');
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('accepting a newer server snapshot clears discarded custom affiliation memory', async ({
  page,
  organizationApi,
}) => {
  await openOrganizationEditor(page, organizationApi);
  const membershipRegion = page.getByRole('region', { name: '운영위원회 구성원 편집' });
  const connection = membershipRegion.locator('[data-person-id="33333333-3333-4333-8333-333333333333"]');

  await connection.getByRole('radio', { name: /김테스트.*다른 소속 입력/ }).check();
  await connection.getByRole('textbox', { name: /김테스트.*다른 소속/ }).fill('폐기할 로컬 소속');
  await connection.getByRole('radio', { name: /김테스트.*소속 숨김/ }).check();

  organizationApi.setOrganization(copyOrganization({ revision: organizationFixture.revision + 1 }));
  await page.getByRole('button', { name: '서버 변경 확인' }).click();
  await expect(page.getByRole('alert')).toContainText('다른 관리자가 먼저 저장했습니다');
  await Promise.all([
    page.waitForEvent('dialog').then((dialog) => dialog.accept()),
    page.getByRole('button', { name: '최신 내용 불러오기' }).click(),
  ]);

  await expect(connection.getByRole('radio', { name: /김테스트.*기본 소속 사용/ })).toBeChecked();
  await connection.getByRole('radio', { name: /김테스트.*다른 소속 입력/ }).check();
  await expect(connection.getByRole('textbox', { name: /김테스트.*다른 소속/ })).toHaveValue('기본 소속');
  await expect(connection.getByRole('textbox', { name: /김테스트.*다른 소속/ })).not.toHaveValue('폐기할 로컬 소속');
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('drift-only background refetch preserves custom memory until the snapshot is accepted', async ({
  page,
  organizationApi,
}) => {
  await openOrganizationEditor(page, organizationApi);
  const membershipRegion = page.getByRole('region', { name: '운영위원회 구성원 편집' });
  const connection = membershipRegion.locator('[data-person-id="33333333-3333-4333-8333-333333333333"]');
  const customRadio = connection.getByRole('radio', { name: /김테스트.*다른 소속 입력/ });
  const hideRadio = connection.getByRole('radio', { name: /김테스트.*소속 숨김/ });

  await customRadio.check();
  await connection.getByRole('textbox', { name: /김테스트.*다른 소속/ }).fill('background에서 유지할 소속');
  await hideRadio.check();

  organizationApi.setOrganization(copyOrganization({ legacyContentDrift: true }));
  await page.getByRole('button', { name: '서버 변경 확인' }).click();
  await expect(page.getByRole('alert')).toContainText('전환 상태가 바뀌었습니다');

  await customRadio.check();
  await expect(connection.getByRole('textbox', { name: /김테스트.*다른 소속/ })).toHaveValue('background에서 유지할 소속');
  await hideRadio.check();

  await Promise.all([
    page.waitForEvent('dialog').then((dialog) => dialog.accept()),
    page.getByRole('button', { name: '최신 내용 불러오기' }).click(),
  ]);
  await expect(connection.getByRole('radio', { name: /김테스트.*기본 소속 사용/ })).toBeChecked();
  await customRadio.check();
  await expect(connection.getByRole('textbox', { name: /김테스트.*다른 소속/ })).toHaveValue('기본 소속');
  await expect(connection.getByRole('textbox', { name: /김테스트.*다른 소속/ })).not.toHaveValue('background에서 유지할 소속');
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('mobile intro and group editor actions stay single-column, touch-sized, and overflow-free', async ({
  page,
  organizationApi,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', '390px mobile regression only');
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  await page.goto('/admin?section=intro');

  const peopleRow = page.getByRole('row').filter({ hasText: '함께하는이들' });
  const peopleCells = peopleRow.getByRole('cell');
  await expect(peopleCells).toHaveCount(4);
  const cellBoxes = await peopleCells.evaluateAll((cells) => cells.map((cell) => {
    const { x, width } = cell.getBoundingClientRect();
    return { x, width };
  }));
  expect(Math.max(...cellBoxes.map(({ x }) => x)) - Math.min(...cellBoxes.map(({ x }) => x))).toBeLessThanOrEqual(1);
  expect(cellBoxes.every(({ width }) => width <= 358)).toBe(true);

  const manageButton = peopleRow.getByRole('button', { name: '조직도 관리' });
  expect((await manageButton.boundingBox()).height).toBeGreaterThanOrEqual(48);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await manageButton.click();

  const treeSection = page.getByRole('heading', { name: '그룹 구조' }).locator('xpath=ancestor::section[1]');
  const formSection = page.getByRole('heading', { name: '선택한 그룹 편집' }).locator('xpath=ancestor::section[1]');
  const treeBox = await treeSection.boundingBox();
  const formBox = await formSection.boundingBox();
  expect(Math.abs(treeBox.x - formBox.x)).toBeLessThanOrEqual(1);
  expect(formBox.y).toBeGreaterThanOrEqual(treeBox.y + treeBox.height);

  const tree = getGroupList(page);
  const actionButtons = [
    page.getByRole('button', { name: '최상위 조직 추가' }),
    tree.getByRole('button', { name: '운영위원회 하위 조직 추가' }),
    tree.getByRole('button', { name: '운영위원회 위로 이동' }),
    tree.getByRole('button', { name: '운영위원회 아래로 이동' }),
    tree.getByRole('button', { name: '운영위원회 비공개로 전환' }),
    tree.getByRole('button', { name: '운영위원회 삭제' }),
    page.getByRole('button', { name: '서버 변경 확인' }),
  ];
  const actionBoxes = [];
  for (const button of actionButtons) {
    const box = await button.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(48);
    actionBoxes.push(box);
  }
  const rowActionBoxes = actionBoxes.slice(1, 6);
  expect(Math.max(...rowActionBoxes.map(({ x }) => x)) - Math.min(...rowActionBoxes.map(({ x }) => x))).toBeLessThanOrEqual(1);
  expect(rowActionBoxes.every((box, index) => index === 0 || box.y >= rowActionBoxes[index - 1].y + rowActionBoxes[index - 1].height)).toBe(true);

  await page.getByLabel('그룹 이름').fill('모바일 로컬 초안');
  organizationApi.setOrganization(copyOrganization({ revision: organizationFixture.revision + 1 }));
  await page.getByRole('button', { name: '서버 변경 확인' }).click();
  expect((await page.getByRole('button', { name: '최신 내용 불러오기' }).boundingBox()).height).toBeGreaterThanOrEqual(48);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('mobile people, membership, and preview surfaces are stacked, touch-sized, and overflow-free', async ({
  page,
  organizationApi,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', '390px mobile regression only');
  await openOrganizationEditor(page, organizationApi);

  const formSection = page.getByRole('heading', { name: '선택한 그룹 편집' }).locator('xpath=ancestor::section[1]');
  const membershipSection = page.getByRole('region', { name: '운영위원회 구성원 편집' });
  const formBox = await formSection.boundingBox();
  const membershipBox = await membershipSection.boundingBox();
  expect(Math.abs(formBox.x - membershipBox.x)).toBeLessThanOrEqual(1);
  expect(membershipBox.y).toBeGreaterThanOrEqual(formBox.y + formBox.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const existingPersonBlock = membershipSection.getByLabel('기존 인물').locator('xpath=..');
  const createPersonBlock = membershipSection.getByLabel('새 인물 이름').locator('xpath=..');
  const existingPersonBox = await existingPersonBlock.boundingBox();
  const createPersonBox = await createPersonBlock.boundingBox();
  expect(Math.abs(existingPersonBox.x - createPersonBox.x)).toBeLessThanOrEqual(1);
  expect(createPersonBox.y).toBeGreaterThanOrEqual(existingPersonBox.y + existingPersonBox.height);

  const rootConnection = membershipSection.locator('[data-person-id="33333333-3333-4333-8333-333333333333"]');
  const affiliationLabels = rootConnection.locator('input[type="radio"]').locator('xpath=ancestor::label[1]');
  const affiliationBoxes = await affiliationLabels.evaluateAll((labels) => labels.map((label) => {
    const { x, y, height } = label.getBoundingClientRect();
    return { x, y, height };
  }));
  expect(affiliationBoxes.every(({ height }) => height >= 48)).toBe(true);
  expect(Math.max(...affiliationBoxes.map(({ x }) => x)) - Math.min(...affiliationBoxes.map(({ x }) => x))).toBeLessThanOrEqual(1);
  expect(affiliationBoxes.every((box, index) => index === 0 || box.y >= affiliationBoxes[index - 1].y + affiliationBoxes[index - 1].height)).toBe(true);

  const existingPersonSelect = membershipSection.getByLabel('기존 인물');
  await existingPersonSelect.selectOption('44444444-4444-4444-8444-444444444444');
  await existingPersonSelect.focus();
  await page.keyboard.press('Tab');
  await expect(membershipSection.getByRole('button', { name: '기존 인물 연결' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(membershipSection.getByLabel('새 인물 이름')).toBeFocused();

  for (const button of [
    page.getByRole('button', { name: '인물 관리' }),
    page.getByRole('button', { name: '저장 전 미리보기' }),
    membershipSection.getByRole('button', { name: '기존 인물 연결' }),
    membershipSection.getByRole('button', { name: '새 인물 만들고 연결' }),
  ]) {
    expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(48);
  }

  const tree = getGroupList(page);
  await tree.getByRole('button', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다 선택' }).click();
  const childMembershipSection = page.getByRole('region', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다 구성원 편집' });
  const membershipCardBoxes = await childMembershipSection.locator('[data-membership-id]').evaluateAll((cards) => cards.map((card) => {
    const { x, y, height } = card.getBoundingClientRect();
    return { x, y, height };
  }));
  expect(Math.max(...membershipCardBoxes.map(({ x }) => x)) - Math.min(...membershipCardBoxes.map(({ x }) => x))).toBeLessThanOrEqual(1);
  expect(membershipCardBoxes.every((box, index) => index === 0 || box.y >= membershipCardBoxes[index - 1].y + membershipCardBoxes[index - 1].height)).toBe(true);

  await page.getByRole('button', { name: '인물 관리' }).click();
  const peopleDirectory = getPeopleDirectory(page);
  const newPersonName = peopleDirectory.getByLabel('새 인물 이름');
  const newPersonAffiliation = peopleDirectory.getByLabel('새 인물 소속');
  const addPersonButton = peopleDirectory.getByRole('button', { name: '인물 추가' });
  const peopleFormBoxes = await Promise.all([
    newPersonName.locator('xpath=ancestor::label[1]').boundingBox(),
    newPersonAffiliation.locator('xpath=ancestor::label[1]').boundingBox(),
    addPersonButton.boundingBox(),
  ]);
  expect(Math.max(...peopleFormBoxes.map(({ x }) => x)) - Math.min(...peopleFormBoxes.map(({ x }) => x))).toBeLessThanOrEqual(1);
  expect(peopleFormBoxes.every((box, index) => index === 0 || box.y >= peopleFormBoxes[index - 1].y + peopleFormBoxes[index - 1].height)).toBe(true);
  const peopleCards = peopleDirectory.locator('[data-person-id]');
  const peopleBoxes = await peopleCards.evaluateAll((cards) => cards.map((card) => {
    const { x, y, width, height } = card.getBoundingClientRect();
    return { x, y, width, height };
  }));
  expect(Math.max(...peopleBoxes.map(({ x }) => x)) - Math.min(...peopleBoxes.map(({ x }) => x))).toBeLessThanOrEqual(1);
  expect(peopleBoxes.every((box, index) => index === 0 || box.y >= peopleBoxes[index - 1].y + peopleBoxes[index - 1].height)).toBe(true);
  expect((await addPersonButton.boundingBox()).height).toBeGreaterThanOrEqual(48);
  await newPersonName.fill('포커스 순서 확인');
  await newPersonName.focus();
  await page.keyboard.press('Tab');
  await expect(newPersonAffiliation).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(addPersonButton).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: '조직 편집으로 돌아가기' }).click();

  await page.getByRole('button', { name: '저장 전 미리보기' }).click();
  const dialog = page.getByRole('dialog', { name: '저장 전 조직도 미리보기' });
  const closePreview = dialog.getByRole('button', { name: '미리보기 닫기' });
  expect((await closePreview.boundingBox()).height).toBeGreaterThanOrEqual(48);
  await expect(closePreview).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  const previewGroupButtons = dialog.getByRole('navigation', { name: '저장 전 미리보기 그룹' }).getByRole('button');
  const previewGroupBoxes = await previewGroupButtons.evaluateAll((buttons) => buttons.map((button) => {
    const { y, height } = button.getBoundingClientRect();
    return { y, height };
  }));
  expect(previewGroupBoxes).toHaveLength(2);
  expect(previewGroupBoxes.every((box, index) => index === 0 || box.y >= previewGroupBoxes[index - 1].y + previewGroupBoxes[index - 1].height)).toBe(true);
  await expect(previewGroupButtons.last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(closePreview).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(organizationApi.getPutRequests()).toEqual([]);
});
