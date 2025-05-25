package com.crimecat.backend.admin.dto;

import com.crimecat.backend.webUser.domain.WebUser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 차단 정보 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockInfoResponse {
    
    private boolean isBlocked;
    private String blockReason;
    private LocalDateTime blockedAt;
    private LocalDateTime blockExpiresAt;
    private boolean isPermanent; // 영구 차단 여부
    
    public static BlockInfoResponse from(WebUser webUser) {
        return BlockInfoResponse.builder()
                .isBlocked(webUser.getIsBanned())
                .blockReason(webUser.getBlockReason())
                .blockedAt(webUser.getBlockedAt())
                .blockExpiresAt(webUser.getBlockExpiresAt())
                .isPermanent(webUser.getBlockExpiresAt() == null && webUser.getIsBanned())
                .build();
    }
    
    public static BlockInfoResponse notBlocked() {
        return BlockInfoResponse.builder()
                .isBlocked(false)
                .build();
    }
}