import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import type { UserRole } from '../../types/index';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect client-role users to their portal, others to admin dashboard
    const redirectTo = user.role === 'client' ? '/client' : '/';
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}