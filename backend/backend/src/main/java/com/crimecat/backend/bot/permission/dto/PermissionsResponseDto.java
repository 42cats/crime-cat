package com.crimecat.backend.bot.permission.dto;

import com.crimecat.backend.bot.permission.domain.Permission;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PermissionsResponseDto {
    private String message;
    private List<Permission> permissionList;
}
