import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * 인증이 필요한 페이지를 보호하는 컴포넌트
 * @param children 보호할 컨텐츠
 * @param redirectTo 미인증 시 리다이렉트할 경로 (기본: /login)
 * @param fallback 로딩 중에 표시할 컴포넌트
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  redirectTo = '/login',
  fallback
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  // 로딩 중
  if (isLoading) {
    return fallback || (
      <div className="flex justify-center items-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 미인증 상태
  if (!isAuthenticated) {
    return null;
  }

  // 인증된 상태
  return <>{children}</>;
};

/**
 * 인증이 필요한 페이지를 위한 HOC
 * @param WrappedComponent 보호할 컴포넌트
 * @param redirectTo 미인증 시 리다이렉트할 경로
 */
export function withAuthGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  redirectTo?: string
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const AuthGuardedComponent = (props: P) => (
    <AuthGuard redirectTo={redirectTo}>
      <WrappedComponent {...props} />
    </AuthGuard>
  );

  AuthGuardedComponent.displayName = `withAuthGuard(${displayName})`;

  return AuthGuardedComponent;
}
