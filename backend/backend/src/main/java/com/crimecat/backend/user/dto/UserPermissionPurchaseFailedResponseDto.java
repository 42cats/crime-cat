package com.crimecat.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class UserPermissionPurchaseFailedResponseDto implements UserPermissionPurchaseResponseDto{
	private String message;
	private Integer permissionPoint;
	private Integer point;
}
