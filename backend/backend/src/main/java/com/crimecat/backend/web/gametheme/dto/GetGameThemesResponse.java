package com.crimecat.backend.web.gametheme.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
@Builder
public class GetGameThemesResponse {
    private List<GameThemeDto> themes;
    private int page;
    private int size;
}
