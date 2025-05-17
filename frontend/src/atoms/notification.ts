import { atom, selector } from 'recoil';
import { Notification } from '@/types/notification';

// 미읽은 알림 개수
export const notificationCountState = atom<number>({
  key: 'notificationCountState',
  default: 0,
});

// 최근 알림 목록 (드롭다운용)
export const recentNotificationsState = atom<Notification[]>({
  key: 'recentNotificationsState',
  default: [],
});

// 알림 드롭다운 열림 상태
export const notificationDropdownOpenState = atom<boolean>({
  key: 'notificationDropdownOpenState',
  default: false,
});

// 새 알림이 있는지 여부
export const hasNewNotificationState = selector({
  key: 'hasNewNotificationState',
  get: ({ get }) => {
    const count = get(notificationCountState);
    return count > 0;
  },
});

// 알림 시스템 초기화 상태
export const notificationSystemInitializedState = atom<boolean>({
  key: 'notificationSystemInitializedState',
  default: false,
});

// 이미 처리된 알림 ID를 추적하는 상태
export const processedNotificationIdsState = atom<Set<string>>({
  key: 'processedNotificationIdsState',
  default: new Set(),
});
