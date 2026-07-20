import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures/organizationTest.js';
import {
  copyOrganization,
  emptyLegacyPeopleHtml,
  legacyPeopleHtml,
  organizationFixture,
  organizationGroupIds,
} from './fixtures/organizationDirectoryData.js';

const ANONYMOUS_403 = /^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/;
const API_404 = /^Failed to load resource: the server responded with a status of 404 \(Not Found\)$/;
const API_500 = /^Failed to load resource: the server responded with a status of 500 \(Internal Server Error\)$/;
const USERS_API_URL = /\/api\/v1\/users(?:[?#].*)?$/;
const ORGANIZATION_API_URL = /\/api\/v1\/organization(?:[?#].*)?$/;
const LEGACY_API_URL = /\/api\/v1\/static-content\/intro-people(?:[?#].*)?$/;
const STATIC_CONTENT_SERVICE_URL = /\/src\/services\/staticContentService\.js(?:[?#].*)?$/;

function allowAnonymousRequest(pageQuality) {
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
}

function allowLegacyRequestFailure(pageQuality) {
  pageQuality.allowConsoleError(API_500, LEGACY_API_URL);
  pageQuality.allowConsoleError(/^Error fetching static content: AxiosError$/, STATIC_CONTENT_SERVICE_URL);
}

async function openPeople(page, organizationApi, {
  organization = organizationFixture,
  legacyHtml = emptyLegacyPeopleHtml,
  organizationFailure,
  legacyFailure,
  url = '/intro/people',
} = {}) {
  organizationApi.setOrganization(organization);
  organizationApi.setLegacyHtml(legacyHtml);
  if (organizationFailure) organizationApi.fail('/organization', organizationFailure);
  if (legacyFailure) organizationApi.fail('/static-content/intro-people', legacyFailure);
  await page.goto(url);
}

async function expectStructuredDirectory(page) {
  await expect(page.getByRole('navigation', { name: '조직 선택' })).toBeVisible();
  await expect(page.getByRole('button', { name: '운영위원회' })).toHaveAttribute('aria-current', 'true');
  await expect(page.getByRole('heading', { name: '운영위원회', level: 2 })).toBeVisible();
}

async function expectLegacyDirectory(page) {
  await expect(page.getByRole('heading', { name: '기존 조직도 명단', level: 2 })).toBeVisible();
  await expect(page.getByText('기존 화면만 보입니다.')).toBeVisible();
}

test.beforeEach(async ({ pageQuality }) => {
  allowAnonymousRequest(pageQuality);
});

test('configured data without drift always uses the C directory', async ({ page, organizationApi }) => {
  await openPeople(page, organizationApi, { legacyHtml: legacyPeopleHtml });
  await expectStructuredDirectory(page);
  await expect(page.locator('section[aria-labelledby^="organization-group-"]')
    .getByText('운영 설명', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '기존 조직도 명단' })).toHaveCount(0);
});

test('configured drift uses meaningful sanitized legacy content', async ({ page, organizationApi }) => {
  await openPeople(page, organizationApi, {
    organization: copyOrganization({ legacyContentDrift: true }),
    legacyHtml: legacyPeopleHtml,
  });
  await expectLegacyDirectory(page);
  await expect(page.locator('.rich-content script')).toHaveCount(0);
  await expect(page.getByAltText('기존 조직도 예시')).not.toHaveAttribute('onerror');
  expect(await page.evaluate(() => window.__legacyUnsafe)).toBeUndefined();
});

test('configured drift with empty Quill markup uses the C directory', async ({ page, organizationApi }) => {
  await openPeople(page, organizationApi, {
    organization: copyOrganization({ legacyContentDrift: true }),
  });
  await expectStructuredDirectory(page);
});

test('unconfigured data uses meaningful legacy content', async ({ page, organizationApi }) => {
  await openPeople(page, organizationApi, {
    organization: copyOrganization({ configured: false }),
    legacyHtml: legacyPeopleHtml,
  });
  await expectLegacyDirectory(page);
});

test('unconfigured data with empty legacy content uses the public C seed', async ({ page, organizationApi }) => {
  await openPeople(page, organizationApi, {
    organization: copyOrganization({ configured: false }),
  });
  await expectStructuredDirectory(page);
});

test('organization 404 uses meaningful legacy content first', async ({ page, organizationApi, pageQuality }) => {
  pageQuality.allowConsoleError(API_404, ORGANIZATION_API_URL);
  await openPeople(page, organizationApi, {
    legacyHtml: legacyPeopleHtml,
    organizationFailure: 404,
  });
  await expectLegacyDirectory(page);
});

test('organization 404 and empty legacy content use an accessible overflow-free emergency fallback', async ({ page, organizationApi, pageQuality }) => {
  pageQuality.allowConsoleError(API_404, ORGANIZATION_API_URL);
  await openPeople(page, organizationApi, { organizationFailure: 404 });
  await expect(page.getByRole('heading', { name: '조직도', level: 3 })).toBeVisible();
  await expect(page.getByRole('heading', { name: '공동대표', level: 3 })).toBeVisible();

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `emergency fallback overflows at ${width}px`).toBe(true);
  }

  const boardButton = page.getByRole('button', { name: '이사회', exact: true });
  const committeeButton = page.getByRole('button', { name: '운영위원회', exact: true });
  await boardButton.focus();
  await boardButton.press('Enter');
  await expect.poll(() => page.locator('#board-section').evaluate((element) => (
    Math.abs(element.getBoundingClientRect().top)
  ))).toBeLessThan(4);

  await boardButton.focus();
  await page.keyboard.press('Tab');
  await expect(committeeButton).toBeFocused();
  await committeeButton.press('Enter');
  await expect.poll(() => page.locator('#committee-section').evaluate((element) => (
    Math.abs(element.getBoundingClientRect().top)
  ))).toBeLessThan(4);

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const serious = results.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious');
  expect(serious).toEqual([]);
});

test('organization 500 still uses meaningful legacy content', async ({ page, organizationApi, pageQuality }) => {
  pageQuality.allowConsoleError(API_500, ORGANIZATION_API_URL);
  await openPeople(page, organizationApi, {
    legacyHtml: legacyPeopleHtml,
    organizationFailure: 500,
  });
  await expectLegacyDirectory(page);
});

test('organization 500 with no legacy content shows an explicit retry state', async ({ page, organizationApi, pageQuality }) => {
  pageQuality.allowConsoleError(API_500, ORGANIZATION_API_URL);
  await openPeople(page, organizationApi, { organizationFailure: 500 });
  const error = page.getByRole('alert');
  await expect(error.getByRole('heading', { name: '조직도 정보를 불러오지 못했습니다' })).toBeVisible();
  organizationApi.recover('/organization');
  await error.getByRole('button', { name: '다시 시도' }).click();
  await expectStructuredDirectory(page);
});

test('a legacy request failure is irrelevant to configured data without drift', async ({ page, organizationApi, pageQuality }) => {
  allowLegacyRequestFailure(pageQuality);
  await openPeople(page, organizationApi, { legacyFailure: 500 });
  await expectStructuredDirectory(page);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('unconfigured data retries a failed legacy request before choosing a source', async ({ page, organizationApi, pageQuality }) => {
  allowLegacyRequestFailure(pageQuality);
  await openPeople(page, organizationApi, {
    organization: copyOrganization({ configured: false }),
    legacyHtml: legacyPeopleHtml,
    legacyFailure: 500,
  });
  const error = page.getByRole('alert');
  await expect(error.getByRole('heading', { name: '조직도 정보를 불러오지 못했습니다' })).toBeVisible();
  organizationApi.recover('/static-content/intro-people');
  await error.getByRole('button', { name: '다시 시도' }).click();
  await expectLegacyDirectory(page);
});

test('drifted configured data retries a failed legacy request before choosing a source', async ({ page, organizationApi, pageQuality }) => {
  allowLegacyRequestFailure(pageQuality);
  await openPeople(page, organizationApi, {
    organization: copyOrganization({ legacyContentDrift: true }),
    legacyHtml: legacyPeopleHtml,
    legacyFailure: 500,
  });
  const error = page.getByRole('alert');
  await expect(error.getByRole('heading', { name: '조직도 정보를 불러오지 못했습니다' })).toBeVisible();
  organizationApi.recover('/static-content/intro-people');
  await error.getByRole('button', { name: '다시 시도' }).click();
  await expectLegacyDirectory(page);
});

test('member rows resolve affiliation tri-state and the visible count from public memberships', async ({ page, organizationApi }) => {
  await openPeople(page, organizationApi);
  const rootDetail = page.locator('section[aria-labelledby^="organization-group-"]');
  await expect(rootDetail.getByText('구성원 1명')).toBeVisible();
  await expect(rootDetail.getByRole('listitem')).toHaveCount(1);
  await expect(rootDetail.getByText('기본 소속')).toBeVisible();

  await page.getByRole('button', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다' }).click();
  const childDetail = page.locator('section[aria-labelledby^="organization-group-"]');
  await expect(childDetail.getByText('구성원 2명')).toBeVisible();
  await expect(childDetail.getByRole('listitem')).toHaveCount(2);
  const hiddenAffiliation = childDetail.getByRole('listitem').filter({ hasText: '김테스트' });
  await expect(hiddenAffiliation.getByText('분과장')).toBeVisible();
  await expect(hiddenAffiliation.getByText('기본 소속')).toHaveCount(0);
  const customAffiliation = childDetail.getByRole('listitem').filter({ hasText: '이테스트이름이길어도줄바꿈됩니다' });
  await expect(customAffiliation.getByText('분과위원')).toBeVisible();
  await expect(customAffiliation.getByText('별도 소속 문구')).toBeVisible();
});

test('member rows omit whitespace-only labels and trim displayed labels', async ({ page, organizationApi }) => {
  const organization = copyOrganization({
    people: organizationFixture.people.map((person) => (
      person.id === '33333333-3333-4333-8333-333333333333'
        ? { ...person, affiliation: ' \t ' }
        : person
    )),
    memberships: organizationFixture.memberships.map((membership) => {
      if (membership.id === '55555555-5555-4555-8555-555555555555') {
        return { ...membership, roleLabel: '   ' };
      }
      if (membership.id === '77777777-7777-4777-8777-777777777777') {
        return { ...membership, roleLabel: '  분과위원  ', affiliationOverride: '  별도 소속 문구  ' };
      }
      return membership;
    }),
  });
  await openPeople(page, organizationApi, { organization });

  const rootMember = page.locator('section[aria-labelledby^="organization-group-"]').getByRole('listitem');
  await expect(rootMember.getByRole('heading', { name: '김테스트' })).toBeVisible();
  await expect(rootMember.locator('p')).toHaveCount(0);

  await page.getByRole('button', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다' }).click();
  const customMember = page.locator('section[aria-labelledby^="organization-group-"]')
    .getByRole('listitem')
    .filter({ hasText: '이테스트이름이길어도줄바꿈됩니다' });
  expect(await customMember.locator('p').allTextContents()).toEqual(['분과위원', '별도 소속 문구']);
});

test('empty member and empty group collections have distinct visible states', async ({ page, organizationApi, pageQuality }) => {
  const emptyGroup = {
    id: organizationGroupIds.empty,
    name: '구성원 없는 조직',
    description: '',
    parentGroupId: null,
    displayOrder: 20,
    enabled: true,
  };
  await openPeople(page, organizationApi, {
    organization: copyOrganization({ groups: [...organizationFixture.groups, emptyGroup] }),
  });
  await page.getByRole('button', { name: emptyGroup.name }).click();
  await expect(page.getByText('등록된 공개 구성원이 없습니다')).toBeVisible();
  await expect(page.locator('section[aria-labelledby^="organization-group-"]').getByRole('listitem')).toHaveCount(0);

  organizationApi.setOrganization(copyOrganization({ groups: [], people: [], memberships: [] }));
  allowAnonymousRequest(pageQuality);
  await page.reload();
  await expect(page.getByText('현재 공개된 조직 정보가 없습니다')).toBeVisible();
  await expect(page.getByRole('navigation', { name: '조직 선택' })).toHaveCount(0);
});

test('stable group selection survives reload and back while invalid values self-correct without focus movement', async ({ page, organizationApi, pageQuality }) => {
  await openPeople(page, organizationApi, {
    url: `/intro/people?campaign=forest&group=${organizationGroupIds.child}`,
  });
  await expect(page.getByRole('heading', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다', level: 2 })).toBeVisible();
  allowAnonymousRequest(pageQuality);
  await page.reload();
  await expect(page).toHaveURL(new RegExp(`campaign=forest&group=${organizationGroupIds.child}`));

  await page.getByRole('button', { name: '운영위원회' }).click();
  await expect(page).toHaveURL(new RegExp(`group=${organizationGroupIds.root}`));
  await page.getByRole('button', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다' }).click();
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`campaign=forest&group=${organizationGroupIds.root}`));
  await expect(page.getByRole('heading', { name: '운영위원회', level: 2 })).toBeVisible();
  await page.waitForLoadState('networkidle');

  allowAnonymousRequest(pageQuality);
  await page.goto('/intro/people?campaign=forest&group=99999999-9999-4999-8999-999999999999');
  await expect(page).toHaveURL(new RegExp(`campaign=forest&group=${organizationGroupIds.root}`));
  await expect(page.getByRole('heading', { name: '운영위원회', level: 2 })).not.toBeFocused();
});

test('group controls keep responsive columns, keyboard focus, vertical reflow, and document width', async ({ page, organizationApi }) => {
  await openPeople(page, organizationApi);
  const widths = [320, 390, 720, 768, 1440];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow, `document overflows at ${width}px`).toBe(false);
  }

  const navigation = page.getByRole('navigation', { name: '조직 선택' });
  await page.setViewportSize({ width: 390, height: 844 });
  expect((await navigation.evaluate((node) => getComputedStyle(node).gridTemplateColumns)).split(' ')).toHaveLength(2);
  await page.setViewportSize({ width: 320, height: 844 });
  expect((await navigation.evaluate((node) => getComputedStyle(node).gridTemplateColumns)).split(' ')).toHaveLength(1);

  await page.setViewportSize({ width: 720, height: 900 });
  const navBox = await navigation.boundingBox();
  const detailBox = await page.locator('section[aria-labelledby^="organization-group-"]').boundingBox();
  expect(detailBox.y).toBeGreaterThanOrEqual(navBox.y + navBox.height);

  const childButton = page.getByRole('button', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다' });
  await childButton.focus();
  const focusStyle = await childButton.evaluate((node) => ({
    style: getComputedStyle(node).outlineStyle,
    width: getComputedStyle(node).outlineWidth,
    height: node.getBoundingClientRect().height,
  }));
  expect(focusStyle.style).not.toBe('none');
  expect(Number.parseFloat(focusStyle.width)).toBeGreaterThanOrEqual(4);
  expect(focusStyle.height).toBeGreaterThanOrEqual(48);
  await childButton.press('Enter');
  await expect(childButton).toBeFocused();
  await expect(page.getByRole('heading', { name: '숲교육분과 이름이 길어도 줄바꿈됩니다', level: 2 })).not.toBeFocused();
});

test('public organization directory has no critical or serious axe findings', async ({ page, organizationApi }) => {
  await openPeople(page, organizationApi);
  await expectStructuredDirectory(page);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const serious = results.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious');
  expect(serious).toEqual([]);
});
