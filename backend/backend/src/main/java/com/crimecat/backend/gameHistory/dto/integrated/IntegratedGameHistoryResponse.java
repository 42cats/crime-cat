package com.crimecat.backend.gameHistory.dto.integrated;

import com.crimecat.backend.gameHistory.dto.EscapeRoomHistoryResponse;
import com.crimecat.backend.gameHistory.dto.UserGameHistoryDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 통합 게임 기록 응답 DTO
 * 사용자의 모든 게임 타입 기록을 한 번에 반환
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntegratedGameHistoryResponse {
    
    /**
     * 크라임씬 게임 기록 목록
     */
    private List<UserGameHistoryDto> crimeSceneHistories;
    
    /**
     * 방탈출 게임 기록 목록 (상세 정보 포함)
     */
    private List<EscapeRoomHistoryDetailResponse> escapeRoomHistories;
    
    /**
     * 게임별 통계 정보
     */
    private GameStatistics statistics;
    
    /**
     * 페이징 정보
     */
    private PageInfo pageInfo;
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GameStatistics {
        /**
         * 크라임씬 통계 (total과 unique가 동일 - 한 번만 플레이 가능)
         */
        private GameTypeStats crimeScene;
        
        /**
         * 방탈출 통계 (중복 플레이 가능)
         */
        private GameTypeStats escapeRoom;
        
        /**
         * 전체 게임 플레이 횟수
         */
        private int totalPlayCount;
        
        /**
         * 전체 고유 테마 수
         */
        private int totalUniqueThemes;
    }
    
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GameTypeStats {
        /**
         * 총 플레이 횟수 (중복 포함)
         */
        private int playCount;
        
        /**
         * 고유 테마 수 (중복 제거)
         * 크라임씬의 경우 total과 동일
         */
        private int unique;
        
        /**
         * 승리 횟수
         */
        private int winCount;
        
        /**
         * 승률 (%)
         */
        private double winRate;
        /**
         * 전체 테마수
         */
        private int total;
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
        private String sortBy;
        private String sortDirection;
    }
}
