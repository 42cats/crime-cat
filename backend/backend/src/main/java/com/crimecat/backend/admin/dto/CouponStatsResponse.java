package com.crimecat.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 쿠폰 통계 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponStatsResponse {
    
    private long totalCoupons;      // 전체 쿠폰 수
    private long usedCoupons;       // 사용된 쿠폰 수
    private long expiredCoupons;    // 만료된 쿠폰 수
    private long unusedCoupons;     // 미사용 쿠폰 수
    private double usageRate;       // 사용률 (%)
    private double expiredRate;     // 만료율 (%)
    private long totalPointsIssued; // 발급된 총 포인트
    private long totalPointsUsed;   // 사용된 총 포인트
    
    public static CouponStatsResponse of(long total, long used, long expired, long totalPoints, long usedPoints) {
        long unused = total - used - expired;
        double usageRate = total > 0 ? ((double) used / total) * 100 : 0.0;
        double expiredRate = total > 0 ? ((double) expired / total) * 100 : 0.0;
        
        return CouponStatsResponse.builder()
                .totalCoupons(total)
                .usedCoupons(used)
                .expiredCoupons(expired)
                .unusedCoupons(unused)
                .usageRate(Math.round(usageRate * 100.0) / 100.0) // 소수점 2자리
                .expiredRate(Math.round(expiredRate * 100.0) / 100.0)
                .totalPointsIssued(totalPoints)
                .totalPointsUsed(usedPoints)
                .build();
    }
}