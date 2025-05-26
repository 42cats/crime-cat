package com.crimecat.backend.user.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UserPermissionPurchaseSuccessResponseDto implements
		UserPermissionPurchaseResponseDto {

	private String message;
	private List<UserPermissionPurchaseDto> permissions;
}
