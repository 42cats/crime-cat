package com.crimecat.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 사용자 차단 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class BlockUserRequest {
    
    @NotNull(message = "사용자 ID는 필수입니다.")
    private UUID userId;
    
    @NotBlank(message = "차단 사유는 필수입니다.")
    private String blockReason;
    
    // null이면 영구 차단, 값이 있으면 해당 시간까지 차단
    private LocalDateTime blockExpiresAt;
}