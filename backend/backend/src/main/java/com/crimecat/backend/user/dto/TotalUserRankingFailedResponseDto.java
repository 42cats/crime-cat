package com.crimecat.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class TotalUserRankingFailedResponseDto implements TotalUserRankingResponseDto{
	private String message;
}
