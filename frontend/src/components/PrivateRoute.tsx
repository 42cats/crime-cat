import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
    allowedRoles: string[];
    children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles, children }) => {
  const { isLoading, hasRole } = useAuth();

  if (isLoading) return null;

  if (!hasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;