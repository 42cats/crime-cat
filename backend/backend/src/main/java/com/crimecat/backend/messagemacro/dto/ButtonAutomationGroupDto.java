package com.crimecat.backend.messagemacro.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;

@Data @Builder
@NoArgsConstructor
@AllArgsConstructor
public class ButtonAutomationGroupDto {
    private UUID id;
    
    @NotBlank(message = "그룹 이름은 필수입니다")
    private String name;
    
    @NotNull(message = "길드 ID는 필수입니다")
    private String guildId;
    
    @Min(value = 0, message = "표시 순서는 0 이상이어야 합니다")
    private Integer displayOrder;
    
    private String settings; // JSON 형태의 그룹 설정
    
    private Boolean isActive;
    
    private Timestamp createdAt;
    
    private Timestamp updatedAt;
    
    private List<ButtonAutomationDto> buttons;
}