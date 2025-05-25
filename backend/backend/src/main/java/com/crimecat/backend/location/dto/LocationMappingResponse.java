package com.crimecat.backend.location.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationMappingResponse {
    private List<LocationMappingDto> mappings;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
    
    public static LocationMappingResponse from(Page<LocationMappingDto> page) {
        return LocationMappingResponse.builder()
                .mappings(page.getContent())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .currentPage(page.getNumber())
                .pageSize(page.getSize())
                .build();
    }
}