import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import ThemeForm from '@/components/themes/ThemeForm';
import { useAuth } from '@/hooks/useAuth';

const CreateTheme: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (formData: FormData) => {
    try {
      const res = await fetch('/api/themes', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('업로드 실패');

      navigate('/themes');
    } catch (err) {
      console.error('테마 저장 실패:', err);
    }
  };

  return (
    <ThemeForm 
      mode='create'
      title='새 명령어 작성'
      onSubmit={handleSubmit} 
    />
  );
};

export default CreateTheme;
