package com.crimecat.backend.messagemacro.dto;

import lombok.Builder;
import lombok.Data;

/**
 * 파라미터 선택지 DTO
 */
@Data
@Builder
public class ParameterChoiceDto {
    private String name;
    private String value;
}