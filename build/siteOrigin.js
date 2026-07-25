/**
 * 공개 사이트의 대표 origin. 캐노니컬·OG·사이트맵·RSS·robots 가 모두 이 값을 쓴다.
 *
 * 도메인이 여러 파일에 흩어져 있으면 교체할 때 일부만 갱신되어 캐노니컬과 사이트맵이
 * 어긋난다. 그러면 검색엔진이 같은 문서를 두 주소로 보고 색인을 나눈다. 그래서 문자열은
 * 여기 한 곳에만 두고 나머지는 `__SITE_ORIGIN__` 토큰으로 치환한다.
 *
 * 한글 도메인 같은 별칭은 이 값으로 301 리다이렉트만 시키고 대표로 삼지 않는다.
 */
export const SITE_ORIGIN = 'https://jbforest.platformholder.site';

export const SITE_ORIGIN_TOKEN = '__SITE_ORIGIN__';

/** 토큰이 남아 있으면 배포본에 잘못된 주소가 나가므로 호출부에서 검증할 수 있게 분리한다. */
export const hasSiteOriginToken = (text) => (
  typeof text === 'string' && text.includes(SITE_ORIGIN_TOKEN)
);

export function applySiteOrigin(text, origin = SITE_ORIGIN) {
  if (typeof text !== 'string') return text;
  return text.split(SITE_ORIGIN_TOKEN).join(origin);
}
