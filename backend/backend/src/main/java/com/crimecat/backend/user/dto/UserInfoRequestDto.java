package com.crimecat.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserInfoRequestDto {
	String userSnowflake;
	String name;
	String avatar;
}
