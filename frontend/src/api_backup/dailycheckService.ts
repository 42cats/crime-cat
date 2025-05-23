import { apiClient } from '@/lib/api';
import { DailyCheck } from '@/lib/types';

const baseURI = `/web_user/daily_check`;

export const dailycheckService = {
  getDailyCheck: async (id: string): Promise<DailyCheck> => {
    try {
      return await apiClient.get<DailyCheck>(`${baseURI}/${id}`);
    } catch (error) {
      console.error('출석 체크 확인 실패:', error);
      throw error;
    }
  },
  requestDailyCheck: async (id: string): Promise<DailyCheck> => {
    try {
      return await apiClient.post<DailyCheck>(`${baseURI}/${id}`);
    } catch (error) {
      console.error('출석 체크 요청 실패:', error);
      throw error;
    }
  },
};