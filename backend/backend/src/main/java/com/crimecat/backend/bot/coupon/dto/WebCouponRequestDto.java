package com.crimecat.backend.bot.coupon.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class WebCouponRequestDto {
    private String userId;  // 유저의 UUID
    private String code;           // 쿠폰 코드 (UUID)
}
