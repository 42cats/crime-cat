import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Notification, NotificationType } from '@/types/notification';
import { handleNotificationRouting } from '@/utils/notificationRouting';
import { cn } from '@/lib/utils';
import { Gamepad2, Users, MessageSquare, Megaphone, Mail, FileText, MessageCircle, Reply } from 'lucide-react';
import { useReadNotifications } from '@/hooks/useReadNotifications';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.GAME_RECORD_REQUEST:
      return <Gamepad2 className="w-5 h-5 text-blue-500" />;
    case NotificationType.FRIEND_REQUEST:
      return <Users className="w-5 h-5 text-green-500" />;
    case NotificationType.COMMENT_ALERT:
      return <MessageSquare className="w-5 h-5 text-purple-500" />;
    case NotificationType.SYSTEM_NOTICE:
      return <Megaphone className="w-5 h-5 text-orange-500" />;
    case NotificationType.NEW_THEME:
      return <Megaphone className="w-5 h-5 text-green-500" />;
    case NotificationType.GAME_NOTICE:
      return <Gamepad2 className="w-5 h-5 text-orange-500" />;
    case NotificationType.USER_POST_NEW:
      return <FileText className="w-5 h-5 text-blue-600" />;
    case NotificationType.USER_POST_COMMENT:
      return <MessageCircle className="w-5 h-5 text-green-600" />;
    case NotificationType.USER_POST_COMMENT_REPLY:
      return <Reply className="w-5 h-5 text-purple-600" />;
    default:
      return <Mail className="w-5 h-5 text-gray-500" />;
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRead,
  onClick,
}) => {
  const navigate = useNavigate();
  const { isRead } = useReadNotifications();
  
  const handleClick = () => {
    // 읽음 상태가 아닌 경우에만 읽음 처리 - 불필요한 서버 호출 방지
    if (isUnread) {
      // 무조건 읽음 처리 - 즉시 호출
      onRead(notification.id);
    }
    
    // onClick prop이 있으면 먼저 실행
    if (onClick) {
      // 업데이트된 상태의 알림 전달
      const updatedNotification = isUnread 
        ? { ...notification, status: 'READ', read: true } 
        : notification;
      onClick(updatedNotification);
    } else {
      // onClick prop이 없으면 기본 라우팅 처리
      handleNotificationRouting.navigate(notification, navigate);
    }
  };
  
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: ko,
  });
  
  // 로컬에서 읽음 상태를 확인 - 모든 소스 확인
  const notificationIsRead = isRead(notification.id, notification.status);
  // 읽지 않음 상태 계산 (알림이 읽혔는지 여부의 반대)
  // 서버 상태(status)와 로컬 상태(readIds)를 모두 고려
  const isUnread = !notificationIsRead;
  
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
        "hover:bg-muted/50",
        isUnread ? "bg-background" : "bg-muted/20"
      )}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground truncate">
            {notification.title}
          </p>
          {isUnread && (
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
          )}
        </div>
        
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {notification.message}
        </p>
        
        <p className="text-xs text-muted-foreground mt-2">
          {timeAgo}
        </p>
      </div>
    </div>
  );
};
