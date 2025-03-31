package com.crimecat.backend.coupon.controller;

import com.crimecat.backend.coupon.dto.CouponCreateRequestDto;
import com.crimecat.backend.coupon.dto.CouponRedeemRequestDto;
import com.crimecat.backend.coupon.dto.CouponResponseDto;
import com.crimecat.backend.coupon.dto.MessageDto;
import com.crimecat.backend.coupon.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/bot/coupons")
public class CouponController{
    private final CouponService couponService;

    /**
     * 쿠폰생성
     *
     */
    @PostMapping
    public ResponseEntity<MessageDto<List<CouponResponseDto>>> createCoupons(@RequestBody CouponCreateRequestDto request){
        return ResponseEntity.ok(couponService.createCoupon(request));

    };

    @PatchMapping
    public ResponseEntity<?> redeemCoupon(@RequestBody CouponRedeemRequestDto request){
        try{
            return ResponseEntity.ok(couponService.redeemCoupon(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageDto<>(e.getMessage()));
        }
    }
}