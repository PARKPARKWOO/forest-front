import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures/publicTest.js';

const ANONYMOUS_403 = /^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/;
const USERS_API_URL = /\/api\/v1\/users(?:[?#].*)?$/;

const openCatalog = async (page, pageQuality) => {
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  await page.goto('/__design-system');
  await expect(page.getByRole('heading', { level: 1, name: 'Forest 디자인 시스템' })).toBeVisible();
};

test('action primitives expose stable variants, pending state, and 48px targets', async ({ page, pageQuality }) => {
  await openCatalog(page, pageQuality);
  const primary = page.getByRole('button', { name: '주 행동' });
  const pending = page.getByRole('button', { name: '저장 중…' });
  const disabled = page.getByRole('button', { name: '사용 불가' });
  const icon = page.getByRole('button', { name: '항목 닫기' });
  const dangerIcon = page.getByRole('button', { name: '항목 삭제' });
  const link = page.getByRole('link', { name: '프로그램 보기' });

  for (const control of [primary, pending, disabled, icon, dangerIcon, link]) {
    const box = await control.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(48);
    expect(box.width).toBeGreaterThanOrEqual(48);
  }
  await expect(pending).toBeDisabled();
  await expect(pending).toHaveAttribute('aria-busy', 'true');
  await expect(disabled).toBeDisabled();
  await expect(page.getByRole('button', { name: '조용한 행동' })).toBeVisible();
  await expect(page.getByRole('button', { name: '역상 행동' })).toBeVisible();
  await expect(link).toHaveAttribute('href', '/programs/participate');

  await primary.focus();
  const outlineWidth = await primary.evaluate((node) => Number.parseFloat(getComputedStyle(node).outlineWidth));
  expect(outlineWidth).toBeGreaterThanOrEqual(4);
});
