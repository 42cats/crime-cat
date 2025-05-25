package com.crimecat.backend.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddUserPointsRequest {
    @NotNull(message = "사용자 ID는 필수입니다.")
    private UUID userId;
    
    @NotNull(message = "포인트 금액은 필수입니다.")
    @Min(value = 1, message = "포인트 금액은 최소 1 이상이어야 합니다.")
    private Integer amount;
    
    private String reason;
}
