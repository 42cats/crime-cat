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

  const { data, isLoading, error } = useQuery({
    queryKey: ['theme', id],
    queryFn: () => (id ? themesService.getThemeById(id) : Promise.reject('No ID')),
    enabled: !!id && !initialTheme,
    initialData: initialTheme,
  });

  // 에러 로그 추가
  React.useEffect(() => {
    if (error) {
      console.error('테마 로드 오류:', error);
    }
  }, [error]);

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
        // 테마 타입을 라우팅 경로에 맞게 변환 (ESCAPE_ROOM -> escape-room)
        const themeTypeForRoute = data.type.toLowerCase().replace('_', '-');
        navigate(`/themes/${themeTypeForRoute}/${id}`);
      } else {
        navigate('/');
      }
    },
  });

  const handleSubmit = (formData: FormData) => {
    updateMutation.mutate(formData);
  };

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p>테마 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 처리
  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">테마를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-4">
            요청하신 테마가 존재하지 않거나 접근 권한이 없습니다.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

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