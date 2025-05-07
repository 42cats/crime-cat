package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.gametheme.domain.GameTheme;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Set;
import java.util.UUID;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
public class GameThemeDetailDto {
    private UUID id;
    private String title;
    private String thumbnail;
    private String summary;
    private int recommendations;
    private int views;
    private int playCount;
    private AuthorDto author;
    private int playersMin;
    private int playersMax;
    private int playTimeMin;
    private int playTimeMax;
    private int price;
    private int difficulty;
    private Set<String> tags;
    private String content;
    private boolean publicStatus;
    private Instant createdAt;
    private Instant updatedAt;
    private String type;

    public static GameThemeDetailDto of(GameTheme theme) {
        if (theme instanceof CrimesceneTheme) {
            return CrimesceneThemeDetailDto.of((CrimesceneTheme) theme);
        }
        return GameThemeDetailDto.builder()
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
                .build();
    }
}
