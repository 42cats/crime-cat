import { useEffect, useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/api/notificationService';
import {
  notificationCountState,
  recentNotificationsState,
  notificationDropdownOpenState,
} from '@/atoms/notification';
import { useAuth } from '@/hooks/useAuth';

const NOTIFICATION_QUERY_KEYS = {
  unreadCount: ['notifications', 'unreadCount'],
  recent: ['notifications', 'recent'],
};

const POLLING_INTERVAL = 30000; // 30초

export const useNotification = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
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
  
  // 최근 알림 목록 조회
  const { 
    data: notifications = [],
    error: notificationsError,
    isLoading: notificationsLoading
  } = useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.recent,
    queryFn: () => notificationService.getRecentNotifications(10),
    enabled: isAuthenticated && isDropdownOpen,
    staleTime: 5000, // 5초간 캐시 유지
    refetchOnWindowFocus: false,
    retry: 1,
  });
  
  // 알림 읽음 처리 뮤테이션
  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.unreadCount });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.recent });
    },
    onError: (error) => {
      console.error('알림 읽음 처리 실패:', error);
    },
  });
  
  // unreadCount가 변경될 때만 Recoil state 업데이트
  useEffect(() => {
    if (!countError && unreadCount !== notificationCount) {
      setNotificationCount(unreadCount);
    }
  }, [unreadCount, countError, notificationCount, setNotificationCount]);
  
  // notifications가 변경될 때만 Recoil state 업데이트
  useEffect(() => {
    if (!notificationsError && notifications.length !== recentNotifications.length) {
      setRecentNotifications(notifications);
    }
  }, [notifications, notificationsError, recentNotifications.length, setRecentNotifications]);
  
  // 드롭다운 열기/닫기
  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, [setIsDropdownOpen]);
  
  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, [setIsDropdownOpen]);
  
  // 알림 읽음 처리
  const markAsRead = useCallback((id: string) => {
    markAsReadMutation.mutate(id);
  }, [markAsReadMutation]);
  
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
    isLoading: markAsReadMutation.isPending,
    hasError: countError || notificationsError,
  };
};
