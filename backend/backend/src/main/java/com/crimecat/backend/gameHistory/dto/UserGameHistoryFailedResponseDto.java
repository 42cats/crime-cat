package com.crimecat.backend.gameHistory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class UserGameHistoryFailedResponseDto implements UserGameHistoryResponseDto {
	private String message;
}
