import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Notification } from '@/types/notification';
import { handleNotificationRouting } from '@/utils/notificationRouting';
import { cn } from '@/lib/utils';
import { Megaphone, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SystemNotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

export const SystemNotificationItem: React.FC<SystemNotificationItemProps> = ({
  notification,
  onRead,
  onClick,
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (notification.status === 'UNREAD') {
      onRead(notification.id);
    }
    
    // onClick prop이 있으면 실행, 없으면 기본 라우팅
    if (onClick) {
      onClick(notification);
    } else {
      handleNotificationRouting.navigate(notification, navigate);
    }
  };
  
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: ko,
  });
  
  const isUnread = notification.status === 'UNREAD';
  const isProcessed = notification.status === 'PROCESSED';
  
  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md cursor-pointer",
        isUnread ? "border-blue-200 bg-blue-50/30" : "bg-card",
        isProcessed && "bg-muted/50"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* 아이콘 */}
          <div className="flex-shrink-0 mt-1">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isUnread ? "bg-blue-100" : "bg-muted"
            )}>
              <Megaphone className={cn(
                "w-5 h-5",
                isUnread ? "text-blue-600" : "text-muted-foreground"
              )} />
            </div>
          </div>
          
          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className={cn(
                  "font-semibold text-base leading-tight",
                  isUnread ? "text-foreground" : "text-muted-foreground"
                )}>
                  {notification.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {notification.message}
                </p>
                
                <div className="flex items-center gap-2 mt-3">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {timeAgo}
                  </span>
                  
                  {isProcessed && (
                    <div className="flex items-center gap-1 ml-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600">처리됨</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 상태 표시 */}
              {isUnread && (
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
