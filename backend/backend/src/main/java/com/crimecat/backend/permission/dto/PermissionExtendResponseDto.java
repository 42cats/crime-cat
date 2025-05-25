package com.crimecat.backend.permission.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PermissionExtendResponseDto {
    private String message;
    private String expiredDate;
}
