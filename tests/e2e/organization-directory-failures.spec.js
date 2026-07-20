import { test, expect } from './fixtures/organizationTest.js';
import {
  copyOrganization,
  legacyPeopleHtml,
  organizationFixture,
  organizationGroupIds,
} from './fixtures/organizationDirectoryData.js';

const MANAGE_API_URL = /\/api\/v1\/organization\/manage(?:[?#].*)?$/;
const LEGACY_API_URL = /\/api\/v1\/static-content\/intro-people(?:[?#].*)?$/;
const STATIC_CONTENT_SERVICE_URL = /\/src\/services\/staticContentService\.js$/;
const fingerprintA = `sha256:${'a'.repeat(64)}`;
const fingerprintB = `sha256:${'b'.repeat(64)}`;

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

const failedResource = (status, label) => new RegExp(
  `^Failed to load resource: the server responded with a status of ${status} \\(${label}\\)$`,
);

async function openOrganizationEditor(page, organizationApi) {
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  await page.goto('/admin?section=intro');
  const peopleRow = page.getByRole('row').filter({ hasText: '함께하는이들' });
  await peopleRow.getByRole('button', { name: '조직도 관리' }).click();
  await expect(page.getByRole('heading', { name: '함께하는이들 조직도 관리' })).toBeVisible();
}

async function openOrganizationEditorFromPublicSpa(page) {
  await page.evaluate(() => {
    window.history.pushState({}, '', '/admin?section=intro');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page).toHaveURL(/\/admin\?section=intro$/);
  const peopleRow = page.getByRole('row').filter({ hasText: '함께하는이들' });
  await expect(peopleRow.getByRole('button', { name: '조직도 관리' })).toBeVisible();
  return peopleRow;
}

const saveButton = (page) => page.getByRole('button', { name: '변경사항 저장' });

async function changeRootName(page, name) {
  await page.getByLabel('그룹 이름').fill(name);
}

async function confirmLegacySave(page) {
  const dialog = page.getByRole('dialog', { name: '기존 함께하는이들 내용 전환 확인' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '확인하고 저장' }).click();
}

async function refetchManageOnVisibilityChange(page) {
  const completedResponse = page.waitForResponse((response) => (
    response.request().method() === 'GET' && MANAGE_API_URL.test(response.url())
  ));
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')));
  expect((await completedResponse).status()).toBe(200);
}

test('client validation focuses the first field-path error and sends no PUT', async ({
  page,
  organizationApi,
}) => {
  await openOrganizationEditor(page, organizationApi);
  await page.getByLabel('그룹 이름').fill('');

  await saveButton(page).click();

  await expect(page.getByRole('alert').filter({ hasText: '저장할 수 없는 항목이 있습니다.' })).toBeVisible();
  await expect(page.locator('[data-field-path="groups.0.name"]')).toBeFocused();
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('pending save deduplicates clicks and success replaces metadata and invalidates caches', async ({
  page,
  organizationApi,
}) => {
  organizationApi.setNextSavedFingerprint(fingerprintB);
  organizationApi.deferNextPut();
  await openOrganizationEditor(page, organizationApi);
  await changeRootName(page, '한 번만 저장할 이름');

  await saveButton(page).evaluate((button) => {
    button.click();
    button.click();
  });
  await expect.poll(() => organizationApi.getPutRequests().length).toBe(1);
  await expect(page.getByRole('button', { name: '저장 중…' })).toBeDisabled();
  organizationApi.releaseDeferredPut();

  await expect(page.getByRole('status').filter({ hasText: '조직도를 저장했습니다. revision 3' })).toBeVisible();
  await expect(page.getByText('서버 내용과 동일')).toBeVisible();
  expect(organizationApi.getPutRequests()[0]).toEqual({
    schemaVersion: 1,
    revision: 2,
    legacyContentFingerprint: fingerprintA,
    groups: organizationFixture.groups.map((group) => (
      group.id === organizationGroupIds.root ? { ...group, name: '한 번만 저장할 이름' } : { ...group }
    )),
    people: organizationFixture.people,
    memberships: organizationFixture.memberships,
  });

  await changeRootName(page, '새 메타데이터로 다시 저장');
  organizationApi.expectPutCount(2);
  await saveButton(page).click();
  await expect(page.getByText('서버 내용과 동일')).toBeVisible();
  expect(organizationApi.getPutRequests()[1]).toMatchObject({
    revision: 3,
    legacyContentFingerprint: fingerprintB,
  });

  await page.goto('/intro/people');
  await expect(page.getByRole('navigation', { name: '조직 선택' })).toBeVisible();
  await expect(page.getByRole('button', { name: '새 메타데이터로 다시 저장' })).toBeVisible();
});

test('edits made while a PUT is pending remain dirty and use the saved revision next', async ({
  page,
  organizationApi,
}) => {
  organizationApi.deferNextPut();
  organizationApi.expectPutCount(2);
  await openOrganizationEditor(page, organizationApi);
  await changeRootName(page, '서버로 전송한 이름');

  await saveButton(page).click();
  await expect.poll(() => organizationApi.getPutRequests().length).toBe(1);
  await page.getByLabel('그룹 이름').fill('응답 전에 계속 편집한 이름');
  organizationApi.releaseDeferredPut();

  await expect(page.getByRole('status').filter({ hasText: '조직도를 저장했습니다. revision 3' })).toBeVisible();
  await expect(page.getByLabel('그룹 이름')).toHaveValue('응답 전에 계속 편집한 이름');
  await expect(page.getByText('저장하지 않은 변경사항 있음')).toBeVisible();
  await saveButton(page).click();
  await expect(page.getByText('서버 내용과 동일')).toBeVisible();
  expect(organizationApi.getPutRequests()[1]).toMatchObject({
    revision: 3,
    groups: expect.arrayContaining([
      expect.objectContaining({ id: organizationGroupIds.root, name: '응답 전에 계속 편집한 이름' }),
    ]),
  });
});

test('meaningful legacy cutover requires a focus-trapped confirmation and preserves legacy content', async ({
  page,
  organizationApi,
}) => {
  organizationApi.setOrganization(copyOrganization({ configured: false }));
  organizationApi.setLegacyHtml(legacyPeopleHtml);
  await openOrganizationEditor(page, organizationApi);
  await changeRootName(page, '레거시 전환 이름');
  const trigger = saveButton(page);

  await expect(page.getByRole('alert').filter({ hasText: '현재 공개 화면은 기존 소개글을 사용 중입니다.' })).toBeVisible();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: '기존 함께하는이들 내용 전환 확인' });
  await expect(dialog).toContainText('기존 정적 콘텐츠는 삭제하지 않습니다.');
  await expect(dialog.getByRole('button', { name: '취소' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: '확인하고 저장' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(organizationApi.getPutRequests()).toEqual([]);

  await trigger.click();
  organizationApi.expectPutCount(1);
  await confirmLegacySave(page);
  await expect(page.getByText('서버 내용과 동일')).toBeVisible();
  expect(organizationApi.getLegacyHtml()).toBe(legacyPeopleHtml);
});

test('configured directory with legacy drift requires acknowledgement before save', async ({
  page,
  organizationApi,
}) => {
  organizationApi.setOrganization(copyOrganization({ legacyContentDrift: true }));
  await openOrganizationEditor(page, organizationApi);
  await changeRootName(page, '드리프트 승인 이름');

  await expect(page.getByRole('alert').filter({ hasText: '저장된 조직도와 기존 내용이 달라졌습니다.' })).toBeVisible();
  await saveButton(page).click();
  const dialog = page.getByRole('dialog', { name: '기존 함께하는이들 내용 전환 확인' });
  await expect(dialog).toContainText('기존 내용 변경을 확인했습니다.');
  organizationApi.expectPutCount(1);
  await dialog.getByRole('button', { name: '확인하고 저장' }).click();
  await expect(page.getByText('서버 내용과 동일')).toBeVisible();
});

test('legacy loading and failure fail closed, and retry never sends a PUT', async ({
  page,
  organizationApi,
  pageQuality,
}) => {
  organizationApi.setOrganization(copyOrganization({ configured: false }));
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  await page.goto('/admin?section=intro');
  const peopleRow = page.getByRole('row').filter({ hasText: '함께하는이들' });
  await expect(peopleRow.getByRole('button', { name: '조직도 관리' })).toBeVisible();
  organizationApi.deferNextLegacyGet();
  await peopleRow.getByRole('button', { name: '조직도 관리' }).click();
  await expect(page.getByRole('heading', { name: '함께하는이들 조직도 관리' })).toBeVisible();
  await changeRootName(page, '조회 실패에도 남는 이름');
  await expect(saveButton(page)).toBeDisabled();

  organizationApi.fail('/static-content/intro-people', 500);
  pageQuality.allowConsoleError(failedResource(500, 'Internal Server Error'), LEGACY_API_URL);
  pageQuality.allowConsoleError(/^Error fetching static content: AxiosError$/, STATIC_CONTENT_SERVICE_URL);
  organizationApi.releaseDeferredLegacyGet();
  await expect(page.getByRole('alert').filter({ hasText: '기존 함께하는이들 내용을 확인하지 못했습니다.' })).toBeVisible();
  await expect(saveButton(page)).toBeDisabled();
  expect(organizationApi.getPutRequests()).toEqual([]);

  organizationApi.recover('/static-content/intro-people');
  await page.getByRole('button', { name: '기존 내용 다시 확인' }).click();
  await expect(saveButton(page)).toBeEnabled();
  await expect(page.getByLabel('그룹 이름')).toHaveValue('조회 실패에도 남는 이름');
  expect(organizationApi.getPutRequests()).toEqual([]);
});

for (const scenario of [
  {
    status: 400,
    label: 'Bad Request',
    message: '입력 내용을 저장할 수 없습니다.',
  },
  {
    status: 403,
    label: 'Forbidden',
    message: '로그인 상태와 조직도 관리 권한을 확인해 주세요.',
  },
]) {
  test(`${scenario.status} save failure focuses a top alert and retains the draft`, async ({
    page,
    organizationApi,
    pageQuality,
  }) => {
    await openOrganizationEditor(page, organizationApi);
    await changeRootName(page, `${scenario.status}에도 남는 이름`);
    organizationApi.failNextPut(scenario.status);
    organizationApi.expectPutCount(1);
    pageQuality.allowConsoleError(failedResource(scenario.status, scenario.label), MANAGE_API_URL);

    await saveButton(page).click();

    const alert = page.getByRole('alert').filter({ hasText: scenario.message });
    await expect(alert).toBeFocused();
    await expect(page.getByLabel('그룹 이름')).toHaveValue(`${scenario.status}에도 남는 이름`);
    await expect(saveButton(page)).toBeEnabled();
  });
}

test('revision conflict retains the draft and only explicit confirmed discard loads latest', async ({
  page,
  organizationApi,
  pageQuality,
}) => {
  await openOrganizationEditor(page, organizationApi);
  await changeRootName(page, '충돌한 로컬 이름');
  organizationApi.setOrganization(copyOrganization({
    revision: 3,
    groups: organizationFixture.groups.map((group) => (
      group.id === organizationGroupIds.root ? { ...group, name: '서버 최신 이름' } : { ...group }
    )),
  }));
  organizationApi.failNextPut(409, 'ORGANIZATION_REVISION_CONFLICT');
  organizationApi.expectPutCount(1);
  pageQuality.allowConsoleError(failedResource(409, 'Conflict'), MANAGE_API_URL);

  await saveButton(page).click();

  await expect(page.getByRole('alert').filter({ hasText: '다른 관리자가 먼저 저장했습니다.' })).toBeVisible();
  await expect(page.getByLabel('그룹 이름')).toHaveValue('충돌한 로컬 이름');
  await expect(saveButton(page)).toBeDisabled();
  const loadLatest = page.getByRole('button', { name: '최신 내용 불러오기' });
  await Promise.all([
    page.waitForEvent('dialog').then((dialog) => dialog.dismiss()),
    loadLatest.click(),
  ]);
  await expect(page.getByLabel('그룹 이름')).toHaveValue('충돌한 로컬 이름');
  await Promise.all([
    page.waitForEvent('dialog').then((dialog) => dialog.accept()),
    loadLatest.click(),
  ]);
  await expect(page.getByLabel('그룹 이름')).toHaveValue('서버 최신 이름');
  await expect(page.getByText('서버 내용과 동일')).toBeVisible();
});

test('legacy conflict refreshes only legacy state and requires renewed confirmation', async ({
  page,
  organizationApi,
  pageQuality,
}) => {
  organizationApi.setOrganization(copyOrganization({ configured: false }));
  organizationApi.setLegacyHtml(legacyPeopleHtml);
  await openOrganizationEditor(page, organizationApi);
  await changeRootName(page, '레거시 충돌에도 남는 이름');
  organizationApi.setManagedFingerprint(fingerprintB);
  organizationApi.setLegacyHtml('<p>서버에서 바뀐 기존 내용</p>');
  organizationApi.failNextPut(409, 'ORGANIZATION_LEGACY_CONTENT_CONFLICT');
  organizationApi.expectPutCount(2);
  pageQuality.allowConsoleError(failedResource(409, 'Conflict'), MANAGE_API_URL);

  await saveButton(page).click();
  await confirmLegacySave(page);
  await expect(page.getByRole('alert').filter({ hasText: '기존 함께하는이들 내용이 변경되었습니다. 다시 확인해 주세요.' })).toBeVisible();
  await expect(page.getByLabel('그룹 이름')).toHaveValue('레거시 충돌에도 남는 이름');
  expect(organizationApi.getPutRequests()[0]).toMatchObject({ revision: 2, legacyContentFingerprint: fingerprintA });

  await saveButton(page).click();
  const renewedDialog = page.getByRole('dialog', { name: '기존 함께하는이들 내용 전환 확인' });
  await expect(renewedDialog).toContainText('서버에서 바뀐 기존 내용');
  await renewedDialog.getByRole('button', { name: '확인하고 저장' }).click();
  await expect(page.getByText('서버 내용과 동일')).toBeVisible();
  expect(organizationApi.getPutRequests()[1]).toMatchObject({ revision: 2, legacyContentFingerprint: fingerprintB });
});

test('legacy conflict requires renewed confirmation even when refreshed legacy is empty', async ({
  page,
  organizationApi,
  pageQuality,
}) => {
  organizationApi.setOrganization(copyOrganization({ configured: false }));
  organizationApi.setLegacyHtml(legacyPeopleHtml);
  await openOrganizationEditor(page, organizationApi);
  await changeRootName(page, '빈 레거시 충돌 초안');
  organizationApi.setManagedFingerprint(fingerprintB);
  organizationApi.setLegacyHtml('<p><br></p>');
  organizationApi.failNextPut(409, 'ORGANIZATION_LEGACY_CONTENT_CONFLICT');
  organizationApi.expectPutCount(2);
  pageQuality.allowConsoleError(failedResource(409, 'Conflict'), MANAGE_API_URL);

  await saveButton(page).click();
  await confirmLegacySave(page);
  await expect(page.getByRole('alert').filter({ hasText: '기존 함께하는이들 내용이 변경되었습니다.' })).toBeVisible();
  await saveButton(page).click();

  const renewedDialog = page.getByRole('dialog', { name: '기존 함께하는이들 내용 전환 확인' });
  await expect(renewedDialog).toBeVisible();
  expect(organizationApi.getPutRequests()).toHaveLength(1);
  await renewedDialog.getByRole('button', { name: '확인하고 저장' }).click();
  await expect(page.getByText('서버 내용과 동일')).toBeVisible();
  expect(organizationApi.getPutRequests()[1]).toMatchObject({ legacyContentFingerprint: fingerprintB });
});

test('failed legacy conflict refresh stays fail-closed and retries GETs without a PUT', async ({
  page,
  organizationApi,
  pageQuality,
}) => {
  organizationApi.setOrganization(copyOrganization({ configured: false }));
  organizationApi.setLegacyHtml(legacyPeopleHtml);
  await openOrganizationEditor(page, organizationApi);
  await changeRootName(page, '레거시 재조회 실패 초안');
  organizationApi.setManagedFingerprint(fingerprintB);
  organizationApi.failNextPut(409, 'ORGANIZATION_LEGACY_CONTENT_CONFLICT');
  organizationApi.fail('/static-content/intro-people', 500);
  organizationApi.expectPutCount(2);
  pageQuality.allowConsoleError(failedResource(409, 'Conflict'), MANAGE_API_URL);
  pageQuality.allowConsoleError(failedResource(500, 'Internal Server Error'), LEGACY_API_URL);
  pageQuality.allowConsoleError(/^Error fetching static content: AxiosError$/, STATIC_CONTENT_SERVICE_URL);

  await saveButton(page).click();
  await confirmLegacySave(page);
  await expect(page.getByRole('alert').filter({ hasText: '최신 기존 내용을 확인하지 못했습니다.' })).toBeVisible();
  await expect(saveButton(page)).toBeDisabled();
  expect(organizationApi.getPutRequests()).toHaveLength(1);

  organizationApi.recover('/static-content/intro-people');
  await page.getByRole('button', { name: '최신 기존 내용 다시 확인' }).click();
  await expect(saveButton(page)).toBeEnabled();
  expect(organizationApi.getPutRequests()).toHaveLength(1);
  await saveButton(page).click();
  await confirmLegacySave(page);
  await expect(page.getByText('서버 내용과 동일')).toBeVisible();
});

test('legacy conflict with a newer revision never combines the revision with an old draft', async ({
  page,
  organizationApi,
  pageQuality,
}) => {
  organizationApi.setOrganization(copyOrganization({ configured: false }));
  organizationApi.setLegacyHtml(legacyPeopleHtml);
  await openOrganizationEditor(page, organizationApi);
  await changeRootName(page, '구버전 로컬 초안');
  organizationApi.setOrganization(copyOrganization({
    configured: false,
    revision: 3,
    groups: organizationFixture.groups.map((group) => (
      group.id === organizationGroupIds.root ? { ...group, name: '서버 revision 3 이름' } : { ...group }
    )),
  }));
  organizationApi.setManagedFingerprint(fingerprintB);
  organizationApi.failNextPut(409, 'ORGANIZATION_LEGACY_CONTENT_CONFLICT');
  organizationApi.fail('/static-content/intro-people', 500);
  organizationApi.expectPutCount(1);
  pageQuality.allowConsoleError(failedResource(409, 'Conflict'), MANAGE_API_URL);
  pageQuality.allowConsoleError(failedResource(500, 'Internal Server Error'), LEGACY_API_URL);
  pageQuality.allowConsoleError(/^Error fetching static content: AxiosError$/, STATIC_CONTENT_SERVICE_URL);

  await saveButton(page).click();
  await confirmLegacySave(page);

  await expect(page.getByRole('alert').filter({ hasText: '다른 관리자가 먼저 저장했습니다.' })).toBeVisible();
  await expect(page.getByLabel('그룹 이름')).toHaveValue('구버전 로컬 초안');
  await expect(saveButton(page)).toBeDisabled();
  expect(organizationApi.getPutRequests()[0]).toMatchObject({ revision: 2, legacyContentFingerprint: fingerprintA });
  pageQuality.allowConsoleError(failedResource(500, 'Internal Server Error'), LEGACY_API_URL);
  pageQuality.allowConsoleError(/^Error fetching static content: AxiosError$/, STATIC_CONTENT_SERVICE_URL);
  await Promise.all([
    page.waitForEvent('dialog').then((dialog) => dialog.accept()),
    page.getByRole('button', { name: '최신 내용 불러오기' }).click(),
  ]);
  await expect(page.getByLabel('그룹 이름')).toHaveValue('서버 revision 3 이름');
  await changeRootName(page, 'revision 3에서 이어서 편집');
  await expect(saveButton(page)).toBeDisabled();
  await expect(page.getByRole('button', { name: '최신 기존 내용 다시 확인' })).toBeVisible();
});

test('revision conflict latest-GET failure stays blocked and offers a query-only retry', async ({
  page,
  organizationApi,
  pageQuality,
}) => {
  await openOrganizationEditor(page, organizationApi);
  await changeRootName(page, 'revision 조회 실패 초안');
  organizationApi.setOrganization(copyOrganization({
    revision: 3,
    groups: organizationFixture.groups.map((group) => (
      group.id === organizationGroupIds.root ? { ...group, name: '재조회한 revision 3 이름' } : { ...group }
    )),
  }));
  organizationApi.failNextPut(409, 'ORGANIZATION_REVISION_CONFLICT');
  organizationApi.failNextManageGet(500);
  organizationApi.expectPutCount(1);
  pageQuality.allowConsoleError(failedResource(409, 'Conflict'), MANAGE_API_URL);
  pageQuality.allowConsoleError(failedResource(500, 'Internal Server Error'), MANAGE_API_URL);

  await saveButton(page).click();
  await expect(saveButton(page)).toBeDisabled();
  await page.getByRole('button', { name: '최신 내용 다시 확인' }).click();
  expect(organizationApi.getPutRequests()).toHaveLength(1);
  const loadLatest = page.getByRole('button', { name: '최신 내용 불러오기' });
  await expect(loadLatest).toBeEnabled();
  await Promise.all([
    page.waitForEvent('dialog').then((dialog) => dialog.accept()),
    loadLatest.click(),
  ]);
  await expect(page.getByLabel('그룹 이름')).toHaveValue('재조회한 revision 3 이름');
});

test('background revision and fingerprint refetch never overwrites a dirty draft', async ({
  page,
  organizationApi,
}) => {
  await openOrganizationEditor(page, organizationApi);
  await changeRootName(page, '백그라운드 갱신에도 남는 이름');
  organizationApi.setOrganization(copyOrganization({
    revision: 3,
    groups: organizationFixture.groups.map((group) => (
      group.id === organizationGroupIds.root ? { ...group, name: '백그라운드 서버 이름' } : { ...group }
    )),
  }));
  organizationApi.setManagedFingerprint(fingerprintB);

  await page.getByRole('button', { name: '서버 변경 확인' }).click();

  await expect(page.getByLabel('그룹 이름')).toHaveValue('백그라운드 갱신에도 남는 이름');
  await expect(saveButton(page)).toBeDisabled();
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('500 retains the draft and an explicit retry succeeds', async ({
  page,
  organizationApi,
  pageQuality,
}) => {
  await openOrganizationEditor(page, organizationApi);
  await changeRootName(page, '재시도할 로컬 이름');
  organizationApi.failNextPut(500);
  organizationApi.expectPutCount(2);
  pageQuality.allowConsoleError(failedResource(500, 'Internal Server Error'), MANAGE_API_URL);

  await saveButton(page).click();
  await expect(page.getByRole('alert').filter({ hasText: '조직도를 저장하지 못했습니다. 초안은 유지됩니다.' })).toBeVisible();
  await expect(page.getByLabel('그룹 이름')).toHaveValue('재시도할 로컬 이름');
  await expect(saveButton(page)).toBeEnabled();

  await saveButton(page).click();
  await expect(page.getByText('서버 내용과 동일')).toBeVisible();
});

test('cached public legacy content never satisfies a fresh accepted-snapshot decision', async ({
  page,
  organizationApi,
}) => {
  organizationApi.setOrganization(copyOrganization({ configured: false }));
  organizationApi.setLegacyHtml('<p><br></p>');
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  await page.goto('/intro/people');
  await expect(page.getByRole('navigation', { name: '조직 선택' })).toBeVisible();
  const primedLegacyGets = organizationApi.getRequests()
    .filter((request) => request === 'GET /static-content/intro-people').length;

  organizationApi.setManagedFingerprint(fingerprintB);
  organizationApi.setLegacyHtml('<p>fresh accepted-snapshot legacy</p>');
  const peopleRow = await openOrganizationEditorFromPublicSpa(page);
  organizationApi.deferNextLegacyGet();
  await peopleRow.getByRole('button', { name: '조직도 관리' }).click();
  await expect(page.getByRole('heading', { name: '함께하는이들 조직도 관리' })).toBeVisible();
  await expect.poll(() => organizationApi.getRequests()
    .filter((request) => request === 'GET /static-content/intro-people').length).toBeGreaterThan(primedLegacyGets);
  await changeRootName(page, 'fresh legacy를 기다리는 이름');

  let legacyReleased = false;
  try {
    await expect(saveButton(page)).toBeDisabled();
    expect(organizationApi.getPutRequests()).toEqual([]);
    organizationApi.releaseDeferredLegacyGet();
    legacyReleased = true;
    await expect(saveButton(page)).toBeEnabled();
    await saveButton(page).click();
    await expect(page.getByRole('dialog', { name: '기존 함께하는이들 내용 전환 확인' }))
      .toContainText('fresh accepted-snapshot legacy');
  } finally {
    if (!legacyReleased) organizationApi.releaseDeferredLegacyGet();
  }
});

test('accepting a new fingerprint resets legacy readiness until that generation finishes', async ({
  page,
  organizationApi,
}) => {
  organizationApi.setOrganization(copyOrganization({ configured: false }));
  organizationApi.setLegacyHtml('<p>initial legacy generation</p>');
  await openOrganizationEditor(page, organizationApi);
  await expect(saveButton(page)).toBeDisabled();

  organizationApi.setOrganization(copyOrganization({ configured: false, revision: 3 }));
  organizationApi.setManagedFingerprint(fingerprintB);
  organizationApi.setLegacyHtml('<p>new fingerprint generation</p>');
  await page.getByRole('button', { name: '서버 변경 확인' }).click();
  organizationApi.deferNextLegacyGet();
  await page.getByRole('button', { name: '최신 내용 불러오기' }).click();
  await changeRootName(page, '새 fingerprint 이후의 이름');

  let legacyReleased = false;
  try {
    await expect(saveButton(page)).toBeDisabled();
    expect(organizationApi.getPutRequests()).toEqual([]);
    organizationApi.releaseDeferredLegacyGet();
    legacyReleased = true;
    await expect(saveButton(page)).toBeEnabled();
    await saveButton(page).click();
    await expect(page.getByRole('dialog', { name: '기존 함께하는이들 내용 전환 확인' }))
      .toContainText('new fingerprint generation');
  } finally {
    if (!legacyReleased) organizationApi.releaseDeferredLegacyGet();
  }
});

test('a captured stale manage GET cannot overwrite an authoritative save', async ({
  page,
  organizationApi,
  pageQuality,
}) => {
  await openOrganizationEditor(page, organizationApi);
  const initialManageGets = organizationApi.getRequests()
    .filter((request) => request === 'GET /organization/manage').length;
  organizationApi.deferNextManageGet();
  await page.getByRole('button', { name: '서버 변경 확인' }).click();
  await expect.poll(() => organizationApi.getRequests()
    .filter((request) => request === 'GET /organization/manage').length).toBeGreaterThan(initialManageGets);

  await changeRootName(page, 'revision 3 저장 이름');
  pageQuality.allowRequestFailure(MANAGE_API_URL);
  const canceledManageGet = page.waitForEvent('requestfailed', (request) => MANAGE_API_URL.test(request.url()));
  await saveButton(page).click();
  await expect(page.getByRole('status').filter({ hasText: '조직도를 저장했습니다. revision 3' })).toBeVisible();
  await canceledManageGet;
  await changeRootName(page, 'revision 3 기반 후속 편집');
  organizationApi.releaseDeferredManageGet();

  await expect(page.getByLabel('그룹 이름')).toHaveValue('revision 3 기반 후속 편집');
  await expect(page.getByText('서버에 더 최신 내용이 있습니다.')).toHaveCount(0);
  await expect(page.getByRole('alert').filter({ hasText: '다른 관리자가 먼저 저장했습니다.' })).toHaveCount(0);
  await expect(saveButton(page)).toBeEnabled();
  organizationApi.expectPutCount(2);
  await saveButton(page).click();
  await expect(page.getByRole('status').filter({ hasText: '조직도를 저장했습니다. revision 4' })).toBeVisible();
  expect(organizationApi.getPutRequests()[1]).toMatchObject({ revision: 3 });
});

test('a clean draft still renders revision-conflict latest-load controls', async ({
  page,
  organizationApi,
  pageQuality,
}) => {
  await openOrganizationEditor(page, organizationApi);
  organizationApi.setOrganization(copyOrganization({
    revision: 3,
    groups: organizationFixture.groups.map((group) => (
      group.id === organizationGroupIds.root ? { ...group, name: 'clean conflict latest name' } : { ...group }
    )),
  }));
  organizationApi.deferNextPut();
  organizationApi.failNextPut(409, 'ORGANIZATION_REVISION_CONFLICT');
  organizationApi.expectPutCount(1);
  pageQuality.allowConsoleError(failedResource(409, 'Conflict'), MANAGE_API_URL);

  await changeRootName(page, 'temporary pending name');
  await saveButton(page).click();
  await expect.poll(() => organizationApi.getPutRequests().length).toBe(1);
  await changeRootName(page, organizationFixture.groups[0].name);
  organizationApi.releaseDeferredPut();

  const loadLatest = page.getByRole('button', { name: '최신 내용 불러오기' });
  await expect(loadLatest).toBeVisible();
  await loadLatest.click();
  await expect(page.getByLabel('그룹 이름')).toHaveValue('clean conflict latest name');
});

test('a clean draft still renders revision-conflict retry controls after latest GET fails', async ({
  page,
  organizationApi,
  pageQuality,
}) => {
  await openOrganizationEditor(page, organizationApi);
  organizationApi.setOrganization(copyOrganization({ revision: 3 }));
  organizationApi.deferNextPut();
  organizationApi.failNextPut(409, 'ORGANIZATION_REVISION_CONFLICT');
  organizationApi.failNextManageGet(500);
  organizationApi.expectPutCount(1);
  pageQuality.allowConsoleError(failedResource(409, 'Conflict'), MANAGE_API_URL);
  pageQuality.allowConsoleError(failedResource(500, 'Internal Server Error'), MANAGE_API_URL);

  await changeRootName(page, 'temporary retry name');
  await saveButton(page).click();
  await expect.poll(() => organizationApi.getPutRequests().length).toBe(1);
  await changeRootName(page, organizationFixture.groups[0].name);
  organizationApi.releaseDeferredPut();

  const retryLatest = page.getByRole('button', { name: '최신 내용 다시 확인' });
  await expect(retryLatest).toBeVisible();
  await retryLatest.click();
  expect(organizationApi.getPutRequests()).toHaveLength(1);
  await expect(page.getByRole('button', { name: '최신 내용 불러오기' })).toBeVisible();
});

test('blank transient custom affiliation focuses its canonical path and sends no PUT', async ({
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
  const tree = page.getByRole('list', { name: '조직 그룹 편집' });
  await tree.getByRole('button', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다 선택' }).click();
  const membership = page.locator('[data-membership-id="77777777-7777-4777-8777-777777777777"]');
  await membership.getByRole('radio', { name: /이테스트이름이길어도줄바꿈됩니다.*다른 소속 입력/ }).check();
  const customInput = membership.getByRole('textbox', { name: /이테스트이름이길어도줄바꿈됩니다.*다른 소속/ });
  await expect(customInput).toHaveValue('');
  await page.getByLabel('그룹 이름').fill('정상적인 다른 변경');

  await saveButton(page).click();

  await expect(customInput).toBeFocused();
  await expect(customInput).toHaveAttribute('data-field-path', 'memberships.2.affiliationOverride');
  expect(organizationApi.getPutRequests()).toEqual([]);
});

test('configured-false warning waits for fresh meaningful legacy evidence', async ({
  page,
  organizationApi,
}) => {
  organizationApi.setOrganization(copyOrganization({ configured: false }));
  organizationApi.setLegacyHtml('<p>fresh public legacy evidence</p>');
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  await page.goto('/admin?section=intro');
  const peopleRow = page.getByRole('row').filter({ hasText: '함께하는이들' });
  await expect(peopleRow.getByRole('button', { name: '조직도 관리' })).toBeVisible();
  organizationApi.deferNextLegacyGet();
  await peopleRow.getByRole('button', { name: '조직도 관리' }).click();
  await expect(page.getByRole('heading', { name: '함께하는이들 조직도 관리' })).toBeVisible();
  const warning = page.getByRole('alert').filter({
    hasText: '현재 공개 화면은 기존 소개글을 사용 중입니다.',
  });

  let legacyReleased = false;
  try {
    await expect(warning).toHaveCount(0);
    organizationApi.releaseDeferredLegacyGet();
    legacyReleased = true;
    await expect(warning).toBeVisible();
  } finally {
    if (!legacyReleased) organizationApi.releaseDeferredLegacyGet();
  }
});

for (const [label, legacyHtml] of [
  ['null', null],
  ['empty string', ''],
  ['empty Quill markup', '<p><br></p>'],
]) {
  test(`configured-false ${label} legacy does not show a false public-content warning`, async ({
    page,
    organizationApi,
  }) => {
    organizationApi.setOrganization(copyOrganization({ configured: false }));
    organizationApi.setLegacyHtml(legacyHtml);
    await openOrganizationEditor(page, organizationApi);
    await changeRootName(page, `${label} legacy edit`);
    await expect(saveButton(page)).toBeEnabled();

    await expect(page.getByRole('alert').filter({
      hasText: /기존 함께하는이들 내용이 공개 중입니다|현재 공개 화면은 기존 소개글을 사용 중입니다/,
    })).toHaveCount(0);
  });
}

test('save cancels same-revision cutover refetch before PUT and locks manual refetch', async ({
  page,
  organizationApi,
  pageQuality,
}) => {
  await openOrganizationEditor(page, organizationApi);
  organizationApi.setOrganization(copyOrganization({ legacyContentDrift: true }));
  organizationApi.setManagedFingerprint(fingerprintB);
  organizationApi.deferNextManageGet();
  const initialManageGets = organizationApi.getRequests()
    .filter((request) => request === 'GET /organization/manage').length;
  await page.getByRole('button', { name: '서버 변경 확인' }).click();
  await expect.poll(() => organizationApi.getRequests()
    .filter((request) => request === 'GET /organization/manage').length).toBeGreaterThan(initialManageGets);

  organizationApi.deferNextPut();
  organizationApi.expectPutCount(1);
  pageQuality.allowRequestFailure(MANAGE_API_URL);
  const canceledManageGet = page.waitForEvent('requestfailed', {
    predicate: (request) => MANAGE_API_URL.test(request.url()),
    timeout: 2_000,
  });
  let putReleased = false;
  let manageReleased = false;
  try {
    await changeRootName(page, 'same revision cutover guarded save');
    await saveButton(page).click();
    await expect.poll(() => organizationApi.getPutRequests().length).toBe(1);
    await canceledManageGet;
    await expect(page.getByRole('button', { name: /서버 (변경 확인|확인 중…)/ })).toBeDisabled();

    organizationApi.releaseDeferredPut();
    putReleased = true;
    organizationApi.releaseDeferredManageGet();
    manageReleased = true;
    await expect(page.getByRole('status').filter({ hasText: '조직도를 저장했습니다. revision 3' })).toBeVisible();
    await expect(page.getByText('서버에 더 최신 내용이 있습니다.')).toHaveCount(0);
  } finally {
    if (!putReleased) organizationApi.releaseDeferredPut();
    if (!manageReleased) organizationApi.releaseDeferredManageGet();
  }
});

test('successful save invalidates a fresh public cache within the same SPA', async ({
  page,
  organizationApi,
}) => {
  await page.addInitScript(() => {
    const realNow = Date.now.bind(Date);
    window.__restoreOrganizationTestNow = () => { Date.now = realNow; };
    Date.now = () => realNow() + 60 * 60 * 1000;
  });
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  let publicOrganizationGets = 0;
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (request.method() === 'GET' && /\/api\/v1\/organization\/?$/.test(url.pathname)) {
      publicOrganizationGets += 1;
    }
  });
  await page.goto('/intro/people');
  await expect(page.getByRole('navigation', { name: '조직 선택' })).toBeVisible();
  await expect.poll(() => publicOrganizationGets).toBe(1);
  const primedLegacyGets = organizationApi.getRequests()
    .filter((request) => request === 'GET /static-content/intro-people').length;
  await page.evaluate(() => window.__restoreOrganizationTestNow());

  const peopleRow = await openOrganizationEditorFromPublicSpa(page);
  await peopleRow.getByRole('button', { name: '조직도 관리' }).click();
  await expect(page.getByRole('heading', { name: '함께하는이들 조직도 관리' })).toBeVisible();
  await changeRootName(page, 'SPA invalidation으로 공개될 이름');
  organizationApi.expectPutCount(1);
  await saveButton(page).click();
  await expect(page.getByRole('status').filter({ hasText: '조직도를 저장했습니다. revision 3' })).toBeVisible();
  expect(publicOrganizationGets).toBe(1);

  await page.evaluate(() => {
    window.history.pushState({}, '', '/intro/people');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.getByRole('navigation', { name: '조직 선택' })).toBeVisible();
  await expect.poll(() => publicOrganizationGets).toBe(2);
  await expect.poll(() => organizationApi.getRequests()
    .filter((request) => request === 'GET /static-content/intro-people').length)
    .toBeGreaterThan(primedLegacyGets);
  await expect(page.getByRole('button', { name: 'SPA invalidation으로 공개될 이름' })).toBeVisible();
});

test('a delayed PUT response cannot erase newer same-revision cutover evidence', async ({
  page,
  organizationApi,
}) => {
  organizationApi.setLegacyHtml('<p>fingerprint B 최신 기존 내용</p>');
  const putCommitted = organizationApi.deferNextPutResponse();
  organizationApi.expectPutCount(2);
  await openOrganizationEditor(page, organizationApi);
  await changeRootName(page, '지연된 revision 3 PUT 이름');
  await saveButton(page).click();
  await putCommitted;

  organizationApi.setOrganization(copyOrganization({
    revision: 3,
    legacyContentDrift: true,
    groups: organizationFixture.groups.map((group) => (
      group.id === organizationGroupIds.root
        ? { ...group, name: '동일 revision 최신 서버 이름' }
        : { ...group }
    )),
  }));
  organizationApi.setManagedFingerprint(fingerprintB);
  await refetchManageOnVisibilityChange(page);
  const latestConflict = page.getByRole('alert').filter({
    hasText: '다른 관리자가 먼저 저장했습니다.',
  });
  await expect(latestConflict).toBeVisible();

  let putResponseReleased = false;
  try {
    organizationApi.releaseDeferredPutResponse();
    putResponseReleased = true;
    await expect(latestConflict).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: '최신 내용 불러오기' }).click();
    await expect(page.getByLabel('그룹 이름')).toHaveValue('동일 revision 최신 서버 이름');
    await changeRootName(page, 'fingerprint B 기반 후속 저장');
    await expect(saveButton(page)).toBeEnabled();
    await saveButton(page).click();
    const confirmation = page.getByRole('dialog', { name: '기존 함께하는이들 내용 전환 확인' });
    await expect(confirmation).toContainText('fingerprint B 최신 기존 내용');
    await confirmation.getByRole('button', { name: '확인하고 저장' }).click();

    await expect(page.getByRole('status').filter({ hasText: '조직도를 저장했습니다. revision 4' }))
      .toBeVisible();
    expect(organizationApi.getPutRequests()[1]).toMatchObject({
      revision: 3,
      legacyContentFingerprint: fingerprintB,
    });
  } finally {
    if (!putResponseReleased) organizationApi.releaseDeferredPutResponse();
  }
});

test('a superseded successful PUT still invalidates fresh public caches', async ({
  page,
  organizationApi,
}) => {
  await page.addInitScript(() => {
    const realNow = Date.now.bind(Date);
    window.__restoreOrganizationTestNow = () => { Date.now = realNow; };
    Date.now = () => realNow() + 60 * 60 * 1000;
  });
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  let publicOrganizationGets = 0;
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (request.method() === 'GET' && /\/api\/v1\/organization\/?$/.test(url.pathname)) {
      publicOrganizationGets += 1;
    }
  });
  await page.goto('/intro/people');
  await expect(page.getByRole('navigation', { name: '조직 선택' })).toBeVisible();
  await expect.poll(() => publicOrganizationGets).toBe(1);
  await page.evaluate(() => window.__restoreOrganizationTestNow());

  const peopleRow = await openOrganizationEditorFromPublicSpa(page);
  await peopleRow.getByRole('button', { name: '조직도 관리' }).click();
  await expect(page.getByRole('heading', { name: '함께하는이들 조직도 관리' })).toBeVisible();
  const putCommitted = organizationApi.deferNextPutResponse();
  organizationApi.expectPutCount(1);
  await changeRootName(page, 'superseded revision 3 이름');
  await saveButton(page).click();
  await putCommitted;

  organizationApi.setOrganization(copyOrganization({
    revision: 4,
    groups: organizationFixture.groups.map((group) => (
      group.id === organizationGroupIds.root
        ? { ...group, name: 'revision 4 최신 공개 이름' }
        : { ...group }
    )),
  }));
  organizationApi.setManagedFingerprint(fingerprintB);
  await refetchManageOnVisibilityChange(page);
  await expect(page.getByRole('alert').filter({
    hasText: '다른 관리자가 먼저 저장했습니다.',
  })).toBeVisible();

  let putResponseReleased = false;
  try {
    const staticGetsBeforePutResponse = organizationApi.getRequests()
      .filter((request) => request === 'GET /static-content/intro-people').length;
    organizationApi.releaseDeferredPutResponse();
    putResponseReleased = true;
    await expect(page.getByRole('alert').filter({
      hasText: '더 최신인 서버 응답이 있어 저장 결과를 적용하지 않았습니다.',
    })).toBeVisible();
    expect(publicOrganizationGets).toBe(1);

    await page.evaluate(() => {
      window.history.pushState({}, '', '/intro/people');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page.getByRole('navigation', { name: '조직 선택' })).toBeVisible();
    await expect.poll(() => publicOrganizationGets).toBe(2);
    await expect.poll(() => organizationApi.getRequests()
      .filter((request) => request === 'GET /static-content/intro-people').length)
      .toBeGreaterThan(staticGetsBeforePutResponse);
    await expect(page.getByRole('button', { name: 'revision 4 최신 공개 이름' })).toBeVisible();
  } finally {
    if (!putResponseReleased) organizationApi.releaseDeferredPutResponse();
  }
});
