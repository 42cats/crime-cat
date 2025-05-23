import { useEffect, useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/api/social/notifications';
import {
  notificationCountState,
  recentNotificationsState,
  notificationDropdownOpenState,
} from '@/atoms/notification';
import { useAuth } from '@/hooks/useAuth';
import { Notification } from '@/types/notification';
import { useReadNotifications } from '@/hooks/useReadNotifications';

const NOTIFICATION_QUERY_KEYS = {
  unreadCount: ['notifications', 'unreadCount'],
  recent: ['notifications', 'recent'],
};

const POLLING_INTERVAL = 30000; // 30초

export const useNotification = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { markAsRead: markLocalAsRead } = useReadNotifications();
  
  const [notificationCount, setNotificationCount] = useRecoilState(notificationCountState);
  const [recentNotifications, setRecentNotifications] = useRecoilState(recentNotificationsState);
  const [isDropdownOpen, setIsDropdownOpen] = useRecoilState(notificationDropdownOpenState);
  
  // 미읽은 알림 개수 조회
  const { 
    data: unreadCount = 0,
    error: countError,
    isLoading: countLoading
  } = useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount,
    queryFn: notificationService.getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: POLLING_INTERVAL,
    staleTime: 10000, // 10초간 캐시 유지
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    retry: (failureCount, error) => {
      // 404나 401 에러는 재시도하지 않음
      if (error && 'response' in error && error.response) {
        const status = (error.response as any).status;
        if (status === 404 || status === 401) return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  // 최근 알림 목록 조회 - 항상 최신 데이터 가져오도록 변경
  const { 
    data: notifications = [],
    error: notificationsError,
    isLoading: notificationsLoading,
    refetch: refetchNotifications
  } = useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.recent,
    queryFn: () => notificationService.getRecentNotifications(10),
    enabled: isAuthenticated && isDropdownOpen,
    staleTime: 0, // 항상 새로운 데이터 가져오도록 변경
    refetchOnWindowFocus: true, // 포커스 시 새로고침
    retry: 1,
  });
  
  // 알림 읽음 처리 뮤테이션 - 확장된 버전
  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onMutate: async (notificationId) => {
      // 로컬 상태에 즉시 표시
      markLocalAsRead(notificationId);

      // 미리 쿼리 캐시 저장
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_QUERY_KEYS.recent });
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_QUERY_KEYS.unreadCount });
      
      // 현재 알림 목록 가져오기
      const previousNotifications = queryClient.getQueryData<Notification[]>(NOTIFICATION_QUERY_KEYS.recent) || [];
      const previousCount = queryClient.getQueryData<number>(NOTIFICATION_QUERY_KEYS.unreadCount) || 0;
      
      // 알림 목록 업데이트 (해당 알림 제외)
      const updatedNotifications = previousNotifications.filter(notif => 
        notif.id !== notificationId
      );
      
      // React Query 캐시 업데이트
      queryClient.setQueryData(NOTIFICATION_QUERY_KEYS.recent, updatedNotifications);

      // 현재 Recoil 상태와 다를 경우에만 Recoil 상태 동기화
      if (JSON.stringify(updatedNotifications) !== JSON.stringify(recentNotifications)) {
        setRecentNotifications(updatedNotifications);
      }
      
      // 알림 개수 업데이트 - 쓰지 않음 상태였던 경우에만
      // 이미 UNREAD 상태로 필터링됨 알림만 있으므로 미읽음 상태임
      const wasUnread = true;
      
      if (wasUnread) {
        const newCount = Math.max(0, previousCount - 1);
        queryClient.setQueryData(NOTIFICATION_QUERY_KEYS.unreadCount, newCount);
        setNotificationCount(newCount); // Recoil 상태도 즉시 업데이트
      }
      
      return { previousNotifications, previousCount, wasUnread };
    },
    onSuccess: () => {
      // 서버 응답 후 모든 항목 다시 조회
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.unreadCount });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.recent });
    },
    onError: (error, notificationId, context) => {
      console.error('알림 읽음 처리 실패:', error);
      // 오류 발생 시 이전 상태로 되돌리기
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATION_QUERY_KEYS.recent, context.previousNotifications);
      }
      
      if (context?.wasUnread && context?.previousCount !== undefined) {
        queryClient.setQueryData(NOTIFICATION_QUERY_KEYS.unreadCount, context.previousCount);
        setNotificationCount(context.previousCount);
      }
    },
  });
  
  // unreadCount가 변경될 때만 Recoil state 업데이트 - 무한 루프 방지
  useEffect(() => {
    if (!countError && unreadCount !== undefined && unreadCount !== notificationCount) {
      setNotificationCount(unreadCount);
    }
  }, [unreadCount, countError, notificationCount, setNotificationCount]);
  
  // notifications가 변경될 때 Recoil state 업데이트 - 무한 루프 방지 개선
  useEffect(() => {
    // 데이터가 유효한 경우에만 업데이트
    if (!notificationsError && JSON.stringify(notifications) !== JSON.stringify(recentNotifications)) {
      setRecentNotifications(notifications);
    }
  }, [notifications, notificationsError, setRecentNotifications, recentNotifications]);
  
  // 드롭다운 열기/닫기 - 무한 루프 방지 버전
  const toggleDropdown = useCallback(() => {
    const newState = !isDropdownOpen;
    setIsDropdownOpen(newState);
    
    // 드롭다운이 열릴 때마다 데이터 강제 갱신
    if (newState) {
      // 토글 상태 변경 후 일정 시간 후에 쿼리 새로고침 수행
      setTimeout(() => {
        // 오직 refetch만 사용하여 상태 업데이트 최소화
        refetchNotifications();
      }, 100);
    }
  }, [isDropdownOpen, setIsDropdownOpen, refetchNotifications]);
  
  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, [setIsDropdownOpen]);
  
  // 알림 읽음 처리 - 확장된 버전
  const markAsRead = useCallback((id: string) => {
    // 로컬 및 서버 모두 업데이트
    markLocalAsRead(id);
    markAsReadMutation.mutate(id);
  }, [markAsReadMutation, markLocalAsRead]);
  
  // 로그아웃 시 상태 초기화
  useEffect(() => {
    if (!isAuthenticated) {
      setNotificationCount(0);
      setRecentNotifications([]);
      setIsDropdownOpen(false);
    }
  }, [isAuthenticated, setNotificationCount, setRecentNotifications, setIsDropdownOpen]);
  
  return {
    notificationCount,
    recentNotifications,
    isDropdownOpen,
    toggleDropdown,
    closeDropdown,
    markAsRead,
    refetchNotifications, // 강제 갱신 함수 추가
    isLoading: markAsReadMutation.isPending,
    hasError: countError || notificationsError,
  };
};
