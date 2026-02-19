const padTwo = (value) => String(value).padStart(2, '0');

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatKoreanDateTime = (value) => {
  const date = toDate(value);
  if (!date) return value || '';

  return `${date.getFullYear()}.${padTwo(date.getMonth() + 1)}.${padTwo(date.getDate())} ${padTwo(date.getHours())}:${padTwo(date.getMinutes())}`;
};

export const formatKoreanDate = (value) => {
  const date = toDate(value);
  if (!date) return value || '';

  return `${date.getFullYear()}.${padTwo(date.getMonth() + 1)}.${padTwo(date.getDate())}`;
};

export const formatKoreanDateRange = (start, end, withTime = true) => {
  const format = withTime ? formatKoreanDateTime : formatKoreanDate;
  const startText = format(start);
  const endText = format(end);

  if (!startText && !endText) return '';
  if (!endText) return startText;
  if (!startText) return endText;
  return `${startText} ~ ${endText}`;
};
