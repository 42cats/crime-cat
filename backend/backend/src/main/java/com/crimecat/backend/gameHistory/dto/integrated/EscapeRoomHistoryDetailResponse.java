package com.crimecat.backend.gameHistory.dto.integrated;

import com.crimecat.backend.gameHistory.dto.EscapeRoomHistoryResponse;
import com.crimecat.backend.gameHistory.enums.SuccessStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 방탈출 기록 상세 응답 DTO
 * 테마 정보와 매장 정보를 포함한 완전한 응답
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EscapeRoomHistoryDetailResponse {
    
    // 기본 정보 (EscapeRoomHistoryResponse와 동일한 필드)
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
    
    // 테마 상세 정보
    private String themeThumbnail;
    private String themeSummary;
    private Integer themePrice;
    private Integer themeDifficulty;
    private List<String> themeTags;
    
    // 매장 정보
    private String storeName;
    private String storeAddress;
    private String storeRegion; // 지역 (예: 홍대, 강남)
    private String storePhone;
    
    // 추가 통계 정보
    private boolean isFirstPlay; // 해당 테마 첫 플레이 여부
    private int playCountForTheme; // 해당 테마 플레이 횟수
    
    /**
     * EscapeRoomHistoryResponse를 기반으로 상세 정보 추가
     */
    public static EscapeRoomHistoryDetailResponse from(
            EscapeRoomHistoryResponse baseResponse,
            ThemeDetail themeDetail,
            LocationDetail locationDetail,
            int playCount) {
        
        return EscapeRoomHistoryDetailResponse.builder()
                // 기본 정보 복사
                .id(baseResponse.getId())
                .escapeRoomThemeId(baseResponse.getEscapeRoomThemeId())
                .escapeRoomThemeTitle(baseResponse.getEscapeRoomThemeTitle())
                .escapeRoomLocationId(baseResponse.getEscapeRoomLocationId())
                .escapeRoomLocationName(baseResponse.getEscapeRoomLocationName())
                .userId(baseResponse.getUserId())
                .userNickname(baseResponse.getUserNickname())
                .userAvatarUrl(baseResponse.getUserAvatarUrl())
                .successStatus(baseResponse.getSuccessStatus())
                .clearTime(baseResponse.getClearTime())
                .formattedClearTime(baseResponse.getFormattedClearTime())
                .difficultyRating(baseResponse.getDifficultyRating())
                .difficultyRatingStars(baseResponse.getDifficultyRatingStars())
                .teamSize(baseResponse.getTeamSize())
                .hintCount(baseResponse.getHintCount())
                .funRating(baseResponse.getFunRating())
                .funRatingStars(baseResponse.getFunRatingStars())
                .storyRating(baseResponse.getStoryRating())
                .storyRatingStars(baseResponse.getStoryRatingStars())
                .memo(baseResponse.getMemo())
                .playDate(baseResponse.getPlayDate())
                .isSpoiler(baseResponse.getIsSpoiler())
                .createdAt(baseResponse.getCreatedAt())
                .updatedAt(baseResponse.getUpdatedAt())
                .isAuthor(baseResponse.getIsAuthor())
                
                // 추가 정보
                .themeThumbnail(themeDetail.getThumbnail())
                .themeSummary(themeDetail.getSummary())
                .themePrice(themeDetail.getPrice())
                .themeDifficulty(themeDetail.getDifficulty())
                .themeTags(themeDetail.getTags())
                
                .storeName(locationDetail.getStoreName())
                .storeAddress(locationDetail.getAddress())
                .storeRegion(locationDetail.getRegion())
                .storePhone(locationDetail.getPhone())
                
                .isFirstPlay(playCount == 1)
                .playCountForTheme(playCount)
                .build();
    }
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ThemeDetail {
        private String thumbnail;
        private String summary;
        private Integer price;
        private Integer difficulty;
        private List<String> tags;
    }
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationDetail {
        private String storeName;
        private String address;
        private String region;
        private String phone;
    }
}
