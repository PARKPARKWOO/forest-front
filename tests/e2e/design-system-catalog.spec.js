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

  const inverse = page.getByRole('button', { name: '역상 행동' });
  await inverse.focus();
  const inverseFocus = await inverse.evaluate((node) => ({
    outlineColor: getComputedStyle(node).outlineColor,
    containerBackgroundColor: getComputedStyle(node.parentElement).backgroundColor,
  }));
  expect(inverseFocus.outlineColor).not.toBe(inverseFocus.containerBackgroundColor);
  expect(inverseFocus.outlineColor).toBe('rgb(255, 255, 255)');
});

test('form and status primitives connect labels, errors, and non-color text', async ({ page, pageQuality }) => {
  await openCatalog(page, pageQuality);
  const input = page.getByRole('textbox', { name: '그룹 이름' });
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toHaveAttribute('aria-describedby', /catalog-group-name-error/);
  await expect(page.locator('#catalog-group-name-error')).toHaveText('그룹 이름을 입력해 주세요.');
  expect((await input.boundingBox()).height).toBeGreaterThanOrEqual(48);
  for (const status of ['확인 전', '접수 중', '저장하지 않은 변경', '확인 필요', '안내']) {
    await expect(page.getByText(status, { exact: true })).toBeVisible();
  }
  for (const stateTitle of ['내용을 불러오고 있습니다', '등록된 내용이 없습니다', '내용을 불러오지 못했습니다', '접근 권한이 없습니다']) {
    await expect(page.getByRole('heading', { name: stateTitle })).toBeVisible();
  }
});

test('AccessibleDialog traps focus, closes with Escape, restores focus, and locks scrolling', async ({ page, pageQuality }) => {
  await openCatalog(page, pageQuality);
  const trigger = page.getByRole('button', { name: '대화상자 열기' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: '변경사항 확인' });
  const close = dialog.getByRole('button', { name: '대화상자 닫기' });
  await expect(close).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('catalog has no critical or serious axe findings', async ({ page, pageQuality }) => {
  await openCatalog(page, pageQuality);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(({ impact }) => ['critical', 'serious'].includes(impact))).toEqual([]);
});

test('catalog reflows at 720 CSS pixels and honors reduced motion', async ({ page, pageQuality }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop 200% equivalent only');
  await page.setViewportSize({ width: 720, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openCatalog(page, pageQuality);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  const motion = await page.locator('[aria-busy="true"] .animate-spin').evaluate((node) => ({
    durationMs: Number.parseFloat(getComputedStyle(node).animationDuration) * 1000,
    iterationCount: getComputedStyle(node).animationIterationCount,
  }));
  expect(motion.durationMs).toBeLessThanOrEqual(0.01);
  expect(motion.iterationCount).toBe('1');
});

test('catalog matches the reviewed responsive baseline', async ({ page, pageQuality }, testInfo) => {
  await openCatalog(page, pageQuality);
  if (process.env.FOREST_VISUAL_REVIEW === 'true') {
    await page.screenshot({
      path: testInfo.outputPath('forest-design-system-review.png'),
      fullPage: true,
      animations: 'disabled',
    });
    return;
  }
  await expect(page).toHaveScreenshot('forest-design-system.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
