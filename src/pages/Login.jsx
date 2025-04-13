import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    console.log('Login - Received tokens:', { accessToken, refreshToken });
    console.log('Login - Full URL:', window.location.href);

    if (accessToken && refreshToken) {
      try {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        login({
          accessToken,
          refreshToken,
        });

        console.log('Login - Tokens saved to localStorage');
        navigate('/', { replace: true });
      } catch (error) {
        console.error('토큰 처리 실패:', error);
        navigate('/', { replace: true });
      }
    } else {
      console.log('Login - No tokens received');
      navigate('/', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 로딩 중에는 아무것도 표시하지 않음
  return null;
} 