package com.crimecat.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class UserRankingFailedResponseDto implements UserRankingResponseDto{

	private String message;
}
