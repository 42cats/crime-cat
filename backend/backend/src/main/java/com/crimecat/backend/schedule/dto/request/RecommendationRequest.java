package com.crimecat.backend.schedule.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * 추천 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationRequest {
    
    /**
     * 이벤트 ID
     */
    private UUID eventId;
    
    /**
     * 요청하는 사용자 ID
     */
    private UUID requestUserId;
    
    /**
     * 검색 시작 날짜 (기본값: 내일)
     */
    @Builder.Default
    private LocalDate startDate = LocalDate.now().plusDays(1);
    
    /**
     * 검색 종료 날짜 (기본값: 3개월 후)
     */
    @Builder.Default
    private LocalDate endDate = LocalDate.now().plusDays(90);
    
    /**
     * 선호하는 시작 시간 (기본값: 10:00)
     */
    @Builder.Default
    private LocalTime preferredStartTime = LocalTime.of(10, 0);
    
    /**
     * 선호하는 종료 시간 (기본값: 22:00)
     */
    @Builder.Default
    private LocalTime preferredEndTime = LocalTime.of(22, 0);
    
    /**
     * 최소 이벤트 지속 시간 (시간 단위, 기본값: 2시간)
     */
    @Builder.Default
    private Integer minDurationHours = 2;
    
    /**
     * 최대 추천 개수 (기본값: 5개)
     */
    @Builder.Default
    private Integer maxRecommendations = 5;
}