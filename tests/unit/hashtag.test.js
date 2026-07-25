import assert from 'node:assert/strict';
import test from 'node:test';
import { HASHTAG_MAX_COUNT, extractHashtags, tagBrowsePath } from '../../src/utils/hashtag.js';

// 이 규칙은 백엔드 HashtagExtractor 와 같아야 한다. 어긋나면 에디터가 보여준 태그와
// 서버가 실제로 저장한 태그가 달라진다.
test('본문 평문에서 한글 영문 숫자 밑줄 태그를 뽑는다', () => {
  assert.deepEqual(
    extractHashtags('<p>#숲가꾸기 활동 #forest #숲2026 #초록_숲</p>'),
    ['숲가꾸기', 'forest', '숲2026', '초록_숲'],
  );
});

test('링크 마크업 안의 태그도 동일하게 뽑는다', () => {
  const html = '<p><a href="/news/activities?tag=숲가꾸기">#숲가꾸기</a> 함께해요</p>';
  assert.deepEqual(extractHashtags(html), ['숲가꾸기']);
});

test('같은 태그는 처음 순서로 한 번만 남는다', () => {
  assert.deepEqual(extractHashtags('#숲 #나무 #숲 #나무 #숲'), ['숲', '나무']);
});

test('태그가 없으면 빈 목록', () => {
  assert.deepEqual(extractHashtags('<p>태그 없는 본문</p>'), []);
  assert.deepEqual(extractHashtags(''), []);
  assert.deepEqual(extractHashtags(null), []);
  assert.deepEqual(extractHashtags(undefined), []);
});

test('HTML 속성 안의 값은 태그로 오인하지 않는다', () => {
  assert.deepEqual(extractHashtags('<p style="color:#166534" data-x="#hidden">본문</p>'), []);
});

test('숫자로만 이루어진 토큰은 태그가 아니다', () => {
  assert.deepEqual(extractHashtags('색상 #166534 그리고 #2026'), []);
});

test('숫자 문자 참조는 태그로 오인하지 않는다', () => {
  assert.deepEqual(extractHashtags('&#39;따옴표&#39; #숲'), ['숲']);
});

test('단어 중간의 샵은 태그가 아니다', () => {
  assert.deepEqual(extractHashtags('email#tag 와 abc#def'), []);
});

test('최대 길이를 넘는 태그는 버린다', () => {
  const tooLong = '가'.repeat(51);
  const allowed = '나'.repeat(50);
  assert.deepEqual(extractHashtags(`#${tooLong} #${allowed}`), [allowed]);
});

test('태그 개수는 상한을 넘지 않는다', () => {
  const many = Array.from({ length: 40 }, (_, i) => `#태그${i + 1}`).join(' ');
  assert.equal(extractHashtags(many).length, HASHTAG_MAX_COUNT);
});

test('태그 모아보기 경로는 태그를 인코딩한다', () => {
  assert.equal(tagBrowsePath('숲가꾸기'), `/news/activities?tag=${encodeURIComponent('숲가꾸기')}`);
  assert.equal(tagBrowsePath('a b&c'), `/news/activities?tag=${encodeURIComponent('a b&c')}`);
});
