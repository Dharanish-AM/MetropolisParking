import type { FC, ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactElement;
  allowedRoles?: Array<'ADMIN' | 'CUSTOMER'>;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Loading"
        className="min-h-screen flex items-center justify-center bg-neutral-bg"
      >
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
