import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
    accessTokenExpiresIn: null,
    refreshTokenExpiresIn: null,
  });

  // URL에서 토큰 파라미터 추출 함수
  const extractTokensFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('accessToken');
    const refreshToken = urlParams.get('refreshToken');
    const accessTokenExpiresIn = urlParams.get('accessTokenExpiresIn');
    const refreshTokenExpiresIn = urlParams.get('refreshTokenExpiresIn');

    if (accessToken && refreshToken) {
      // URL에서 토큰 정보 제거
      window.history.replaceState({}, document.title, window.location.pathname);
      return { accessToken, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn };
    }
    return null;
  };

  // JWT 토큰에서 사용자 정보 추출
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('토큰 파싱 에러:', error);
      return null;
    }
  };

  // 로그인 처리
  const login = (tokens) => {
    const { accessToken, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn } = tokens;
    const userData = parseJwt(accessToken);

    if (userData) {
      const authData = {
        accessToken,
        refreshToken,
        user: {
          id: userData.user_id,
          role: userData.user_role,
          applicationId: userData.application_id,
        },
        isAuthenticated: true,
        accessTokenExpiresIn: parseInt(accessTokenExpiresIn),
        refreshTokenExpiresIn: parseInt(refreshTokenExpiresIn),
      };

      setAuthState(authData);
      localStorage.setItem('authData', JSON.stringify(authData));
    }
  };

  // 로그아웃 처리
  const logout = () => {
    setAuthState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      accessTokenExpiresIn: null,
      refreshTokenExpiresIn: null,
    });
    localStorage.removeItem('authData');
  };

  // 초기 로드시 로컬스토리지에서 인증 상태 복구
  useEffect(() => {
    const storedAuth = localStorage.getItem('authData');
    if (storedAuth) {
      const authData = JSON.parse(storedAuth);
      setAuthState(authData);
    }

    // URL에서 토큰 확인
    const tokens = extractTokensFromUrl();
    if (tokens) {
      login(tokens);
    }
  }, []);

  // 토큰 갱신이 필요한지 확인
  const checkTokenExpiration = () => {
    if (!authState.accessToken) return false;
    
    const tokenData = parseJwt(authState.accessToken);
    if (!tokenData) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    return tokenData.exp < currentTime;
  };

  // 토큰 갱신 함수
  const refreshAuthToken = async () => {
    if (!authState.refreshToken) return false;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: authState.refreshToken,
        }),
      });

      if (response.ok) {
        const newTokens = await response.json();
        login(newTokens);
        return true;
      }
      return false;
    } catch (error) {
      console.error('토큰 갱신 에러:', error);
      return false;
    }
  };

  const value = {
    ...authState,
    login,
    logout,
    checkTokenExpiration,
    refreshAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 커스텀 훅
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 