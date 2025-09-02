import React from 'react';
import { EventCard } from './EventCard';
import { LoadingSpinner } from './LoadingSpinner';
import { EventResponse, PublicEventResponse } from '@/api/schedule/types';

interface EventListProps {
  events: (EventResponse | PublicEventResponse)[];
  isLoading?: boolean;
  showJoinButton?: boolean;
  onJoin?: (eventId: string) => void;
  onViewDetails?: (eventId: string) => void;
  joiningEventId?: string;
  emptyMessage?: string;
  className?: string;
}

/**
 * 일정 목록 컴포넌트
 * - 일정 카드들의 컨테이너
 * - 로딩 상태 표시
 * - 빈 목록 메시지 표시
 * - 그리드 레이아웃 (반응형)
 */
export const EventList: React.FC<EventListProps> = ({
  events,
  isLoading = false,
  showJoinButton = true,
  onJoin,
  onViewDetails,
  joiningEventId,
  emptyMessage = '등록된 일정이 없습니다.',
  className = '',
}) => {
  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // 빈 목록일 때
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          일정이 없습니다
        </h3>
        <p className="text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 반응형 그리드 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            showJoinButton={showJoinButton}
            onJoin={onJoin}
            onViewDetails={onViewDetails}
            isJoining={joiningEventId === event.id}
          />
        ))}
      </div>
    </div>
  );
};

export default EventList;