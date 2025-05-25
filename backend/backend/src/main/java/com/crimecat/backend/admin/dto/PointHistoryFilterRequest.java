package com.crimecat.backend.admin.dto;

import com.crimecat.backend.point.domain.TransactionType;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PointHistoryFilterRequest {
    private TransactionType type;
    private UUID userId;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer minAmount;
    private Integer maxAmount;
}
