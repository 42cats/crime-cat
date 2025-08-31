package com.crimecat.backend.schedule.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 시간대 추천 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeSlotRecommendation {
    
    /**
     * 추천 시작 시간
     */
    private LocalDateTime startTime;
    
    /**
     * 추천 종료 시간
     */
    private LocalDateTime endTime;
    
    /**
     * 참여자 수
     */
    private Integer participantCount;
    
    /**
     * 가용성 점수 (높을수록 좋은 시간)
     */
    private Double availabilityScore;
    
    /**
     * 추천 설명
     */
    private String description;
    
    /**
     * 충돌 여부
     */
    @Builder.Default
    private Boolean hasConflict = false;
    
    /**
     * 추천 우선순위 (1이 가장 높음)
     */
    private Integer priority;
}