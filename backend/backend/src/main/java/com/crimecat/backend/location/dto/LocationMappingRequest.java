package com.crimecat.backend.location.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationMappingRequest {
    
    @NotBlank(message = "키워드는 필수입니다")
    @Size(max = 100, message = "키워드는 100자를 초과할 수 없습니다")
    private String keyword;
    
    @NotBlank(message = "정규화된 주소는 필수입니다")
    @Size(max = 200, message = "정규화된 주소는 200자를 초과할 수 없습니다")
    private String normalized;
    
    @Builder.Default
    private List<String> relatedKeywords = new ArrayList<>();
    
    @Builder.Default
    private List<String> typoVariants = new ArrayList<>();
    
    @Builder.Default
    private Boolean isActive = true;
    
    @Size(max = 500, message = "설명은 500자를 초과할 수 없습니다")
    private String description;
}