package com.crimecat.backend.admin.dto.permission;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevokePermissionRequest {
    @NotNull(message = "사용자 ID는 필수입니다.")
    private UUID userId;
    
    @NotBlank(message = "권한명은 필수입니다.")
    private String permissionName;
}
