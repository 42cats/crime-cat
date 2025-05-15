package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.gametheme.enums.ThemeType;
import com.crimecat.backend.guild.dto.bot.GuildDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.time.ZoneOffset;
import java.util.Map;

@Getter
@AllArgsConstructor
@SuperBuilder
public class CrimesceneThemeDetailDto extends GameThemeDetailDto {
    private TeamDto team;
    private GuildDto guild;
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
                .author(AuthorDto.from(theme.getAuthor()))
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
                .recommendationEnabled(theme.isRecommendationEnabled())
                .commentEnabled(theme.isCommentEnabled())
                .type(ThemeType.Values.CRIMESCENE)
                .team(TeamDto.from(theme.getTeam()))
                .guild(GuildDto.from(theme.getGuild()))
                .guildSnowflake(theme.getGuildSnowflake())
                .extra(theme.getExtra())
                .build();
    }
}
