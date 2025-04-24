package com.crimecat.backend.bot.coupon.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crimecat.backend.bot.coupon.dto.CouponCreateRequestDto;
import com.crimecat.backend.bot.coupon.dto.CouponListResponse;
import com.crimecat.backend.bot.coupon.dto.CouponRedeemRequestDto;
import com.crimecat.backend.bot.coupon.dto.MessageDto;
import com.crimecat.backend.bot.coupon.service.CouponService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/bot/v1/coupons")
public class CouponController{
    private final CouponService couponService;

    /**
     * 쿠폰생성
     *
     */
    @PostMapping
    public ResponseEntity<MessageDto<CouponListResponse>> createCoupons(@RequestBody CouponCreateRequestDto request){
        return ResponseEntity.ok(couponService.createCoupon(request));

    };

    @PatchMapping
    public ResponseEntity<?> redeemCoupon(@RequestBody CouponRedeemRequestDto request){
        return ResponseEntity.ok(couponService.redeemCoupon(request));
    }
}