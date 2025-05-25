package com.crimecat.backend.advertisement.dto;

import com.crimecat.backend.advertisement.domain.ThemeAdvertisement;
import jakarta.validation.constraints.NotNull;
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
public class CreateThemeAdvertisementRequest {
    
    @NotNull(message = "테마 ID는 필수입니다")
    private UUID themeId;
    
    @NotNull(message = "테마 타입은 필수입니다")
    private ThemeAdvertisement.ThemeType themeType;
    
    @NotNull(message = "시작 날짜는 필수입니다")
    private LocalDateTime startDate;
    
    @NotNull(message = "종료 날짜는 필수입니다")
    private LocalDateTime endDate;
    
    private Integer displayOrder;
}
