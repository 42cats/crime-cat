package com.crimecat.backend.bot.user.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserGrantedPermissionResponseDto {

	private String userSnowflake;
	private List<UserGrantedPermissionDto> permissions;
}
