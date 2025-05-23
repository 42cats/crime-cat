import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeForm from '@/components/themes/ThemeForm';
import { useAuth } from '@/hooks/useAuth';
import { themesService } from '@/api/themesService';
import { ResizeMode } from '@/utils/imageCompression';

const CreateTheme: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [resizeMode, setResizeMode] = useState<ResizeMode>('fit');

  const state = location.state as { category?: string };
  const initialCategory = state?.category?.toLowerCase() || '';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (formData: FormData) => {
    try {
      await themesService.createTheme(formData);

      if (initialCategory) {
        navigate(`/themes/${initialCategory}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('테마 저장 실패:', err);
    }
  };

  return (
    <ThemeForm 
      mode="create"
      title="새 테마 작성"
      onSubmit={handleSubmit}
      imageOptions={{
        // 테마 썸네일에 적합한 크기로 설정
        width: 800,
        height: 450,
        quality: 0.8,
        backgroundColor: '#FFFFFF'
      }}
    />
  );
};

export default CreateTheme;