const BULLET_LIST_PATTERN = /^[-*•]\s+(.+)$/;
const ORDERED_LIST_PATTERN = /^\d+[\.\)]\s+(.+)$/;

const parseListLine = (rawText) => {
  if (!rawText) {
    return null;
  }

  const text = rawText.replace(/\u00a0/g, ' ').trim();
  if (!text) {
    return null;
  }

  const bulletMatch = text.match(BULLET_LIST_PATTERN);
  if (bulletMatch?.[1]) {
    return { type: 'ul', value: bulletMatch[1].trim() };
  }

  const orderedMatch = text.match(ORDERED_LIST_PATTERN);
  if (orderedMatch?.[1]) {
    return { type: 'ol', value: orderedMatch[1].trim() };
  }

  return null;
};

const isSimpleTextBlock = (node) => {
  if (!node || node.nodeType !== 1) {
    return false;
  }

  const tagName = node.tagName.toLowerCase();
  if (tagName !== 'p' && tagName !== 'div') {
    return false;
  }

  return Array.from(node.children).every((child) => child.tagName.toLowerCase() === 'br');
};

export const normalizeListMarkup = (html = '') => {
  if (typeof html !== 'string' || !html.trim()) {
    return html || '';
  }

  if (typeof DOMParser === 'undefined') {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="__editor_root__">${html}</div>`, 'text/html');
  const root = doc.getElementById('__editor_root__');
  if (!root) {
    return html;
  }

  const fragment = doc.createDocumentFragment();
  let currentList = null;
  let currentListType = null;

  const flushList = () => {
    if (!currentList) {
      return;
    }
    fragment.appendChild(currentList);
    currentList = null;
    currentListType = null;
  };

  const nodes = Array.from(root.childNodes);
  for (const node of nodes) {
    if (node.nodeType === 1) {
      const tagName = node.tagName.toLowerCase();
      if (tagName === 'ul' || tagName === 'ol') {
        flushList();
        fragment.appendChild(node.cloneNode(true));
        continue;
      }
    }

    if (isSimpleTextBlock(node)) {
      const listLine = parseListLine(node.textContent || '');
      if (listLine) {
        if (!currentList || currentListType !== listLine.type) {
          flushList();
          currentListType = listLine.type;
          currentList = doc.createElement(listLine.type);
        }

        const li = doc.createElement('li');
        li.textContent = listLine.value;
        currentList.appendChild(li);
        continue;
      }
    }

    flushList();
    fragment.appendChild(node.cloneNode(true));
  }

  flushList();
  root.innerHTML = '';
  root.appendChild(fragment);
  return root.innerHTML;
};
