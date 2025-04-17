import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/userService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 초기화 함수
  const initializeAuth = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      console.log('Initializing Auth - Tokens:', { accessToken, refreshToken });
      
      if (accessToken && refreshToken) {
        try {
          const userInfo = await getCurrentUser();
          console.log('User Info loaded:', userInfo);
          
          setUser(userInfo);
          setIsAuthenticated(true);
          setIsAdmin(userInfo.role === 'ROLE_ADMIN');
        } catch (error) {
          console.error('사용자 정보 조회 실패:', error);
          // 에러 발생 시에도 토큰은 유지
          setIsAuthenticated(true);
        }
      } else {
        console.log('No tokens found in localStorage');
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    initializeAuth();
  }, []);

  const login = async (userData) => {
    try {
      localStorage.setItem('accessToken', userData.accessToken);
      localStorage.setItem('refreshToken', userData.refreshToken);
      
      setIsAuthenticated(true);
      
      const userInfo = await getCurrentUser();
      setUser(userInfo);
      setIsAdmin(userInfo.role === 'ROLE_ADMIN');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
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