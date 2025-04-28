package com.crimecat.backend.web.gametheme.dto;

import com.crimecat.backend.web.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.web.gametheme.domain.ThemeType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;

@Getter
@AllArgsConstructor
@SuperBuilder
public class CrimesceneThemeDetailDto extends GameThemeDetailDto {
    private UUID makerTeamsId;
    private String guildSnowflake;
    private Map<String, Object> extra;

    public static CrimesceneThemeDetailDto of(CrimesceneTheme theme) {
        return CrimesceneThemeDetailDto.builder()
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
                .content(theme.getContent())
                .publicStatus(theme.isPublicStatus())
                .createdAt(theme.getCreatedAt().toInstant(ZoneOffset.UTC))
                .updatedAt(theme.getUpdatedAt().toInstant(ZoneOffset.UTC))
                .type(ThemeType.Values.CRIMESCENE)
                .makerTeamsId(theme.getTeamId())
                .guildSnowflake(theme.getGuildSnowflake())
                .extra(theme.getExtra())
                .build();
    }
}
