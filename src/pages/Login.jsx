import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    // URL에서 쿼리 파라미터 추출
    const searchParams = new URLSearchParams(location.search);
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const accessTokenExpiresIn = searchParams.get('accessTokenExpiresIn');
    const refreshTokenExpiresIn = searchParams.get('refreshTokenExpiresIn');

    if (accessToken && refreshToken) {
      login({
        accessToken,
        refreshToken,
        accessTokenExpiresIn,
        refreshTokenExpiresIn
      });
      navigate('/', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [login, navigate, location]);

  return null; // 로딩 중에는 아무것도 표시하지 않음
} 