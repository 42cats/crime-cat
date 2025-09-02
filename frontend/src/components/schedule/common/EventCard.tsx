import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Clock } from 'lucide-react';
import { EventResponse, PublicEventResponse, EventStatus } from '@/api/schedule/types';
import { useAuth } from '@/hooks/useAuth';
import { mockParticipantCounts } from '@/data/mockScheduleData';

interface EventCardProps {
  event: EventResponse | PublicEventResponse;
  showJoinButton?: boolean;
  onJoin?: (eventId: string) => void;
  onViewDetails?: (eventId: string) => void;
  isJoining?: boolean;
  className?: string;
}

/**
 * 일정 카드 컴포넌트
 * - 일정 기본 정보 표시
 * - 상태별 뱃지 표시
 * - 참여 버튼 (인증된 사용자만)
 * - 상세 보기 기능
 */
export const EventCard: React.FC<EventCardProps> = ({
  event,
  showJoinButton = true,
  onJoin,
  onViewDetails,
  isJoining = false,
  className = '',
}) => {
  const { isAuthenticated } = useAuth();

  // 상태별 뱃지 스타일
  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case EventStatus.RECRUITING:
        return <Badge variant="default" className="bg-green-500">모집중</Badge>;
      case EventStatus.RECRUITMENT_COMPLETE:
        return <Badge variant="secondary">모집완료</Badge>;
      case EventStatus.COMPLETED:
        return <Badge variant="outline">완료</Badge>;
      case EventStatus.CANCELLED:
        return <Badge variant="destructive">취소</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // 카테고리 표시
  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      MEETING: '모임',
      WORKSHOP: '워크샵',
      GAMING: '게임',
      SOCIAL: '소셜',
      STUDY: '스터디',
      OTHER: '기타',
    };
    return categoryMap[category] || category;
  };

  // 생성자 이름 표시 (PublicEventResponse vs EventResponse 구분)
  const getCreatorName = () => {
    if ('creatorNickname' in event) {
      return event.creatorNickname; // PublicEventResponse
    }
    return event.creatorName; // EventResponse
  };

  // 클릭 핸들러
  const handleCardClick = () => {
    onViewDetails?.(event.id);
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    onJoin?.(event.id);
  };

  return (
    <Card 
      className={`hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {event.title}
          </CardTitle>
          {getStatusBadge(event.status)}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {getCategoryLabel(event.category)}
          </Badge>
          <span>by {getCreatorName()}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 설명 */}
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}

        {/* 일정 정보 */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {event.scheduledAt && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(event.scheduledAt), 'MM/dd (E) HH:mm', { locale: ko })}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>
              {mockParticipantCounts[event.id] || 0}명
              {event.maxParticipants && ` / ${event.maxParticipants}명`}
            </span>
          </div>
        </div>

        {/* 생성일 */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{format(new Date(event.createdAt), 'yyyy-MM-dd', { locale: ko })} 생성</span>
        </div>

        {/* 참여 버튼 (인증된 사용자만, 모집 중인 일정만) */}
        {showJoinButton && 
         isAuthenticated && 
         event.status === EventStatus.RECRUITING && 
         onJoin && (
          <div className="pt-2">
            <Button 
              onClick={handleJoinClick}
              disabled={isJoining}
              size="sm"
              className="w-full"
            >
              {isJoining ? '참여 중...' : '참여하기'}
            </Button>
          </div>
        )}

        {/* 비로그인 사용자 안내 */}
        {showJoinButton && 
         !isAuthenticated && 
         event.status === EventStatus.RECRUITING && (
          <div className="pt-2">
            <Button 
              variant="outline"
              size="sm" 
              className="w-full cursor-not-allowed"
              disabled
            >
              로그인 후 참여 가능
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard;