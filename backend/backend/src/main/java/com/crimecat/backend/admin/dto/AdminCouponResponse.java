package com.crimecat.backend.admin.dto;

import com.crimecat.backend.coupon.domain.Coupon;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 관리자용 쿠폰 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminCouponResponse {
    
    private UUID id;
    private String code; // 쿠폰 코드 (UUID 문자열)
    private Integer point;
    private Integer value; // point와 동일한 값 (프론트엔드 호환성)
    private String status; // "UNUSED", "USED", "EXPIRED"
    private String userName; // 사용자 이름 (User.getName())
    private String userType; // "WEB", "DISCORD", "UNKNOWN"
    private LocalDateTime createdAt;
    private LocalDateTime usedAt;
    private LocalDateTime expiredAt;
    private LocalDateTime expiresAt; // expiredAt과 동일한 값 (프론트엔드 호환성)
    private boolean isExpired;
    private boolean isUsed;
    private boolean used; // isUsed와 동일한 값 (프론트엔드 호환성)
    
    public static AdminCouponResponse from(Coupon coupon) {
        String status;
        String userName = null;
        String userType = "UNKNOWN";
        
        if (coupon.isUsed()) {
            status = "USED";
            userName = coupon.getUser().getName();
            // 사용자 타입 판별
            if (coupon.getUser().getWebUser() != null) {
                userType = "WEB";
            } else if (coupon.getUser().getDiscordUser() != null) {
                userType = "DISCORD";
            }
        } else if (coupon.isExpired()) {
            status = "EXPIRED";
        } else {
            status = "UNUSED";
        }
        
        return AdminCouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getId().toString()) // UUID를 문자열로 변환
                .point(coupon.getPoint())
                .value(coupon.getPoint()) // 프론트엔드 호환성
                .status(status)
                .userName(userName)
                .userType(userType)
                .createdAt(coupon.getCreatedAt())
                .usedAt(coupon.getUsedAt())
                .expiredAt(coupon.getExpiredAt())
                .expiresAt(coupon.getExpiredAt()) // 프론트엔드 호환성
                .isExpired(coupon.isExpired())
                .isUsed(coupon.isUsed())
                .used(coupon.isUsed()) // 프론트엔드 호환성
                .build();
    }
}