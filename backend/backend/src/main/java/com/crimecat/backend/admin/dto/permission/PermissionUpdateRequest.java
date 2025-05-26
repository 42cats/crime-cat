package com.crimecat.backend.admin.dto.permission;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionUpdateRequest {
    private String name;
    
    @PositiveOrZero(message = "가격은 0 이상이어야 합니다.")
    private Integer price;
    
    @Positive(message = "기간은 0보다 커야 합니다.")
    private Integer duration;
    
    private String info;
}
