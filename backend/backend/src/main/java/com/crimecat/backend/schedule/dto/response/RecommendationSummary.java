package com.crimecat.backend.schedule.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;

/**
 * 추천 요약 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationSummary {
    
    /**
     * 추천 시간대 목록
     */
    @Builder.Default
    private List<TimeSlotRecommendation> recommendations = Collections.emptyList();
    
    /**
     * 검색된 총 추천 개수
     */
    @Builder.Default
    private Integer totalSearched = 0;
    
    /**
     * 참여자 수
     */
    @Builder.Default
    private Integer participantCount = 0;
    
    /**
     * 검색 기간 설명
     */
    private String searchPeriod;
    
    /**
     * 추천 결과가 비어있는지 여부
     */
    @Builder.Default
    private Boolean empty = true;
    
    /**
     * 추천 계산에 걸린 시간 (밀리초)
     */
    private Long calculationTimeMs;
    
    /**
     * 평균 가용성 점수
     */
    private Double averageScore;
    
    /**
     * 빈 추천 요약 생성
     */
    public static RecommendationSummary empty() {
        return RecommendationSummary.builder()
            .recommendations(Collections.emptyList())
            .totalSearched(0)
            .participantCount(0)
            .empty(true)
            .build();
    }
    
    /**
     * 추천이 비어있는지 확인
     */
    public boolean isEmpty() {
        return empty == null ? recommendations.isEmpty() : empty;
    }
    
    /**
     * 평균 점수 계산 (lazy)
     */
    public Double getAverageScore() {
        if (averageScore != null) {
            return averageScore;
        }
        
        if (recommendations.isEmpty()) {
            return 0.0;
        }
        
        averageScore = recommendations.stream()
            .mapToDouble(TimeSlotRecommendation::getAvailabilityScore)
            .average()
            .orElse(0.0);
        
        return averageScore;
    }
}