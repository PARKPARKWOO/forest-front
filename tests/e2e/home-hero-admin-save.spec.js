import { test, expect } from './fixtures/organizationTest.js';

const ADMIN_USER_RESPONSE = {
  status: 200,
  body: { data: { userId: 'home-hero-admin', role: 'ROLE_ADMIN', canManageContent: true, hasMaxAccess: false } },
};

const LEGACY_SENTINELS = {
  sideImageUrl: '/legacy/save-side.png',
  titleColor: '#123456',
  descriptionColor: '#234567',
  badgeTextColor: '#345678',
  sideTitle: '숨겨진 기존 제목',
  sideDescription: '숨겨진 기존 설명',
};

test('admin validates visible fields and sends one compatibility-safe Home Banner update', async ({ page, organizationApi }) => {
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  organizationApi.setHomeBanner({
    banners: [{
      badgeText: '저장 테스트 배지',
      title: '저장 전 제목',
      description: '저장 전 설명',
      backgroundImageUrl: '/draft/forest-hero-placeholder.svg',
      primaryButtonText: '단체 소개',
      primaryButtonLink: '/intro',
      secondaryButtonText: '프로그램 참여',
      secondaryButtonLink: '/programs/participate',
      ...LEGACY_SENTINELS,
    }],
    autoSlideSeconds: 17,
  });
  organizationApi.expectHomeBannerPutCount(1);
  organizationApi.deferNextHomeBannerPutResponse();

  await page.goto('/admin?section=homeBanner');
  const editor = page.getByRole('region', { name: '홈 화면 메인 배너 편집' });
  const title = editor.getByLabel('제목', { exact: true });
  const save = editor.getByRole('button', { name: '저장', exact: true });

  await title.fill('   ');
  await save.click();
  await expect(editor.getByText('제목을 입력해 주세요.', { exact: true })).toBeVisible();
  expect(organizationApi.getHomeBannerPutRequests()).toHaveLength(0);

  await title.fill('저장한 새 제목');
  await save.click();
  await expect.poll(() => organizationApi.getHomeBannerPutRequests().length).toBe(1);
  await expect(save).toBeDisabled();
  await expect(save).toHaveText('저장 중…');

  const [payload] = organizationApi.getHomeBannerPutRequests();
  expect(Object.hasOwn(payload, 'autoSlideSeconds')).toBe(false);
  expect(payload.banners[0].title).toBe('저장한 새 제목');
  for (const [field, value] of Object.entries(LEGACY_SENTINELS)) {
    expect(payload.banners[0][field]).toBe(value);
  }

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toBe('홈 배너가 저장되었습니다.');
    await dialog.accept();
  });
  organizationApi.releaseDeferredHomeBannerPutResponse();
  await expect(save).toBeEnabled();
  await expect(save).toHaveText('저장');
});
