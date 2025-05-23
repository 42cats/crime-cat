import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ThemeForm from '@/components/themes/ThemeForm';
import { themesService } from '@/api/content';
import { Theme } from '@/lib/types';
import { ResizeMode } from '@/utils/imageCompression';

const EditTheme: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [resizeMode, setResizeMode] = useState<ResizeMode>('fit');

  const initialTheme = (location.state as { theme?: Theme })?.theme;

  const { data, isLoading } = useQuery({
    queryKey: ['theme', id],
    queryFn: () => (id ? themesService.getThemeById(id) : Promise.reject('No ID')),
    enabled: !!id && !initialTheme,
    initialData: initialTheme,
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // FormData에서 JSON 데이터 추출하여 테마 타입 확인
      const dataBlob = formData.get('data') as Blob;
      if (!dataBlob) {
        throw new Error('테마 데이터가 없습니다.');
      }
      
      const jsonText = await dataBlob.text();
      const themeData = JSON.parse(jsonText);
      const themeType = themeData.type;
      
      if (!themeType) {
        throw new Error('테마 타입이 지정되지 않았습니다.');
      }
      
      return themesService.updateTheme(id!, formData, themeType as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
	  queryClient.invalidateQueries({ queryKey: ['theme', id] });
      if (data) {
        navigate(`/themes/${data.type}/${id}`);
      } else {
        navigate('/');
      }
    },
  });

  const handleSubmit = (formData: FormData) => {
    updateMutation.mutate(formData);
  };

  if (!data) return null;

  return (
    <ThemeForm
      mode="edit"
      title="테마 수정"
      initialData={data}
      onSubmit={handleSubmit}
      isLoading={updateMutation.isPending}
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

export default EditTheme;