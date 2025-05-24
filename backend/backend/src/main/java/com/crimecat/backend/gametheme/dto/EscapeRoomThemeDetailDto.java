package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.gametheme.domain.EscapeRoomTheme;
import com.crimecat.backend.gametheme.enums.ThemeType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;

@Getter
@AllArgsConstructor
@SuperBuilder
public class EscapeRoomThemeDetailDto extends GameThemeDetailDto {
    private Integer horrorLevel;
    private Integer deviceRatio;
    private Integer activityLevel;
    private LocalDate openDate;
    private Boolean isOperating;
    private Set<String> genreTags;
    private List<EscapeRoomLocation> locations;
    private String homepageUrl;
    private String reservationUrl;
    private Boolean allowGameHistory;

    public static EscapeRoomThemeDetailDto of(EscapeRoomTheme theme) {
        return EscapeRoomThemeDetailDto.builder()
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
                .type(ThemeType.Values.ESCAPE_ROOM)
                // 방탈출 전용 필드
                .horrorLevel(theme.getHorrorLevel())
                .deviceRatio(theme.getDeviceRatio())
                .activityLevel(theme.getActivityLevel())
                .openDate(theme.getOpenDate())
                .isOperating(theme.getIsOperating())
                .genreTags(theme.getGenreTagNames())
                .locations(theme.getLocationDtos())
                .homepageUrl(theme.getHomepageUrl())
                .reservationUrl(theme.getReservationUrl())
                .allowGameHistory(true) // 방탈출 테마는 기본적으로 게임 기록 허용
                .build();
    }
}