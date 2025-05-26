package com.crimecat.backend.coupon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class CouponListResponse {

    @JsonProperty("coupons") // ✅ JSON에서 coupons라는 키로 감싸줌
    private List<CouponResponseDto> innerList;
}
