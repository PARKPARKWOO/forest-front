import { test, expect } from './fixtures/publicTest.js';
import AxeBuilder from '@axe-core/playwright';
import { publicHomeData } from './fixtures/publicHomeData.js';
import { expectReadableText, waitForPublicHomeReady, waitForPublicShellReady } from './support/publicReady.js';

const ANONYMOUS_403 = /^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/;
const USERS_API_URL = /\/api\/v1\/users(?:[?#].*)?$/;

test('anonymous visitor sees the home without unexpected errors', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  await page.goto('/');
  await waitForPublicShellReady(page);
});

test('draft exposes its boundary and uses the approved primary color', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  await page.goto('/');
  await expect(page.getByText('로컬 초안', { exact: true })).toBeVisible();
  const cta = page.getByRole('link', { name: '프로그램 참여' }).first();
  await expect(cta).toHaveCSS('background-color', 'rgb(22, 101, 52)');
  expect((await cta.boundingBox()).height).toBeGreaterThanOrEqual(48);
});

test('dark Hero primary CTA uses a white four-pixel focus outline distinct from its background', async ({ page, pageQuality }) => {
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  await page.goto('/');
  const hero = page.locator('[data-component="home-hero"]');
  const primaryCta = hero.locator('[data-hero-action]').first();

  await primaryCta.focus();
  await expect(primaryCta).toBeFocused();
  await expect(primaryCta).toHaveCSS('outline-color', 'rgb(255, 255, 255)');
  expect(await primaryCta.evaluate((element) => Number.parseFloat(getComputedStyle(element).outlineWidth))).toBeGreaterThanOrEqual(4);
  const colors = await hero.evaluate((root) => ({
    outline: getComputedStyle(root.querySelector('[data-hero-action]')).outlineColor,
    surface: getComputedStyle(root.querySelector('[data-hero-part="surface"]')).backgroundColor,
  }));
  expect(colors.outline).not.toBe(colors.surface);
});

test('hero makes program participation primary and never auto-advances', async ({ page, forestApi, pageQuality }) => {
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
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
  await expect(page.getByRole('group', { name: '대표 배너 선택' })).toBeVisible();
  await page.getByRole('button', { name: '다음 배너' }).click();
  await expect(heading).toHaveText('두 번째 배너');
});

test('desktop navigation has five groups, keyboard submenu access, and active parent', async ({ page, forestApi, pageQuality }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop navigation only');
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
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

test('desktop navigation keeps the focused submenu open after the pointer leaves', async ({ page, pageQuality }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop navigation only');
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  await page.goto('/news/notice');
  const nav = page.getByRole('navigation', { name: '주요 메뉴' });
  const news = nav.getByRole('link', { name: '소식', exact: true });
  await news.hover();
  await news.focus();
  await page.keyboard.press('Tab');
  const notice = nav.getByRole('link', { name: '공지사항' });
  await expect(notice).toBeFocused();
  await page.mouse.move(0, 0);
  await expect(notice).toBeVisible();
  await expect(notice).toBeFocused();
});

test('mobile keyboard menu preserves nested boards and restores focus', async ({ page, forestApi, pageQuality }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile drawer only');
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
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
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  await page.goto('/');
  await waitForPublicShellReady(page);
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: '본문으로 건너뛰기' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

test('home presents the approved task order and only available program facts', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
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
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  forestApi.setData({
    programs: [{ ...publicHomeData.programs[0], maxParticipants: 0 }],
  });
  await page.goto('/');
  await expect(page.getByRole('article', { name: '전북 숲길 시민 프로그램' }).getByText('정원 제한 없음')).toBeVisible();
});

test('invalid route explains the error instead of silently redirecting', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  await page.goto('/does-not-exist');
  await expect(page).toHaveURL(/does-not-exist/);
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeVisible();
  await expect(page.getByRole('link', { name: /전북생명의숲/ }).first()).toBeVisible();
  await expect(page.getByText('로컬 초안', { exact: true })).toBeVisible();
});

test('home links arrive at the three approved existing destinations', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
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
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  await page.goto('/');
  await waitForPublicHomeReady(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(({ impact }) => ['critical', 'serious'].includes(impact))).toEqual([]);
});

test('desktop content reflows at the 720 CSS pixel equivalent of 200 percent zoom', async ({ page, forestApi, pageQuality }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', '1440 desktop at 200 percent is 720 CSS pixels');
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
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
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await waitForPublicShellReady(page);
  await page.getByRole('button', { name: '전체 메뉴 열기' }).click();
  const panel = page.getByRole('dialog', { name: '전체 메뉴' });
  const milliseconds = await panel.evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration) * 1000);
  expect(milliseconds).toBeLessThanOrEqual(0.01);
});

test('draft status strip stays in document flow above narrow main content', async ({ page, forestApi, pageQuality }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop', 'tablet and mobile regression only');
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  await page.goto('/');
  await waitForPublicHomeReady(page);
  const status = page.getByRole('status');
  await expect(status).toHaveText('로컬 초안');
  await expect(status).toHaveCSS('background-color', 'rgb(180, 83, 9)');
  await expect(status).toHaveCSS('font-size', '18px');
  const statusBox = await status.boundingBox();
  const mainBox = await page.locator('#main-content').boundingBox();
  expect(statusBox.y + statusBox.height).toBeLessThanOrEqual(mainBox.y);
  expect(statusBox.x).toBeLessThanOrEqual(1);
  expect(statusBox.width).toBeGreaterThanOrEqual(page.viewportSize().width - 2);
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  const scrolledStatusBox = await status.boundingBox();
  expect(scrolledStatusBox.y).toBeLessThan(statusBox.y - 100);
});

test('public draft matches the reviewed responsive baseline', async ({ page, forestApi, pageQuality }, testInfo) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  await page.goto('/');
  await waitForPublicHomeReady(page);
  if (process.env.FOREST_VISUAL_REVIEW === 'true') {
    await page.screenshot({
      path: testInfo.outputPath('forest-public-home-review.png'),
      fullPage: true,
      animations: 'disabled',
    });
    return;
  }
  await expect(page).toHaveScreenshot('forest-public-home.png', { fullPage: true, animations: 'disabled' });
});
