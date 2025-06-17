import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
    allowedRoles?: string[];
    children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles, children }) => {
  const { isLoading, isAuthenticated, hasRole } = useAuth();

  if (isLoading) return null;

  // If no roles specified, just check authentication
  if (!allowedRoles || allowedRoles.length === 0) {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  }

  // If roles specified, check both authentication and roles
  if (!hasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;