package com.crimecat.backend.admin.dto.permission;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrantPermissionRequest {
    @NotNull(message = "사용자 ID는 필수입니다.")
    private UUID userId;
    
    @NotBlank(message = "권한명은 필수입니다.")
    private String permissionName;
    
    // null인 경우 Permission의 기본 duration 사용
    private LocalDateTime expiresAt;
}
