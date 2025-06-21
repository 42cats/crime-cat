package com.crimecat.backend.messagemacro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * 봇 전용 응답 DTO - 실행에 필요한 최소한의 정보만 포함
 */
@Data @Builder
@NoArgsConstructor
@AllArgsConstructor
public class BotButtonAutomationResponseDto {
    private UUID id;
    private String buttonLabel;
    private String config; // JSON 설정
    private Boolean isActive;
    
    @Data @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Group {
        private UUID id;
        private String name;
        private String settings; // JSON 설정
        private List<BotButtonAutomationResponseDto> buttons;
    }
}