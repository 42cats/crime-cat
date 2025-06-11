package com.crimecat.backend.advertisement.service;

import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.notification.builder.NotificationBuilders;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 테마 광고 관련 알림 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ThemeAdvertisementNotificationService {
    
    private final NotificationBuilders notificationBuilders;
    private final UserRepository userRepository;
    
    /**
     * 광고 만료 알림 전송
     */
    public void sendAdvertisementExpiredNotification(ThemeAdvertisementRequest request) {
        try {
            log.info("광고 만료 알림 전송 시작: requestId={}, userId={}, themeName={}", 
                    request.getId(), request.getUserId(), request.getThemeName());
            
            User user = userRepository.findByWebUserId(request.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found for webUserId: " + request.getUserId()));
            
            notificationBuilders.themeAdvertisementExpired(user.getId())
                    .themeName(request.getThemeName())
                    .themeType(request.getThemeType())
                    .send();
            
            log.info("광고 만료 알림 전송 완료: requestId={}", request.getId());
        } catch (Exception e) {
            log.error("광고 만료 알림 전송 실패: requestId={}", request.getId(), e);
            throw ErrorStatus.INTERNAL_ERROR.asServiceException();
        }
    }
    
    /**
     * 광고 활성화 알림 전송
     */
    public void sendAdvertisementActivatedNotification(ThemeAdvertisementRequest request) {
        try {
            log.info("광고 활성화 알림 전송 시작: requestId={}, userId={}, themeName={}", 
                    request.getId(), request.getUserId(), request.getThemeName());
            
            User user = userRepository.findByWebUserId(request.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found for webUserId: " + request.getUserId()));
            
            notificationBuilders.themeAdvertisementActivated(user.getId())
                    .themeName(request.getThemeName())
                    .themeType(request.getThemeType())
                    .send();
            
            log.info("광고 활성화 알림 전송 완료: requestId={}", request.getId());
        } catch (Exception e) {
            log.error("광고 활성화 알림 전송 실패: requestId={}", request.getId(), e);
            throw ErrorStatus.INTERNAL_ERROR.asServiceException();
        }
    }
    
    /**
     * 광고 취소 알림 전송
     */
    public void sendAdvertisementCancelledNotification(ThemeAdvertisementRequest request, Integer refundAmount, String reason) {
        try {
            log.info("광고 취소 알림 전송 시작: requestId={}, userId={}, themeName={}, refundAmount={}", 
                    request.getId(), request.getUserId(), request.getThemeName(), refundAmount);
            
            User user = userRepository.findByWebUserId(request.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found for webUserId: " + request.getUserId()));
            
            notificationBuilders.themeAdvertisementCancelled(user.getId())
                    .themeName(request.getThemeName())
                    .themeType(request.getThemeType())
                    .refundAmount(refundAmount)
                    .reason(reason)
                    .send();
            
            log.info("광고 취소 알림 전송 완료: requestId={}", request.getId());
        } catch (Exception e) {
            log.error("광고 취소 알림 전송 실패: requestId={}", request.getId(), e);
            throw ErrorStatus.INTERNAL_ERROR.asServiceException();
        }
    }
}