package com.crimecat.backend.messagemacro.dto;

import lombok.Builder;
import lombok.Data;

/**
 * 자동완성 옵션 DTO
 * Discord 봇 자동완성과 동일한 구조
 */
@Data
@Builder
public class AutocompleteOptionDto {
    /**
     * 사용자에게 표시될 이름
     */
    private String name;
    
    /**
     * 실제 전송될 값
     */
    private String value;
}