/**
 * 해시태그 추출·링크 변환.
 *
 * 추출 규칙은 백엔드 `HashtagExtractor` 와 동일해야 한다. 서버가 저장하는 태그와
 * 에디터가 보여주는 태그가 어긋나면 사용자가 붙였다고 생각한 태그로 검색이 안 된다.
 *
 * 본문에는 사용자가 입력한 `#단어` 를 그대로 저장하고 링크는 읽는 시점에만 만든다.
 * 저장본에 생성 마크업이 없어야 Quill 재편집에서 태그가 소실되지 않고,
 * 에디터 도입 이전 게시글도 백필 없이 같은 규칙으로 링크가 걸린다.
 */

export const HASHTAG_MAX_COUNT = 30;
export const HASHTAG_MAX_LENGTH = 50;

const NUMERIC_CHARACTER_REFERENCE = /&#x?[0-9a-fA-F]+;/g;
const HTML_TAG = /<[^>]*>/g;
// 앞 글자가 문자/숫자/밑줄이면 단어 중간의 `#` 이므로 태그가 아니다.
const HASHTAG_PATTERN = /(?<![\p{L}\p{N}_])#([\p{L}\p{N}_]+)/gu;

const isTaggable = (candidate) => (
  candidate.length <= HASHTAG_MAX_LENGTH
  // 색상코드나 번호가 태그로 잡히지 않도록 글자를 하나는 포함해야 한다.
  && /\p{L}/u.test(candidate)
);

export function extractHashtags(content) {
  if (typeof content !== 'string' || content.length === 0) return [];

  const plainText = content
    .replace(NUMERIC_CHARACTER_REFERENCE, ' ')
    .replace(HTML_TAG, ' ');

  const found = [];
  for (const match of plainText.matchAll(HASHTAG_PATTERN)) {
    const candidate = match[1];
    if (!isTaggable(candidate) || found.includes(candidate)) continue;
    found.push(candidate);
    if (found.length === HASHTAG_MAX_COUNT) break;
  }
  return found;
}

export const tagBrowsePath = (tag) => `/news/activities?tag=${encodeURIComponent(tag)}`;

/**
 * 이미 정화된 HTML의 텍스트 노드에서만 `#단어` 를 링크로 바꾼다.
 * 속성값과 기존 링크 안쪽은 건드리지 않는다.
 */
export function linkifyHashtags(sanitizedHtml) {
  if (typeof sanitizedHtml !== 'string' || sanitizedHtml.length === 0) return '';
  if (typeof DOMParser === 'undefined') return sanitizedHtml;

  const parser = new DOMParser();
  const document = parser.parseFromString(`<body>${sanitizedHtml}</body>`, 'text/html');
  const body = document.body;
  if (!body) return sanitizedHtml;

  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  const targets = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    // 이미 링크 안에 있는 텍스트는 중첩 링크가 되므로 건너뛴다.
    if (node.parentElement?.closest('a')) continue;
    if (node.nodeValue && node.nodeValue.includes('#')) targets.push(node);
  }

  targets.forEach((node) => {
    const text = node.nodeValue;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    for (const match of text.matchAll(HASHTAG_PATTERN)) {
      const tag = match[1];
      if (!isTaggable(tag)) continue;
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      const anchor = document.createElement('a');
      anchor.setAttribute('href', tagBrowsePath(tag));
      anchor.setAttribute('data-hashtag', tag);
      anchor.className = 'forest-hashtag';
      anchor.textContent = `#${tag}`;
      fragment.appendChild(anchor);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex === 0) return;
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
    node.parentNode?.replaceChild(fragment, node);
  });

  return body.innerHTML;
}
