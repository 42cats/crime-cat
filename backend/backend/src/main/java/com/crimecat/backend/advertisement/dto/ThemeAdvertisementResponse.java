package com.crimecat.backend.advertisement.dto;

import com.crimecat.backend.advertisement.domain.ThemeAdvertisement;
import com.crimecat.backend.gametheme.dto.GetGameThemeResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThemeAdvertisementResponse {
    private UUID id;
    private UUID themeId;
    private ThemeAdvertisement.ThemeType themeType;
    private Integer displayOrder;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private UUID createdBy;
    private LocalDateTime updatedAt;
    private UUID updatedBy;
    private GetGameThemeResponse theme;
    
    public static ThemeAdvertisementResponse from(ThemeAdvertisement advertisement) {
        return ThemeAdvertisementResponse.builder()
                .id(advertisement.getId())
                .themeId(advertisement.getThemeId())
                .themeType(advertisement.getThemeType())
                .displayOrder(advertisement.getDisplayOrder())
                .startDate(advertisement.getStartDate())
                .endDate(advertisement.getEndDate())
                .isActive(advertisement.getIsActive())
                .createdAt(advertisement.getCreatedAt())
                .createdBy(advertisement.getCreatedBy())
                .updatedAt(advertisement.getUpdatedAt())
                .updatedBy(advertisement.getUpdatedBy())
                .build();
    }
    
    public static ThemeAdvertisementResponse from(ThemeAdvertisement advertisement, GetGameThemeResponse theme) {
        return ThemeAdvertisementResponse.builder()
                .id(advertisement.getId())
                .themeId(advertisement.getThemeId())
                .themeType(advertisement.getThemeType())
                .displayOrder(advertisement.getDisplayOrder())
                .startDate(advertisement.getStartDate())
                .endDate(advertisement.getEndDate())
                .isActive(advertisement.getIsActive())
                .createdAt(advertisement.getCreatedAt())
                .createdBy(advertisement.getCreatedBy())
                .updatedAt(advertisement.getUpdatedAt())
                .updatedBy(advertisement.getUpdatedBy())
                .theme(theme)
                .build();
    }
}
