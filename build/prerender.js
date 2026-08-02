/**
 * 경로별 정적 HTML 생성.
 *
 * SPA 는 어느 주소를 요청해도 같은 `index.html` 을 돌려준다. `react-helmet` 이 브라우저에서
 * 메타를 고쳐 넣지만 **자바스크립트를 실행하지 않는 수집기**(네이버 Yeti·다음 Daumoa·Bing·
 * 카카오톡·페이스북 미리보기·대부분의 AI 크롤러)는 정적 HTML 만 읽는다. 그래서 그들에게는
 * 모든 URL 의 캐노니컬이 홈을 가리켰고, 결과적으로 **홈 1개만 색인**되고 있었다.
 *
 * 여기서는 빌드 시 경로마다 메타를 치환한 HTML 을 `dist/<경로>/index.html` 로 떨군다.
 * Vercel 은 catch-all rewrite 보다 파일시스템을 먼저 보므로(운영에서 확인된 동작 —
 * `/googlebfb4ce8e4c2b4ba8.html` 이 같은 이유로 서빙된다) 이 파일들이 먼저 응답한다.
 * 하이드레이션 이후에는 Helmet 이 `data-rh` 태그를 인계하므로 화면 이동 동작은 그대로다.
 *
 * 한계: 빌드 시점 스냅샷이라 이후 수정된 제목·설명은 다음 빌드까지 낡는다. 그래도 "모든
 * 페이지가 홈이라고 주장하는 것"보다는 낫다. 빌드 후 삭제된 글은 프리렌더 파일이 남아
 * 200 을 반환하지만, 본문은 SPA 가 여전히 "찾을 수 없음"을 렌더한다.
 */

const SITE_NAME = '전북생명의숲';
const DEFAULT_DESCRIPTION = '전북생명의숲은 전북 지역의 숲을 보호하고 시민들과 함께하는 숲 체험 프로그램, 숲 해설가 양성교육, 자원봉사활동을 운영합니다.';
const DESCRIPTION_LIMIT = 150;

export function escapeAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 리치텍스트 본문에서 설명을 만든다. 태그·엔티티·공백을 걷어내고 문장 단위로 자르지 않는다. */
export function toDescription(html, fallback = DEFAULT_DESCRIPTION) {
  if (typeof html !== 'string' || html.trim() === '') return fallback;
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text === '') return fallback;
  return text.length <= DESCRIPTION_LIMIT ? text : `${text.slice(0, DESCRIPTION_LIMIT - 1).trimEnd()}…`;
}

export function toPageTitle(name) {
  if (!name || name === SITE_NAME) return `${SITE_NAME} | 숲과 함께하는 녹색 미래`;
  return `${name} | ${SITE_NAME}`;
}

/**
 * 상세 페이지용 구조화 데이터. 화면별 데이터라 정적 index.html 에는 넣을 수 없었고,
 * 프리렌더가 생기면서 비로소 자바스크립트 없이도 전달할 수 있게 됐다.
 * 값이 없는 필드는 넣지 않는다 — 비어 있는 것보다 지어낸 값이 나쁘다.
 */
export function buildEntryJsonLd(entry, origin) {
  const url = `${origin}${entry.path}`;

  if (entry.kind === 'program') {
    const event = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: entry.name,
      url,
      description: entry.description,
      organizer: { '@type': 'Organization', name: SITE_NAME, url: origin },
    };
    if (entry.eventDate) event.startDate = entry.eventDate;
    if (entry.image) event.image = entry.image;
    return event;
  }

  if (entry.kind === 'post' || entry.kind === 'notice') {
    const article = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: entry.name,
      url,
      description: entry.description,
      publisher: { '@type': 'Organization', name: SITE_NAME, url: origin },
    };
    if (entry.updatedAt) article.dateModified = entry.updatedAt;
    if (entry.image) article.image = entry.image;
    return article;
  }

  return null;
}

/**
 * 셸 HTML 의 메타를 경로 값으로 교체한다.
 *
 * 셸에 이미 있는 태그만 치환하고 없는 태그는 `</head>` 앞에 넣는다. 태그를 중복으로 남기면
 * 캐노니컬이 2개가 되어 예전에 겪은 문제가 재발하므로, 각 항목은 정확히 한 번만 나오게 한다.
 */
export function renderShell(shell, { title, description, canonical, image, jsonLd }) {
  let html = shell;
  const added = [];

  const replaceOrQueue = (pattern, replacement) => {
    if (pattern.test(html)) {
      html = html.replace(pattern, replacement);
    } else {
      added.push(replacement);
    }
  };

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttribute(title)}</title>`);

  replaceOrQueue(
    /<meta([^>]*)name="description"[^>]*>/,
    `<meta$1name="description" content="${escapeAttribute(description)}" />`,
  );
  replaceOrQueue(
    /<meta([^>]*)property="og:title"[^>]*>/,
    `<meta$1property="og:title" content="${escapeAttribute(title)}" />`,
  );
  replaceOrQueue(
    /<meta([^>]*)property="og:description"[^>]*>/,
    `<meta$1property="og:description" content="${escapeAttribute(description)}" />`,
  );
  replaceOrQueue(
    /<meta([^>]*)property="og:url"[^>]*>/,
    `<meta$1property="og:url" content="${escapeAttribute(canonical)}" />`,
  );
  replaceOrQueue(
    /<meta([^>]*)name="twitter:title"[^>]*>/,
    `<meta$1name="twitter:title" content="${escapeAttribute(title)}" />`,
  );
  replaceOrQueue(
    /<meta([^>]*)name="twitter:description"[^>]*>/,
    `<meta$1name="twitter:description" content="${escapeAttribute(description)}" />`,
  );
  replaceOrQueue(
    /<link([^>]*)rel="canonical"[^>]*>/,
    `<link$1rel="canonical" href="${escapeAttribute(canonical)}" />`,
  );

  if (image) {
    added.push(`<meta data-rh="true" property="og:image" content="${escapeAttribute(image)}" />`);
  }
  if (jsonLd) {
    // JSON 안의 `<` 는 스크립트 조기 종료를 막으려고 이스케이프한다.
    const serialized = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
    added.push(`<script type="application/ld+json">${serialized}</script>`);
  }

  if (added.length > 0) {
    html = html.replace('</head>', `    ${added.join('\n    ')}\n  </head>`);
  }

  return html;
}

/**
 * `#root` 안에 정적 본문을 심는다.
 *
 * 자바스크립트를 실행하지 않는 수집기에게 이 사이트의 본문은 지금까지 26자짜리 빈 셸이었고
 * 내부 링크도 0개였다. 제목·설명·주요 메뉴만이라도 정적 HTML 에 있으면 그들이 읽을 것이 생긴다.
 *
 * `createRoot` 는 첫 렌더에서 컨테이너 내용을 지우므로(`hydrateRoot` 가 아니다) 실제 사용자에게는
 * 보이지 않는다. 화면 깜빡임을 막으려고 숨기지는 않는다 — 숨긴 텍스트는 클로킹으로 오해받는다.
 */
function renderFallbackBody({ title, description, links }) {
  const items = links
    .map((link) => `<li><a href="${escapeAttribute(link.path)}">${escapeAttribute(link.name)}</a></li>`)
    .join('');

  return [
    '<div id="root">',
    '<div data-prerender-fallback>',
    `<h1>${escapeAttribute(title)}</h1>`,
    `<p>${escapeAttribute(description)}</p>`,
    items ? `<nav aria-label="주요 메뉴"><ul>${items}</ul></nav>` : '',
    '</div>',
    '</div>',
  ].join('');
}

/** 라우트 하나를 프리렌더한 HTML. `entry.kind` 가 `static` 이면 메뉴 이름으로 제목을 만든다. */
export function renderEntry(shell, entry, origin, navLinks = []) {
  const canonical = entry.path === '/' ? `${origin}/` : `${origin}${entry.path}`;
  const title = toPageTitle(entry.name);
  const description = entry.description || DEFAULT_DESCRIPTION;

  const html = renderShell(shell, {
    title,
    description,
    canonical,
    image: entry.image ?? null,
    jsonLd: buildEntryJsonLd(entry, origin),
  });

  // 헤딩은 페이지 제목이 아니라 화면 이름을 쓴다. `… | 전북생명의숲` 이 h1 에 들어가면 어색하다.
  const heading = entry.name || '전북생명의숲';
  return html.replace(
    /<div id="root"><\/div>/,
    renderFallbackBody({ title: heading, description, links: navLinks }),
  );
}

/** `/news/notice/1` → `news/notice/1/index.html`. 루트는 셸 자신이므로 프리렌더 대상이 아니다. */
export function toOutputPath(routePath) {
  const trimmed = routePath.replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? null : `${trimmed}/index.html`;
}
