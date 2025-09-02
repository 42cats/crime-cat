package com.crimecat.backend.schedule.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 이중 추천 응답 DTO
 * - "현재 참여자" vs "나를 포함한" 추천 결과 제공
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DualRecommendationResponse {
    
    /**
     * 현재 참여자들만의 추천 결과
     */
    private RecommendationSummary currentParticipants;
    
    /**
     * 요청한 사용자를 포함한 추천 결과
     */
    private RecommendationSummary includingMe;
    
    /**
     * 요청한 사용자가 이미 참여 중인지 여부
     */
    @Builder.Default
    private Boolean isUserParticipant = false;
    
    /**
     * 현재 참여자 수
     */
    @Builder.Default
    private Integer participantCount = 0;
    
    /**
     * 추천 결과 요약 메시지
     */
    private String message;
    
    /**
     * 추천 생성 시간 (밀리초)
     */
    private Long generatedAt;
    
    /**
     * 추천의 신뢰도 (0.0 ~ 1.0)
     */
    @Builder.Default
    private Double confidenceLevel = 0.8;
}