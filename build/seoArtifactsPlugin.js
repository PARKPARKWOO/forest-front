import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SITE_ORIGIN } from './siteOrigin.js';
import { collectStaticPublicRoutes, describeStaticPath } from './publicRoutes.js';
import { renderEntry, toDescription, toOutputPath } from './prerender.js';

const DEFAULT_API_BASE = 'https://forest.platformholder.site/api/v1';

/**
 * 수집 전체에 거는 벽시계 예산(ms)과 개별 요청 상한.
 *
 * 사이트맵 때문에 배포가 실패하면 사이트맵이 낡은 것보다 훨씬 나쁘다. 백엔드가 느리거나
 * 죽어 있어도 빌드는 반드시 끝나야 하므로 "모을 수 있는 만큼 모으고 시간이 다 되면 멈춘다".
 * 정적 경로는 API 와 무관하게 항상 들어가므로 최악의 경우에도 유효한 사이트맵이 나온다.
 */
const COLLECT_BUDGET_MS = 20_000;
const REQUEST_TIMEOUT_MS = 5_000;

/** 페이지네이션 폭주 방어. 게시판이 커져도 빌드 시간이 선형으로 늘지 않게 한다. */
const MAX_PAGES_PER_LIST = 20;
const RSS_ITEM_LIMIT = 30;

function makeDeadline(budgetMs) {
  const end = Date.now() + budgetMs;
  return {
    expired: () => Date.now() >= end,
    remaining: () => Math.max(0, end - Date.now()),
  };
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** `2026-02-13T14:22:01.123` 같은 값에서 날짜만 뽑는다. 파싱 실패는 조용히 버린다. */
function toIsoDate(value) {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function toRfc822(value) {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toUTCString();
}

/**
 * 예산을 지키는 JSON fetch. 실패·타임아웃·예산 소진은 전부 `null` 이다.
 * 사이트맵 생성은 best-effort 이므로 예외를 위로 던지지 않는다.
 */
async function fetchJson(url, deadline) {
  const budget = Math.min(REQUEST_TIMEOUT_MS, deadline.remaining());
  if (budget <= 0) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), budget);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** `{data:{contents,hasNextPage}}` 형태의 목록을 마지막 페이지까지(예산 안에서) 모은다. */
async function fetchPagedContents(apiBase, pathname, deadline) {
  const collected = [];
  for (let page = 0; page < MAX_PAGES_PER_LIST; page += 1) {
    if (deadline.expired()) break;
    const separator = pathname.includes('?') ? '&' : '?';
    const json = await fetchJson(`${apiBase}${pathname}${separator}page=${page}`, deadline);
    const data = json?.data;
    const contents = Array.isArray(data?.contents) ? data.contents : [];
    collected.push(...contents);
    if (!data?.hasNextPage || contents.length === 0) break;
  }
  return collected;
}

function flattenCategories(categories) {
  const flat = [];
  const walk = (items) => {
    for (const item of items ?? []) {
      if (item?.id != null) flat.push(item);
      if (Array.isArray(item?.children)) walk(item.children);
    }
  };
  walk(categories);
  return flat;
}

/**
 * 동적 공개 URL 을 모은다. 실패한 부분은 그냥 빠지고 나머지는 살린다.
 *
 * 경로는 `src/routes.jsx` 의 라우트와 1:1 로 맞춘다 —
 * 공지 `/news/notice/:noticeId`, 게시판 `/category/:categoryId`, 글 `/post/:categoryId/:postId`,
 * 프로그램 `/programs/detail/:id`.
 */
async function collectDynamicEntries(apiBase, deadline) {
  const entries = [];

  const notices = await fetchPagedContents(apiBase, '/notice', deadline);
  for (const notice of notices) {
    if (notice?.id == null) continue;
    entries.push({
      kind: 'notice',
      path: `/news/notice/${notice.id}`,
      name: notice.title,
      description: toDescription(notice.content),
      image: notice.thumbnail ?? null,
      updatedAt: notice.updatedAt,
      priority: '0.7',
      changefreq: 'monthly',
    });
  }

  const categoriesJson = await fetchJson(`${apiBase}/categories`, deadline);
  const categories = flattenCategories(categoriesJson?.data);
  for (const category of categories) {
    entries.push({
      kind: 'category',
      path: `/category/${category.id}`,
      name: category.name,
      description: null,
      image: null,
      updatedAt: null,
      priority: '0.6',
      changefreq: 'weekly',
    });
  }

  for (const category of categories) {
    if (deadline.expired()) break;
    const posts = await fetchPagedContents(apiBase, `/posts/${category.id}`, deadline);
    for (const post of posts) {
      if (post?.id == null) continue;
      entries.push({
        kind: 'post',
        path: `/post/${category.id}/${post.id}`,
        name: post.title,
        description: toDescription(post.content),
        image: post.thumbnail ?? null,
        updatedAt: post.updatedAt,
        priority: '0.6',
        changefreq: 'monthly',
      });
    }
  }

  const programs = await fetchPagedContents(apiBase, '/program/information', deadline);
  for (const program of programs) {
    if (program?.id == null) continue;
    entries.push({
      kind: 'program',
      path: `/programs/detail/${program.id}`,
      name: program.title,
      description: toDescription(program.content),
      image: null,
      eventDate: program.eventDate ?? null,
      updatedAt: program.updatedAt ?? program.createdAt,
      priority: '0.7',
      changefreq: 'weekly',
    });
  }

  return entries;
}

export function buildSitemapXml(entries, origin = SITE_ORIGIN) {
  const urls = entries.map((entry) => {
    const lastmod = toIsoDate(entry.updatedAt);
    return [
      '  <url>',
      `    <loc>${escapeXml(`${origin}${entry.path}`)}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      `    <changefreq>${entry.changefreq}</changefreq>`,
      `    <priority>${entry.priority}</priority>`,
      '  </url>',
    ].filter(Boolean).join('\n');
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

export function buildRssXml(entries, origin = SITE_ORIGIN, buildDate = null) {
  const items = entries
    .filter((entry) => entry.name && entry.updatedAt)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, RSS_ITEM_LIMIT)
    .map((entry) => {
      const pubDate = toRfc822(entry.updatedAt);
      return [
        '    <item>',
        `      <title>${escapeXml(entry.name)}</title>`,
        `      <link>${escapeXml(`${origin}${entry.path}`)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(`${origin}${entry.path}`)}</guid>`,
        pubDate ? `      <pubDate>${pubDate}</pubDate>` : null,
        '    </item>',
      ].filter(Boolean).join('\n');
    });

  const lastBuildDate = buildDate ?? new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>전북생명의숲</title>
    <link>${escapeXml(origin)}</link>
    <description>전북 지역의 숲을 보호하고 시민과 함께하는 전북생명의숲 소식</description>
    <language>ko</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(`${origin}/rss.xml`)}" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>
`;
}

/**
 * 빌드 산출물의 SEO 자산을 실제 사이트 구조로 다시 만든다 — `sitemap.xml`, `rss.xml`,
 * 그리고 경로별 프리렌더 HTML.
 *
 * 셋이 한 플러그인에 있는 이유는 **수집을 한 번만 하기 위해서**다. 같은 목록 API 를
 * 세 번 읽으면 빌드 시간이 세 배가 되고 예산 관리도 어려워진다.
 *
 * `public/` 의 sitemap·rss 는 정적 경로만 담은 fallback 이고(개발 서버·API 장애 대비),
 * 여기서 `closeBundle` 에 동적 콘텐츠까지 채워 덮어쓴다. `seoOriginPlugin` 의 토큰 검증이
 * 끝난 뒤 실행되며, 여기서 쓰는 값은 이미 치환된 절대 URL 이라 토큰이 남을 여지가 없다.
 */
export function seoArtifactsPlugin({ origin = SITE_ORIGIN, apiBase = DEFAULT_API_BASE } = {}) {
  let outDir = null;

  return {
    name: 'forest-seo-artifacts',
    apply: 'build',

    configResolved(config) {
      // Vite 가 해석한 root 기준으로 절대경로를 만든다. 실행 위치에 의존하지 않게 한다.
      outDir = path.resolve(config.root, config.build.outDir);
    },

    async closeBundle() {
      const deadline = makeDeadline(COLLECT_BUDGET_MS);

      const staticEntries = collectStaticPublicRoutes().map((route) => ({
        kind: 'static',
        path: route.path,
        name: route.name,
        description: null,
        image: null,
        updatedAt: null,
        ...describeStaticPath(route.path),
      }));

      let dynamicEntries = [];
      try {
        dynamicEntries = await collectDynamicEntries(apiBase, deadline);
      } catch (error) {
        this.warn(`동적 콘텐츠 수집에 실패해 정적 경로만 담습니다: ${error.message}`);
      }

      const seen = new Set();
      const entries = [...staticEntries, ...dynamicEntries].filter((entry) => {
        if (seen.has(entry.path)) return false;
        seen.add(entry.path);
        return true;
      });

      await writeFile(path.join(outDir, 'sitemap.xml'), buildSitemapXml(entries, origin));
      await writeFile(path.join(outDir, 'rss.xml'), buildRssXml(dynamicEntries, origin));

      const prerendered = await prerenderEntries(this, outDir, entries, origin);

      const dynamicCount = entries.length - staticEntries.length;
      this.info?.(`사이트맵 ${entries.length}개 (정적 ${staticEntries.length} · 동적 ${dynamicCount}) · 프리렌더 ${prerendered}개`);
      if (dynamicCount === 0) {
        this.warn('동적 URL 이 0개입니다 — 백엔드 응답을 확인하세요. 정적 경로만 배포됩니다.');
      }
    },
  };
}

/**
 * 각 경로를 `dist/<경로>/index.html` 로 떨군다.
 *
 * 셸은 이미 origin 치환과 토큰 검증을 마친 `dist/index.html` 을 그대로 쓴다 — 해시가 박힌
 * 스크립트·스타일 링크를 다시 계산할 필요가 없고, 셸이 바뀌어도 자동으로 따라간다.
 * 홈(`/`)은 셸 자신이므로 건너뛴다.
 */
async function prerenderEntries(context, outDir, entries, origin) {
  let shell;
  try {
    shell = await readFile(path.join(outDir, 'index.html'), 'utf8');
  } catch (error) {
    context.warn(`셸 HTML 을 읽지 못해 프리렌더를 건너뜁니다: ${error.message}`);
    return 0;
  }

  // 정적 본문에 넣을 주요 메뉴. 최상위 항목만 넣어 크롤러에게 사이트 구조를 알린다.
  const navLinks = entries
    .filter((entry) => entry.kind === 'static' && entry.name && entry.path.split('/').length === 2)
    .map((entry) => ({ path: entry.path, name: entry.name }));

  let written = 0;
  for (const entry of entries) {
    const outputPath = toOutputPath(entry.path);
    // 홈은 셸 자신이다. 별도 디렉터리 대신 dist/index.html 을 직접 갱신한다.
    const target = path.join(outDir, outputPath ?? 'index.html');
    // 경로 세그먼트에 사용자 입력(카테고리 id 등)이 들어가므로 outDir 밖으로 나가지 않는지 확인한다.
    if (!target.startsWith(`${outDir}${path.sep}`)) {
      context.warn(`경로가 출력 디렉터리를 벗어나 건너뜁니다: ${entry.path}`);
      continue;
    }

    try {
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, renderEntry(shell, entry, origin, navLinks));
      written += 1;
    } catch (error) {
      // 한 경로가 실패해도 나머지는 살린다. 프리렌더가 없으면 SPA 셸로 fallback 될 뿐이다.
      context.warn(`프리렌더 실패 ${entry.path}: ${error.message}`);
    }
  }

  return written;
}
