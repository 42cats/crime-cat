package com.crimecat.backend.user.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class TotalUserRankingResponseDto {
	private Integer page;
	private Integer limit;
	private Integer totalUsers;
	private List<TotalUserRankingDto> ranks;
}
