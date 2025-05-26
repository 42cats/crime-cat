package com.crimecat.backend.user.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class TotalUserRankingSuccessResponseDto implements TotalUserRankingResponseDto{
	private Integer page;
	private Integer limit;
	private Integer totalUsers;
	private List<TotalUserRankingDto> ranks;
}
