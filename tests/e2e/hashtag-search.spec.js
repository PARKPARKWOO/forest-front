import { test, expect } from './fixtures/publicTest.js';

const ANONYMOUS_403 = /^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/;
const USERS_API_URL = /\/api\/v1\/users(?:[?#].*)?$/;

function allowAnonymous(pageQuality, times = 1) {
  for (let i = 0; i < times * 2; i += 1) {
    pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  }
}

const activities = [
  {
    id: 'activity-tagged',
    title: '숲가꾸기 활동 보고',
    content: '<p>올해도 <strong>#숲가꾸기</strong> 와 #나무심기 를 진행했습니다.</p>',
    thumbnail: '/draft/forest-hero-placeholder.svg',
    authorName: '전북생명의숲',
    updatedAt: '2026-07-20T10:00:00',
  },
  {
    id: 'activity-plain',
    title: '정기총회 결과',
    content: '<p>태그 없는 본문입니다.</p>',
    thumbnail: '/draft/forest-hero-placeholder.svg',
    authorName: '전북생명의숲',
    updatedAt: '2026-07-19T10:00:00',
  },
  {
    id: 'activity-other-tag',
    title: '나무심기 봉사',
    content: '<p>#나무심기 봉사 후기</p>',
    thumbnail: '/draft/forest-hero-placeholder.svg',
    authorName: '전북생명의숲',
    updatedAt: '2026-07-18T10:00:00',
  },
];

test('post detail turns hashtags into links without touching other text', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality, 2);
  forestApi.setData({ activities });
  await page.goto('/post/0/activity-tagged');
  await expect(page.getByRole('heading', { level: 1, name: '숲가꾸기 활동 보고' })).toBeVisible();

  const forestTag = page.getByRole('link', { name: '#숲가꾸기' });
  await expect(forestTag).toBeVisible();
  await expect(forestTag).toHaveAttribute('href', `/news/activities?tag=${encodeURIComponent('숲가꾸기')}`);
  await expect(page.getByRole('link', { name: '#나무심기' })).toBeVisible();
  // 본문 문장은 그대로 남아야 한다.
  await expect(page.getByText('올해도')).toBeVisible();

  await forestTag.click();
  await expect(page).toHaveURL(/\/news\/activities\?tag=/);
});

test('a post without hashtags renders no hashtag links', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  forestApi.setData({ activities });
  await page.goto('/post/0/activity-plain');
  await expect(page.getByRole('heading', { level: 1, name: '정기총회 결과' })).toBeVisible();

  await expect(page.locator('a[data-hashtag]')).toHaveCount(0);
});

test('browsing by tag lists only the posts carrying that tag', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  forestApi.setData({ activities });
  await page.goto(`/news/activities?tag=${encodeURIComponent('숲가꾸기')}`);

  await expect(page.getByTestId('activities-tag-filter')).toContainText('숲가꾸기');
  const cards = page.getByRole('article');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('숲가꾸기 활동 보고');

  // 필터를 해제하면 전체 목록으로 돌아온다.
  await page.getByRole('link', { name: '태그 필터 해제' }).click();
  await expect(page).toHaveURL(/\/news\/activities$/);
  await expect(page.getByRole('article')).toHaveCount(3);
});

test('a tag with no posts explains the empty result instead of showing everything', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  forestApi.setData({ activities });
  await page.goto('/news/activities?tag=없는태그');

  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.getByText('해당 태그의 게시글이 없습니다')).toBeVisible();
});

test('searching matches title, body and hashtag', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  forestApi.setData({ activities });
  await page.goto('/news/activities');

  const search = page.getByRole('searchbox', { name: '게시글 검색' });

  await search.fill('정기총회');
  await page.getByRole('button', { name: '검색' }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('article').first()).toContainText('정기총회 결과');

  // 본문에만 있는 낱말
  await search.fill('봉사 후기');
  await page.getByRole('button', { name: '검색' }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('article').first()).toContainText('나무심기 봉사');

  // 해시태그로도 걸린다
  await search.fill('나무심기');
  await page.getByRole('button', { name: '검색' }).click();
  await expect(page.getByRole('article')).toHaveCount(2);
});

test('an empty search returns to the full list', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  forestApi.setData({ activities });
  await page.goto('/news/activities');

  const search = page.getByRole('searchbox', { name: '게시글 검색' });
  await search.fill('정기총회');
  await page.getByRole('button', { name: '검색' }).click();
  await expect(page.getByRole('article')).toHaveCount(1);

  await search.fill('');
  await page.getByRole('button', { name: '검색' }).click();
  await expect(page.getByRole('article')).toHaveCount(3);
});

test('a search with no match says so', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  forestApi.setData({ activities });
  await page.goto('/news/activities');

  await page.getByRole('searchbox', { name: '게시글 검색' }).fill('존재하지않는낱말');
  await page.getByRole('button', { name: '검색' }).click();

  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.getByText('검색 결과가 없습니다')).toBeVisible();
});
