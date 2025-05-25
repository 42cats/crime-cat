package com.crimecat.backend.gameHistory.dto.integrated;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

/**
 * 테마별 플레이 횟수 DTO
 */
@Getter
@AllArgsConstructor
public class ThemePlayCountDto {
    private UUID themeId;
    private Long playCount;
}
