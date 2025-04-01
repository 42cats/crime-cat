package com.crimecat.backend.user.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserPermissionPurchaseSuccessResponseDto implements
		UserPermissionPurchaseResponseDto {

	private String message;
	private List<UserPermissionPurchaseDto> permissions;
}
