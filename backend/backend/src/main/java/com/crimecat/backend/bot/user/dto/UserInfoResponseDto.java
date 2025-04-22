package com.crimecat.backend.bot.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserInfoResponseDto {

	private String message;
	private UserResponseDto user;
}
