package com.crimecat.backend.web.gameHistory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class UserGameHistoryFailedResponseDto implements UserGameHistoryResponseDto {
	private String message;
}
