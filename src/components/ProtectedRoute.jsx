import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // 개발 환경이거나 관리자인 경우 접근 허용
  if (isDevelopment || isAdmin) {
    return children;
  }

  // 운영 환경에서 관리자가 아닌 경우 접근 차단
  return <Navigate to="/" replace />;
} 