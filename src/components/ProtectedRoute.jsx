import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireMaxAccess = false }) {
  const { isAuthenticated, isAdmin, hasMaxAccess } = useAuth();

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireMaxAccess && !hasMaxAccess) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
