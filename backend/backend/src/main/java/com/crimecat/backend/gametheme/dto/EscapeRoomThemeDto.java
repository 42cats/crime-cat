package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.gametheme.domain.EscapeRoomTheme;
import com.crimecat.backend.gametheme.enums.ThemeType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@SuperBuilder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class EscapeRoomThemeDto extends GameThemeDto {
    private Integer horrorLevel;
    private Integer deviceRatio;
    private Integer activityLevel;
    private LocalDate openDate;
    private Boolean isOperating;
    private Set<String> genreTags;
    private List<EscapeRoomLocation> locations;
    private String homepageUrl;
    private String reservationUrl;

    public static EscapeRoomThemeDto from(EscapeRoomTheme theme) {
        return EscapeRoomThemeDto.builder()
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
                .type(ThemeType.Values.ESCAPE_ROOM)
                // 방탈출 전용 필드
                .horrorLevel(theme.getHorrorLevel())
                .deviceRatio(theme.getDeviceRatio())
                .activityLevel(theme.getActivityLevel())
                .openDate(theme.getOpenDate())
                .isOperating(theme.getIsOperating())
                .locations(theme.getLocationDtos())
                .homepageUrl(theme.getHomepageUrl())
                .reservationUrl(theme.getReservationUrl())
                .build();
    }
}