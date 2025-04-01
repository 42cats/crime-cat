package com.crimecat.backend.gameHistory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class UserGameHistoryFailedResponseDto implements UserGameHistoryResponseDto {
	private String message;
}
