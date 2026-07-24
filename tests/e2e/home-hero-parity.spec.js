import { test, expect } from './fixtures/organizationTest.js';

const ADMIN_USER_RESPONSE = {
  status: 200,
  body: { data: {
    userId: 'home-hero-admin',
    role: 'ROLE_ADMIN',
    canManageContent: true,
    hasMaxAccess: false,
  } },
};

const API_500 = /^Failed to load resource: the server responded with a status of 500 \(Internal Server Error\)$/;
const HOME_BANNER_API_URL = /\/api\/v1\/home-banner(?:[?#].*)?$/;
const HOME_BANNER_SERVICE_URL = /\/src\/services\/homeBannerService\.js(?:[?#].*)?$/;

const HERO_FIXTURE = {
  banners: [{
    badgeText: '공유 렌더러 전용 배지',
    title: 'API에서 받은 공유 Hero 제목',
    description: 'fallback과 구분되는 관리자·공개 공통 설명입니다.',
    backgroundImageUrl: '/draft/forest-hero-placeholder.svg',
    sideImageUrl: '/legacy/fixture-side.png',
    titleColor: '#123456',
    descriptionColor: '#234567',
    badgeTextColor: '#345678',
    primaryButtonText: '단체 소개',
    primaryButtonLink: '/intro',
    secondaryButtonText: '프로그램 참여',
    secondaryButtonLink: '/programs/participate',
    sideTitle: '렌더링하지 않는 기존 제목',
    sideDescription: '렌더링하지 않는 기존 설명',
  }],
  autoSlideSeconds: 17,
};

const readHeroSignature = (hero) => hero.evaluate((root) => ({
  badge: root.querySelector('[data-hero-part="badge"]')?.textContent.trim(),
  title: root.querySelector('[data-hero-part="title"]')?.textContent.trim(),
  description: root.querySelector('[data-hero-part="description"]')?.textContent.trim(),
  actions: [...root.querySelectorAll('[data-hero-action]')].map((action) => ({
    text: action.textContent.trim(),
    className: action.className,
  })),
  surfaceClass: root.querySelector('[data-hero-part="surface"]')?.className,
  titleClass: root.querySelector('[data-hero-part="title"]')?.className,
}));

test('admin preview and public home use the same Hero content, order, and visual contract', async ({ page, organizationApi }) => {
  organizationApi.setHomeBanner(HERO_FIXTURE);
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  await page.goto('/admin?section=homeBanner');
  const adminHero = page.locator('[data-component="home-hero"]');
  await expect(adminHero).toBeVisible();
  await expect(adminHero.locator('a, [href]')).toHaveCount(0);
  const adminSignature = await readHeroSignature(adminHero);

  await page.goto('/');
  const publicHero = page.locator('[data-component="home-hero"]');
  await expect(publicHero).toBeVisible();
  await expect(publicHero.locator('[data-hero-action]')).toHaveCount(2);
  await expect(publicHero.locator('[data-hero-action]').nth(0)).toHaveAttribute('href', '/programs/participate');
  await expect(publicHero.locator('[data-hero-action]').nth(1)).toHaveAttribute('href', '/intro');
  const publicSignature = await readHeroSignature(publicHero);

  expect(adminSignature).toEqual(publicSignature);
  expect(publicSignature.title).toBe('API에서 받은 공유 Hero 제목');
  expect(publicSignature.actions.map(({ text }) => text)).toEqual(['프로그램 참여', '단체 소개']);
});

test('admin editor exposes only fields rendered by the public Hero', async ({ page, organizationApi }) => {
  organizationApi.setHomeBanner(HERO_FIXTURE);
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  await page.goto('/admin?section=homeBanner');
  const editor = page.getByRole('region', { name: '홈 화면 메인 배너 편집' });
  await editor.getByLabel('제목', { exact: true }).fill('관리자 미리보기 확인');
  await expect(page.locator('[data-component="home-hero"]').getByRole('heading', { name: '관리자 미리보기 확인' })).toBeVisible();

  for (const hiddenLabel of ['자동 전환 간격(초)', '배지 색상', '제목 색상', '설명 색상', '우측 카드 이미지', '우측 카드 제목', '우측 카드 설명']) {
    await expect(editor.getByLabel(hiddenLabel, { exact: true })).toHaveCount(0);
  }
  for (const visibleLabel of ['배지 문구', '제목', '설명 문구', '버튼 A 문구', '버튼 A 링크', '버튼 B 문구', '버튼 B 링크', '배경 이미지']) {
    expect((await editor.getByLabel(visibleLabel, { exact: true }).boundingBox()).height).toBeGreaterThanOrEqual(48);
  }
  await expect(editor.getByText('버튼 A와 B 중 프로그램 페이지로 연결되는 버튼은 공개 화면에서 먼저 표시됩니다.', { exact: true }).first()).toBeVisible();
  for (const actionName of ['현재 배너 초기화', '배너 추가', '현재 배너 삭제', '저장']) {
    expect((await editor.getByRole('button', { name: actionName, exact: true }).boundingBox()).height).toBeGreaterThanOrEqual(48);
  }
});

test('Hero background advances through page, API, and local fallback candidates', async ({ page, organizationApi }) => {
  await page.route('**/uploads/hero.png', async (route) => route.fulfill({
    status: 200,
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="#166534"/></svg>',
  }));
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  organizationApi.setHomeBanner({
    ...HERO_FIXTURE,
    banners: [{ ...HERO_FIXTURE.banners[0], backgroundImageUrl: '/uploads/hero.png' }],
  });
  await page.goto('/');
  const image = page.locator('[data-hero-part="background"]');
  await expect(image).toHaveAttribute('src', 'http://127.0.0.1:3000/uploads/hero.png');
  await image.dispatchEvent('error');
  await expect(image).toHaveAttribute('src', 'http://localhost:8080/uploads/hero.png');
  await image.dispatchEvent('error');
  await expect(image).toHaveAttribute('src', '/draft/forest-hero-placeholder.svg');
});

test('admin home banner load failure blocks editing and offers a safe retry', async ({ page, organizationApi, pageQuality }) => {
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  organizationApi.fail('/home-banner', 500);
  for (let index = 0; index < 2; index += 1) {
    pageQuality.allowConsoleError(API_500, HOME_BANNER_API_URL);
    pageQuality.allowConsoleError(/^Error fetching home banner: AxiosError$/, HOME_BANNER_SERVICE_URL);
  }

  await page.goto('/admin?section=homeBanner');
  const error = page.getByRole('alert');
  await expect(error.getByRole('heading', { name: '홈 배너를 불러오지 못했습니다' })).toBeVisible();
  await expect(page.getByRole('region', { name: '홈 화면 메인 배너 편집' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '저장', exact: true })).toHaveCount(0);

  organizationApi.recover('/home-banner');
  await error.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByRole('region', { name: '홈 화면 메인 배너 편집' })).toBeVisible();
});

test('admin treats an unusable successful Home Banner response as a hard load failure', async ({ page, organizationApi }) => {
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  organizationApi.setHomeBanner(null);

  await page.goto('/admin?section=homeBanner');
  const error = page.getByRole('alert');
  await expect(error.getByRole('heading', { name: '홈 배너를 불러오지 못했습니다' })).toBeVisible();
  await expect(page.getByRole('region', { name: '홈 화면 메인 배너 편집' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '저장', exact: true })).toHaveCount(0);
});

test('admin keeps an explicitly empty banner collection as a valid editable contract', async ({ page, organizationApi }) => {
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  organizationApi.setHomeBanner({ banners: [] });

  await page.goto('/admin?section=homeBanner');
  const editor = page.getByRole('region', { name: '홈 화면 메인 배너 편집' });
  await expect(editor).toBeVisible();
  await expect(editor.getByLabel('제목', { exact: true })).toHaveValue('숲을 지키는 가장 가까운 방법');
});
