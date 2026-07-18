import { test, expect } from './fixtures/publicTest.js';
import { watchPageQuality } from './support/pageQuality.js';

const ANONYMOUS_403 = /^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/;
const USERS_API_URL = /\/api\/v1\/users(?:[?#].*)?$/;
const PROGRAM_LIST_API_URL = /\/api\/v1\/program\/information\?page=1&size=10(?:#.*)?$/;

function emitConsoleError(url) {
  const listeners = new Map();
  const quality = watchPageQuality({
    on(event, listener) {
      listeners.set(event, listener);
    },
  });
  listeners.get('console')({
    type: () => 'error',
    text: () => 'Failed to load resource: the server responded with a status of 403 (Forbidden)',
    location: () => ({ url }),
  });
  return quality;
}

test('console allowlist restricts the anonymous 403 to the users endpoint', () => {
  const usersQuality = emitConsoleError('http://127.0.0.1:3000/api/v1/users?draft=true#status');
  usersQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  expect(() => usersQuality.assertClean()).not.toThrow();

  const programQuality = emitConsoleError('http://127.0.0.1:3000/api/v1/program/information');
  programQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  expect(() => programQuality.assertClean()).toThrow(/api\/v1\/program\/information/);
});

test('console allowlist rejects a non-RegExp URL pattern', () => {
  const quality = emitConsoleError('http://127.0.0.1:3000/api/v1/users');
  expect(() => quality.allowConsoleError(ANONYMOUS_403, '/api/v1/users')).toThrow(/URL must be a RegExp/);
});

test('home uses the participation route when the banner collection is empty', async ({ page, forestApi, pageQuality }) => {
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  forestApi.setData({ banner: { banners: [] } });
  await page.goto('/');
  await expect(page.getByRole('link', { name: '프로그램 참여' }).first()).toHaveAttribute('href', '/programs/participate');
});

test('home distinguishes empty program and notice collections', async ({ page, forestApi, pageQuality }) => {
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  forestApi.setData({ programs: [], notices: [] });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '등록된 프로그램이 없습니다' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '등록된 공지가 없습니다' })).toBeVisible();
});

test('program error remains until the visitor explicitly retries', async ({ page, forestApi, pageQuality }) => {
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(
    /^Failed to load resource: the server responded with a status of 500 \(Internal Server Error\)$/,
    PROGRAM_LIST_API_URL,
  );
  pageQuality.allowConsoleError(/^Error fetching programs:/);
  forestApi.fail('/program/information', 500);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '프로그램을 불러오지 못했습니다' })).toBeVisible();
  forestApi.recover('/program/information');
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByRole('article', { name: '전북 숲길 시민 프로그램' })).toBeVisible();
});
