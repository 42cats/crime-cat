import { apiClient } from '@/lib/api';
import { Stats } from '@/lib/types';

const baseURI = '/public/info/stats';

export const statsService = {
  fetchStats: async (): Promise<Stats> => {
    try {
      return await apiClient.get<Stats>(`${baseURI}/main`);
    } catch (error) {
      console.error('스탯 조회 실패', error);
      throw error;
    }
  },
};