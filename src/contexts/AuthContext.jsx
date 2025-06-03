import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/userService';
import { getCookie, removeCookie } from '../utils/cookieUtils';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeAuth = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
      setIsAdmin(userData.authorities?.some(auth => auth.authority === 'ROLE_ADMIN'));
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
      setIsAuthenticated(true);
    }
    setIsInitialized(true);
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const login = async (userData) => {
    try {
      setIsAuthenticated(true);
      const userInfo = await getCurrentUser();
      setUser(userInfo);
      setIsAdmin(userInfo.role === 'ROLE_ADMIN');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = () => {
    removeCookie('accessToken');
    removeCookie('refreshToken');
    setIsAuthenticated(false);
    setUser(null);
    setIsAdmin(false);
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