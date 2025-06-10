package com.crimecat.backend.advertisement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 사용자 광고 요약 통계
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAdvertisementSummary {
    
    // 광고 개수 통계
    private Long totalAdvertisements;
    private Long activeAdvertisements;
    private Long completedAdvertisements;
    private Long queuedAdvertisements;
    
    // 비용 통계
    private Integer totalSpent;
    private Integer totalRefunded;
    private Integer netSpent; // 실제 지출 = 총 지출 - 환불
    
    // 성과 통계
    private Long totalExposures;
    private Long totalClicks;
    private Double averageCTR;
    
    // 효율성 지표
    private Double averageCostPerClick;
    private Double averageCostPerExposure;
    
    // 인기 테마 (가장 성과가 좋은 테마)
    private String bestPerformingTheme;
    private Double bestPerformingCTR;
    
    // 계산된 평균 CTR
    public Double getAverageCTR() {
        if (totalExposures == null || totalExposures == 0) {
            return 0.0;
        }
        return (totalClicks.doubleValue() / totalExposures.doubleValue()) * 100.0;
    }
    
    // 계산된 평균 클릭당 비용
    public Double getAverageCostPerClick() {
        if (totalClicks == null || totalClicks == 0) {
            return null;
        }
        return netSpent.doubleValue() / totalClicks.doubleValue();
    }
    
    // 계산된 평균 노출당 비용
    public Double getAverageCostPerExposure() {
        if (totalExposures == null || totalExposures == 0) {
            return null;
        }
        return netSpent.doubleValue() / totalExposures.doubleValue();
    }
}