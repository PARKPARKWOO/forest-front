/**
 * 클라이언트에서 쓰는 대표 origin. 실제 값은 `build/siteOrigin.js` 한 곳에서 정의하고
 * Vite `define` 으로 주입한다.
 */
export const SITE_ORIGIN = __FOREST_SITE_ORIGIN__;

export const siteUrl = (path = '') => {
  if (!path) return SITE_ORIGIN;
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
};
