package com.crimecat.backend.gametheme.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class GetGameThemeResponse {
    private GameThemeDetailDto theme;
}
