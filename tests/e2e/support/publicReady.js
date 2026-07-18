import { expect } from '@playwright/test';

export async function waitForPublicShellReady(page) {
  await expect(page.getByRole('heading', { level: 1, name: '숲을 지키는 가장 가까운 방법' })).toBeVisible();
}

export async function waitForPublicHomeReady(page) {
  await waitForPublicShellReady(page);
  await expect(page.getByRole('article', { name: '전북 숲길 시민 프로그램' })).toBeVisible();
  await expect(page.getByText('여름 숲 프로그램 참가 안내와 준비물 공지')).toBeVisible();
  await expect(page.getByRole('article', { name: '시민과 함께한 전북 숲 돌봄 활동' })).toBeVisible();
  await expect(page.getByText('숲 이야기 첫 글')).toBeVisible();
}

export async function expectReadableText(locator) {
  const metrics = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return { fontSize: Number.parseFloat(style.fontSize), lineHeight: Number.parseFloat(style.lineHeight) };
  });
  expect(metrics.fontSize).toBeGreaterThanOrEqual(18);
  expect(metrics.lineHeight / metrics.fontSize).toBeGreaterThanOrEqual(1.7);
}
