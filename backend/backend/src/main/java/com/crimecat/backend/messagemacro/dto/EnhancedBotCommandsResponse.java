package com.crimecat.backend.messagemacro.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 향상된 봇 커맨드 응답 DTO
 * 봇 커맨드 정보 + 자동완성 메타데이터 통합 응답
 */
@Data
@Builder
public class EnhancedBotCommandsResponse {
    private boolean success;
    private List<EnhancedBotCommandDto> commands;
    private int count;
    private String message;
    
    // 자동완성 지원 통계
    private AutocompleteSummaryDto autocompleteSummary;
}