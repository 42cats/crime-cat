import { apiClient } from '@/lib/api';
import { DailyCheck } from '@/lib/types';

export const dailycheckService = {
  getDailyCheck: async (id: string): Promise<DailyCheck> => {
    try {
      return await apiClient.get<DailyCheck>(`/web_user/daily_check/${id}`);
    } catch (error) {
      console.error('출석 체크 확인 실패:', error);
      throw error;
    }
  },
  requestDailyCheck: async (id: string): Promise<DailyCheck> => {
    try {
      return await apiClient.post<DailyCheck>(`/web_user/daily_check/${id}`);
    } catch (error) {
      console.error('출석 체크 요청 실패:', error);
      throw error;
    }
  },
};