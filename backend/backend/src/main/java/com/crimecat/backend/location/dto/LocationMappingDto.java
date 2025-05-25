package com.crimecat.backend.location.dto;

import com.crimecat.backend.location.domain.LocationMapping;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationMappingDto {
    private UUID id;
    private String keyword;
    private String normalized;
    private List<String> relatedKeywords;
    private List<String> typoVariants;
    private Boolean isActive;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static LocationMappingDto from(LocationMapping entity) {
        return LocationMappingDto.builder()
                .id(entity.getId())
                .keyword(entity.getKeyword())
                .normalized(entity.getNormalized())
                .relatedKeywords(entity.getRelatedKeywords())
                .typoVariants(entity.getTypoVariants())
                .isActive(entity.getIsActive())
                .description(entity.getDescription())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}