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

const normalizeQuillListBlocks = (root, doc) => {
  const quillLists = Array.from(root.querySelectorAll('ol')).filter((node) => {
    return Array.from(node.children).some((child) => {
      return child.nodeType === 1
        && child.tagName.toLowerCase() === 'li'
        && child.hasAttribute('data-list');
    });
  });

  quillLists.forEach((originalList) => {
    const replacement = doc.createDocumentFragment();
    let currentList = null;
    let currentType = null;

    const flushCurrent = () => {
      if (!currentList) {
        return;
      }
      replacement.appendChild(currentList);
      currentList = null;
      currentType = null;
    };

    Array.from(originalList.children).forEach((child) => {
      if (child.nodeType !== 1 || child.tagName.toLowerCase() !== 'li') {
        flushCurrent();
        replacement.appendChild(child.cloneNode(true));
        return;
      }

      const dataListType = child.getAttribute('data-list');
      const nextType = dataListType === 'ordered' ? 'ol' : 'ul';
      if (!currentList || currentType !== nextType) {
        flushCurrent();
        currentType = nextType;
        currentList = doc.createElement(nextType);
      }

      const nextLi = child.cloneNode(true);
      nextLi.removeAttribute('data-list');
      currentList.appendChild(nextLi);
    });

    flushCurrent();
    originalList.replaceWith(replacement);
  });
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

  normalizeQuillListBlocks(root, doc);

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
