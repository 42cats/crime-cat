package com.crimecat.backend.bot.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserInfoRequestDto {
	String userSnowflake;
	String name;
	String avatar;
}
