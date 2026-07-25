import { siteUrl } from '../config/siteOrigin';
import { stripHtmlToText } from './contentUtils';

export const SITE_NAME = '전북생명의숲';
export const DEFAULT_DESCRIPTION = '전북생명의숲은 전북 지역의 숲을 보호하고 시민들과 함께하는 숲 체험 프로그램, 숲 해설가 양성교육, 자원봉사활동을 운영합니다.';
export const DEFAULT_KEYWORDS = '전북생명의숲, 숲체험, 숲해설가, 자원봉사, 환경보호, 전북, 숲교육, 생태보전';
const DESCRIPTION_MAX_LENGTH = 160;

/** 본문 HTML 에서 미리보기용 설명을 뽑는다. 비어 있으면 사이트 기본 문구를 쓴다. */
export function toMetaDescription(html, fallback = DEFAULT_DESCRIPTION) {
  const text = stripHtmlToText(typeof html === 'string' ? html : '').replace(/\s+/g, ' ').trim();
  if (!text) return fallback;
  return text.length > DESCRIPTION_MAX_LENGTH
    ? `${text.slice(0, DESCRIPTION_MAX_LENGTH - 1).trimEnd()}…`
    : text;
}

/** OG 이미지는 절대 URL 이어야 수집기가 읽는다. */
export const toAbsoluteUrl = (value) => {
  if (typeof value !== 'string' || !value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return siteUrl(value);
};

/** 캐노니컬에는 쿼리스트링·해시를 넣지 않는다. 파라미터마다 색인이 갈라진다. */
export const toCanonicalPath = (path) => (
  typeof path === 'string' && path ? path.split('?')[0].split('#')[0] : ''
);
