import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PageTransition from '@/components/PageTransition';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">🚫 접근이 제한되었습니다</h1>
        <p className="text-muted-foreground mb-6">
          이 페이지에 접근할 권한이 없습니다. 관리자에게 문의하거나 메인 페이지로 돌아가세요.
        </p>
        <Button onClick={() => navigate('/')}>메인 페이지로 이동</Button>
      </div>
    </PageTransition>
  );
};

export default Unauthorized;