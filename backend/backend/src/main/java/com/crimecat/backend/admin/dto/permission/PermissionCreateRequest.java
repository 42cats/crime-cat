package com.crimecat.backend.admin.dto.permission;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionCreateRequest {
    @NotBlank(message = "권한명은 필수입니다.")
    private String name;
    
    @NotNull(message = "가격은 필수입니다.")
    @PositiveOrZero(message = "가격은 0 이상이어야 합니다.")
    private Integer price;
    
    @Positive(message = "기간은 0보다 커야 합니다.")
    private Integer duration = 28; // 기본값 28일
    
    private String info;
}
