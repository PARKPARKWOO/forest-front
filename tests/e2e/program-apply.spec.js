import { test, expect } from './fixtures/publicTest.js';
import { publicHomeData } from './fixtures/publicHomeData.js';

const ANONYMOUS_403 = /^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/;
const USERS_API_URL = /\/api\/v1\/users(?:[?#].*)?$/;

const APPLY_URL = 'https://forms.gle/forest-e2e-example';

function allowAnonymous(pageQuality) {
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
}

async function openProgram(page, forestApi, overrides = {}) {
  forestApi.setData({ programs: [{ ...publicHomeData.programs[0], ...overrides }] });
  await page.goto('/programs/detail/program-1');
  await expect(page.getByRole('heading', { name: '전북 숲길 시민 프로그램' })).toBeVisible();
}

test('an open program offers the Google Form as its only application route', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  await openProgram(page, forestApi, { applyUrl: APPLY_URL });

  const googleForm = page.getByRole('link', { name: '구글폼으로 신청하기' });
  await expect(googleForm).toBeVisible();
  await expect(googleForm).toHaveAttribute('href', APPLY_URL);
  await expect(googleForm).toHaveAttribute('rel', /noopener/);

  // 홈페이지 자체 신청은 더 이상 제공하지 않는다.
  await expect(page.getByRole('button', { name: '홈페이지에서 신청하기' })).toHaveCount(0);
  await expect(page.getByText('홈페이지 신청만 가능합니다')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('an open program without an apply link says so instead of promising homepage applications', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  await openProgram(page, forestApi, { applyUrl: null });

  await expect(page.getByRole('link', { name: '구글폼으로 신청하기' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '홈페이지에서 신청하기' })).toHaveCount(0);
  // 안내는 사실과 일치해야 한다: 신청 수단이 아직 없다.
  await expect(page.getByText('신청 링크가 아직 등록되지 않았습니다')).toBeVisible();
  await expect(page.getByText('홈페이지 신청만 가능합니다')).toHaveCount(0);
});

test('a closed program shows no application route at all', async ({ page, forestApi, pageQuality }) => {
  allowAnonymous(pageQuality);
  await openProgram(page, forestApi, { status: 'CLOSED', applyUrl: APPLY_URL });

  await expect(page.getByRole('link', { name: '구글폼으로 신청하기' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '홈페이지에서 신청하기' })).toHaveCount(0);
  await expect(page.getByText('신청 링크가 아직 등록되지 않았습니다')).toHaveCount(0);
});
