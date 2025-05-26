package com.crimecat.backend.admin.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPointSummaryResponse {
    private UUID userId;
    private String nickname;
    private String email;
    private String profileImagePath;
    private Integer currentBalance;
    private Integer totalEarned;
    private Integer totalSpent;
    private Integer totalReceived;
    private Integer totalGifted;
    private LocalDateTime lastTransactionAt;
    private LocalDateTime accountCreatedAt;
}
