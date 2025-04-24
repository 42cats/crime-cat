package com.crimecat.backend.web.gametheme.dto;

import com.crimecat.backend.web.gametheme.domain.CrimesceneTheme;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

@SuperBuilder
@Getter
@AllArgsConstructor
public class CrimesceneThemeDto extends GameThemeDto {
    private String teamName;

    public static CrimesceneThemeDto from(CrimesceneTheme theme) {
        String teamName = null;
        if (theme.getTeam() != null) {
            teamName = theme.getTeam().getName();
        }
        return CrimesceneThemeDto.builder()
                .id(theme.getId())
                .title(theme.getTitle())
                .thumbnail(theme.getThumbnail())
                .summary(theme.getSummary())
                .recommendations(theme.getRecommendations())
                .views(theme.getViews())
                .playCount(theme.getPlayCount())
                .author(theme.getAuthorId())
                .playersMin(theme.getPlayerMin())
                .playersMax(theme.getPlayerMax())
                .playtime(theme.getPlaytime())
                .price(theme.getPrice())
                .difficulty(theme.getDifficulty())
                .tags(theme.getTags())
                .teamName(teamName)
                .build();
    }
}
