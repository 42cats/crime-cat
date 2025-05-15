import React from 'react';
import { Link } from 'react-router-dom';
import { NotificationItem } from '@/components/NotificationItem';
import { useNotification } from '@/hooks/useNotification';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface NotificationDropdownProps {
  onClose?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onClose,
}) => {
  const { recentNotifications, markAsRead } = useNotification();
  
  return (
    <div className="w-80 max-w-[90vw] bg-background rounded-lg shadow-lg border border-border">
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="text-lg font-semibold">알림</h3>
        {recentNotifications.length > 0 && (
          <Link
            to="/notifications"
            className="text-sm text-primary hover:underline"
            onClick={onClose}
          >
            전체 보기
          </Link>
        )}
      </div>
      
      <Separator />
      
      <ScrollArea className="max-h-96">
        {recentNotifications.length > 0 ? (
          <div className="py-2">
            {recentNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <NotificationItem
                  notification={notification}
                  onRead={markAsRead}
                  onClick={(notification) => {
                    // TODO: Navigate to notification detail
                    onClose?.();
                  }}
                />
                {index < recentNotifications.length - 1 && (
                  <Separator className="mx-3" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-muted-foreground">새로운 알림이 없습니다</p>
          </div>
        )}
      </ScrollArea>
      
      {recentNotifications.length > 0 && (
        <>
          <Separator />
          <div className="p-4 pt-2">
            <Link
              to="/notifications"
              className={cn(
                "block text-center text-sm text-primary hover:underline",
                "py-2 rounded-md hover:bg-muted/50 transition-colors"
              )}
              onClick={onClose}
            >
              전체 보기 →
            </Link>
          </div>
        </>
      )}
    </div>
  );
};
