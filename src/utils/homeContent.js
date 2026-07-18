import { sortProgramsByStatus } from './programStatus';

export const HOME_IMAGE_FALLBACK = '/draft/forest-hero-placeholder.svg';

export const selectActivePrograms = (programs) => sortProgramsByStatus(
  Array.isArray(programs) ? programs : [],
).filter(({ status }) => status === 'IN_PROGRESS').slice(0, 3);

export const sortHomeNotices = (notices) => [...(Array.isArray(notices) ? notices : [])]
  .sort((a, b) => {
    const important = Number(Boolean(b.dynamicFields?.important)) - Number(Boolean(a.dynamicFields?.important));
    return important || new Date(b.updatedAt) - new Date(a.updatedAt);
  })
  .slice(0, 5);

export const extractPostThumbnail = (post) => {
  if (post?.thumbnail) return post.thumbnail;
  return post?.content?.match(/<img[^>]+src=['"]([^'"]+)['"]/i)?.[1] || null;
};

export const getCollectionStatus = ({ isLoading, isError, value }) => {
  if (isLoading) return 'loading';
  if (isError || !Array.isArray(value)) return 'error';
  return value.length === 0 ? 'empty' : 'success';
};

export const formatCapacity = (value) => {
  const capacity = Number(value);
  if (!Number.isFinite(capacity) || capacity < 0) return '정원 상세에서 확인';
  if (capacity === 0) return '정원 제한 없음';
  return `최대 ${capacity}명`;
};
