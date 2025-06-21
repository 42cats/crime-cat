package com.crimecat.backend.messagemacro.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.util.UUID;

@Data @Builder
@NoArgsConstructor
@AllArgsConstructor
public class ButtonAutomationDto {
    private UUID id;
    
    @NotNull(message = "길드 ID는 필수입니다")
    private String guildId;
    
    private UUID groupId;
    
    @NotBlank(message = "버튼 라벨은 필수입니다")
    private String buttonLabel;
    
    @Min(value = 0, message = "표시 순서는 0 이상이어야 합니다")
    private Integer displayOrder;
    
    @NotBlank(message = "버튼 설정은 필수입니다")
    private String config; // JSON 형태의 버튼 설정
    
    private Boolean isActive;
    
    private Timestamp createdAt;
    
    private Timestamp updatedAt;
}