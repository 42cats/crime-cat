package com.crimecat.backend.admin.dto;

import com.crimecat.backend.webUser.enums.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangeUserRoleRequest {
    @NotNull(message = "사용자 ID는 필수입니다.")
    private UUID userId;
    
    @NotNull(message = "새 역할은 필수입니다.")
    private UserRole newRole;
}
