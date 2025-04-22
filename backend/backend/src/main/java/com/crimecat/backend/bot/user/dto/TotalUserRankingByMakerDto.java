package com.crimecat.backend.bot.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class TotalUserRankingByMakerDto implements TotalUserRankingDto {
    private String userSnowflake;
    private Integer rank;
    private Integer guildCount;
}