package com.crimecat.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class UserRankingSuccessResponseDto implements UserRankingResponseDto {

	private String message;
	private String userSnowflake;
	private Integer playtime;
	private Integer playRank;
	private Integer point;
	private Integer poinRank;
	private Integer totalUsers;
}
