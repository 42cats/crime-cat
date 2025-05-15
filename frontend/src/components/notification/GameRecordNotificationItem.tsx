import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Notification } from '@/types/notification';
import { GameRecordAcceptModal } from './GameRecordAcceptModal';
import { GameRecordDeclineModal } from './GameRecordDeclineModal';
import { GameRecordAcceptDto, GameRecordDeclineDto } from '@/api/notificationService';
import { cn } from '@/lib/utils';
import { Gamepad2, User, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GameRecordNotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onAction: (action: 'accept' | 'decline', data: GameRecordAcceptDto | GameRecordDeclineDto) => void;
  isLoading: boolean;
}

export const GameRecordNotificationItem: React.FC<GameRecordNotificationItemProps> = ({
  notification,
  onRead,
  onAction,
  isLoading,
}) => {
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: ko,
  });
  
  const isUnread = notification.status === 'UNREAD';
  const isProcessed = notification.status === 'PROCESSED';
  
  // 알림 메타데이터에서 정보 추출 (백엔드에서 dataJson으로 제공)
  const requesterName = notification.senderName || '알 수 없는 사용자';
  
  const handleAccept = (data: GameRecordAcceptDto) => {
    if (!notification.read) {
      onRead(notification.id);
    }
    onAction('accept', data);
    setShowAcceptModal(false);
  };
  
  const handleDecline = (data: GameRecordDeclineDto) => {
    if (!notification.read) {
      onRead(notification.id);
    }
    onAction('decline', data);
    setShowDeclineModal(false);
  };
  
  return (
    <>
      <Card
        className={cn(
          "transition-all duration-200",
          isUnread ? "border-orange-200 bg-orange-50/30" : "bg-card",
          isProcessed && "bg-muted/50"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* 아이콘 */}
            <div className="flex-shrink-0 mt-1">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                isUnread ? "bg-orange-100" : "bg-muted"
              )}>
                <Gamepad2 className={cn(
                  "w-5 h-5",
                  isUnread ? "text-orange-600" : "text-muted-foreground"
                )} />
              </div>
            </div>
            
            {/* 내용 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={cn(
                      "font-semibold text-base",
                      isUnread ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {notification.title}
                    </h3>
                    {isProcessed && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        처리됨
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>요청자: {requesterName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                  
                  {/* 액션 버튼들 */}
                  {!isProcessed && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAcceptModal(true);
                        }}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeclineModal(true);
                        }}
                        disabled={isLoading}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        거절
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* 상태 표시 */}
                {isUnread && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 승인 모달 - z-index 조정 */}
      {showAcceptModal && (
        <GameRecordAcceptModal
          isOpen={showAcceptModal}
          onClose={() => setShowAcceptModal(false)}
          onSubmit={handleAccept}
          notificationId={notification.id}
        />
      )}
      
      {/* 거절 모달 - z-index 조정 */}
      {showDeclineModal && (
        <GameRecordDeclineModal
          isOpen={showDeclineModal}
          onClose={() => setShowDeclineModal(false)}
          onSubmit={handleDecline}
          notificationId={notification.id}
        />
      )}
    </>
  );
};
