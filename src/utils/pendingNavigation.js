const PENDING_NAVIGATION_KEY = 'forest:pending-navigation';
const PENDING_NAVIGATION_TTL_MS = 30 * 60 * 1000;

const isSafeInternalPath = (path) => (
  typeof path === 'string'
  && path.startsWith('/')
  && !path.startsWith('//')
);

export const readPendingNavigation = () => {
  if (typeof window === 'undefined') return null;

  try {
    const rawValue = window.sessionStorage.getItem(PENDING_NAVIGATION_KEY);
    if (!rawValue) return null;

    const value = JSON.parse(rawValue);
    const isExpired = !value?.savedAt
      || Date.now() - value.savedAt > PENDING_NAVIGATION_TTL_MS;

    if (isExpired || !isSafeInternalPath(value.returnTo)) {
      window.sessionStorage.removeItem(PENDING_NAVIGATION_KEY);
      return null;
    }

    return value;
  } catch {
    try {
      window.sessionStorage.removeItem(PENDING_NAVIGATION_KEY);
    } catch {
      // 저장소가 차단된 환경에서는 복귀 정보 없이 계속 진행한다.
    }
    return null;
  }
};

export const savePendingNavigation = ({ returnTo, action, programId } = {}) => {
  if (typeof window === 'undefined' || !isSafeInternalPath(returnTo)) return;

  const value = {
    returnTo,
    action: action ?? null,
    programId: programId ?? null,
    savedAt: Date.now(),
  };

  try {
    window.sessionStorage.setItem(PENDING_NAVIGATION_KEY, JSON.stringify(value));
  } catch {
    // 저장소 사용이 불가능해도 로그인/신청 흐름 자체는 계속 진행한다.
  }
};

export const clearPendingNavigation = () => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(PENDING_NAVIGATION_KEY);
  } catch {
    // 저장소가 차단된 환경에서는 정리 실패를 무시한다.
  }
};

export const getCurrentInternalPath = () => {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};
