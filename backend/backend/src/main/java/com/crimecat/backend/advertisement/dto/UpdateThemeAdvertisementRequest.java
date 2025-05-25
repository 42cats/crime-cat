package com.crimecat.backend.advertisement.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateThemeAdvertisementRequest {
    
    private LocalDateTime startDate;
    
    private LocalDateTime endDate;
    
    private Integer displayOrder;
    
    private Boolean isActive;
}
