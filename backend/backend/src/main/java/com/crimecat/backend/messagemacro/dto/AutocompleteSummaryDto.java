package com.crimecat.backend.messagemacro.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 자동완성 지원 통계 DTO
 */
@Data
@Builder
public class AutocompleteSummaryDto {
    private int totalCommands;
    private int commandsWithAutocomplete;
    private int totalAutocompleteParameters;
    private List<String> supportedAutocompleteTypes;
}