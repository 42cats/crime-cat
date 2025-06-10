import { apiClient } from '@/lib/api';

export interface AdvertisementStats {
  requestId: string;
  themeName: string;
  themeType: 'CRIME_SCENE' | 'ESCAPE_ROOM';
  status: string;
  totalCost: number;
  requestedDays: number;
  remainingDays?: number;
  exposureCount: number;
  clickCount: number;
  clickThroughRate: number;
  costPerClick?: number;
  costPerExposure?: number;
  startedAt?: string;
  expiresAt?: string;
  requestedAt: string;
}

export interface UserAdvertisementSummary {
  totalAdvertisements: number;
  activeAdvertisements: number;
  completedAdvertisements: number;
  queuedAdvertisements: number;
  totalSpent: number;
  totalRefunded: number;
  netSpent: number;
  totalExposures: number;
  totalClicks: number;
  averageCTR: number;
  averageCostPerClick?: number;
  averageCostPerExposure?: number;
  bestPerformingTheme?: string;
  bestPerformingCTR?: number;
}

export interface PopularThemeStats {
  themeName: string;
  themeType: 'CRIME_SCENE' | 'ESCAPE_ROOM';
  exposureCount: number;
  clickCount: number;
  ctr: number;
  rank: number;
}

export interface PlatformAdvertisementStats {
  totalAdvertisements: number;
  activeAdvertisements: number;
  queuedAdvertisements: number;
  totalRevenue: number;
  totalExposures: number;
  totalClicks: number;
  platformCTR: number;
  topPerformingThemes: PopularThemeStats[];
  mostActiveThemes: PopularThemeStats[];
  averageCTR: number;
  averageCostPerClick: number;
  averageCostPerExposure: number;
}

export const advertisementStatsService = {
  // 내 광고 상세 통계
  getMyAdvertisementStats: async (): Promise<AdvertisementStats[]> => {
    const response = await apiClient.get<AdvertisementStats[]>('/theme-advertisements/stats/my-ads');
    return response || [];
  },

  // 내 광고 요약 통계
  getMyAdvertisementSummary: async (): Promise<UserAdvertisementSummary> => {
    const response = await apiClient.get<UserAdvertisementSummary>('/theme-advertisements/stats/my-summary');
    return response || {
      totalAdvertisements: 0,
      activeAdvertisements: 0,
      completedAdvertisements: 0,
      queuedAdvertisements: 0,
      totalSpent: 0,
      totalRefunded: 0,
      netSpent: 0,
      totalExposures: 0,
      totalClicks: 0,
      averageCTR: 0,
      averageCostPerClick: 0,
      averageCostPerExposure: 0,
      bestPerformingTheme: null,
      bestPerformingCTR: 0
    };
  },

  // 특정 광고 상세 통계
  getAdvertisementStats: async (requestId: string): Promise<AdvertisementStats> => {
    const response = await apiClient.get<AdvertisementStats>(`/theme-advertisements/stats/${requestId}`);
    return response;
  },

  // 플랫폼 전체 통계 (공개)
  getPlatformStats: async (): Promise<PlatformAdvertisementStats> => {
    const response = await apiClient.get<PlatformAdvertisementStats>('/theme-advertisements/stats/platform');
    return response || {
      totalAdvertisements: 0,
      activeAdvertisements: 0,
      queuedAdvertisements: 0,
      totalRevenue: 0,
      totalExposures: 0,
      totalClicks: 0,
      platformCTR: 0,
      topPerformingThemes: [],
      mostActiveThemes: [],
      averageCTR: 0,
      averageCostPerClick: 0,
      averageCostPerExposure: 0
    };
  },
};