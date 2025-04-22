package com.crimecat.backend.bot.coupon.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class CouponRedeemRequestDto {
    private String userSnowflake;  // 유저의 Discord ID
    private String code;           // 쿠폰 코드 (UUID)

}
