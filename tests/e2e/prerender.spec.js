import { test, expect } from '@playwright/test';

/**
 * 빌드 산출물 기준 프리렌더 검증.
 *
 * 개발 서버에는 프리렌더 파일이 없으므로 이 스펙은 `playwright.built.config.js`(=`preview:built`)
 * 로만 돌린다. 확인하려는 것은 두 가지다.
 *  1. 자바스크립트를 실행하지 않는 수집기가 경로별 메타·본문을 받는가
 *  2. 실제 사용자에게는 그 정적 본문이 React 로 교체되는가 (하이드레이션)
 *
 * **파일 경로를 명시해서 요청한다.** `vite preview` 는 `/intro/greeting` 처럼 슬래시 없는 주소를
 * SPA fallback 으로 넘겨 셸을 돌려주지만, Vercel 은 rewrite 보다 파일시스템을 먼저 보고
 * `intro/greeting/index.html` 을 `/intro/greeting` 으로 서빙한다(= clean URL). 두 서버의 이 차이를
 * 테스트가 흉내 내면 오히려 오해를 부르므로, 여기서는 "파일이 올바른 내용으로 존재하는가"만 본다.
 * **배포 후 실제 주소로 한 번 더 확인해야 한다** — 확인 명령은 `prd/forest/requirements.md` 18장.
 */

const ORIGIN = 'https://jbforest.platformholder.site';

const ROUTES = [
  { file: '/index.html', path: '/', title: '전북생명의숲 | 숲과 함께하는 녹색 미래', heading: '전북생명의숲' },
  { file: '/intro/greeting/index.html', path: '/intro/greeting', title: '인사말 | 전북생명의숲', heading: '인사말' },
  { file: '/news/notice/index.html', path: '/news/notice', title: '공지사항 | 전북생명의숲', heading: '공지사항' },
  { file: '/donation/individual/index.html', path: '/donation/individual', title: '후원 신청 | 전북생명의숲', heading: '후원 신청' },
];

for (const route of ROUTES) {
  test(`정적 HTML 이 경로별 제목·캐노니컬을 담는다: ${route.path}`, async ({ request }) => {
    const html = await (await request.get(route.file)).text();

    expect(html).toContain(`<title>${route.title}</title>`);
    expect(html).toContain(`href="${ORIGIN}${route.path}"`);
    expect(html).toContain(`<h1>${route.heading}</h1>`);

    // 캐노니컬이 2개가 되면 예전에 겪은 색인 분리 문제가 재발한다.
    expect(html.match(/rel="canonical"/g)).toHaveLength(1);
    expect(html.match(/<title>/g)).toHaveLength(1);
  });
}

test('서로 다른 경로는 서로 다른 캐노니컬을 갖는다', async ({ request }) => {
  const canonicals = await Promise.all(ROUTES.map(async (route) => {
    const html = await (await request.get(route.file)).text();
    return html.match(/rel="canonical"[^>]*href="([^"]+)"/)?.[1];
  }));

  expect(new Set(canonicals).size).toBe(ROUTES.length);
});

test('프리렌더 본문은 하이드레이션 후 React 화면으로 교체된다', async ({ page }) => {
  await page.goto('/intro/greeting/');

  await expect(page.locator('[data-prerender-fallback]')).toHaveCount(0);
  await expect(page.getByRole('navigation').first()).toBeVisible();
});
