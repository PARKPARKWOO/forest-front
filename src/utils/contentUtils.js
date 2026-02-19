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
