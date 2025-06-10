package com.crimecat.backend.advertisement.dto;

import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 플랫폼 전체 광고 통계
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformAdvertisementStats {
    
    // 전체 통계
    private Long totalAdvertisements;
    private Long activeAdvertisements;
    private Long queuedAdvertisements;
    private Integer totalRevenue; // 플랫폼 수익 (총 광고비)
    
    // 성과 통계
    private Long totalExposures;
    private Long totalClicks;
    private Double platformCTR;
    
    // 인기 순위
    private List<PopularThemeStats> topPerformingThemes;
    private List<PopularThemeStats> mostActiveThemes;
    
    // 벤치마크 데이터
    private Double averageCTR;
    private Double averageCostPerClick;
    private Double averageCostPerExposure;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PopularThemeStats {
        private String themeName;
        private ThemeAdvertisementRequest.ThemeType themeType;
        private Long exposureCount;
        private Long clickCount;
        private Double ctr;
        private Integer rank;
    }
    
    // 계산된 플랫폼 CTR
    public Double getPlatformCTR() {
        if (totalExposures == null || totalExposures == 0) {
            return 0.0;
        }
        return (totalClicks.doubleValue() / totalExposures.doubleValue()) * 100.0;
    }
}