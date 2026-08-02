import { buildPublicNavigation } from '../src/navigation/publicNavigation.js';

/**
 * 사이트맵·RSS 에 넣을 공개 정적 경로.
 *
 * 예전에는 `public/sitemap.xml` 에 경로를 손으로 적어 두었는데 실제 라우팅과 어긋났다.
 * 존재하지 않는 `/community`·`/support` 가 제출되어(라우트가 없어 `*` → NotFoundPage,
 * 그런데 SPA 라 HTTP 는 200 이므로 검색엔진에는 soft-404 로 보인다) 색인 품질을 깎고,
 * 반대로 실제 섹션인 `/resources`·`/donation`·`/esg` 는 빠져 있었다.
 *
 * 그래서 목록을 따로 두지 않고 **공개 내비게이션 한 곳에서 파생**시킨다.
 * 메뉴에 없는 경로는 사용자도 도달할 수 없으니 사이트맵에도 넣지 않는다 —
 * 메뉴를 고치면 사이트맵이 따라오고, 둘이 어긋날 방법이 없어진다.
 */
export function collectStaticPublicPaths() {
  return collectStaticPublicRoutes().map((route) => route.path);
}

/**
 * 경로와 함께 메뉴 이름도 돌려준다. 프리렌더가 경로별 `<title>` 을 만들 때 쓴다.
 * 홈은 메뉴 항목이 아니라 이름이 없다 — 사이트 기본 제목을 그대로 쓴다는 뜻이다.
 */
export function collectStaticPublicRoutes() {
  const routes = [{ path: '/', name: null }];
  const seen = new Set(['/']);

  const walk = (items) => {
    for (const item of items) {
      if (typeof item?.path === 'string' && item.path.startsWith('/') && !seen.has(item.path)) {
        seen.add(item.path);
        routes.push({ path: item.path, name: item.name ?? null });
      }
      if (Array.isArray(item?.children)) walk(item.children);
    }
  };

  // 동적 게시판 카테고리는 여기서 넣지 않는다. 빌드 시 API 로 받아 별도로 추가한다.
  walk(buildPublicNavigation());

  return routes;
}

/**
 * 경로 깊이로 우선순위·갱신주기를 정한다. 값 자체는 검색엔진이 참고만 하는 힌트라
 * 정교하게 맞출 이유가 없고, 손으로 관리하면 또 낡는다.
 */
export function describeStaticPath(path) {
  if (path === '/') return { priority: '1.0', changefreq: 'daily' };
  const depth = path.split('/').filter(Boolean).length;
  return depth <= 1
    ? { priority: '0.8', changefreq: 'weekly' }
    : { priority: '0.6', changefreq: 'weekly' };
}
