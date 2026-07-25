import { test, expect } from './fixtures/publicTest.js';
import { publicHomeData } from './fixtures/publicHomeData.js';

const ANONYMOUS_403 = /^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/;
const USERS_API_URL = /\/api\/v1\/users(?:[?#].*)?$/;
const SITE_ORIGIN = 'https://jbforest.platformholder.site';

function allowAnonymous(pageQuality, times = 1) {
  for (let i = 0; i < times * 2; i += 1) {
    pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  }
}

const meta = (page, selector) => page.locator(selector).first().getAttribute('content');
const canonical = (page) => page.locator('link[rel="canonical"]').first().getAttribute('href');

test('the home page keeps the site-level title and canonical', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  expect(forestApi).toBeDefined();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: '숲을 지키는 가장 가까운 방법' })).toBeVisible();

  await expect(page).toHaveTitle('전북생명의숲');
  // 사이트맵의 <loc> 과 같은 형태여야 한 문서가 두 주소로 색인되지 않는다.
  expect(await canonical(page)).toBe(`${SITE_ORIGIN}/`);
  expect(await meta(page, 'meta[property="og:url"]')).toBe(`${SITE_ORIGIN}/`);
});

test('an activity post describes itself in the title, canonical and OG tags', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  forestApi.setData({
    activities: [{
      ...publicHomeData.activities[0],
      id: 'activity-1',
      title: '시민과 함께한 전북 숲 돌봄 활동',
      content: '<p>주민 40명과 함께 숲길을 정비했습니다.</p>',
      thumbnail: '/draft/forest-hero-placeholder.svg',
    }],
  });
  await page.goto('/post/0/activity-1');
  await expect(page.getByRole('heading', { level: 1, name: '시민과 함께한 전북 숲 돌봄 활동' })).toBeVisible();

  await expect(page).toHaveTitle('시민과 함께한 전북 숲 돌봄 활동 | 전북생명의숲');
  expect(await canonical(page)).toBe(`${SITE_ORIGIN}/post/0/activity-1`);
  expect(await meta(page, 'meta[property="og:url"]')).toBe(`${SITE_ORIGIN}/post/0/activity-1`);
  expect(await meta(page, 'meta[property="og:title"]')).toBe('시민과 함께한 전북 숲 돌봄 활동 | 전북생명의숲');
  // 본문에서 뽑은 설명이어야 한다 (사이트 기본 문구가 아니라).
  expect(await meta(page, 'meta[name="description"]')).toContain('주민 40명과 함께');
  // 썸네일이 있으면 OG 이미지로 쓰고, 절대 URL 이어야 한다.
  expect(await meta(page, 'meta[property="og:image"]')).toMatch(/^https?:\/\//);
});

test('a program detail describes itself instead of reusing the site defaults', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  forestApi.setData({ programs: [{ ...publicHomeData.programs[0], applyUrl: 'https://forms.gle/x' }] });
  await page.goto('/programs/detail/program-1');
  await expect(page.getByRole('heading', { name: '전북 숲길 시민 프로그램' })).toBeVisible();

  await expect(page).toHaveTitle('전북 숲길 시민 프로그램 | 전북생명의숲');
  expect(await canonical(page)).toBe(`${SITE_ORIGIN}/programs/detail/program-1`);
});

test('the activities list has its own title and canonical', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  expect(forestApi).toBeDefined();
  await page.goto('/news/activities');
  await expect(page.getByRole('heading', { level: 1, name: '전북생명의숲 활동보기' })).toBeVisible();

  await expect(page).toHaveTitle('전북생명의숲 활동보기 | 전북생명의숲');
  expect(await canonical(page)).toBe(`${SITE_ORIGIN}/news/activities`);
});

test('canonical never carries query strings so filters do not split the index', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  expect(forestApi).toBeDefined();
  await page.goto('/news/activities?q=%EC%88%B2&page=2');
  await expect(page.getByRole('heading', { level: 1, name: '전북생명의숲 활동보기' })).toBeVisible();

  expect(await canonical(page)).toBe(`${SITE_ORIGIN}/news/activities`);
});

test('metadata is replaced, not appended, when moving between pages', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  allowAnonymous(pageQuality, 2);
  await page.goto('/news/activities');
  await expect(page.getByRole('heading', { level: 1, name: '전북생명의숲 활동보기' })).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: '숲을 지키는 가장 가까운 방법' })).toBeVisible();

  // 이전 화면의 태그가 남아 중복되면 크롤러가 어느 쪽을 볼지 알 수 없다.
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  expect(await canonical(page)).toBe(`${SITE_ORIGIN}/`);
});

test('a page without its own SEO block still keeps a canonical and its own title', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  allowAnonymous(pageQuality, 2);
  await page.goto('/news/activities');
  await expect(page.getByRole('heading', { level: 1, name: '전북생명의숲 활동보기' })).toBeVisible();

  // SPA 이동. 도착 화면은 자체 SEO 블록이 없다.
  await page.getByRole('link', { name: '공지사항' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: '공지사항' })).toBeVisible();

  // Helmet 이 정적 태그를 걷어낸 뒤 대체가 없으면 캐노니컬이 0개가 되고 제목이 이전 화면에 남는다.
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  expect(await canonical(page)).toBe(`${SITE_ORIGIN}/news/notice`);
  expect(await meta(page, 'meta[property="og:url"]')).toBe(`${SITE_ORIGIN}/news/notice`);
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  expect(await page.title()).not.toContain('활동보기');
});

test('every public route keeps exactly one canonical on direct entry', async ({ page, forestApi, pageQuality }) => {
  expect(forestApi).toBeDefined();
  const routes = ['/', '/intro/people', '/programs', '/news', '/news/notice', '/resources', '/donation', '/esg'];
  allowAnonymous(pageQuality, routes.length);

  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('link[rel="canonical"]'), `${route} canonical`).toHaveCount(1);
    expect(await canonical(page), `${route} canonical 값`).toBe(`${SITE_ORIGIN}${route === '/' ? '/' : route}`);
  }
});
