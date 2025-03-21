package com.crimecat.backend.user.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserPermissionResponseDto {

	private String message;
	private List<UserPermissionDto> permissions;
}
