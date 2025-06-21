package com.crimecat.backend.messagemacro.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data @Builder
@NoArgsConstructor
@AllArgsConstructor
public class ButtonAutomationRequestDto {
    private UUID groupId;
    
    @NotBlank(message = "버튼 라벨은 필수입니다")
    private String buttonLabel;
    
    @Min(value = 0, message = "표시 순서는 0 이상이어야 합니다")
    private Integer displayOrder;
    
    @NotBlank(message = "버튼 설정은 필수입니다")
    private String config; // JSON 형태의 버튼 설정
    
    private Boolean isActive;
}