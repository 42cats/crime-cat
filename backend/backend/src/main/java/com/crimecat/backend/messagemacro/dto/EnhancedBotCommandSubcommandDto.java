package com.crimecat.backend.messagemacro.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 자동완성 메타데이터가 포함된 향상된 봇 커맨드 서브커맨드 DTO
 */
@Data
@Builder
public class EnhancedBotCommandSubcommandDto {
    private String name;
    private String description;
    
    // 파라미터 정보 (자동완성 메타데이터 포함)
    private List<EnhancedBotCommandParameterDto> parameters;
    
    // 자동완성 지원 파라미터 수
    private int autocompleteParameterCount;
}