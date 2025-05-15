package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.gametheme.enums.ThemeType;
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
                .playTimeMin(theme.getPlayTimeMin())
                .playTimeMax(theme.getPlayTimeMax())
                .price(theme.getPrice())
                .difficulty(theme.getDifficulty())
                .tags(theme.getTags())
                .recommendationEnabled(theme.isRecommendationEnabled())
                .teamName(teamName)
                .type(ThemeType.Values.CRIMESCENE)
                .build();
    }
}
