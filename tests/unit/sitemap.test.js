import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { collectStaticPublicPaths, describeStaticPath } from '../../build/publicRoutes.js';
import { buildSitemapXml, buildRssXml } from '../../build/seoArtifactsPlugin.js';

const routesPath = fileURLToPath(new URL('../../src/routes.jsx', import.meta.url));
const sitemapPath = fileURLToPath(new URL('../../public/sitemap.xml', import.meta.url));
const robotsPath = fileURLToPath(new URL('../../public/robots.txt', import.meta.url));

const ORIGIN = 'https://example.test';

test('정적 공개 경로는 공개 내비게이션에서만 파생된다', () => {
  const paths = collectStaticPublicPaths();
  assert.ok(paths.includes('/'));
  assert.ok(paths.includes('/intro/greeting'));
  assert.ok(paths.includes('/resources/documents'));
  assert.ok(paths.includes('/esg/report'));
  assert.equal(new Set(paths).size, paths.length, '중복 경로가 있으면 안 된다');
});

test('예전 사이트맵에 있던 유령 경로는 더 이상 포함되지 않는다', () => {
  // /community·/support 는 routes.jsx 에 라우트가 없어 NotFoundPage 로 떨어진다.
  // SPA 라 HTTP 는 200 이므로 검색엔진에는 soft-404 로 보인다.
  const paths = collectStaticPublicPaths();
  assert.ok(!paths.includes('/community'));
  assert.ok(!paths.includes('/support'));
});

test('사이트맵의 모든 정적 경로에 대응하는 라우트가 존재한다', async () => {
  const routesSource = await readFile(routesPath, 'utf8');
  const declared = new Set(
    [...routesSource.matchAll(/path:\s*'([^']+)'/g)].map(([, value]) => (
      value.startsWith('/') ? value : `/${value}`
    )),
  );

  const matchesRoute = (pathname) => {
    if (pathname === '/') return true;
    if (declared.has(pathname)) return true;
    // `/intro/:subCategory` 같은 동적 세그먼트로도 매칭될 수 있다.
    const segments = pathname.split('/').filter(Boolean);
    return [...declared].some((route) => {
      const routeSegments = route.split('/').filter(Boolean);
      if (routeSegments.length !== segments.length) return false;
      return routeSegments.every((segment, index) => (
        segment.startsWith(':') || segment === segments[index]
      ));
    });
  };

  const unmatched = collectStaticPublicPaths().filter((pathname) => !matchesRoute(pathname));
  assert.deepEqual(unmatched, [], `라우트가 없는 경로가 사이트맵에 있다: ${unmatched.join(', ')}`);
});

test('fallback sitemap.xml 이 파생 목록과 같은 경로를 담는다', async () => {
  const xml = await readFile(sitemapPath, 'utf8');
  const locs = [...xml.matchAll(/<loc>__SITE_ORIGIN__([^<]*)<\/loc>/g)].map(([, value]) => value);
  assert.deepEqual(locs.sort(), collectStaticPublicPaths().sort());
});

test('sitemap XML 은 lastmod 가 있을 때만 넣고 특수문자를 이스케이프한다', () => {
  const xml = buildSitemapXml([
    { path: '/', updatedAt: null, ...describeStaticPath('/') },
    { path: '/post/1/2', updatedAt: '2026-02-13T14:22:01.123', priority: '0.6', changefreq: 'monthly' },
    { path: '/category/a&b', updatedAt: 'not-a-date', priority: '0.6', changefreq: 'weekly' },
  ], ORIGIN);

  assert.match(xml, /<loc>https:\/\/example\.test\/<\/loc>/);
  assert.match(xml, /<lastmod>2026-02-13<\/lastmod>/);
  assert.match(xml, /category\/a&amp;b/);
  // 날짜가 없거나 파싱 실패한 항목에는 lastmod 를 넣지 않는다 — 가짜 날짜가 더 나쁘다.
  assert.equal([...xml.matchAll(/<lastmod>/g)].length, 1);
});

test('RSS 는 제목·날짜가 있는 항목만 최신순으로 담는다', () => {
  const xml = buildRssXml([
    { path: '/a', name: '오래된 글', updatedAt: '2026-01-01T00:00:00' },
    { path: '/b', name: '최신 글', updatedAt: '2026-03-01T00:00:00' },
    { path: '/c', name: null, updatedAt: '2026-02-01T00:00:00' },
    { path: '/d', name: '날짜 없음', updatedAt: null },
  ], ORIGIN, 'Sun, 01 Mar 2026 00:00:00 GMT');

  const titles = [...xml.matchAll(/<title>([^<]*)<\/title>/g)].map(([, value]) => value);
  assert.deepEqual(titles, ['전북생명의숲', '최신 글', '오래된 글']);
  assert.match(xml, /rel="self"/);
});

test('robots.txt 의 크롤러 그룹이 하나로 합쳐져 Disallow 가 모두에게 적용된다', async () => {
  const robots = await readFile(robotsPath, 'utf8');
  const lines = robots.split('\n').map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));

  // 그룹이 몇 개인지 센다 — User-agent 가 아닌 줄 뒤에 다시 User-agent 가 나오면 새 그룹이다.
  let groups = 0;
  let previousWasUserAgent = false;
  for (const line of lines) {
    const isUserAgent = line.toLowerCase().startsWith('user-agent:');
    if (isUserAgent && !previousWasUserAgent) groups += 1;
    previousWasUserAgent = isUserAgent;
  }

  assert.equal(groups, 1, 'Googlebot 등 개별 그룹이 생기면 * 그룹의 Disallow 를 덮어써 무력화된다');
  for (const blocked of ['/admin', '/api/', '/login', '/signup']) {
    assert.ok(robots.includes(`Disallow: ${blocked}`), `${blocked} 차단이 빠졌다`);
  }
  for (const crawler of ['Googlebot', 'Yeti', 'GPTBot', 'ClaudeBot', 'PerplexityBot']) {
    assert.ok(robots.includes(`User-agent: ${crawler}`), `${crawler} 가 그룹에 없다`);
  }
});
