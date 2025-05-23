package com.crimecat.backend.admin.service;

import com.crimecat.backend.admin.dto.AdminCouponCreateRequest;
import com.crimecat.backend.admin.dto.AdminCouponResponse;
import com.crimecat.backend.admin.dto.CouponStatsResponse;
import com.crimecat.backend.coupon.domain.Coupon;
import com.crimecat.backend.coupon.repository.CouponRepository;
import com.crimecat.backend.exception.ErrorStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

/**
 * 관리자용 쿠폰 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminCouponService {
    
    private final CouponRepository couponRepository;
    
    /**
     * 쿠폰 목록 조회 (페이징)
     */
    @Transactional(readOnly = true)
    public Page<AdminCouponResponse> getAllCoupons(Pageable pageable) {
        return couponRepository.findAll(pageable)
                .map(AdminCouponResponse::from);
    }
    
    /**
     * 상태별 쿠폰 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<AdminCouponResponse> getCouponsByStatus(String status, Pageable pageable) {
        Page<Coupon> coupons;
        LocalDateTime now = LocalDateTime.now();
        
        switch (status.toUpperCase()) {
            case "USED":
                coupons = couponRepository.findByUserIsNotNull(pageable);
                break;
            case "EXPIRED":
                coupons = couponRepository.findByUserIsNullAndExpiredAtBefore(now, pageable);
                break;
            case "UNUSED":
                coupons = couponRepository.findByUserIsNullAndExpiredAtAfter(now, pageable);
                break;
            default:
                coupons = couponRepository.findAll(pageable);
        }
        
        return coupons.map(AdminCouponResponse::from);
    }
    
    /**
     * 쿠폰 생성
     */
    @Transactional
    public List<AdminCouponResponse> createCoupons(AdminCouponCreateRequest request) {
        log.info("관리자가 쿠폰 생성: {} 포인트, {} 개, {} 일간", 
                 request.getValue(), request.getCount(), request.getDuration());
        
        List<Coupon> coupons = IntStream.range(0, request.getCount())
                .mapToObj(i -> Coupon.create(request.getValue(), request.getDuration()))
                .toList();
        
        List<Coupon> savedCoupons = couponRepository.saveAll(coupons);
        
        return savedCoupons.stream()
                .map(AdminCouponResponse::from)
                .toList();
    }
    
    /**
     * 쿠폰 통계 조회
     */
    @Transactional(readOnly = true)
    public CouponStatsResponse getCouponStats() {
        LocalDateTime now = LocalDateTime.now();
        
        long totalCoupons = couponRepository.count();
        long usedCoupons = couponRepository.countByUserIsNotNull();
        long expiredCoupons = couponRepository.countByUserIsNullAndExpiredAtBefore(now);
        
        // 포인트 통계
        Long totalPointsIssued = couponRepository.sumAllPoints();
        Long totalPointsUsed = couponRepository.sumUsedPoints();
        
        return CouponStatsResponse.of(
                totalCoupons,
                usedCoupons,
                expiredCoupons,
                totalPointsIssued != null ? totalPointsIssued : 0L,
                totalPointsUsed != null ? totalPointsUsed : 0L
        );
    }
    
    /**
     * 쿠폰 삭제 (미사용 쿠폰만)
     */
    @Transactional
    public void deleteCoupon(UUID couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> ErrorStatus.INVALID_INPUT.asException());
        
        if (coupon.isUsed()) {
            throw new IllegalStateException("사용된 쿠폰은 삭제할 수 없습니다.");
        }
        
        couponRepository.delete(coupon);
        log.info("관리자가 쿠폰 삭제: {}", couponId);
    }
}