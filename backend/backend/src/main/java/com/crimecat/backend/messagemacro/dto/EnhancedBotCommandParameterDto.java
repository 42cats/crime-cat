package com.crimecat.backend.messagemacro.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 자동완성 메타데이터가 포함된 향상된 봇 커맨드 파라미터 DTO
 */
@Data
@Builder
public class EnhancedBotCommandParameterDto {
    private String name;
    private String description;
    private String type;
    private boolean required;
    
    // 선택지가 있는 경우 (enum 타입 등)
    private List<ParameterChoiceDto> choices;
    
    // 자동완성 관련 메타데이터
    private boolean hasAutocomplete;
    private boolean isMultiSelect;
    private String autocompleteType; // "group-names", "button-groups", "log-files"
    private String autocompleteEndpoint;
}