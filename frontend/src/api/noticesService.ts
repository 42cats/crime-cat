import { apiClient } from '@/lib/api';
import { Notice, NoticePage } from '@/lib/types';

export const noticesService = {
  getLatestNotices: async (): Promise<Notice[]> => {
    try {
      return await apiClient.get<Notice[]>(`/notices/limit=4`);
    } catch (error) {
      console.error('최신 공지 불러오기 오류:', error);
      throw error;
    }
  },

  getNotices: async (page: number, limit: number): Promise<NoticePage> => {
    try {
      return await apiClient.get<NoticePage>(`/notices?page=${page}&limit=${limit}`);
    } catch (error) {
      console.error('공지 목록 불러오기 오류:', error);
      throw error;
    }
  },

  getNoticeById: async (id: string): Promise<Notice | null> => {
    try {
      return await apiClient.get<Notice>(`/notices/${id}`);
    } catch (error) {
      console.error('공지 ID로 조회 실패:', error);
      throw error;
    }
  },

  createNotice: async (
    data: Omit<Notice, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Notice> => {
    try {
      return await apiClient.post<Notice>('/notices', data);
    } catch (error) {
      console.error('명령어 생성 실패:', error);
      throw error;
    }
  },

  updateNotice: async (
    id: string,
    data: Partial<Notice>
  ): Promise<Notice> => {
    try {
      return await apiClient.patch<Notice>(`/notices/${id}`, data);
    } catch (error) {
      console.error('명령어 수정 실패:', error);
      throw error;
    }
  },

  deleteNotice: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/notices/${id}`);
    } catch (error) {
      console.error('명령어 삭제 실패:', error);
      throw error;
    }
  },
};
