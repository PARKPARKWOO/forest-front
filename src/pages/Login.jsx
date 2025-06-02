import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCookie } from '../utils/cookieUtils';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const accessToken = getCookie('accessToken');
    const refreshToken = getCookie('refreshToken');

    console.log('Login - Received tokens from cookies:', { accessToken, refreshToken });
    console.log('Login - Full URL:', window.location.href);

    if (accessToken && refreshToken) {
      try {
        login({
          accessToken,
          refreshToken,
        });

        console.log('Login - Tokens loaded from cookies');
        navigate('/', { replace: true });
      } catch (error) {
        console.error('토큰 처리 실패:', error);
        navigate('/', { replace: true });
      }
    } else {
      console.log('Login - No tokens found in cookies');
      navigate('/', { replace: true });
    }
  }, [login, navigate]);

  // 로딩 중에는 아무것도 표시하지 않음
  return null;
} 