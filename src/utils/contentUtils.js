export const stripHtmlToText = (html = '') => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const hasMeaningfulHtmlContent = (html = '') => {
  if (!html || typeof html !== 'string') {
    return false;
  }

  const normalizedHtml = html.trim();
  if (!normalizedHtml) {
    return false;
  }

  if (/<(img|video|iframe|table|ul|ol|blockquote|pre|code)\b/i.test(normalizedHtml)) {
    return true;
  }

  return stripHtmlToText(normalizedHtml).length > 0;
};

export const getHtmlPreviewText = (html = '', maxLength = 80) => {
  if (!hasMeaningfulHtmlContent(html)) {
    return '';
  }

  const text = stripHtmlToText(html);
  if (text) {
    return text.slice(0, maxLength);
  }

  if (/<img\b/i.test(html)) return '이미지 콘텐츠';
  if (/<table\b/i.test(html)) return '표 콘텐츠';
  if (/<(ul|ol)\b/i.test(html)) return '목록 콘텐츠';
  return '서식 콘텐츠';
};

export const extractImageUrlsFromHtml = (html = '') => {
  if (!html || typeof html !== 'string' || typeof DOMParser === 'undefined') {
    return [];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="__content_root__">${html}</div>`, 'text/html');
  const root = doc.getElementById('__content_root__');

  if (!root) {
    return [];
  }

  return Array.from(root.querySelectorAll('img'))
    .map((image) => image.getAttribute('src')?.trim())
    .filter(Boolean);
};

export const mergeUniqueUrls = (...groups) => {
  const seen = new Set();

  return groups
    .flat()
    .filter((url) => {
      if (!url || seen.has(url)) {
        return false;
      }

      seen.add(url);
      return true;
    });
};
