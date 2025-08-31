package com.crimecat.backend.schedule.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 내일정 조회 응답 DTO
 * Discord 봇 `/내일정` 명령어 전용
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyScheduleResponse {
    
    /**
     * Discord Snowflake ID
     */
    private String discordSnowflake;
    
    /**
     * 한국어 형식으로 포맷된 일정 목록
     * 예: "8월 28 29 30, 9월 3 4 7 10 11 12 14 15 16 17 18 19 20 21 22 23 25 26 27 28 29 30"
     */
    private String koreanDateFormat;
    
    /**
     * 요청된 개월 수
     */
    private Integer requestedMonths;
    
    /**
     * 마지막 iCal 동기화 시간
     */
    private LocalDateTime syncedAt;
    
    /**
     * 등록된 캘린더 개수
     */
    private Integer calendarCount;
    
    /**
     * 총 일정 개수 (향후 3개월)
     */
    private Integer totalEvents;
    
    /**
     * 사용자 웹 등록 여부
     */
    private Boolean isWebUserRegistered;
    
    /**
     * iCal URL 등록 여부
     */
    private Boolean hasICalCalendars;
    
    /**
     * 사용 가능한 날짜 (한국어 형식)
     * 예: "8월 1 2 5 6 12 13, 9월 1 2 8 9 15 16"
     */
    private String availableDatesFormat;
    
    /**
     * 사용 가능한 날짜 수
     */
    private Integer totalAvailableDays;
    
    /**
     * 웹에서 차단된 날짜 수
     */
    private Integer totalBlockedDays;
    
    /**
     * 가용성 비율 (0.0-1.0)
     * 전체 기간 중 사용 가능한 날짜 비율
     */
    private Double availabilityRatio;
}