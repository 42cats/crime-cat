package com.crimecat.backend.gameHistory.dto;

import com.crimecat.backend.gameHistory.domain.EscapeRoomHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 방탈출 히스토리 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EscapeRoomHistoryResponse {

    private UUID id;
    private UUID escapeRoomThemeId;
    private String escapeRoomThemeTitle;
    private UUID userId;
    private String userNickname;
    private String userAvatarUrl;
    
    // 게임 결과
    private Boolean isSuccess;
    private Integer escapeTimeMinutes;
    private String formattedEscapeTime;
    
    // 평가
    private Integer feltDifficulty;
    private Double feltDifficultyStars;
    private Integer satisfaction;
    private Double satisfactionStars;
    
    // 플레이 정보
    private Integer participantsCount;
    private Integer hintUsedCount;
    private String memo;
    private String storeLocation;
    
    // 메타 정보
    private Boolean isPublic;
    private Boolean hasSpoiler;
    private LocalDateTime playDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 권한 정보
    private Boolean isAuthor; // 현재 사용자가 작성자인지

    /**
     * Entity에서 DTO로 변환
     */
    public static EscapeRoomHistoryResponse from(EscapeRoomHistory history, UUID currentUserId) {
        return EscapeRoomHistoryResponse.builder()
                .id(history.getId())
                .escapeRoomThemeId(history.getEscapeRoomTheme().getId())
                .escapeRoomThemeTitle(history.getEscapeRoomTheme().getTitle())
                .userId(history.getUser().getId())
                .userNickname(history.getUser().getName())
                .userAvatarUrl(history.getUser().getProfileImagePath())
                .isSuccess(history.getIsSuccess())
                .escapeTimeMinutes(history.getEscapeTimeMinutes())
                .formattedEscapeTime(history.getFormattedEscapeTime())
                .feltDifficulty(history.getFeltDifficulty())
                .feltDifficultyStars(history.getFeltDifficultyStars())
                .satisfaction(history.getSatisfaction())
                .satisfactionStars(history.getSatisfactionStars())
                .participantsCount(history.getParticipantsCount())
                .hintUsedCount(history.getHintUsedCount())
                .memo(history.getMemo())
                .storeLocation(history.getStoreLocation())
                .isPublic(history.getIsPublic())
                .hasSpoiler(history.getHasSpoiler())
                .playDate(history.getPlayDate())
                .createdAt(history.getCreatedAt())
                .updatedAt(history.getUpdatedAt())
                .isAuthor(currentUserId != null && history.isAuthor(currentUserId))
                .build();
    }

    /**
     * Entity에서 DTO로 변환 (작성자 정보 없이)
     */
    public static EscapeRoomHistoryResponse from(EscapeRoomHistory history) {
        return from(history, null);
    }
}