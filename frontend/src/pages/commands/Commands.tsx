import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import CommandList from '@/components/commands/CommandList';
import PageTransition from '@/components/PageTransition';
import { commandsService } from '@/api/commandsService';
import { Card } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

const Commands: React.FC = () => {
  const navigate = useNavigate();
  const { data: commands, isLoading, error } = useQuery({
    queryKey: ['commands'],
    queryFn: commandsService.getCommands,
  });
  const { hasRole } = useAuth();

  if (isLoading) {
    return (
      <PageTransition>
        <div className="container mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">명령어 불러오는 중...</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              봇에서 사용 가능한 명령어 목록을 불러오고 있습니다. 잠시만 기다려 주세요.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            <div className="flex mb-6 space-x-2">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-10 w-24 rounded-md" />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-20 w-full" />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="container mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">명령어 로딩 실패</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              명령어를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">봇 명령어</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            짭냥이 봇에서 사용할 수 있는 모든 명령어를 확인해보세요. 원하는 명령어를 검색하거나 카테고리로 필터링할 수 있습니다.
          </p>
        </div>
        {hasRole(['ADMIN', 'MANAGER']) && (
        <div className="max-w-6xl mx-auto mb-6 text-right">
            <Button onClick={() => navigate('/commands/new')}>
                등록
            </Button>
        </div>
        )}
        <div className="max-w-4xl mx-auto">
          <CommandList commands={commands || []} />
        </div>
      </div>
    </PageTransition>
  );
};

export default Commands;
