import { test, expect } from './fixtures/publicTest.js';

const ANONYMOUS_403 = /^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/;
const USERS_API_URL = /\/api\/v1\/users(?:[?#].*)?$/;
const THUMBNAIL_FALLBACK = '/draft/forest-hero-placeholder.svg';

function allowAnonymous(pageQuality) {
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
}

const buildActivities = (count) => Array.from({ length: count }, (_, index) => ({
  id: `activity-${index + 1}`,
  title: `활동 게시글 ${index + 1}`,
  content: '',
  // 마지막 글만 썸네일이 없는 상태를 재현한다.
  thumbnail: index === count - 1 ? null : `/draft/forest-hero-placeholder.svg?post=${index + 1}`,
  authorName: '전북생명의숲',
  updatedAt: `2026-07-${String((index % 28) + 1).padStart(2, '0')}T10:00:00`,
}));

async function openActivities(page, forestApi, count) {
  forestApi.setData({ activities: buildActivities(count) });
  await page.goto('/news/activities');
  await expect(page.getByRole('heading', { level: 1, name: '전북생명의숲 활동보기' })).toBeVisible();
}

test('each activity row shows a thumbnail, falling back when the post has none', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  await openActivities(page, forestApi, 3);

  const cards = page.getByRole('article');
  await expect(cards).toHaveCount(3);

  const first = cards.nth(0).locator('img');
  await expect(first).toHaveAttribute('src', '/draft/forest-hero-placeholder.svg?post=1');
  // 실제로 그려진 이미지여야 한다 (깨진 이미지 아님).
  expect(await first.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);

  await expect(cards.nth(2).locator('img')).toHaveAttribute('src', THUMBNAIL_FALLBACK);
});

test('the activity thumbnail and title both open the post', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  allowAnonymous(pageQuality);
  await openActivities(page, forestApi, 3);

  await page.getByRole('article').first().locator('img').click();
  await expect(page).toHaveURL(/\/post\/0\/activity-1$/);

  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: '전북생명의숲 활동보기' })).toBeVisible();
  await page.getByRole('article').first().getByRole('heading', { name: '활동 게시글 1' }).click();
  await expect(page).toHaveURL(/\/post\/0\/activity-1$/);
});

test('the activity list paginates instead of rendering every post at once', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  await openActivities(page, forestApi, 14);

  const cards = page.getByRole('article');
  const pageStatus = page.getByTestId('activities-page-status');
  const previous = page.getByRole('button', { name: '이전' });
  const next = page.getByRole('button', { name: '다음' });

  await expect(cards).toHaveCount(9);
  await expect(pageStatus).toHaveText('1 / 2');
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();

  await next.click();
  await expect(cards).toHaveCount(5);
  await expect(pageStatus).toHaveText('2 / 2');
  await expect(next).toBeDisabled();
  await expect(previous).toBeEnabled();
  await expect(page.getByRole('heading', { name: '활동 게시글 10' })).toBeVisible();

  await previous.click();
  await expect(cards).toHaveCount(9);
  await expect(page.getByRole('heading', { name: '활동 게시글 1' })).toBeVisible();
});

test('a single page of activities hides the pagination controls', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  await openActivities(page, forestApi, 4);

  await expect(page.getByRole('article')).toHaveCount(4);
  await expect(page.getByRole('button', { name: '다음' })).toHaveCount(0);
  await expect(page.getByTestId('activities-page-status')).toHaveCount(0);
});
