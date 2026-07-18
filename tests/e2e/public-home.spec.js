import { test, expect } from './fixtures/publicTest.js';
import { publicHomeData } from './fixtures/publicHomeData.js';
import { expectReadableText, waitForPublicHomeReady, waitForPublicShellReady } from './support/publicReady.js';

test('anonymous visitor sees the home without unexpected errors', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(/^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/);
  await page.goto('/');
  await waitForPublicShellReady(page);
});

test('draft exposes its boundary and uses the approved primary color', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(/^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/);
  await page.goto('/');
  await expect(page.getByText('로컬 초안', { exact: true })).toBeVisible();
  const cta = page.getByRole('link', { name: '프로그램 참여' }).first();
  await expect(cta).toHaveCSS('background-color', 'rgb(22, 101, 52)');
  expect((await cta.boundingBox()).height).toBeGreaterThanOrEqual(48);
});

test('hero makes program participation primary and never auto-advances', async ({ page, forestApi, pageQuality }) => {
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(/^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/);
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
  await page.getByRole('button', { name: '다음 배너' }).click();
  await expect(heading).toHaveText('두 번째 배너');
});

test('desktop navigation has five groups, keyboard submenu access, and active parent', async ({ page, forestApi, pageQuality }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop navigation only');
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(/^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/);
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

test('mobile keyboard menu preserves nested boards and restores focus', async ({ page, forestApi, pageQuality }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile drawer only');
  expect(forestApi).toBeDefined();
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(/^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/);
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
  pageQuality.allowConsoleError(/^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/);
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
  pageQuality.allowConsoleError(/^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/);
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
  pageQuality.allowConsoleError(/^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/);
  forestApi.setData({
    programs: [{ ...publicHomeData.programs[0], maxParticipants: 0 }],
  });
  await page.goto('/');
  await expect(page.getByRole('article', { name: '전북 숲길 시민 프로그램' }).getByText('정원 제한 없음')).toBeVisible();
});
