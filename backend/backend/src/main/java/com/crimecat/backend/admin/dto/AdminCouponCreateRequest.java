package com.crimecat.backend.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 관리자 쿠폰 생성 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AdminCouponCreateRequest {
    
    @NotNull(message = "포인트 값은 필수입니다.")
    @Min(value = 1, message = "포인트 값은 1 이상이어야 합니다.")
    private Integer value;
    
    @NotNull(message = "생성 개수는 필수입니다.")
    @Min(value = 1, message = "생성 개수는 1 이상이어야 합니다.")
    private Integer count;
    
    @NotNull(message = "유효 기간은 필수입니다.")
    @Min(value = 1, message = "유효 기간은 1일 이상이어야 합니다.")
    private Integer duration;
}