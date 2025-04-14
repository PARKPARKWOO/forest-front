import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/userService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 컴포넌트 마운트 시 로컬 스토리지에서 토큰 확인
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (accessToken && refreshToken) {
        try {
          const userInfo = await getCurrentUser();
          setUser(userInfo);
          setIsAuthenticated(true);
          setIsAdmin(userInfo.role === 'ROLE_ADMIN');
        } catch (error) {
          console.error('사용자 정보 조회 실패:', error);
          logout();
        }
      }
      
      setIsInitialized(true);
    };

    initializeAuth();
  }, []);

  const login = async (userData) => {
    setIsAuthenticated(true);
    try {
      const userInfo = await getCurrentUser();
      setUser(userInfo);
      setIsAdmin(userInfo.role === 'ROLE_ADMIN');
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setUser(null);
    setIsAdmin(false);
  };

  // 초기화가 완료될 때까지 로딩 상태 표시
  if (!isInitialized) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 커스텀 훅 추가
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 