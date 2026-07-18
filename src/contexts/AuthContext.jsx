import { createContext, useCallback, useContext, useState, useEffect, useRef } from 'react';
import { getCurrentUser, revokeToken } from '../services/userService';
import {
  getCurrentInternalPath,
  readPendingNavigation,
  savePendingNavigation,
} from '../utils/pendingNavigation';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasMaxAccess, setHasMaxAccess] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const intervalRef = useRef(null);
  const hadAuthenticatedSessionRef = useRef(false);

  const fetchUserData = useCallback(async () => {
    try {
      const userData = await getCurrentUser();
      console.log('AuthContext - userData:', userData);
      setUser(userData);
      setIsAuthenticated(true);
      hadAuthenticatedSessionRef.current = true;
      const adminStatus = userData.canManageContent ?? userData.role === 'ROLE_ADMIN';
      console.log('AuthContext - adminStatus:', adminStatus, 'role:', userData.role);
      setIsAdmin(adminStatus);
      setHasMaxAccess(userData.hasMaxAccess ?? false);
    } catch (error) {
      const isSessionExpired = [401, 403].includes(error.response?.status);
      if (
        hadAuthenticatedSessionRef.current
        && isSessionExpired
        && window.location.pathname !== '/login'
      ) {
        const pendingNavigation = readPendingNavigation();
        savePendingNavigation(pendingNavigation?.action
          ? pendingNavigation
          : { returnTo: getCurrentInternalPath() });
        hadAuthenticatedSessionRef.current = false;
        window.location.assign('/login');
      }
      if (!isSessionExpired) {
        console.error('사용자 정보 로드 실패:', error);
      }
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
      setHasMaxAccess(false);
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    await fetchUserData();
    setIsInitialized(true);
  }, [fetchUserData]);

  // 최초 한 번 인증 상태를 확인한다.
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // 로그인 중에는 1분마다 사용자 정보를 갱신한다.
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    intervalRef.current = setInterval(() => {
      fetchUserData();
    }, 60000); // 60초 = 1분

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchUserData, isAuthenticated]);

  const login = async () => {
    try {
      setIsAuthenticated(true);
      await fetchUserData();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    // F-AUTH-7: 서버측 revoke 가 실패하면 클라이언트 쿠키가 남아있을 수 있어 진짜 로그아웃이 아님.
    // httpOnly 쿠키이므로 JS 가 직접 지울 수 없고, 서버의 Set-Cookie max-age=0 응답에 전적으로 의존.
    // 실패 시 사용자에게 알리고 재시도 옵션 제공.
    try {
      await revokeToken();
    } catch (error) {
      console.error('서버 로그아웃 실패:', error);
      // 호출자가 재시도/안내할 수 있도록 throw. 로컬 state 는 초기화하지 않음 (서버 토큰이 살아있어 다음 요청이 자동 인증되므로).
      throw error;
    }
    setIsAuthenticated(false);
    hadAuthenticatedSessionRef.current = false;
    setUser(null);
    setIsAdmin(false);
    setHasMaxAccess(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  if (!isInitialized) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
    </div>;
  }

  const value = {
    isAuthenticated,
    user,
    isAdmin,
    hasMaxAccess,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
