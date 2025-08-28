package com.crimecat.backend.schedule.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

/**
 * 일정 교차체크 요청 DTO
 * Discord 봇 `/일정체크` 명령어 전용
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleOverlapRequest {
    
    /**
     * 입력된 날짜 목록 문자열
     * 예: "10월 1 2 3 4" 또는 "8월 28 29 30, 9월 3 4 7 10"
     */
    @NotBlank(message = "날짜 목록은 필수입니다")
    private String inputDates;
    
    /**
     * 조회할 개월 수 (옵션, 기본 3개월)
     */
    private Integer months;
}