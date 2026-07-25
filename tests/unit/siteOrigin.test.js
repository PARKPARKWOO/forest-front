import assert from 'node:assert/strict';
import test from 'node:test';
import { SITE_ORIGIN, applySiteOrigin, hasSiteOriginToken } from '../../build/siteOrigin.js';

test('대표 origin 은 프로토콜을 포함하고 끝에 슬래시가 없다', () => {
  assert.match(SITE_ORIGIN, /^https:\/\//);
  assert.ok(!SITE_ORIGIN.endsWith('/'), '끝 슬래시가 있으면 사이트맵 URL 이 //로 이어진다');
});

test('토큰을 모두 치환한다', () => {
  const source = '<loc>__SITE_ORIGIN__/</loc><loc>__SITE_ORIGIN__/news</loc>';
  assert.equal(
    applySiteOrigin(source, 'https://example.test'),
    '<loc>https://example.test/</loc><loc>https://example.test/news</loc>',
  );
});

test('치환 후에는 토큰이 남지 않는다', () => {
  assert.equal(hasSiteOriginToken('__SITE_ORIGIN__/a'), true);
  assert.equal(hasSiteOriginToken(applySiteOrigin('__SITE_ORIGIN__/a', SITE_ORIGIN)), false);
});

test('토큰이 없으면 원문을 그대로 둔다', () => {
  assert.equal(applySiteOrigin('변경 없음', 'https://example.test'), '변경 없음');
});

test('문자열이 아니면 건드리지 않는다', () => {
  assert.equal(applySiteOrigin(null), null);
  assert.equal(hasSiteOriginToken(null), false);
});
