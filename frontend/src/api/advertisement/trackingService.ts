import { apiClient } from '@/lib/api';

export interface ActiveAdvertisement {
  id: string;
  themeName: string;
  themeType: 'CRIME_SCENE' | 'ESCAPE_ROOM';
  themeId: string;
  exposureCount: number;
  clickCount: number;
}

export const advertisementTrackingService = {
  // 활성 광고 목록 조회 (공개 API)
  getActiveAdvertisements: async (): Promise<ActiveAdvertisement[]> => {
    try {
      const response = await apiClient.get('/api/v1/public/theme-ads/active');
      return response.data;
    } catch (error) {
      console.error('활성 광고 조회 실패:', error);
      return [];
    }
  },

  // 광고 클릭 추적
  trackClick: async (requestId: string): Promise<void> => {
    try {
      await apiClient.post(`/api/v1/public/theme-ads/click/${requestId}`);
    } catch (error) {
      // 클릭 추적 실패는 조용히 처리 (사용자 경험에 영향 없도록)
      console.debug('클릭 추적 실패:', error);
    }
  },

  // 특정 테마가 현재 광고 중인지 확인하고 클릭 추적
  trackThemeClick: async (themeId: string): Promise<void> => {
    try {
      const activeAds = await advertisementTrackingService.getActiveAdvertisements();
      const matchingAd = activeAds.find(ad => ad.themeId === themeId);
      
      if (matchingAd) {
        await advertisementTrackingService.trackClick(matchingAd.id);
        console.debug(`광고 클릭 추적: ${matchingAd.themeName}`);
      }
    } catch (error) {
      console.debug('테마 클릭 추적 실패:', error);
    }
  },
};