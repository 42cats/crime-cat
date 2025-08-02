package com.crimecat.backend.messagemacro.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 자동완성 메타데이터가 포함된 향상된 봇 커맨드 DTO
 * Discord 봇 커맨드 정보 + 프론트엔드 자동완성 지원 정보 통합
 */
@Data
@Builder
public class EnhancedBotCommandDto {
    private String name;
    private String description;
    private String type;
    private String category;
    private Boolean isCacheCommand;
    
    // 서브커맨드 정보
    private Map<String, EnhancedBotCommandSubcommandDto> subcommands;
    
    // 자동완성 지원 여부
    private boolean hasAutocompleteSupport;
    private int totalAutocompleteParameters;
}