package com.crimecat.backend.coupon.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class CouponCreateRequestDto {
    private Integer value;
    private Integer count;
    private Integer duration;

}
