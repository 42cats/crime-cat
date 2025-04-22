package com.crimecat.backend.bot.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class UserRankingFailedResponseDto implements UserRankingResponseDto{

	private String message;
}
