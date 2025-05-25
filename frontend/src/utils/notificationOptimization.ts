/**
 * 알림 시스템 성능 최적화 가이드
 */

// 1. React.memo를 활용한 불필요한 리렌더링 방지
export const OptimizedNotificationItem = React.memo(NotificationItem, (prevProps, nextProps) => {
  return (
    prevProps.notification.id === nextProps.notification.id &&
    prevProps.notification.status === nextProps.notification.status &&
    prevProps.notification.createdAt === nextProps.notification.createdAt
  );
});

// 2. useMemo를 활용한 비싼 연산 최적화
export const useOptimizedNotifications = (notifications: Notification[]) => {
  return useMemo(() => {
    return notifications.map(notification => ({
      ...notification,
      timeAgo: formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: true,
        locale: ko,
      }),
      isExpired: notification.expiresAt ? new Date(notification.expiresAt) < new Date() : false,
    }));
  }, [notifications]);
};

// 3. React Query 쿼리 키 최적화
export const notificationQueryKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationQueryKeys.all, 'list'] as const,
  list: (filters: string) => [...notificationQueryKeys.lists(), { filters }] as const,
  details: () => [...notificationQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificationQueryKeys.details(), id] as const,
  unreadCount: () => [...notificationQueryKeys.all, 'unreadCount'] as const,
};

// 4. 가상화를 활용한 대량 알림 처리
export const VirtualizedNotificationList = ({ notifications }: { notifications: Notification[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const { getVirtualItems, getTotalSize } = useVirtual({
    size: notifications.length,
    parentRef,
    estimateSize: useCallback(() => 80, []), // 예상 아이템 높이
    overscan: 5, // 화면 밖 렌더링할 아이템 수
  });
  
  return (
    <div
      ref={parentRef}
      className="h-96 overflow-auto"
      style={{
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualItem.size,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <NotificationItem notification={notifications[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};

// 5. 서비스 워커를 활용한 백그라운드 알림 처리
export const registerNotificationServiceWorker = async () => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/sw-notifications.js');
      console.log('알림 서비스 워커 등록 완료:', registration);
    } catch (error) {
      console.error('서비스 워커 등록 실패:', error);
    }
  }
};
