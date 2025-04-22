package com.crimecat.backend.web.gameHistory.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class UserGameHistorySuccessResponseDto implements UserGameHistoryResponseDto {

	private String userSnowflake;
	private List<UserGameHistoryDto> userGameHistoryDtos;
}
