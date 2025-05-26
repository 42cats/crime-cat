package com.crimecat.backend.coupon.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class WebCouponRequestDto {
    private String userId;  // 유저의 UUID
    private String code;           // 쿠폰 코드 (UUID)
}
