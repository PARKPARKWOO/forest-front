import { Helmet } from 'react-helmet-async';
import { SITE_ORIGIN, siteUrl } from '../config/siteOrigin';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  SITE_NAME,
  toAbsoluteUrl,
  toCanonicalPath,
} from '../utils/metaContent';


/**
 * 페이지별 메타태그.
 *
 * 주의: SPA 라 이 태그들은 브라우저에서 자바스크립트로 삽입된다. 자바스크립트를 실행하는
 * 구글에는 반영되지만, 카카오톡·페이스북 같은 링크 미리보기 수집기는 정적 index.html 만
 * 읽으므로 여기 값을 보지 못한다. 그쪽까지 맞추려면 크롤러에게 서버가 HTML 을 내려주는
 * 별도 처리가 필요하다.
 */
export default function SEO({
  title,
  description,
  keywords = DEFAULT_KEYWORDS,
  image,
  path,
  type = 'website',
  noIndex = false,
  children,
}) {
  const fullTitle = !title || title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;
  // 캐노니컬에는 쿼리스트링을 넣지 않는다. 검색어·페이지 파라미터마다 색인이 갈라진다.
  const canonicalUrl = path ? siteUrl(toCanonicalPath(path)) : SITE_ORIGIN;
  const resolvedDescription = description || DEFAULT_DESCRIPTION;
  const resolvedImage = toAbsoluteUrl(image);

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <meta name="keywords" content={keywords} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="ko_KR" />
      {resolvedImage ? <meta property="og:image" content={resolvedImage} /> : null}

      <meta name="twitter:card" content={resolvedImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      {resolvedImage ? <meta name="twitter:image" content={resolvedImage} /> : null}

      <link rel="canonical" href={canonicalUrl} />

      {children}
    </Helmet>
  );
}
