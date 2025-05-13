package com.crimecat.backend.permission.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AllPermissionsWithUserStatusResponseDto {
    private List<PermissionWithStatusDto> permissions;
    private String message;
}
