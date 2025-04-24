package com.crimecat.backend.web.gametheme.dto;

import com.crimecat.backend.web.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.web.gametheme.domain.GameTheme;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.ZoneOffset;
import java.util.Set;
import java.util.UUID;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
public class GameThemeDto {
    private UUID id;
    private String title;
    private String thumbnail;
    private String summary;
    private int recommendations;
    private int views;
    private int playCount;
    private UUID author;
    private int playersMin;
    private int playersMax;
    private int playtime;
    private int price;
    private int difficulty;
    private Set<String> tags;
    private String type;

    public static GameThemeDto from(GameTheme theme) {
        if (theme instanceof CrimesceneTheme) {
            return CrimesceneThemeDto.from((CrimesceneTheme) theme);
        }
        return GameThemeDto.builder()
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
                .build();
    }
}
