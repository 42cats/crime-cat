import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction } from 'lucide-react';

/**
 * 일정 상세 페이지 (Phase 2에서 구현 예정)
 * TODO: 일정 상세 정보 표시
 * TODO: 참여자 목록 및 가용시간 차트
 * TODO: 일정 참여/취소 기능
 */
const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/dashboard/schedule/events');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleGoBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로
        </Button>
        <div>
          <h1 className="text-3xl font-bold">일정 상세</h1>
          <p className="text-muted-foreground mt-1">
            일정 ID: {eventId}
          </p>
        </div>
      </div>

      {/* 개발 중 안내 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="w-5 h-5 text-yellow-500" />
            개발 중인 기능입니다
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 py-12">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <Construction className="w-8 h-8 text-yellow-500" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">일정 상세 페이지 구현 예정</h3>
            <p className="text-muted-foreground mb-4">
              Phase 2 개발 단계에서 다음 기능들이 구현될 예정입니다:
            </p>
            
            <div className="text-left max-w-md mx-auto space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">일정 상세 정보 표시</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">참여자 목록 및 프로필</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">가용시간 시각화 차트</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">일정 참여/취소 인터랙션</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">실시간 업데이트</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleGoBack} variant="outline">
              일정 목록으로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventDetailPage;