package com.crimecat.backend.schedule.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 일정 교차체크 응답 DTO
 * Discord 봇 `/일정체크` 명령어 전용
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleOverlapResponse {
    
    /**
     * 겹치는 날짜 목록 (월 포함)
     * 예: "10월 2, 4" 또는 "8월 28 30, 9월 3 7"
     */
    private String overlappingDates;
    
    /**
     * 총 겹치는 날짜 개수
     */
    private Integer totalMatches;
    
    /**
     * 입력된 총 날짜 개수
     */
    private Integer inputTotal;
    
    /**
     * 사용자 총 일정 개수 (향후 3개월)
     */
    private Integer userTotal;
    
    /**
     * 일치율 (백분율)
     */
    private Double matchPercentage;
    
    /**
     * Discord Snowflake ID
     */
    private String discordSnowflake;
    
    /**
     * 입력된 날짜 목록 (원본)
     */
    private String inputDates;
    
    /**
     * 요청된 개월 수
     */
    private Integer requestedMonths;
    
    /**
     * 체크된 시간
     */
    private LocalDateTime checkedAt;
    
    /**
     * 입력 날짜 중 사용 가능한 날짜 (한국어 형식)
     * 예: "10월 1 3 5, 11월 2 8 9"
     */
    private String availableDatesFromInput;
    
    /**
     * 입력 날짜 중 사용 가능한 날짜 수
     */
    private Integer totalAvailableFromInput;
    
    /**
     * 입력 날짜 중 웹 차단된 날짜 수
     */
    private Integer totalBlockedFromInput;
    
    /**
     * 입력 날짜 중 사용 가능 비율 (0.0-1.0)
     */
    private Double availabilityRatioFromInput;
}