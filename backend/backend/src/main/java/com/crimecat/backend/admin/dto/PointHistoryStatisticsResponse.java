package com.crimecat.backend.admin.dto;

import com.crimecat.backend.point.domain.TransactionType;
import java.time.LocalDateTime;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Builder
public class PointHistoryStatisticsResponse {
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer totalTransactions;
    private Integer totalPointsCirculated;
    private Map<TransactionType, Integer> transactionsByType;
    private Map<TransactionType, Integer> amountByType;
    private Map<Integer, Integer> hourlyDistribution; // hour -> transaction count
    private Integer uniqueUsers;
    private Double averageTransactionAmount;
    private Integer maxTransactionAmount;
    private Integer minTransactionAmount;
}
