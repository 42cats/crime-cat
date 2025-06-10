package com.crimecat.backend.advertisement.dto;

import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 광고 통계 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdvertisementStatsResponse {
    
    private UUID requestId;
    private String themeName;
    private ThemeAdvertisementRequest.ThemeType themeType;
    private String status;
    
    // 기본 통계
    private Integer totalCost;
    private Integer requestedDays;
    private Integer remainingDays;
    
    // 성과 통계
    private Long exposureCount;
    private Long clickCount;
    private Double clickThroughRate; // CTR = (클릭수 / 노출수) * 100
    
    // 기간 정보
    private LocalDateTime startedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime requestedAt;
    
    // 효율성 지표
    private Double costPerClick;        // 클릭당 비용
    private Double costPerExposure;     // 노출당 비용
    
    // 계산된 CTR
    public Double getClickThroughRate() {
        if (exposureCount == null || exposureCount == 0) {
            return 0.0;
        }
        return (clickCount.doubleValue() / exposureCount.doubleValue()) * 100.0;
    }
    
    // 계산된 클릭당 비용
    public Double getCostPerClick() {
        if (clickCount == null || clickCount == 0) {
            return null;
        }
        return totalCost.doubleValue() / clickCount.doubleValue();
    }
    
    // 계산된 노출당 비용
    public Double getCostPerExposure() {
        if (exposureCount == null || exposureCount == 0) {
            return null;
        }
        return totalCost.doubleValue() / exposureCount.doubleValue();
    }
}