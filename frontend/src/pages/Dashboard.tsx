import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { DailyCheckCard } from '@/components/dashboard/DailyCheckCard';
import { dailycheckService } from '@/api/dailycheckService';
import { useToast } from '@/components/ui/use-toast';

const fetchDailyCheck = async (id: string) => {
  const data = await dailycheckService.getDailyCheck(id);
  return data;
};

const Dashboard: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 로그인 상태 확인 후 리다이렉트
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // 출석 정보 조회
  const {
    data: dailycheck,
    isLoading: isDailyCheckLoading,
    isError: isDailyCheckError,
  } = useQuery({
    queryKey: ['attendance', user?.id],
    queryFn: () => fetchDailyCheck(user!.id),
    enabled: !!user?.id,
  });

  // 출석 체크 mutation
  const checkMutation = useMutation({
    mutationFn: () => dailycheckService.requestDailyCheck(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', user!.id] });
      toast({
        title: '출석 완료 🎉',
        description: '오늘도 출석 체크 성공!',
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: '출석 실패 😢',
        description: '출석 처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    },
  });

  if (!user) return null;

  return (
    <div className="w-full flex justify-center items-center min-h-screen px-4">
      <div className="flex flex-wrap justify-center gap-6">
        <ProfileCard user={user} />

        {isDailyCheckLoading && (
          <div className="text-muted-foreground text-sm">출석 정보를 불러오는 중입니다...</div>
        )}

        {isDailyCheckError && (
          <div className="text-red-500 text-sm">출석 정보를 불러오지 못했습니다.</div>
        )}

        {!isDailyCheckLoading && dailycheck && (
          <DailyCheckCard
            isComplete={dailycheck.isComplete}
            onCheck={() => checkMutation.mutate()}
            isLoading={checkMutation.status === 'pending'}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;