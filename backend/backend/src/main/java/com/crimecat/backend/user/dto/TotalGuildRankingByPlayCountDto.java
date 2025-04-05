package com.crimecat.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class TotalGuildRankingByPlayCountDto implements TotalUserRankingDto  {
    private String guildSnowflake;
    private Integer rank;
    private Integer gameCount;
}