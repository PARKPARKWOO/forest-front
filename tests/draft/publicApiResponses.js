import { publicHomeData } from '../e2e/fixtures/publicHomeData.js';
import { extractHashtags as extractDraftHashtags } from '../../src/utils/hashtag.js';

export function resolvePublicDraftResponse(method, rawUrl, overrides = {}) {
  const data = { ...publicHomeData, ...overrides };
  const url = new URL(rawUrl, 'http://draft.local');
  const path = url.pathname.replace(/^\/api\/v1/, '');
  if (method !== 'GET') return { status: 405, body: { message: `draft blocks ${method} ${path}` } };
  if (path === '/users') return { status: data.userStatus, body: { message: 'anonymous' } };
  if (path === '/organization') return { status: 200, body: { data: data.organization } };
  const staticKey = path.match(/^\/static-content\/([^/]+)$/)?.[1];
  if (staticKey) return { status: 200, body: { data: data.staticContents?.[staticKey] ?? null } };
  if (path === '/categories') return { status: 200, body: { data: data.categories } };
  if (path === '/home-banner') return { status: 200, body: { data: data.banner } };
  if (path === '/program/information') {
    return { status: 200, body: { data: { contents: data.programs, hasNextPage: false, totalCount: data.programs.length } } };
  }
  const programId = path.match(/^\/program\/information\/([^/]+)$/)?.[1];
  if (programId) {
    const program = data.programs.find(({ id }) => id === programId);
    return program
      ? { status: 200, body: { data: program } }
      : { status: 404, body: { message: 'program not found' } };
  }
  if (path.startsWith('/program/form/program/')) return { status: 200, body: { data: null } };
  if (path === '/notice') {
    return { status: 200, body: { data: { contents: data.notices, hasNextPage: false, totalCount: 0 } } };
  }
  const noticeId = path.match(/^\/notice\/([^/]+)$/)?.[1];
  if (noticeId) {
    const notice = data.notices.find(({ id }) => id === noticeId);
    return notice
      ? { status: 200, body: { data: notice } }
      : { status: 404, body: { message: 'notice not found' } };
  }
  if (path === '/posts/search') {
    const query = (url.searchParams.get('q') || '').trim().toLowerCase();
    const tag = (url.searchParams.get('tag') || '').trim();
    const page = Number(url.searchParams.get('page') || 1);
    const size = Number(url.searchParams.get('size') || 9);
    const pool = [...(data.activities || []), ...Object.values(data.boardPosts || {}).flat()];
    const hasTag = (post, wanted) => extractDraftHashtags(post.content).includes(wanted);
    const matched = (!query && !tag) ? [] : pool.filter((post) => {
      if (tag) return hasTag(post, tag);
      return String(post.title || '').toLowerCase().includes(query)
        || String(post.content || '').toLowerCase().includes(query)
        || hasTag(post, query);
    });
    const from = (page - 1) * size;
    return {
      status: 200,
      body: {
        data: {
          contents: matched.slice(from, from + size),
          hasNextPage: from + size < matched.length,
          totalCount: matched.length,
        },
      },
    };
  }
  if (path === '/posts/0') {
    return { status: 200, body: { data: { contents: data.activities, hasNextPage: false, totalCount: 0 } } };
  }
  const boardMatch = path.match(/^\/posts\/(\d+)$/);
  if (boardMatch) {
    const posts = data.boardPosts[boardMatch[1]] || [];
    return { status: 200, body: { data: { contents: posts, hasNextPage: false, totalCount: 0 } } };
  }
  const detailMatch = path.match(/^\/posts\/detail\/(\d+)\/([^/]+)$/);
  if (detailMatch) {
    const [, categoryId, postId] = detailMatch;
    const post = (categoryId === '0' ? data.activities : data.boardPosts[categoryId] || [])
      .find(({ id }) => id === postId);
    return post
      ? { status: 200, body: { data: { ...post, categoryId } } }
      : { status: 404, body: { message: 'post not found' } };
  }
  return { status: 501, body: { message: `unhandled draft API: ${path}` } };
}
