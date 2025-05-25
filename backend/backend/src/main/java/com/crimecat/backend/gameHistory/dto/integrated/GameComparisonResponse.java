package com.crimecat.backend.gameHistory.dto.integrated;

import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.gametheme.domain.EscapeRoomTheme;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 게임 비교 응답 DTO
 * 여러 사용자가 공통으로 플레이하지 않은 테마 목록과 각 사용자의 플레이 통계
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameComparisonResponse {
    
    /**
     * 모든 사용자가 플레이하지 않은 테마 목록
     */
    private List<UnplayedTheme> unplayedThemes;
    
    /**
     * 사용자별 플레이 통계
     */
    private Map<String, UserPlayStats> userStatistics;
    
    /**
     * 전체 테마 수
     */
    private int totalThemeCount;
    
    /**
     * 공통 미플레이 테마 수
     */
    private int commonUnplayedCount;
    
    /**
     * 페이징 정보
     */
    private PageInfo pageInfo;
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnplayedTheme {
        private String id;
        private String title;
        private String thumbnail;
        private String summary;
        private GameType gameType;
        
        // 공통 정보
        private int playersMin;
        private int playersMax;
        private int playTimeMin;
        private int playTimeMax;
        private int price;
        private int difficulty;
        private List<String> tags;
        private int recommendations;
        private int views;
        private int totalPlayCount;
        
        // 크라임씬 전용
        private String guildName;
        private String teamName;
        
        // 방탈출 전용
        private List<LocationInfo> locations;
        private boolean isOperating;
        private Integer horrorLevel;
        private Integer deviceRatio;
        private Integer activityLevel;
        
        public static UnplayedTheme fromCrimesceneTheme(CrimesceneTheme theme) {
            return UnplayedTheme.builder()
                    .id(theme.getId().toString())
                    .title(theme.getTitle())
                    .thumbnail(theme.getThumbnail())
                    .summary(theme.getSummary())
                    .gameType(GameType.CRIMESCENE)
                    .playersMin(theme.getPlayerMin())
                    .playersMax(theme.getPlayerMax())
                    .playTimeMin(theme.getPlayTimeMin())
                    .playTimeMax(theme.getPlayTimeMax())
                    .price(theme.getPrice())
                    .difficulty(theme.getDifficulty())
                    .tags(theme.getTags().stream().toList())
                    .recommendations(theme.getRecommendations())
                    .views(theme.getViews())
                    .totalPlayCount(theme.getPlayCount())
                    .guildName(theme.getGuild() != null ? theme.getGuild().getName() : null)
                    .teamName(theme.getTeam() != null ? theme.getTeam().getName() : null)
                    .build();
        }
        
        public static UnplayedTheme fromEscapeRoomTheme(EscapeRoomTheme theme) {
            return UnplayedTheme.builder()
                    .id(theme.getId().toString())
                    .title(theme.getTitle())
                    .thumbnail(theme.getThumbnail())
                    .summary(theme.getSummary())
                    .gameType(GameType.ESCAPE_ROOM)
                    .playersMin(theme.getPlayerMin())
                    .playersMax(theme.getPlayerMax())
                    .playTimeMin(theme.getPlayTimeMin())
                    .playTimeMax(theme.getPlayTimeMax())
                    .price(theme.getPrice())
                    .difficulty(theme.getDifficulty())
                    .tags(theme.getTags().stream().toList())
                    .recommendations(theme.getRecommendations())
                    .views(theme.getViews())
                    .totalPlayCount(theme.getPlayCount())
                    .locations(theme.getLocations() != null ? 
                            theme.getLocations().stream()
                                    .map(LocationInfo::from)
                                    .toList() : List.of())
                    .isOperating(theme.getIsOperating())
                    .horrorLevel(theme.getHorrorLevel())
                    .deviceRatio(theme.getDeviceRatio())
                    .activityLevel(theme.getActivityLevel())
                    .build();
        }
    }
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationInfo {
        private String storeName;
        private String address;
        private String region;
        
        public static LocationInfo from(com.crimecat.backend.gametheme.domain.EscapeRoomLocation location) {
            return LocationInfo.builder()
                    .storeName(location.getStoreName())
                    .address(location.getAddress())
                    .region(extractRegion(location.getAddress()))
                    .build();
        }
        
        private static String extractRegion(String address) {
            // 주소에서 지역명 추출 로직
            // 예: "서울시 마포구 홍대" -> "홍대"
            if (address == null) return "";
            
            // 간단한 로직 - 실제로는 더 정교한 처리 필요
            if (address.contains("홍대")) return "홍대";
            if (address.contains("강남")) return "강남";
            if (address.contains("건대")) return "건대";
            if (address.contains("신촌")) return "신촌";
            // ... 기타 지역
            
            return "";
        }
    }
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserPlayStats {
        private String userId;
        private String nickname;
        private int totalPlayCount;     // 총 플레이 횟수
        private int uniqueThemeCount;   // 고유 테마 수
        private double completionRate;  // 전체 테마 대비 완료율 (%)
    }
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PageInfo {
        private int currentPage;
        private int totalPages;
        private int pageSize;
        private long totalElements;
        private boolean hasNext;
        private boolean hasPrevious;
    }
    
    public enum GameType {
        CRIMESCENE,
        ESCAPE_ROOM
    }
}
