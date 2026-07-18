import { publicHomeData } from '../e2e/fixtures/publicHomeData.js';

export function resolvePublicDraftResponse(method, rawUrl, overrides = {}) {
  const data = { ...publicHomeData, ...overrides };
  const url = new URL(rawUrl, 'http://draft.local');
  const path = url.pathname.replace(/^\/api\/v1/, '');
  if (method !== 'GET') return { status: 405, body: { message: `draft blocks ${method} ${path}` } };
  if (path === '/users') return { status: data.userStatus, body: { message: 'anonymous' } };
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
