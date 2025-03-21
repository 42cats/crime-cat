package com.crimecat.backend.gameHistory.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class UserGameHitoryResponseDto {

	private String userSnowflake;
	private List<UserGameHistoryDto> userGameHistoryDtos;
}
