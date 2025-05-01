package com.crimecat.backend.coupon.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@AllArgsConstructor
@Getter
public class CouponResponseDto {
    private String code;     // UUID 형식 쿠폰 코드
    private Integer point;       // 포인트 값
    private LocalDateTime expireDate;    // 만료날짜.

}
