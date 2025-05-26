package com.crimecat.backend.admin.dto.permission;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPermissionResponse {
    private String permissionId;
    private String permissionName;
    private LocalDateTime expiredAt;
    private String message;
}
