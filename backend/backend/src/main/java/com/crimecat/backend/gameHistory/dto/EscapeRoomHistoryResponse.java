package com.crimecat.backend.gameHistory.dto;

import com.crimecat.backend.gameHistory.domain.EscapeRoomHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

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
    private UUID userId;
    private String userNickname;
    private Boolean isSuccess;
    private Integer escapeTimeMinutes;
    private String formattedEscapeTime;
    private Integer feltDifficulty;
    private Double feltDifficultyStars;
    private Integer participantsCount;
    private Integer hintUsedCount;
    private Integer satisfaction;
    private Double satisfactionStars;
    private String memo;
    private Boolean isPublic;
    private LocalDateTime playDate;
    private Boolean hasSpoiler;
    private String storeLocation;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isAuthor;
    
    public static EscapeRoomHistoryResponse from(EscapeRoomHistory history, UUID currentUserId) {
        boolean isAuthor = history.isAuthor(currentUserId);
        
        return EscapeRoomHistoryResponse.builder()
                .id(history.getId())
                .escapeRoomThemeId(history.getEscapeRoomTheme().getId())
                .escapeRoomThemeTitle(history.getEscapeRoomTheme().getTitle())
                .userId(history.getUser().getId())
                .userNickname(history.getUser().getName())
                .isSuccess(history.getIsSuccess())
                .escapeTimeMinutes(history.getEscapeTimeMinutes())
                .formattedEscapeTime(history.getFormattedEscapeTime())
                .feltDifficulty(history.getFeltDifficulty())
                .feltDifficultyStars(history.getFeltDifficultyStars())
                .participantsCount(history.getParticipantsCount())
                .hintUsedCount(history.getHintUsedCount())
                .satisfaction(history.getSatisfaction())
                .satisfactionStars(history.getSatisfactionStars())
                .memo(history.getMemo())
                .isPublic(history.getIsPublic())
                .playDate(history.getPlayDate())
                .hasSpoiler(history.getHasSpoiler())
                .storeLocation(history.getStoreLocation())
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
        if (history.getHasSpoiler() && !history.canViewMemo(currentUserId, hasGameHistoryForTheme)) {
            response.memo = history.getSafeMemo(currentUserId, hasGameHistoryForTheme);
        }
        
        return response;
    }
}