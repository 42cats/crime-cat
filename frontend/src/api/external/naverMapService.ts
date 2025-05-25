import { apiClient } from '@/lib/api';
import { Place } from '@/lib/types';

const baseURI = '/naver/local-search';

export const naverMapService = {
  searchLocal: async (query: string): Promise<Place[]> => {
    try {
      const res = await apiClient.get<{ items: Place[] }>(
        `${baseURI}?query=${encodeURIComponent(query)}`
      );
      return res.items || [];
    } catch (error) {
      console.error('❌ 지역 검색 실패:', error);
      throw error;
    }
  },
};