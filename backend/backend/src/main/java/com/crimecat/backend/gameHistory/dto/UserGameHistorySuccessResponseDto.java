package com.crimecat.backend.gameHistory.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class UserGameHistorySuccessResponseDto implements UserGameHistoryResponseDto {

	private String discordSnowflake;
	private List<UserGameHistoryDto> userGameHistoryDtos;
}
