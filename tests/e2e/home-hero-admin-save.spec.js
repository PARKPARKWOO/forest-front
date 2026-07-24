import { test, expect } from './fixtures/organizationTest.js';

const ADMIN_USER_RESPONSE = {
  status: 200,
  body: { data: { userId: 'home-hero-admin', role: 'ROLE_ADMIN', canManageContent: true, hasMaxAccess: false } },
};

const API_500 = /^Failed to load resource: the server responded with a status of 500 \(Internal Server Error\)$/;
const HOME_BANNER_API_URL = /\/api\/v1\/home-banner(?:[?#].*)?$/;
const HOME_BANNER_SERVICE_URL = /\/src\/services\/homeBannerService\.js(?:[?#].*)?$/;

const LEGACY_SENTINELS = {
  sideImageUrl: '/legacy/save-side.png',
  titleColor: '#123456',
  descriptionColor: '#234567',
  badgeTextColor: '#345678',
  sideTitle: '숨겨진 기존 제목',
  sideDescription: '숨겨진 기존 설명',
};

const EDITABLE_BANNER = {
  badgeText: '저장 테스트 배지',
  title: '저장 전 제목',
  description: '저장 전 설명',
  backgroundImageUrl: '/draft/forest-hero-placeholder.svg',
  primaryButtonText: '단체 소개',
  primaryButtonLink: '/intro',
  secondaryButtonText: '프로그램 참여',
  secondaryButtonLink: '/programs/participate',
  ...LEGACY_SENTINELS,
};

const VISIBLE_FIELD_CASES = [
  ['배지 문구', '배지 문구를 입력해 주세요.', EDITABLE_BANNER.badgeText],
  ['제목', '제목을 입력해 주세요.', '저장한 새 제목'],
  ['설명 문구', '설명 문구를 입력해 주세요.', EDITABLE_BANNER.description],
  ['배경 이미지', '배경 이미지 주소를 입력하거나 이미지를 업로드해 주세요.', EDITABLE_BANNER.backgroundImageUrl],
  ['버튼 A 문구', '버튼 A 문구를 입력해 주세요.', EDITABLE_BANNER.primaryButtonText],
  ['버튼 A 링크', '버튼 A 링크를 입력해 주세요.', EDITABLE_BANNER.primaryButtonLink],
  ['버튼 B 문구', '버튼 B 문구를 입력해 주세요.', EDITABLE_BANNER.secondaryButtonText],
  ['버튼 B 링크', '버튼 B 링크를 입력해 주세요.', EDITABLE_BANNER.secondaryButtonLink],
];

test('admin validates visible fields and sends one compatibility-safe Home Banner update', async ({ page, organizationApi }) => {
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  organizationApi.setHomeBanner({
    banners: [EDITABLE_BANNER],
    autoSlideSeconds: 17,
  });
  organizationApi.expectHomeBannerPutCount(1);
  organizationApi.deferNextHomeBannerPutResponse();

  await page.goto('/admin?section=homeBanner');
  const editor = page.getByRole('region', { name: '홈 화면 메인 배너 편집' });
  const save = editor.getByRole('button', { name: '저장', exact: true });

  for (const [label, error, validValue] of VISIBLE_FIELD_CASES) {
    const field = editor.getByLabel(label, { exact: true });
    await field.fill('   ');
    await save.click();
    await expect(editor.getByText(error, { exact: true })).toBeVisible();
    expect(organizationApi.getHomeBannerPutRequests()).toHaveLength(0);
    await field.fill(validValue);
    await expect(editor.getByText(error, { exact: true })).toHaveCount(0);
  }

  await save.click();
  await expect.poll(() => organizationApi.getHomeBannerPutRequests().length).toBe(1);
  await expect(save).toBeDisabled();
  await expect(save).toHaveText('저장 중…');

  const [payload] = organizationApi.getHomeBannerPutRequests();
  expect(payload).toEqual({
    banners: [{
      ...EDITABLE_BANNER,
      title: '저장한 새 제목',
    }],
  });

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toBe('홈 배너가 저장되었습니다.');
    await dialog.accept();
  });
  organizationApi.releaseDeferredHomeBannerPutResponse();
  await expect(save).toBeEnabled();
  await expect(save).toHaveText('저장');
});

test('admin keeps validation errors with their banners through selection and list edits', async ({ page, organizationApi }) => {
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  organizationApi.setHomeBanner({
    banners: [
      EDITABLE_BANNER,
      { ...EDITABLE_BANNER, title: '두 번째 제목', description: '두 번째 설명' },
    ],
    autoSlideSeconds: 17,
  });

  await page.goto('/admin?section=homeBanner');
  const editor = page.getByRole('region', { name: '홈 화면 메인 배너 편집' });
  const save = editor.getByRole('button', { name: '저장', exact: true });
  const bannerOne = editor.getByRole('button', { name: '배너 1', exact: true });
  const bannerTwo = editor.getByRole('button', { name: '배너 2', exact: true });

  await editor.getByLabel('제목', { exact: true }).fill('   ');
  await bannerTwo.click();
  await editor.getByLabel('설명 문구', { exact: true }).fill('   ');
  await save.click();

  await expect(bannerOne).toHaveAttribute('aria-pressed', 'true');
  await expect(editor.getByText('제목을 입력해 주세요.', { exact: true })).toBeVisible();
  await expect(editor.getByLabel('설명 문구', { exact: true })).toHaveValue(EDITABLE_BANNER.description);

  await editor.getByLabel('제목', { exact: true }).fill('첫 번째 수정 제목');
  await save.click();
  await expect(bannerTwo).toHaveAttribute('aria-pressed', 'true');
  await expect(editor.getByText('설명 문구를 입력해 주세요.', { exact: true })).toBeVisible();

  await editor.getByRole('button', { name: '배너 추가', exact: true }).click();
  const bannerThree = editor.getByRole('button', { name: '배너 3', exact: true });
  await expect(bannerThree).toHaveAttribute('aria-pressed', 'true');
  await expect(editor.getByText('설명 문구를 입력해 주세요.', { exact: true })).toHaveCount(0);

  await editor.getByRole('button', { name: '현재 배너 삭제', exact: true }).click();
  await expect(bannerThree).toHaveCount(0);
  await expect(bannerTwo).toHaveAttribute('aria-pressed', 'true');
  await expect(editor.getByText('설명 문구를 입력해 주세요.', { exact: true })).toBeVisible();

  await editor.getByRole('button', { name: '현재 배너 초기화', exact: true }).click();
  await expect(editor.getByText('설명 문구를 입력해 주세요.', { exact: true })).toHaveCount(0);
  await expect(editor.getByLabel('설명 문구', { exact: true })).toHaveValue('전북생명의숲의 활동과 시민 참여 프로그램을 만나보세요.');
  expect(organizationApi.getHomeBannerPutRequests()).toHaveLength(0);
});

test('failed Home Banner PUT is still audited as one attempted write', async ({ page, organizationApi, pageQuality }) => {
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  organizationApi.setHomeBanner({ banners: [EDITABLE_BANNER], autoSlideSeconds: 17 });
  organizationApi.expectHomeBannerPutCount(1);

  await page.goto('/admin?section=homeBanner');
  const editor = page.getByRole('region', { name: '홈 화면 메인 배너 편집' });
  await expect(editor).toBeVisible();

  pageQuality.allowConsoleError(API_500, HOME_BANNER_API_URL);
  pageQuality.allowConsoleError(/^Error updating home banner: AxiosError$/, HOME_BANNER_SERVICE_URL);
  organizationApi.fail('/home-banner', 500);
  let dialogMessage;
  page.once('dialog', async (dialog) => {
    dialogMessage = dialog.message();
    await dialog.dismiss();
  });

  await editor.getByRole('button', { name: '저장', exact: true }).click();
  await expect.poll(() => dialogMessage).toBe('홈 배너 저장에 실패했습니다: Request failed with status code 500');
  expect(organizationApi.getHomeBannerPutRequests()).toEqual([{ banners: [EDITABLE_BANNER] }]);
});
