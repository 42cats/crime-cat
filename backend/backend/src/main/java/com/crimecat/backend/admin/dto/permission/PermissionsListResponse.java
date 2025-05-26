package com.crimecat.backend.admin.dto.permission;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionsListResponse {
    private String message;
    private List<PermissionResponse> permissions;
}
