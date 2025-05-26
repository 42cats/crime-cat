package com.crimecat.backend.point.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PointHistorySummaryDto {

    private Integer currentBalance;
    private Integer totalEarned;
    private Integer totalSpent;
    private Integer totalReceived;
    private Integer totalGifted;
    
    public static PointHistorySummaryDto of(
        Integer currentBalance,
        Integer totalEarned,
        Integer totalSpent,
        Integer totalReceived,
        Integer totalGifted
    ) {
        return PointHistorySummaryDto.builder()
                .currentBalance(currentBalance)
                .totalEarned(totalEarned)
                .totalSpent(totalSpent)
                .totalReceived(totalReceived)
                .totalGifted(totalGifted)
                .build();
    }
}
