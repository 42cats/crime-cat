package com.crimecat.backend.advertisement.dto;

import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import com.crimecat.backend.gametheme.dto.GetGameThemeResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * GameAdsCarousel과 호환되는 공개 광고 응답 DTO
 * 기존 ThemeAdvertisement 형식과 호환됨
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicThemeAdvertisementResponse {
    private UUID id;
    private UUID themeId;
    private String themeType;
    private Integer displayOrder;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
    private GetGameThemeResponse theme;
    
    /**
     * ThemeAdvertisementRequest를 PublicThemeAdvertisementResponse로 변환
     */
    public static PublicThemeAdvertisementResponse from(ThemeAdvertisementRequest request) {
        return PublicThemeAdvertisementResponse.builder()
                .id(request.getId())
                .themeId(request.getThemeId())
                .themeType(request.getThemeType().name())
                .displayOrder(calculateDisplayOrder(request))
                .startDate(request.getStartedAt())
                .endDate(request.getExpiresAt())
                .isActive(true) // 활성 광고만 조회하므로 항상 true
                .createdAt(request.getRequestedAt())
                .createdBy("system") // 큐 시스템에서는 시스템이 생성
                .updatedAt(request.getStartedAt())
                .updatedBy("system")
                .build();
    }
    
    /**
     * 테마 정보와 함께 변환
     */
    public static PublicThemeAdvertisementResponse from(ThemeAdvertisementRequest request, GetGameThemeResponse theme) {
        PublicThemeAdvertisementResponse response = from(request);
        return PublicThemeAdvertisementResponse.builder()
                .id(response.getId())
                .themeId(response.getThemeId())
                .themeType(response.getThemeType())
                .displayOrder(response.getDisplayOrder())
                .startDate(response.getStartDate())
                .endDate(response.getEndDate())
                .isActive(response.getIsActive())
                .createdAt(response.getCreatedAt())
                .createdBy(response.getCreatedBy())
                .updatedAt(response.getUpdatedAt())
                .updatedBy(response.getUpdatedBy())
                .theme(theme)
                .build();
    }
    
    /**
     * displayOrder 계산 로직
     * 활성화된 시간 순서로 정렬 (먼저 활성화된 것이 낮은 순서)
     */
    private static Integer calculateDisplayOrder(ThemeAdvertisementRequest request) {
        if (request.getStartedAt() == null) {
            return 999; // 시작 시간이 없는 경우 맨 뒤로
        }
        // 시작 시간을 기준으로 정렬 순서 계산 (에포크 시간의 초 단위를 사용)
        return (int) (request.getStartedAt().toEpochSecond(java.time.ZoneOffset.UTC) % 1000000);
    }
}