package com.crimecat.backend.bot.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class UserPermissionPurchaseFailedResponseDto implements UserPermissionPurchaseResponseDto{
	private String message;
	private Integer permissionPoint;
	private Integer point;
}
