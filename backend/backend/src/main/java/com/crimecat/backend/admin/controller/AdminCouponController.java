package com.crimecat.backend.admin.controller;

import com.crimecat.backend.admin.dto.AdminCouponCreateRequest;
import com.crimecat.backend.admin.dto.AdminCouponResponse;
import com.crimecat.backend.admin.dto.CouponStatsResponse;
import com.crimecat.backend.admin.service.AdminCouponService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.enums.UserRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * 관리자용 쿠폰 관리 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/coupons")
@RequiredArgsConstructor
public class AdminCouponController {
    
    private final AdminCouponService adminCouponService;
    
    /**
     * 쿠폰 목록 조회 (페이징)
     */
    @GetMapping
    public ResponseEntity<Page<AdminCouponResponse>> getAllCoupons(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) String status) {
        
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        Page<AdminCouponResponse> coupons;
        if (status != null && !status.isEmpty()) {
            coupons = adminCouponService.getCouponsByStatus(status, pageable);
        } else {
            coupons = adminCouponService.getAllCoupons(pageable);
        }
        
        return ResponseEntity.ok(coupons);
    }
    
    /**
     * 쿠폰 생성
     */
    @PostMapping
    public ResponseEntity<List<AdminCouponResponse>> createCoupons(
            @Valid @RequestBody AdminCouponCreateRequest request) {
        
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        List<AdminCouponResponse> createdCoupons = adminCouponService.createCoupons(request);
        
        log.info("관리자 {}가 쿠폰 {} 개 생성완료", 
                 AuthenticationUtil.getCurrentWebUser().getNickname(),
                 createdCoupons.size());
        
        return ResponseEntity.ok(createdCoupons);
    }
    
    /**
     * 쿠폰 통계 조회
     */
    @GetMapping("/stats")
    public ResponseEntity<CouponStatsResponse> getCouponStats() {
        
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        CouponStatsResponse stats = adminCouponService.getCouponStats();
        return ResponseEntity.ok(stats);
    }
    
    /**
     * 쿠폰 삭제 (미사용 쿠폰만)
     */
    @DeleteMapping("/{couponId}")
    public ResponseEntity<Void> deleteCoupon(@PathVariable UUID couponId) {
        
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        adminCouponService.deleteCoupon(couponId);
        
        log.info("관리자 {}가 쿠폰 {} 삭제", 
                 AuthenticationUtil.getCurrentWebUser().getNickname(),
                 couponId);
        
        return ResponseEntity.ok().build();
    }
}