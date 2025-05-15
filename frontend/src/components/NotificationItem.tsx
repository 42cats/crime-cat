import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Notification, NotificationType } from '@/types/notification';
import { cn } from '@/lib/utils';
import { Gamepad2, Users, MessageSquare, Megaphone, Mail } from 'lucide-react';

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
    case NotificationType.COMMENT:
      return <MessageSquare className="w-5 h-5 text-purple-500" />;
    case NotificationType.SYSTEM_NOTICE:
      return <Megaphone className="w-5 h-5 text-orange-500" />;
    default:
      return <Mail className="w-5 h-5 text-gray-500" />;
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRead,
  onClick,
}) => {
  const handleClick = () => {
    if (!notification.read) {
      onRead(notification.id);
    }
    onClick?.(notification);
  };
  
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: ko,
  });
  
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
        "hover:bg-muted/50",
        notification.read ? "bg-muted/20" : "bg-background"
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
          {!notification.read && (
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
