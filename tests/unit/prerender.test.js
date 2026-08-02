import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  buildEntryJsonLd,
  renderEntry,
  toDescription,
  toOutputPath,
  toPageTitle,
} from '../../build/prerender.js';

const shellPath = fileURLToPath(new URL('../../index.html', import.meta.url));
const ORIGIN = 'https://example.test';

const loadShell = async () => (await readFile(shellPath, 'utf8')).replaceAll('__SITE_ORIGIN__', ORIGIN);

const countMatches = (html, pattern) => [...html.matchAll(pattern)].length;

test('경로마다 캐노니컬과 og:url 이 자기 자신을 가리킨다', async () => {
  // 이게 이번 작업의 핵심이다. 예전에는 모든 경로가 홈을 캐노니컬로 주장해서
  // 자바스크립트를 실행하지 않는 수집기에게는 홈 1개만 색인됐다.
  const shell = await loadShell();
  const html = renderEntry(shell, { kind: 'static', path: '/intro/greeting', name: '인사말' }, ORIGIN);

  assert.match(html, /<link[^>]*rel="canonical"[^>]*href="https:\/\/example\.test\/intro\/greeting"/);
  assert.match(html, /<meta[^>]*property="og:url"[^>]*content="https:\/\/example\.test\/intro\/greeting"/);
  assert.match(html, /<title>인사말 \| 전북생명의숲<\/title>/);
});

test('캐노니컬·og:url·title 이 문서당 정확히 하나씩만 남는다', async () => {
  // 예전에 정적 태그와 Helmet 태그가 함께 남아 캐노니컬이 2개가 된 적이 있다.
  const shell = await loadShell();
  const html = renderEntry(shell, { kind: 'static', path: '/programs', name: '참여 프로그램' }, ORIGIN);

  assert.equal(countMatches(html, /rel="canonical"/g), 1);
  assert.equal(countMatches(html, /property="og:url"/g), 1);
  assert.equal(countMatches(html, /<title>/g), 1);
  assert.equal(countMatches(html, /name="description"/g), 1);
});

test('홈은 셸 자신이므로 프리렌더 대상이 아니다', () => {
  assert.equal(toOutputPath('/'), null);
  assert.equal(toOutputPath('/intro'), 'intro/index.html');
  assert.equal(toOutputPath('/post/123/456'), 'post/123/456/index.html');
});

test('본문에서 뽑은 설명은 태그를 걷어내고 길이를 제한한다', () => {
  assert.equal(toDescription('<p>숲을 <strong>가꿉니다</strong></p>'), '숲을 가꿉니다');
  assert.equal(toDescription('<p>&nbsp;</p>', '기본값'), '기본값');
  assert.equal(toDescription('', '기본값'), '기본값');
  assert.equal(toDescription(null, '기본값'), '기본값');

  const long = toDescription(`<p>${'가'.repeat(400)}</p>`);
  assert.ok(long.length <= 150, `설명이 너무 길다: ${long.length}`);
  assert.ok(long.endsWith('…'));
});

test('제목은 사이트명을 중복해서 붙이지 않는다', () => {
  assert.equal(toPageTitle(null), '전북생명의숲 | 숲과 함께하는 녹색 미래');
  assert.equal(toPageTitle('전북생명의숲'), '전북생명의숲 | 숲과 함께하는 녹색 미래');
  assert.equal(toPageTitle('공지사항'), '공지사항 | 전북생명의숲');
});

test('상세 페이지는 종류에 맞는 구조화 데이터를 갖는다', () => {
  const article = buildEntryJsonLd(
    { kind: 'post', path: '/post/1/2', name: '숲 이야기', description: '설명', updatedAt: '2026-02-13T14:22:01' },
    ORIGIN,
  );
  assert.equal(article['@type'], 'Article');
  assert.equal(article.headline, '숲 이야기');
  assert.equal(article.dateModified, '2026-02-13T14:22:01');

  const event = buildEntryJsonLd(
    { kind: 'program', path: '/programs/detail/1', name: '탐사대작전', description: '설명', eventDate: '2026-05-01' },
    ORIGIN,
  );
  assert.equal(event['@type'], 'Event');
  assert.equal(event.startDate, '2026-05-01');

  // 값이 없으면 필드를 넣지 않는다 — 지어낸 값보다 없는 편이 낫다.
  const noDate = buildEntryJsonLd({ kind: 'program', path: '/p', name: '이름', description: '설명' }, ORIGIN);
  assert.ok(!('startDate' in noDate));

  assert.equal(buildEntryJsonLd({ kind: 'static', path: '/intro', name: '단체소개' }, ORIGIN), null);
});

test('구조화 데이터의 닫는 태그 문자가 스크립트를 조기 종료시키지 않는다', async () => {
  const shell = await loadShell();
  const html = renderEntry(shell, {
    kind: 'post',
    path: '/post/1/2',
    name: '</script><img src=x>',
    description: '설명',
  }, ORIGIN);

  assert.ok(!html.includes('</script><img src=x>'));
  assert.match(html, /\\u003c\/script/);
});

test('셸의 단체 JSON-LD 는 프리렌더 후에도 남는다', async () => {
  const shell = await loadShell();
  const html = renderEntry(shell, { kind: 'notice', path: '/news/notice/1', name: '공지', description: '설명' }, ORIGIN);

  // 단체 정보(NGO/WebSite)와 페이지별 Article 이 함께 있어야 한다.
  assert.equal(countMatches(html, /application\/ld\+json/g), 2);
  assert.match(html, /"@type": \["NGO", "Organization"\]/);
  assert.match(html, /"@type":"Article"/);
});
