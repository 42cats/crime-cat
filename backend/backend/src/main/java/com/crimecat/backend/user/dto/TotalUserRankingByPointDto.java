package com.crimecat.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class TotalUserRankingByPointDto implements TotalUserRankingDto {
	String userSnowflake;
	Integer rank;
	private Integer point;
}
