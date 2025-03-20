package com.crimecat.backend.user.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class UserInfoRequestDto {
	String userSnowflake;
	String name;
	String avatar;
}
