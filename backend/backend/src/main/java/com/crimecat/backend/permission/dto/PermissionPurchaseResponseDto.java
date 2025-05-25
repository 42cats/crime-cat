package com.crimecat.backend.permission.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissionPurchaseResponseDto {
    private boolean success;
    private String message;
    private PermissionPurchaseDataDto data;
}
