package com.crimecat.backend.admin.dto;

import com.crimecat.backend.point.domain.TransactionType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SuspiciousActivityResponse {
    private UUID userId;
    private String userNickname;
    private String userEmail;
    private String suspiciousType; // RAPID_EARNING, LARGE_AMOUNT, REPEATED_TRANSFER, etc.
    private String description;
    private LocalDateTime detectedAt;
    private Integer totalAmount;
    private Integer transactionCount;
    private List<TransactionDetail> recentTransactions;
    
    @Getter
    @Builder
    public static class TransactionDetail {
        private UUID transactionId;
        private TransactionType type;
        private Integer amount;
        private LocalDateTime usedAt;
        private String memo;
        private String relatedUserNickname;
    }
}
