package com.crimecat.backend.messagemacro.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder
@NoArgsConstructor
@AllArgsConstructor
public class ButtonAutomationGroupRequestDto {
    @NotBlank(message = "그룹 이름은 필수입니다")
    private String name;
    
    @Min(value = 0, message = "표시 순서는 0 이상이어야 합니다")
    private Integer displayOrder;
    
    private String settings; // JSON 형태의 그룹 설정
    
    private Boolean isActive;
}