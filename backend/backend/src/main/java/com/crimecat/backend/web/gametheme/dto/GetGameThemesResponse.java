package com.crimecat.backend.web.gametheme.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
@AllArgsConstructor
@Builder
public class GetGameThemesResponse {
    private List<GameThemeDto> themes;
    private int page;
    private int size;
    private int totalPages;
    private long totalElements;
    private boolean hasNext;
    private boolean hasPrevious;

    public static GetGameThemesResponse from(Page<GameThemeDto> page) {
        return GetGameThemesResponse.builder()
                .themes(page.getContent())
                .size(page.getSize())
                .page(page.getPageable().getPageNumber())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .build();
    }
}
