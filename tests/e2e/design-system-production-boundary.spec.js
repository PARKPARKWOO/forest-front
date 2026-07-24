import { test, expect } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';
import { installOrganizationApiMocks } from './support/mockOrganizationApi.js';

const ADMIN_USER_RESPONSE = {
  status: 200,
  body: { data: {
    userId: 'built-preview-admin',
    role: 'ROLE_ADMIN',
    canManageContent: true,
    hasMaxAccess: false,
  } },
};

const readBuiltJavaScript = async () => {
  const assetsUrl = new URL('../../dist/assets/', import.meta.url);
  const files = (await readdir(assetsUrl)).filter((file) => file.endsWith('.js'));
  return (await Promise.all(files.map((file) => readFile(new URL(file, assetsUrl), 'utf8')))).join('\n');
};

test('production artifact has no design-system catalog route or marker', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const isUsersRequest = new URL(route.request().url()).pathname.endsWith('/api/v1/users');
    await route.fulfill({
      status: isUsersRequest ? 403 : 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: isUsersRequest ? 'anonymous' : 'not found' }),
    });
  });
  await page.goto('/__design-system');
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeVisible();
  await expect(page.locator('[data-design-system-catalog="forest-v1"]')).toHaveCount(0);
  await expect(readBuiltJavaScript()).resolves.not.toContain('forest-v1');
});

test('built Preview artifact disables organization saves before any PUT', async ({ page }) => {
  test.skip(process.env.FOREST_BUILT_PREVIEW !== 'true', 'built Preview regression only');
  const organizationApi = await installOrganizationApiMocks(page);
  organizationApi.setUser(ADMIN_USER_RESPONSE);

  await page.goto('/admin?section=intro');
  const peopleRow = page.getByRole('row').filter({ hasText: '함께하는이들' });
  await peopleRow.getByRole('button', { name: '조직도 관리' }).click();
  await expect(page.getByRole('heading', { name: '함께하는이들 조직도 관리' })).toBeVisible();
  await expect(page.getByRole('button', { name: '미리보기에서는 저장할 수 없습니다' })).toBeDisabled();
  expect(organizationApi.getPutRequests()).toEqual([]);
  organizationApi.assertHandled();
});
