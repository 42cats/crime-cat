package com.crimecat.backend.coupon.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class CouponRedeemRequestDto {
    private String userSnowflake;  // 유저의 Discord ID
    private String code;           // 쿠폰 코드 (UUID)

}
