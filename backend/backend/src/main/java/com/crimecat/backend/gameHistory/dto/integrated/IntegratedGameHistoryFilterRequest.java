package com.crimecat.backend.gameHistory.dto.integrated;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

/**
 * 통합 게임 기록 필터 요청 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntegratedGameHistoryFilterRequest {
    
    /**
     * 게임 타입 필터 (null이면 전체)
     */
    private GameType gameType;
    
    /**
     * 검색 키워드 (테마명, 길드명, 매장명 등)
     */
    private String keyword;
    
    /**
     * 승패 필터 (null이면 전체)
     */
    private Boolean isWin;
    
    /**
     * 날짜 범위 필터
     */
    private LocalDate startDate;
    private LocalDate endDate;
    
    /**
     * 테마 존재 여부 필터 (크라임씬용)
     */
    private Boolean hasTheme;
    
    /**
     * 방탈출 전용 필터
     */
    private SuccessStatusFilter successStatus;
    private Integer minClearTime;
    private Integer maxClearTime;
    private Integer minDifficulty;
    private Integer maxDifficulty;
    private Integer minFunRating;
    private Integer maxFunRating;
    private Integer minStoryRating;
    private Integer maxStoryRating;
    
    /**
     * 정렬 옵션
     */
    private SortOption sortBy;
    private SortDirection sortDirection;
    
    /**
     * 페이징 정보
     */
    @Builder.Default
    private int page = 0;
    
    @Builder.Default
    private int size = 20;
    
    public enum GameType {
        CRIMESCENE,
        ESCAPE_ROOM,
        MURDER_MYSTERY,
        REALWORLD
    }
    
    public enum SuccessStatusFilter {
        ALL,
        SUCCESS_ONLY,
        FAIL_ONLY,
        PARTIAL_ONLY
    }
    
    public enum SortOption {
        PLAY_DATE,      // 플레이 날짜
        CREATED_AT,     // 기록 생성일
        THEME_NAME,     // 테마명
        GUILD_NAME,     // 길드명 (크라임씬)
        STORE_NAME,     // 매장명 (방탈출)
        CLEAR_TIME,     // 클리어 시간 (방탈출)
        DIFFICULTY,     // 난이도 평가
        FUN_RATING,     // 재미 평가
        STORY_RATING    // 스토리 평가
    }
    
    public enum SortDirection {
        ASC,
        DESC
    }
}
