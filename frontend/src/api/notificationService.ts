import { apiClient } from '@/lib/api';
import { Notification, NotificationPage, UnreadCountResponse } from '@/types/notification';

const baseURI = '/notifications';

export const notificationService = {
  /**
   * 미읽은 알림 개수 조회
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get<UnreadCountResponse>(`${baseURI}/unread/count`);
      return response.count;
    } catch (error) {
      console.error('미읽은 알림 개수 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 최근 알림 목록 조회 (드롭다운용)
   */
  getRecentNotifications: async (limit: number = 10): Promise<Notification[]> => {
    try {
      const response = await apiClient.get<NotificationPage>(`${baseURI}?page=0&size=${limit}`);
      return response.content;
    } catch (error) {
      console.error('최근 알림 목록 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 알림 목록 조회 (페이지네이션)
   */
  getNotifications: async (page: number = 0, size: number = 20): Promise<NotificationPage> => {
    try {
      return await apiClient.get<NotificationPage>(`${baseURI}?page=${page}&size=${size}`);
    } catch (error) {
      console.error('알림 목록 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 알림 조회
   */
  getNotification: async (id: string): Promise<Notification> => {
    try {
      return await apiClient.get<Notification>(`${baseURI}/${id}`);
    } catch (error) {
      console.error('알림 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 알림 읽음 처리
   */
  markAsRead: async (id: string): Promise<void> => {
    try {
      await apiClient.put<void>(`${baseURI}/${id}/read`);
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
      throw error;
    }
  },

  /**
   * 알림 액션 처리 (승인/거절 등)
   */
  processAction: async (id: string, action: string, data?: any): Promise<void> => {
    try {
      await apiClient.post(`${baseURI}/${id}/${action}`, data);
    } catch (error) {
      console.error('알림 액션 처리 실패:', error);
      throw error;
    }
  },
};
