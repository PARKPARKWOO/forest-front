import { test, expect } from './fixtures/publicTest.js';

test('home distinguishes empty program and notice collections', async ({ page, forestApi, pageQuality }) => {
  expect(pageQuality).toBeDefined();
  pageQuality.allowConsoleError(/^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/);
  forestApi.setData({ programs: [], notices: [] });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '등록된 프로그램이 없습니다' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '등록된 공지가 없습니다' })).toBeVisible();
});

test('program error remains until the visitor explicitly retries', async ({ page, forestApi, pageQuality }) => {
  pageQuality.allowConsoleError(/^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/);
  pageQuality.allowConsoleError(/^Failed to load resource: the server responded with a status of 500 \(Internal Server Error\)$/);
  pageQuality.allowConsoleError(/^Error fetching programs:/);
  forestApi.fail('/program/information', 500);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '프로그램을 불러오지 못했습니다' })).toBeVisible();
  forestApi.recover('/program/information');
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByRole('article', { name: '전북 숲길 시민 프로그램' })).toBeVisible();
});
