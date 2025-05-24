package com.crimecat.backend.gameHistory.dto;

import com.crimecat.backend.gameHistory.domain.EscapeRoomHistory;
import com.crimecat.backend.gameHistory.enums.SuccessStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EscapeRoomHistoryResponse {
    private UUID id;
    private UUID escapeRoomThemeId;
    private String escapeRoomThemeTitle;
    private UUID escapeRoomLocationId;
    private String escapeRoomLocationName;
    private UUID userId;
    private String userNickname;
    private String userAvatarUrl;
    private SuccessStatus successStatus;
    private Integer clearTime;
    private String formattedClearTime;
    private Integer difficultyRating;
    private Double difficultyRatingStars;
    private Integer teamSize;
    private Integer hintCount;
    private Integer funRating;
    private Double funRatingStars;
    private Integer storyRating;
    private Double storyRatingStars;
    private String memo;
    private LocalDate playDate;
    private Boolean isSpoiler;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isAuthor;
    
    public static EscapeRoomHistoryResponse from(EscapeRoomHistory history, UUID currentUserId) {
        boolean isAuthor = history.isAuthor(currentUserId);
        
        return EscapeRoomHistoryResponse.builder()
                .id(history.getId())
                .escapeRoomThemeId(history.getEscapeRoomTheme().getId())
                .escapeRoomThemeTitle(history.getEscapeRoomTheme().getTitle())
                .escapeRoomLocationId(history.getEscapeRoomLocationId())
                .escapeRoomLocationName(null) // 지점 정보는 별도로 조회해야 함
                .userId(history.getWebUser().getId())
                .userNickname(history.getWebUser().getNickname())
                .userAvatarUrl(history.getWebUser().getProfileImagePath())
                .successStatus(history.getSuccessStatus())
                .clearTime(history.getClearTime())
                .formattedClearTime(history.getFormattedClearTime())
                .difficultyRating(history.getDifficultyRating())
                .difficultyRatingStars(history.getDifficultyRatingStars())
                .teamSize(history.getTeamSize())
                .hintCount(history.getHintCount())
                .funRating(history.getFunRating())
                .funRatingStars(history.getFunRatingStars())
                .storyRating(history.getStoryRating())
                .storyRatingStars(history.getStoryRatingStars())
                .memo(history.getMemo())
                .playDate(history.getPlayDate())
                .isSpoiler(history.getIsSpoiler())
                .createdAt(history.getCreatedAt())
                .updatedAt(history.getUpdatedAt())
                .isAuthor(isAuthor)
                .build();
    }
    
    public static EscapeRoomHistoryResponse fromWithSpoilerCheck(
            EscapeRoomHistory history, 
            UUID currentUserId, 
            boolean hasGameHistoryForTheme) {
        
        EscapeRoomHistoryResponse response = from(history, currentUserId);
        
        // 스포일러 메모 처리
        if (history.getIsSpoiler() && !history.canViewMemo(currentUserId, hasGameHistoryForTheme)) {
            response.memo = history.getSafeMemo(currentUserId, hasGameHistoryForTheme);
        }
        
        return response;
    }
}