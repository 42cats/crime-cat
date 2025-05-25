package com.crimecat.backend.gameHistory.dto.integrated;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * 게임 비교 요청 DTO
 * 여러 사용자의 게임 기록을 비교하여 공통으로 플레이하지 않은 테마를 찾기 위한 요청
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameComparisonRequest {
    
    /**
     * 비교할 사용자 ID 목록 (현재 사용자 포함)
     */
    private List<String> userIds;
    
    /**
     * 비교할 게임 타입
     */
    private GameType gameType;
    
    /**
     * 운영 중인 테마만 표시 (방탈출용)
     */
    @Builder.Default
    private boolean operatingOnly = true;
    
    /**
     * 지역 필터 (방탈출용)
     */
    private String region;
    
    /**
     * 가격 범위 필터
     */
    private Integer minPrice;
    private Integer maxPrice;
    
    /**
     * 인원 범위 필터
     */
    private Integer minPlayers;
    private Integer maxPlayers;
    
    /**
     * 난이도 범위 필터
     */
    private Integer minDifficulty;
    private Integer maxDifficulty;
    
    /**
     * 정렬 옵션
     */
    @Builder.Default
    private ComparisonSortOption sortBy = ComparisonSortOption.RECOMMENDATION;
    
    /**
     * 페이징 정보
     */
    @Builder.Default
    private int page = 0;
    
    @Builder.Default
    private int size = 20;
    
    public enum GameType {
        CRIMESCENE,
        ESCAPE_ROOM
    }
    
    public enum ComparisonSortOption {
        LATEST,         // 최신순
        OLDEST,         // 오래된순
        RECOMMENDATION, // 추천순
        VIEW_COUNT,     // 조회순
        PLAY_COUNT,     // 플레이순
        PRICE_ASC,      // 가격 낮은순
        PRICE_DESC,     // 가격 높은순
        DIFFICULTY_ASC, // 난이도 낮은순
        DIFFICULTY_DESC // 난이도 높은순
    }
}
