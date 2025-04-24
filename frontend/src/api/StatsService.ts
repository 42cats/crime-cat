import { apiClient } from '@/lib/api';
import { Stats } from '@/lib/types';

export const statsService = {
  fetchStats: async (): Promise<Stats> => {
    try {
      return await apiClient.get<Stats>(`/info/stats/main`);
    } catch (error) {
      console.error('스탯 조회 실패', error);
      throw error;
    }
  },
};