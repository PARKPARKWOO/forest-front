import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getCurrentUser, revokeToken } from '../services/userService';
import { getCookie, removeCookie } from '../utils/cookieUtils';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const intervalRef = useRef(null);

  const fetchUserData = async () => {
    try {
      const userData = await getCurrentUser();
      console.log('AuthContext - userData:', userData);
      setUser(userData);
      setIsAuthenticated(true);
      const adminStatus = userData.role === 'ROLE_ADMIN';
      console.log('AuthContext - adminStatus:', adminStatus, 'role:', userData.role);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
    }
  };

  const initializeAuth = async () => {
    await fetchUserData();
    setIsInitialized(true);
  };

  // 초기 인증 및 주기적 사용자 정보 갱신
  useEffect(() => {
    initializeAuth();

    // 1분마다 사용자 정보 갱신
    intervalRef.current = setInterval(() => {
      if (isAuthenticated) {
        fetchUserData();
      }
    }, 60000); // 60초 = 1분

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated]);

  const login = async (userData) => {
    try {
      setIsAuthenticated(true);
      await fetchUserData();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    console.log('🔴 로그아웃 시작');
    try {
      const accessToken = getCookie('accessToken');
      console.log('🔑 액세스 토큰:', accessToken ? '존재함' : '없음');
      
      // 토큰이 있으면 취소 API 호출
      if (accessToken) {
        console.log('📡 토큰 취소 API 호출 시작...');
        const result = await revokeToken(accessToken);
        console.log('✅ 토큰 취소 API 호출 완료:', result);
      } else {
        console.log('⚠️ 토큰이 없어 API 호출 생략');
      }
    } catch (error) {
      console.error('❌ 토큰 취소 실패:', error);
      // 에러가 발생해도 로그아웃은 진행
    } finally {
      console.log('🧹 쿠키 제거 및 상태 초기화');
      // 쿠키 제거 및 상태 초기화
      removeCookie('accessToken');
      removeCookie('refreshToken');
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
      
      // 로그아웃 시 인터벌 정리
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      console.log('✅ 로그아웃 완료');
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
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 